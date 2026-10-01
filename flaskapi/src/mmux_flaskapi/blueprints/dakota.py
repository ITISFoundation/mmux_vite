from __future__ import annotations

import dataclasses
import logging
import os
import threading
import traceback
from collections.abc import Callable
from pathlib import Path
from typing import Any, NoReturn, TypeVar

import pandas as pd

#
from flask import Blueprint, abort, jsonify, make_response
from itis_sumo.api import (
    DistributionSpec,
    DomainSpec,
    PreprocessingSpec,
    SumoInputError,
    SumoResultError,
    VariableSpec,
)
from itis_sumo.api import compute_correlations as sumo_compute_correlations
from itis_sumo.api import cross_validate as sumo_cross_validate
from itis_sumo.api import evaluate_along_axes as sumo_evaluate_along_axes
from itis_sumo.api import evaluate_cv_metrics as sumo_evaluate_cv_metrics
from itis_sumo.api import evaluate_grid as sumo_evaluate_grid
from itis_sumo.api import evaluate_sobol as sumo_evaluate_sobol
from itis_sumo.api import evaluate_uncertainty as sumo_evaluate_uncertainty
from itis_sumo.api import optimize as sumo_optimize
from pydantic import ValidationError

#
from mmux_flaskapi.blueprints.dakota_models import (
    CorrelationIndicesRequest,
    CorrelationIndicesResponse,
    CVAccuracyMetrics,
    FunctionJob,
    JobVariableSelection,
    ManualUQWithUncertaintyRequest,
    MOGAOptimizationRequest,
    MOGAOptimizationResponse,
    SobolIndicesRequest,
    SobolIndicesResponse,
    SumoAlongAxesRequest,
    SumoAlongAxesResponse,
    SumoCrossValidationRequest,
    SumoCrossValidationResponse,
    SumoCVAccuracyMetricsRequest,
    SumoCVAccuracyMetricsResponse,
    SumoGridEvaluationRequest,
    SumoGridEvaluationResponse,
    UQWithUncertaintyResponse,
    required_completed_jobs,
)
from mmux_flaskapi.utils.helpers import create_run_dir
from mmux_flaskapi.utils.json_serializer import parse_request_model

_logger = logging.getLogger(__name__)
dakota_bp = Blueprint("dakota", __name__)

DAKOTA_RUNS_DIR = Path(
    os.environ.get("DAKOTA_RUNS_DIR", Path(__file__).resolve().parents[3] / "runs_dakota")
)
_logger.info(f"Saving runs in {DAKOTA_RUNS_DIR}")
DAKOTA_RUNS_DIR.mkdir(parents=True, exist_ok=True)
assert DAKOTA_RUNS_DIR.is_dir(), "Dakota Runs Dir does not exist!!"

# V49ad: the itis-sumo Dakota runner executes inside `working_directory(...)`,
# which mutates the PROCESS-WIDE cwd for the duration of a run. Two overlapping
# Dakota-bound calls therefore corrupt each other's paths (observed as nested
# run dirs and `predictions.dat does not exist` under concurrent CV + UQ). The
# adapter serializes all Dakota-bound package calls on this lock; in-memory
# helpers (compute_correlations, generate_lhs_samples) stay outside it.
# ⊥ assume workspace paths alone make concurrent runs safe. The upstream fix
# (cwd-independent execution, e.g. subprocess cwd=) would retire this lock.
ENGINE_LOCK = threading.Lock()

_T = TypeVar("_T")


def _run_engine(fn: Callable[..., _T], *args: Any, **kwargs: Any) -> _T:
    """Call an itis-sumo workflow under ENGINE_LOCK (V49ad).

    One Dakota-bound run per process at a time: the package's runner chdirs
    for the duration of a run, so overlapping calls corrupt each other.
    """
    with ENGINE_LOCK:
        return fn(*args, **kwargs)


########################################################
# Utility Functions for Advanced Error Handling and Data Preprocessing
########################################################


def _jobs_to_df(
    jobs: list[FunctionJob], input_vars: list[str], output_vars: list[str]
) -> pd.DataFrame:
    """
    Convert list of FunctionJob objects to DataFrame.

    Args:
        jobs: List of FunctionJob objects
        input_vars: Requested input variable names
        output_vars: Requested output variable names

    Returns:
        DataFrame with the requested inputs and outputs

    Raises:
        ValueError: If a job is missing requested inputs or outputs
    """
    try:
        validated_selection = JobVariableSelection.model_validate(
            {
                "jobs": jobs,
                "input_vars": input_vars,
                "output_vars": output_vars,
                "minimum_completed_jobs": required_completed_jobs(input_vars),
            }
        )
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc

    _logger.debug("N Completed jobs: %s", len(validated_selection.completed_jobs))
    return pd.DataFrame(validated_selection.to_records())


