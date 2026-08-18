from __future__ import annotations

import logging
import traceback
from pathlib import Path
from typing import NoReturn

import pandas as pd

#
from flask import Blueprint, abort, jsonify, make_response
from itis_sumo.api import DistributionSpec, DomainSpec, SumoInputError, SumoResultError
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
    SumoCVAccuracyMetricsRequest,
    SumoCVAccuracyMetricsResponse,
    SumoGridEvaluationRequest,
    SumoGridEvaluationResponse,
    UQWithUncertaintyResponse,
    required_completed_jobs,
)
from mmux_flaskapi.data_preprocessor import DataPreprocessor

#
from mmux_flaskapi.utils.helpers import create_run_dir
from mmux_flaskapi.utils.json_serializer import parse_request_model

_logger = logging.getLogger(__name__)
dakota_bp = Blueprint("dakota", __name__)

DAKOTA_RUNS_DIR = Path.cwd().parent.parent.parent / "runs_dakota"
_logger.info(f"Saving runs in {DAKOTA_RUNS_DIR}")
DAKOTA_RUNS_DIR.mkdir(exist_ok=True)
assert DAKOTA_RUNS_DIR.is_dir(), "Dakota Runs Dir does not exist!!"


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


def _inverse_transform_output_results(
    preprocessor: DataPreprocessor,
    results: dict[str, list[float]],
) -> dict[str, list[float]]:
    """Inverse transform output values while preserving Dakota suffixes."""
    transformed: dict[str, list[float]] = {}

    for original_name, config in preprocessor.output_variables.items():
        mapped_name = config.mapped_name

        if mapped_name in results:
            inverse = preprocessor.inverse_transform({mapped_name: results[mapped_name]})
            if original_name in inverse:
                transformed[original_name] = inverse[original_name]

        for suffix in ("_hat", "_std_hat"):
            suffixed_key = mapped_name + suffix
            if suffixed_key not in results:
                continue
            inverse = preprocessor.inverse_transform({mapped_name: results[suffixed_key]})
            if original_name in inverse:
                transformed[original_name + suffix] = inverse[original_name]

    return transformed


def _bounds_from_distributions(
    input_vars: list[str],
    distributions: dict,
) -> tuple[list[float], list[float]]:
    """Derive Sobol'/VBD sampling bounds per input variable from its distribution (#470).

    Uses explicit min/max when provided (always the case for a "uniform" distribution,
    enforced by `DistributionParams`); otherwise falls back to mean +/- 3*std for a
    "normal" distribution (also always present, enforced by `DistributionParams`).
    variance_based_decomp needs a bounded continuous_design domain, unlike the
    correlation-indices endpoint which samples directly from the distribution.
    """
    lower_bounds: list[float] = []
    upper_bounds: list[float] = []
    for var in input_vars:
        dist = distributions[var]
        if dist.min is not None and dist.max is not None:
            lower_bounds.append(dist.min)
            upper_bounds.append(dist.max)
        else:
            lower_bounds.append(dist.mean - 3 * dist.std)
            upper_bounds.append(dist.mean + 3 * dist.std)
    return lower_bounds, upper_bounds


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

        result = sumo_cross_validate(samples, input_vars, output_var, workspace=run_dir)

        response_data = {
            output_var: result.observed,
            f"{output_var}_hat": result.predicted,
            f"{output_var}_std_hat": result.predicted_std,
        }

        _logger.debug("Cross-validation completed successfully!")
        return jsonify(response_data)
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

        result = sumo_evaluate_uncertainty(
            samples,
            input_vars,
            output_response,
            distributions=distribution_specs,
            num_samples=num_samples,
            n_histograms=n_histograms,
            seed=seed,
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
        result = sumo_compute_correlations(samples, input_vars, output_response)

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
    (pairwise interaction) Sobol' indices (#470).

    Delegates to itis_sumo.api.evaluate_sobol, which fits a surrogate on the
    completed-job samples and computes Sobol' indices from explicit per-input
    distributions (SPEC V16qf). Response always includes ``sobolSecondOrder``
    (no opt-in flag).
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
        result = sumo_evaluate_sobol(
            samples,
            input_vars,
            output_response,
            distributions=distribution_specs,
            seed=seed,
            workspace=run_dir,
        )

        response_data = {
            "sobol": result.indices,
            "sobol_second_order": result.second_order,
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

        result = sumo_evaluate_along_axes(
            samples,
            input_vars,
            output_response,
            at=slider_values,
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

        result = sumo_evaluate_grid(
            samples,
            input_vars,
            output_response,
            grid_variables=grid_vars,
            at=slider_values,
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
            result = sumo_evaluate_cv_metrics(
                samples, input_vars, output_response, workspace=run_dir
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

        result = sumo_optimize(
            samples, input_vars, output_var_selection, domains=domains, workspace=run_dir
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
