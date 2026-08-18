from __future__ import annotations

import logging
import traceback
from pathlib import Path
from typing import NoReturn, cast

import pandas as pd

#
from flask import Blueprint, abort, jsonify, make_response
from itis_sumo.api import DistributionSpec, SumoInputError
from itis_sumo.api import compute_correlations as sumo_compute_correlations
from itis_sumo.api import cross_validate as sumo_cross_validate
from itis_sumo.api import evaluate_sobol as sumo_evaluate_sobol
from itis_sumo.api import evaluate_uncertainty as sumo_evaluate_uncertainty
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
from mmux_flaskapi.dakota.funs_data_processing import (
    process_input_file,
    sanitize_varnames,
)
from mmux_flaskapi.dakota.funs_evaluate import (
    evaluate_sumo_along_axes,
    evaluate_sumo_crossvalidation,
    evaluate_sumo_on_grid,
    perform_moga_optimization,
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
def _create_training_file_from_jobs(
    jobs: list[FunctionJob],
    input_vars: list[str],
    output_response: str | list[str],
    folder_name: str = "evaluate",
) -> Path:
    output_vars = [output_response] if isinstance(output_response, str) else output_response
    df_jobs = _jobs_to_df(jobs, input_vars, output_vars)
    df_jobs = df_jobs.rename(
        columns={column: sanitize_varnames(column) for column in df_jobs.columns}
    )
    run_dir = create_run_dir(DAKOTA_RUNS_DIR, folder_name)
    TRAINING_FILE = run_dir / "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE


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


def setup_preprocessor_for_workflow(
    jobs: list[FunctionJob],
    input_vars: list[str],
    output_vars: list[str],
    run_dir: Path,
    input_normalizations: dict[str, str] | None = None,
    output_normalizations: dict[str, str] | None = None,
    input_sign_switches: list[str] | None = None,
    output_sign_switches: list[str] | None = None,
) -> tuple[Path, DataPreprocessor]:
    """
    Standardized preprocessor setup for Dakota workflows.

    Args:
        jobs: List of completed FunctionJob objects
        input_vars: List of input variable names
        output_vars: List of output variable names (can be single string or list)
        run_dir: Directory to save files
        input_normalizations: Optional dict mapping input vars to normalization methods
        output_normalizations: Optional dict mapping output vars to normalization methods
        input_sign_switches: Optional list of input vars to switch signs
        output_sign_switches: Optional list of output vars to switch signs

    Returns:
        Tuple of (processed_training_file_path, fitted_preprocessor)
    """
    # Ensure output_vars is a list
    if isinstance(output_vars, str):
        output_vars = [output_vars]

    df_completed_jobs = _jobs_to_df(jobs, input_vars, output_vars)

    # Save original training file
    training_file = run_dir / "df_jobs.csv"
    df_completed_jobs.to_csv(training_file, index=False)

    # Setup preprocessor
    preprocessor = DataPreprocessor()
    preprocessor.setup_variables(input_vars=input_vars, output_vars=output_vars)

    # Configure normalizations if provided
    if input_normalizations or output_normalizations:
        preprocessor.setup_normalization(
            input_normalizations=input_normalizations, output_normalizations=output_normalizations
        )

    # Configure sign switching if provided
    if input_sign_switches or output_sign_switches:
        preprocessor.setup_sign_switching(
            input_sign_switches=input_sign_switches, output_sign_switches=output_sign_switches
        )

    # Fit and transform
    df_preprocessed = preprocessor.fit_transform(df_completed_jobs)

    # Save configuration
    preprocessor.save_config(run_dir / "preprocessor_config.json")

    # Save processed file (Dakota format - space separated)
    processed_file = run_dir / "df_processed_jobs.dat"
    df_preprocessed.to_csv(processed_file, sep=" ", index=False)

    _logger.info(f"Preprocessor fitted and saved to {run_dir}")

    return processed_file, preprocessor


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


def _mapped_to_original(preprocessor: DataPreprocessor) -> dict[str, str]:
    """Return the original variable name for each mapped variable name."""
    return preprocessor.get_inverse_mapping()


def _inverse_transform_values(
    preprocessor: DataPreprocessor,
    mapped_key: str,
    values: list[float],
    mapped_to_original: dict[str, str],
) -> list[float]:
    """Inverse transform mapped values when they correspond to known variables."""
    original_key = mapped_to_original.get(mapped_key)
    if original_key is None:
        return values

    inverse = preprocessor.inverse_transform({mapped_key: values})
    return inverse.get(original_key, values)


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

    Uses DataPreprocessor for variable mapping and normalization.
    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns predictions along each specified input variable axis in original space.
    """
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    request_data = parse_request_model(SumoAlongAxesRequest)

    try:
        # Extract validated data
        output_response = request_data.output
        input_vars = request_data.inputs
        jobs = request_data.function_jobs
        slider_values = request_data.slider_values

        _logger.debug(f"Validated request: {len(input_vars)} inputs, {len(jobs)} jobs")
        _logger.debug(f"Slider values: {slider_values}")

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "along_axes")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_response], run_dir=run_dir
        )

        # Get mapped variable names
        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_output_var = preprocessor.output_variables[output_response].mapped_name

        # Transform slider values to mapped space if provided
        mapped_slider_values = None
        if slider_values:
            # Transform the slider values using the preprocessor
            slider_df = pd.DataFrame([slider_values])
            slider_df_transformed = preprocessor.transform(slider_df)
            mapped_slider_values = cast(dict[str, float], slider_df_transformed.iloc[0].to_dict())
            _logger.debug(f"Mapped slider values: {mapped_slider_values}")

        # Evaluate SUMO along axes with mapped variables
        results = evaluate_sumo_along_axes(
            run_dir,
            PROCESSED_TRAINING_FILE,
            mapped_input_vars,
            mapped_output_var,
            cut_values=mapped_slider_values,
        )

        # Inverse transform results to return original variable names
        # Map results from mapped input names back to original names
        mapped_to_orig_input = {
            cfg.mapped_name: orig for orig, cfg in preprocessor.input_variables.items()
        }
        predictions_original = {}
        for m_var, axis_data in results.items():
            orig_var = mapped_to_orig_input.get(m_var, m_var)
            x_inv = preprocessor.inverse_transform({m_var: list(axis_data["x"])}).get(
                orig_var, list(axis_data["x"])
            )
            y_inv = preprocessor.inverse_transform(
                {mapped_output_var: list(axis_data["y_hat"])}
            ).get(output_response, list(axis_data["y_hat"]))
            axis_orig: dict = {"x": x_inv, "y_hat": y_inv}
            if "std_hat" in axis_data:
                axis_orig["std_hat"] = list(axis_data["std_hat"])
            predictions_original[orig_var] = axis_orig

        # Validate and structure response
        response_data = {"predictions": predictions_original}
        validated_response = SumoAlongAxesResponse.model_validate(response_data)

        _logger.debug("SUMO along axes evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Validation error in SUMO along axes: {e}")
        error_details = []
        for error in e.errors():
            location = " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            error_details.append(f"{location}: {error['msg']}")
        handle_workflow_error(
            Exception(f"Validation failed: {', '.join(error_details)}"),
            "flask_evaluate_sumo_along_axes",
            400,
        )

    except Exception as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 500)


## This method could probably be generic for N-D (thus not needing the 1D version above)
@dakota_bp.route("/sumo_grid_evaluation", methods=["POST"])
def flask_sumo_grid_evaluation():
    """
    SUMO model evaluation on a grid with optional fixed values for non-grid variables.

    Uses DataPreprocessor for variable mapping and normalization.
    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns grid data with input coordinates and predictions in original space.
    """
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    request_data = parse_request_model(SumoGridEvaluationRequest)

    try:
        # Extract validated data
        output_response = request_data.output
        grid_vars = request_data.grid_vars
        input_vars = request_data.input_vars
        jobs = request_data.function_jobs
        slider_values = request_data.slider_values

        _logger.debug(
            f"Validated request: {len(input_vars)} inputs, {len(grid_vars)} grid vars, {len(jobs)} jobs"
        )
        _logger.debug(f"Grid variables: {grid_vars}")
        _logger.debug(f"Slider values: {slider_values}")

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "grid_evaluation")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_response], run_dir=run_dir
        )

        # Get mapped variable names
        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_grid_vars = [preprocessor.input_variables[var].mapped_name for var in grid_vars]
        mapped_output_var = preprocessor.output_variables[output_response].mapped_name

        # Transform slider values to mapped space if provided
        mapped_slider_values = None
        if slider_values:
            # Transform the slider values using the preprocessor
            slider_df = pd.DataFrame([slider_values])
            slider_df_transformed = preprocessor.transform(slider_df)
            mapped_slider_values = cast(dict[str, float], slider_df_transformed.iloc[0].to_dict())
            _logger.debug(f"Mapped slider values: {mapped_slider_values}")

        # Evaluate SUMO on grid with mapped variables
        results = evaluate_sumo_on_grid(
            run_dir,
            PROCESSED_TRAINING_FILE,
            mapped_grid_vars,
            mapped_input_vars,
            mapped_output_var,
            cut_values=mapped_slider_values,
        )

        # Inverse transform results to return original variable names.
        mapped_to_orig = _mapped_to_original(preprocessor)
        grid_data_original = {}
        for key, values in results.items():
            orig_key = mapped_to_orig.get(key, key)
            if values and isinstance(values[0], list):
                # 2D array (reshaped grid output) - flatten, inverse transform, reshape back
                nested_values = cast(list[list[float]], values)
                flat = [item for row in nested_values for item in row]
                flat_inv = _inverse_transform_values(preprocessor, key, flat, mapped_to_orig)
                inner = len(nested_values[0])
                grid_data_original[orig_key] = [
                    flat_inv[i : i + inner] for i in range(0, len(flat_inv), inner)
                ]
            else:
                grid_data_original[orig_key] = _inverse_transform_values(
                    preprocessor, key, list(values), mapped_to_orig
                )

        # Validate and structure response
        response_data = {"grid_data": grid_data_original}
        validated_response = SumoGridEvaluationResponse.model_validate(response_data)

        _logger.debug("SUMO grid evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Validation error in SUMO grid evaluation: {e}")
        error_details = []
        for error in e.errors():
            location = " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            error_details.append(f"{location}: {error['msg']}")
        handle_workflow_error(
            Exception(f"Validation failed: {', '.join(error_details)}"),
            "flask_sumo_grid_evaluation",
            400,
        )

    except Exception as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 500)


@dakota_bp.route("/get_sumo_cv_accuracy_metrics", methods=["POST"])
def flask_get_sumo_cv_accuracy_metrics():
    """
    Get SUMO cross-validation accuracy metrics for model evaluation.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns cross-validation accuracy metrics including RMSE, MAE, and other error statistics.
    """
    _logger.debug("Starting flask function: flask_get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    request_data = parse_request_model(SumoCVAccuracyMetricsRequest)

    try:
        # Extract validated data
        output_response = request_data.output
        input_vars = request_data.inputs
        jobs = request_data.function_jobs

        _logger.debug(f"Validated request: {len(input_vars)} inputs, {len(jobs)} jobs")

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        # Process the training file
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + [output_response],
        )

        # Evaluate SUMO cross-validation
        results = evaluate_sumo_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response,
        )

        _logger.debug(f"Raw CV results: {results}")

        # Handle case where Dakota returns empty results
        if not results:
            # Return a default response indicating no metrics were found
            results = {output_response: "No surrogate quality metrics found."}

        # Transform results to match expected response format
        response_metrics = {}
        for var_name, metrics in results.items():
            if isinstance(metrics, dict):
                # Convert metrics dict to CVAccuracyMetrics model
                cv_metrics = CVAccuracyMetrics(**metrics)
                response_metrics[var_name] = cv_metrics
            else:
                # Handle string responses like "No surrogate quality metrics found."
                response_metrics[var_name] = metrics

        # Validate and structure response
        response_data = {"metrics": response_metrics}
        validated_response = SumoCVAccuracyMetricsResponse.model_validate(response_data)

        _logger.debug("SUMO CV accuracy metrics completed successfully")
        return jsonify(validated_response.model_dump())

    except Exception as e:
        _logger.error(f"Error while getting SUMO CV accuracy metrics: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@dakota_bp.route("/perform_moga_optimization", methods=["POST"])
def flask_perform_moga_optimization():
    """
    Perform Multi-Objective Genetic Algorithm (MOGA) optimization.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns Pareto front solutions with input and output variable values for multi-objective optimization.
    """
    _logger.debug("Starting flask function: flask_perform_moga_optimization")
    _logger.debug("Cwd: " + str(Path.cwd()))

    request_data = parse_request_model(MOGAOptimizationRequest)

    try:
        # Extract validated data
        input_vars = request_data.input_vars
        input_distributions_raw = request_data.distributions
        output_var_selection = request_data.output_var_selection
        jobs = request_data.function_jobs

        # Convert Pydantic distribution models to dict format expected by the optimization function
        input_distributions = {
            var: dist.model_dump() for var, dist in input_distributions_raw.items()
        }

        output_responses = list(output_var_selection.keys())
        _logger.debug(
            f"Validated request: {len(input_vars)} inputs, {len(output_responses)} outputs, {len(jobs)} jobs"
        )
        _logger.debug(f"Output responses: {output_responses}")
        _logger.debug(f"Output var selection: {output_var_selection}")

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "moga")
        maximize_outputs = [
            variable
            for variable, direction in output_var_selection.items()
            if direction == "maximize"
        ]

        processed_training_file, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs,
            input_vars=input_vars,
            output_vars=output_responses,
            run_dir=run_dir,
            output_sign_switches=maximize_outputs,
        )

        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_output_vars = [
            preprocessor.output_variables[var].mapped_name for var in output_responses
        ]
        mapped_input_distributions = {
            preprocessor.input_variables[var].mapped_name: distribution
            for var, distribution in input_distributions.items()
        }

        # Perform MOGA optimization
        results = perform_moga_optimization(
            run_dir,
            processed_training_file,
            mapped_input_vars,
            mapped_input_distributions,
            mapped_output_vars,
            moga_kwargs={"max_function_evaluations": 1000},
        )

        results = preprocessor.inverse_transform(results)

        _logger.debug(f"Final MOGA results before validation: {results}")
        _logger.debug(f"Result array lengths: {[(k, len(v)) for k, v in results.items()]}")

        # Validate and structure response
        response_data = {"optimization_results": results}
        validated_response = MOGAOptimizationResponse.model_validate(response_data)

        _logger.debug("MOGA optimization completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Validation error in MOGA optimization: {e}")
        error_details = []
        for error in e.errors():
            location = " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            error_details.append(f"{location}: {error['msg']}")
        abort(make_response(jsonify({"error": "Validation failed", "details": error_details}), 400))
    except Exception as e:
        error_message = str(e)

        # Check for specific validation errors that should return 400
        if "Missing required output variable" in error_message or (
            "Missing outputs" in error_message and "job" in error_message
        ):
            _logger.error(f"Missing output variable validation error: {e}")
            abort(make_response(jsonify({"error": f"Validation failed: {error_message}"}), 400))
        elif "Distribution for variable" in error_message and "is not defined" in error_message:
            _logger.error(f"Missing distribution validation error: {e}")
            # Extract variable name for better error message
            import re

            var_match = re.search(
                r"Distribution for variable '(.+?)' is not defined", error_message
            )
            if var_match:
                var_name = var_match.group(1)
                abort(
                    make_response(
                        jsonify(
                            {
                                "error": f"Validation failed: Missing distribution for variable '{var_name}'"
                            }
                        ),
                        400,
                    )
                )
            else:
                abort(
                    make_response(
                        jsonify(
                            {"error": f"Validation failed: Missing distribution - {error_message}"}
                        ),
                        400,
                    )
                )
        elif isinstance(e, KeyError):
            # KeyError typically means missing required variables/fields
            _logger.error(f"Missing required field validation error: {e}")
            field_name = str(e).strip("'\"")

            # Determine if this is an input or output variable error by checking context
            if field_name in input_vars:
                abort(
                    make_response(
                        jsonify(
                            {
                                "error": f"Validation failed: Missing required input variable '{field_name}'"
                            }
                        ),
                        400,
                    )
                )
            elif field_name in output_responses:
                abort(
                    make_response(
                        jsonify(
                            {
                                "error": f"Validation failed: Missing required output variable '{field_name}'"
                            }
                        ),
                        400,
                    )
                )
            else:
                abort(
                    make_response(
                        jsonify(
                            {
                                "error": f"Validation failed: Missing required variable '{field_name}'"
                            }
                        ),
                        400,
                    )
                )
        elif error_message.startswith("Input ") and " not in job:" in error_message:
            field_name = error_message[len("Input ") :].split(" not in job:", 1)[0]
            _logger.error(f"Missing required input variable validation error: {e}")
            abort(
                make_response(
                    jsonify(
                        {
                            "error": f"Validation failed: Missing required input variable '{field_name}'"
                        }
                    ),
                    400,
                )
            )
        elif error_message.startswith("Output ") and " not in job:" in error_message:
            field_name = error_message[len("Output ") :].split(" not in job:", 1)[0]
            _logger.error(f"Missing required output variable validation error: {e}")
            abort(
                make_response(
                    jsonify(
                        {
                            "error": f"Validation failed: Missing required output variable '{field_name}'"
                        }
                    ),
                    400,
                )
            )
        else:
            _logger.error(f"Error while performing MOGA optimization: {e}")
            abort(make_response(jsonify({"error": str(e)}), 500))