def handle_workflow_error(e: Exception, workflow_name: str, status_code: int = 500) -> NoReturn:
    """
    Standardized error handling for Dakota workflows.

    Args:
        e: The exception
        workflow_name: Name of the workflow for logging
        status_code: HTTP status code to return
    """
    traceback_str = traceback.format_exc()
    _logger.error(f"Error in {workflow_name}: {e}")
    _logger.debug(f"Traceback:\n{traceback_str}")

    response_payload = {
        "error": str(e),
        "workflow": workflow_name,
    }

    abort(make_response(jsonify(response_payload), status_code))


def _preprocessing_for_log_scales(
    input_log_scales: dict[str, bool],
    output_log_scales: dict[str, bool],
) -> PreprocessingSpec | None:
    """Fold the request's per-variable log flags into a itis-sumo spec (V16).

    Flagged columns become ``VariableSpec(scale="log")`` overrides; the package
    then owns everything downstream — log-space fit, log-uniform UQ draws,
    log-uniform Sobol boxes, log search domains, delta-method std inverses
    (its V44ls/V21pf). Returns None when nothing is flagged, keeping the
    package's auto-derived defaults on the untouched columns.
    """
    log_scales = {**input_log_scales, **output_log_scales}
    overrides = {var: VariableSpec(scale="log") for var, flag in log_scales.items() if flag}
    return PreprocessingSpec(overrides=overrides) if overrides else None


########################################################
# Flask Endpoints
########################################################


@dakota_bp.route("/sumo_cross_validation", methods=["POST"])
def flask_sumo_cross_validation():
    """
    Perform SUMO cross-validation to assess surrogate model accuracy.

    Delegates to itis_sumo.api.cross_validate, which owns preprocessing, Dakota
    configuration, and inverse transforms end-to-end (SPEC V16qf). Returns
    cross-validation predictions with uncertainty estimates in original
    variable names.
    """
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    validated_request = parse_request_model(SumoCrossValidationRequest)

    # At this point, all validation is complete and we have a validated request object
    try:
        jobs: list[FunctionJob] = validated_request.function_jobs
        input_vars: list[str] = validated_request.input_vars
        output_var: str = validated_request.output

        # Create run directory (kept for debugging; itis-sumo persists its
        # working files here instead of a self-cleaning temp dir).
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "cross_validation")

        samples = _jobs_to_df(jobs, input_vars, [output_var])

        result = _run_engine(
            sumo_cross_validate,
            samples,
            input_vars,
            output_var,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        # Fixed-field contract (FE sumoValidation.ts destructures
        # {observed, predicted}): the response is NOT keyed by the QoI name;
        # the model's validators reject empty/misaligned arrays.
        if result.predicted_std is None:
            raise ValueError("Cross-validation did not return prediction standard deviations")
        validated_response = SumoCrossValidationResponse(
            observed=result.observed,
            predicted=result.predicted,
            predicted_std=result.predicted_std,
        )

        _logger.debug("Cross-validation completed successfully!")
        return jsonify(validated_response.model_dump())
    except ValidationError as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 422)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 500)


@dakota_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    """
    Perform manual UQ propagation with uncertainty quantification.

    Delegates to itis_sumo.api.evaluate_uncertainty, which owns sampling,
    surrogate evaluation, and the histogram/boxplot summary end-to-end in the
    response's original units (SPEC V16qf).
    """
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(ManualUQWithUncertaintyRequest)

    try:
        _logger.debug(
            f"Request validation successful. Processing {len(validated_request.function_jobs)} jobs"
        )

        # Extract validated parameters
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        num_samples = validated_request.num_samples
        jobs = validated_request.function_jobs
        n_histograms = validated_request.n_histograms
        seed = validated_request.seed

        # Create run directory (kept for debugging; itis-sumo persists its
        # working files here instead of a self-cleaning temp dir).
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "uq_with_uncertainty")

        samples = _jobs_to_df(jobs, input_vars, [output_response])

        distribution_specs = {
            var: DistributionSpec(
                distribution=dist.distribution,
                mean=dist.mean,
                std=dist.std,
                minimum=dist.min,
                maximum=dist.max,
            )
            for var, dist in distributions.items()
        }

        result = _run_engine(
            sumo_evaluate_uncertainty,
            samples,
            input_vars,
            output_response,
            distributions=distribution_specs,
            num_samples=num_samples,
            n_histograms=n_histograms,
            seed=seed,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        response_data = {
            "bins_start": result.bins_start,
            "bins_end": result.bins_end,
            "bin_means": result.bin_means,
            "bin_stds": result.bin_stds,
            "q1": result.q1,
            "median": result.median,
            "q3": result.q3,
            "whisker_min": result.whisker_min,
            "whisker_max": result.whisker_max,
            "outliers": result.outliers,
            "mean": result.mean,
            "std": result.std,
            "min": result.minimum,
            "max": result.maximum,
        }

        # Validate response using Pydantic
        validated_response = UQWithUncertaintyResponse(**response_data)
        _logger.debug("UQ with uncertainty analysis completed successfully")

        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 500)


@dakota_bp.route("/compute_correlation_indices", methods=["POST"])
def flask_compute_correlation_indices():
    """
    Compute per-input <-> output Pearson and Spearman correlation coefficients (#470).

    Correlates each input variable's completed-job samples against the response's
    observed values (SPEC V16qf). Returns one response covering all requested input
    variables, so sensitivity of a QoI to every parameter can be inspected in a
    single plot (beyond the current 3-var 1D/2D/3D plot limit).
    """
    _logger.debug("Starting flask function: flask_compute_correlation_indices")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(CorrelationIndicesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        jobs = validated_request.function_jobs

        samples = _jobs_to_df(jobs, input_vars, [output_response])
        result = sumo_compute_correlations(
            samples,
            input_vars,
            output_response,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
        )

        response_data = {"correlations": result.coefficients}
        validated_response = CorrelationIndicesResponse.model_validate(response_data)

        _logger.debug("Correlation indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 500)


@dakota_bp.route("/compute_sobol_indices", methods=["POST"])
def flask_compute_sobol_indices():
    """
    Compute per-input first-order (main effect), total-order, and second-order
    (pairwise interaction) Sobol' indices (#470) plus the M1/M2/R order-mass
    partition.

    Delegates to itis_sumo.api.evaluate_sobol (SPEC V16qf). Since itis-sumo
    0.1.0a8 the sampling box is DOMAIN vocabulary (V26dd): the FE's
    distribution-shaped Sobol panel is translated, never forwarded --
    uniform(min,max) becomes the explicit box; normal(mean,std) falls back to
    the auto-inferred observed-bounds box because distribution shape is UQ-only
    now (back-deriving a box from mean ± 3σ is retired; the FE bounds-editor
    migration supersedes the normal choice). Response always includes
    ``sobolSecondOrder`` and ``sobolOrderContributions`` (null exactly when the
    sample output variance is zero).
    """
    _logger.debug("Starting flask function: flask_compute_sobol_indices")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SobolIndicesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        # NOTE (V36): `num_samples` is intentionally unused here -- Sobol' uses a
        # fixed sample count internal to itis_sumo.api (decoupled from the shared UQ
        # numSamples field, which SobolIndicesRequest still carries only for
        # schema/validation compatibility with ManualUQPropagationRequest, e.g. the
        # >=5-completed-jobs check).
        jobs = validated_request.function_jobs
        seed = validated_request.seed

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "sobol_indices")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        # V26dd translation: FE panel selection -> exploration-domain boxes.
        domains: dict[str, DomainSpec] = {}
        for var, dist in distributions.items():
            if var not in input_vars:
                continue
            if dist.distribution == "uniform":
                assert dist.min is not None and dist.max is not None
                domains[var] = DomainSpec(minimum=dist.min, maximum=dist.max)
            else:
                _logger.warning(
                    "Sobol' sampling for '%s' ignores normal-distribution "
                    "parameters: sensitivity is taken over the observed domain "
                    "(V26dd); distribution shape drives UQ propagation only.",
                    var,
                )

        result = _run_engine(
            sumo_evaluate_sobol,
            samples,
            input_vars,
            output_response,
            domains=domains,
            seed=seed,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        response_data = {
            "sobol": result.indices,
            "sobol_second_order": result.second_order,
            "sobol_order_contributions": (
                dataclasses.asdict(result.order_contributions)
                if result.order_contributions is not None
                else None
            ),
        }
        validated_response = SobolIndicesResponse.model_validate(response_data)

        _logger.debug("Sobol' indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 500)


@dakota_bp.route("/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    """
    SuMo model evaluation along each input axis with optional fixed values.

    Delegates to itis_sumo.api.evaluate_along_axes, which fits a surrogate on the
    completed-job samples and sweeps each input variable while holding the others
    at their optional slider values. Unit/name mapping is handled internally, so
    the result is already expressed in original variable names and units.
    """
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoAlongAxesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.inputs
        jobs = validated_request.function_jobs
        slider_values = validated_request.slider_values

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "along_axes")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        result = _run_engine(
            sumo_evaluate_along_axes,
            samples,
            input_vars,
            output_response,
            at=slider_values,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        predictions = {
            var: {
                "x": sweep.x,
                "y_hat": sweep.predicted,
                "std_hat": sweep.predicted_std,
            }
            for var, sweep in result.sweeps.items()
        }
        response_data = {"predictions": predictions}
        validated_response = SumoAlongAxesResponse.model_validate(response_data)

        _logger.debug("SUMO along axes evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 500)


## This method could probably be generic for N-D (thus not needing the 1D version above)
@dakota_bp.route("/sumo_grid_evaluation", methods=["POST"])
def flask_sumo_grid_evaluation():
    """
    SUMO model evaluation on a grid with optional fixed values for non-grid variables.

    Delegates to itis_sumo.api.evaluate_grid, which fits a surrogate on the
    completed-job samples and sweeps the requested grid variables while holding
    the others at their optional slider values. Unit/name mapping is handled
    internally, so grid_data is already keyed by original variable names.
    """
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoGridEvaluationRequest)

    try:
        output_response = validated_request.output
        grid_vars = validated_request.grid_vars
        input_vars = validated_request.input_vars
        jobs = validated_request.function_jobs
        slider_values = validated_request.slider_values

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "grid_evaluation")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        result = _run_engine(
            sumo_evaluate_grid,
            samples,
            input_vars,
            output_response,
            grid_variables=grid_vars,
            at=slider_values,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        response_data = {"grid_data": result.data}
        validated_response = SumoGridEvaluationResponse.model_validate(response_data)

        _logger.debug("SUMO grid evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 500)


@dakota_bp.route("/get_sumo_cv_accuracy_metrics", methods=["POST"])
def flask_get_sumo_cv_accuracy_metrics():
    """
    Get SUMO cross-validation accuracy metrics for model evaluation.

    Delegates to itis_sumo.api.evaluate_cv_metrics, which fits a surrogate on the
    completed-job samples and cross-validates it against the requested output. If
    the run finishes without producing predictions, the response falls back to a
    "No surrogate quality metrics found." string for that output, matching prior
    behavior.
    """
    _logger.debug("Starting flask function: flask_get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoCVAccuracyMetricsRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.inputs
        jobs = validated_request.function_jobs

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "cv_accuracy_metrics")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        try:
            result = _run_engine(
                sumo_evaluate_cv_metrics,
                samples,
                input_vars,
                output_response,
                preprocessing=_preprocessing_for_log_scales(
                    {},
                    {output_response: True} if validated_request.log else {},
                ),
                workspace=run_dir,
            )
            response_metrics = {
                output_response: CVAccuracyMetrics(
                    root_mean_squared=result.root_mean_squared,
                    sum_abs=result.sum_abs,
                    mean_abs=result.mean_abs,
                    max_abs=result.max_abs,
                )
            }
        except SumoResultError:
            response_metrics = {output_response: "No surrogate quality metrics found."}

        response_data = {"metrics": response_metrics}
        validated_response = SumoCVAccuracyMetricsResponse.model_validate(response_data)

        _logger.debug("SUMO CV accuracy metrics completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 500)


@dakota_bp.route("/perform_moga_optimization", methods=["POST"])
def flask_perform_moga_optimization():
    """
    Perform Multi-Objective Genetic Algorithm (MOGA) optimization.

    Delegates to itis_sumo.api.optimize, which fits one surrogate per objective
    over the requested input domains and finds the Pareto-optimal trade-off
    front. Unit/name mapping and maximize-direction sign handling are done
    internally, so optimization_results is already expressed in original
    variable names and original sign.
    """
    _logger.debug("Starting flask function: flask_perform_moga_optimization")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(MOGAOptimizationRequest)

    try:
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        output_var_selection = validated_request.output_var_selection
        jobs = validated_request.function_jobs
        output_vars = list(output_var_selection.keys())

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "moga")
        samples = _jobs_to_df(jobs, input_vars, output_vars)

        domains: dict[str, DomainSpec] = {}
        for var, dist in distributions.items():
            if var not in input_vars:
                continue
            assert dist.min is not None and dist.max is not None, (
                f"MOGA requires a uniform distribution with min/max for variable '{var}'"
            )
            domains[var] = DomainSpec(minimum=dist.min, maximum=dist.max)

        result = _run_engine(
            sumo_optimize,
            samples,
            input_vars,
            output_var_selection,
            domains=domains,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
        )

        response_data = {"optimization_results": result.data}
        validated_response = MOGAOptimizationResponse.model_validate(response_data)

        _logger.debug("MOGA optimization completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 500)
