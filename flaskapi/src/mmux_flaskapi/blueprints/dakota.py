from __future__ import annotations

import logging
import traceback
from pathlib import Path
from typing import NoReturn, cast

import numpy as np
import pandas as pd

#
from flask import Blueprint, abort, jsonify, make_response
from pydantic import ValidationError

#
from mmux_flaskapi.blueprints.dakota_models import (
    CorrelationIndicesRequest,
    CorrelationIndicesResponse,
    CVAccuracyMetrics,
    CVConvergencePoint,
    FunctionJob,
    JobVariableSelection,
    ManualUQWithUncertaintyRequest,
    MOGAOptimizationRequest,
    MOGAOptimizationResponse,
    PairedTTestResult,
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
)
from mmux_flaskapi.dakota.funs_data_processing import (
    compute_correlation_indices,
    create_manual_uq_samples,
    process_input_file,
    sanitize_varnames,
)
from mmux_flaskapi.dakota.funs_evaluate import (
    compute_cv_accuracy_metrics,
    compute_cv_convergence,
    compute_paired_ttest,
    evaluate_sobol_indices,
    evaluate_sumo,
    evaluate_sumo_along_axes,
    evaluate_sumo_manual_crossvalidation,
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

    Uses DataPreprocessor for variable mapping and normalization.
    Returns cross-validation predictions with uncertainty estimates in original variable names.
    """
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    validated_request = parse_request_model(SumoCrossValidationRequest)

    # At this point, all validation is complete and we have a validated request object
    try:
        jobs: list[FunctionJob] = validated_request.function_jobs
        input_vars: list[str] = validated_request.input_vars
        output_var: str = validated_request.output

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "cross_validation")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_var], run_dir=run_dir
        )

        # Get mapped variable names for Dakota
        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_output_var = preprocessor.output_variables[output_var].mapped_name

        # Evaluate cross-validation with mapped variable names
        results = evaluate_sumo_manual_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            mapped_input_vars,
            mapped_output_var,
        )

        # Validate that "results" contains the expected keys: estimate of output (_hat) and its std (_std_hat)
        expected_keys = [mapped_output_var + "_hat", mapped_output_var + "_std_hat"]
        missing_keys = [key for key in expected_keys if key not in results]
        if missing_keys:
            _logger.error(f"Missing expected keys in results: {missing_keys}")
            return (
                jsonify({"error": f"Missing expected keys in results: {missing_keys}"}),
                422,
            )  # Unprocessable Entity

        # Inverse transform results to return original variable names while
        # preserving prediction suffixes expected by the client.
        results_transformed = _inverse_transform_output_results(preprocessor, results)

        _logger.debug("Cross-validation completed successfully!")
        return jsonify(results_transformed)
    except ValidationError as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 422)
    except ValueError as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 500)


@dakota_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    """
    Perform manual UQ propagation with uncertainty quantification.

    Uses DataPreprocessor for variable mapping and normalization.
    Creates multiple histogram realizations using uncertainty estimates
    from a trained surrogate model to quantify the uncertainty in the UQ results.
    Returns results in original variable space.
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

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "uq_with_uncertainty")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_response], run_dir=run_dir
        )

        # Get mapped variable names
        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_output_var = preprocessor.output_variables[output_response].mapped_name

        # Generate UQ samples using provided distributions
        _logger.debug(f"Generating {num_samples} UQ samples with seed {seed}")
        # Convert Pydantic models to dict format expected by create_manual_uq_samples
        distributions_dict = {var: dist.model_dump() for var, dist in distributions.items()}
        samples = create_manual_uq_samples(input_vars, distributions_dict, num_samples, seed)
        df_samples = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df_samples.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")

        df_samples_transformed = preprocessor.transform(df_samples)
        PROCESSED_UQ_SAMPLES_FILE = run_dir / "manual_uq_samples_processed.csv"
        df_samples_transformed.to_csv(PROCESSED_UQ_SAMPLES_FILE, sep=" ", index=False)

        # Evaluate surrogate model on UQ samples
        _logger.debug("Evaluating surrogate model on UQ samples")
        results = evaluate_sumo(
            run_dir,
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            mapped_input_vars,
            mapped_output_var,
        )

        # Verify uncertainty predictions are available
        uncertainty_key = mapped_output_var + "_std_hat"
        prediction_key = mapped_output_var + "_hat"

        if uncertainty_key not in results:
            available_keys = list(results.keys())
            raise ValueError(
                f"Cannot perform uncertainty quantification without '{uncertainty_key}' predictions. "
                f"Available result keys: {available_keys}. "
                f"Ensure the surrogate model was trained to predict uncertainty."
            )

        if prediction_key not in results:
            available_keys = list(results.keys())
            raise ValueError(
                f"Cannot perform uncertainty quantification without '{prediction_key}' predictions. "
                f"Available result keys: {available_keys}."
            )

        _logger.debug(f"Found required predictions: {prediction_key} and {uncertainty_key}")

        # Perform uncertainty propagation using error function inverse
        _logger.debug(
            f"Generating {n_histograms} histogram realizations for uncertainty quantification"
        )
        from scipy.special import erfinv  # type: ignore

        # Set random seed for reproducibility
        np.random.seed(seed)

        # Generate samples in transformed space
        all_results_transformed = np.empty(shape=(n_histograms, num_samples), dtype=float)
        for i in range(n_histograms):
            # Generate random samples from uniform distribution and transform via erfinv
            r = erfinv(
                np.random.uniform(-1 + 1e-10, 1 - 1e-10, size=num_samples)
            )  # Avoid exact -1,1 for erfinv
            all_results_transformed[i, :] = results[prediction_key] + r * results[uncertainty_key]

        # Inverse transform results to original space for histogram calculation
        # Create a results dict with all samples for inverse transform
        all_samples_dict = {mapped_output_var: all_results_transformed.flatten().tolist()}
        all_samples_original = preprocessor.inverse_transform(all_samples_dict)
        all_values = np.array(all_samples_original[output_response])

        # Reshape back to (n_histograms, num_samples)
        all_values_reshaped = all_values.reshape(n_histograms, num_samples)

        # Compute histogram statistics in original space
        _logger.debug("Computing histogram and statistical summaries in original space")
        all_values_flat = all_values.flatten()
        num_bins = min(50, max(10, num_samples // 10))  # Ensure reasonable number of bins
        hist_min, hist_max = np.percentile(all_values_flat, 1), np.percentile(all_values_flat, 99)

        # Handle edge case where hist_min == hist_max
        if hist_min == hist_max:
            hist_range = max(1e-10, abs(hist_min) * 1e-6)  # Small range around the value
            hist_min -= hist_range
            hist_max += hist_range

        bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

        # Compute histograms for each realization
        histograms = np.array(
            [
                np.histogram(all_values_reshaped[i, :], bins=bin_edges, density=True)[0]
                for i in range(n_histograms)
            ]
        )

        # Calculate statistics across histogram realizations
        bin_means = np.mean(histograms, axis=0)
        bin_stds = np.std(histograms, axis=0)

        # Calculate box plot quantities
        q1 = np.percentile(all_values_flat, 25)
        median = np.percentile(all_values_flat, 50)
        q3 = np.percentile(all_values_flat, 75)
        iqr = q3 - q1

        # Extended percentiles for UQ Stats modal (T24/T32/node T34); p1/p99 reuse the
        # already-computed histogram bounds (hist_min/hist_max)
        p5 = np.percentile(all_values_flat, 5)
        p95 = np.percentile(all_values_flat, 95)

        # Calculate whisker boundaries (1.5 * IQR rule)
        whisker_min = max(hist_min, q1 - 1.5 * iqr)
        whisker_max = min(hist_max, q3 + 1.5 * iqr)

        # Identify outliers
        outliers = all_values_flat[
            (all_values_flat < whisker_min) | (all_values_flat > whisker_max)
        ]

        # Create response object
        response_data = {
            "bins_start": float(hist_min),
            "bins_end": float(hist_max),
            "bin_means": bin_means.tolist(),
            "bin_stds": bin_stds.tolist(),
            "q1": float(q1),
            "median": float(median),
            "q3": float(q3),
            "whisker_min": float(whisker_min),
            "whisker_max": float(whisker_max),
            "outliers": outliers.tolist(),
            "mean": float(np.mean(all_values_flat)),
            "std": float(np.std(all_values_flat)),
            "min": float(np.min(all_values_flat)),
            "max": float(np.max(all_values_flat)),
            "p1": float(hist_min),
            "p5": float(p5),
            "p95": float(p95),
            "p99": float(hist_max),
        }

        # Validate response using Pydantic
        validated_response = UQWithUncertaintyResponse(**response_data)
        _logger.debug("UQ with uncertainty analysis completed successfully")

        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except ValueError as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 500)


@dakota_bp.route("/compute_correlation_indices", methods=["POST"])
def flask_compute_correlation_indices():
    """
    Compute per-input <-> output Pearson and Spearman correlation coefficients (#470).

    Generates the same kind of Monte Carlo sample set used for manual UQ propagation
    (per-input distributions -> samples -> surrogate evaluation), then correlates each
    input variable's samples against the predicted QoI values. Returns one response
    covering all requested input variables, so sensitivity of a QoI to every parameter
    can be inspected in a single plot (beyond the current 3-var 1D/2D/3D plot limit).
    """
    _logger.debug("Starting flask function: flask_compute_correlation_indices")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(CorrelationIndicesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        num_samples = validated_request.num_samples
        jobs = validated_request.function_jobs
        seed = validated_request.seed

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "correlation_indices")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_response], run_dir=run_dir
        )

        # Get mapped variable names
        mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
        mapped_output_var = preprocessor.output_variables[output_response].mapped_name

        # Generate Monte Carlo samples using the provided distributions
        _logger.debug(f"Generating {num_samples} correlation samples with seed {seed}")
        distributions_dict = {var: dist.model_dump() for var, dist in distributions.items()}
        samples = create_manual_uq_samples(input_vars, distributions_dict, num_samples, seed)
        df_samples = pd.DataFrame(samples)
        SAMPLES_FILE = run_dir / "correlation_samples.csv"
        df_samples.to_csv(SAMPLES_FILE, index=False)

        df_samples_transformed = preprocessor.transform(df_samples)
        PROCESSED_SAMPLES_FILE = run_dir / "correlation_samples_processed.csv"
        df_samples_transformed.to_csv(PROCESSED_SAMPLES_FILE, sep=" ", index=False)

        # Evaluate surrogate model on the samples
        results = evaluate_sumo(
            run_dir,
            PROCESSED_TRAINING_FILE,
            PROCESSED_SAMPLES_FILE,
            mapped_input_vars,
            mapped_output_var,
        )

        prediction_key = mapped_output_var + "_hat"
        if prediction_key not in results:
            raise ValueError(
                f"Cannot compute correlation indices without '{prediction_key}' predictions. "
                f"Available result keys: {list(results.keys())}."
            )

        # Inverse transform predicted output values back to original space
        output_predictions_original = preprocessor.inverse_transform(
            {mapped_output_var: results[prediction_key]}
        ).get(output_response, results[prediction_key])

        # Compute per-input correlation coefficients (original variable names/units)
        correlations = compute_correlation_indices(
            df_samples, output_predictions_original, input_vars
        )

        response_data = {"correlations": correlations}
        validated_response = CorrelationIndicesResponse.model_validate(response_data)

        _logger.debug("Correlation indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except ValueError as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 500)


@dakota_bp.route("/compute_sobol_indices", methods=["POST"])
def flask_compute_sobol_indices():
    """
    Compute per-input first-order (main effect), total-order, and second-order
    (pairwise interaction) Sobol' indices (#470).

    Builds a surrogate from completed jobs via ``evaluate_sumo()``, then computes
    Sobol' indices directly in Python: generates Saltelli A/B/AB sample matrices
    locally (honouring per-input distributions via ``scipy.stats.rv_continuous.ppf``),
    evaluates all samples in ONE batch through ``evaluate_sumo()``, then applies
    ``scipy.stats.sobol_indices`` for first/total order plus a closed-form second-order
    (pairwise interaction) estimator.  Response always includes ``sobolSecondOrder``
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
        # fixed SOBOL_BASE_SAMPLES constant (decoupled from the shared UQ numSamples
        # field, which SobolIndicesRequest still carries only for schema/validation
        # compatibility with ManualUQPropagationRequest, e.g. the >=5-completed-jobs check).
        jobs = validated_request.function_jobs
        seed = validated_request.seed

        # Create run directory
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "sobol_indices")

        # Use DataPreprocessor for standardized data handling
        PROCESSED_TRAINING_FILE, preprocessor = setup_preprocessor_for_workflow(
            jobs=jobs, input_vars=input_vars, output_vars=[output_response], run_dir=run_dir
        )

        # Get mapped variable names
        mapped_output_var = preprocessor.output_variables[output_response].mapped_name

        # Convert Pydantic distribution models to dicts for evaluate_sobol_indices
        distributions_dict = {var: dist.model_dump() for var, dist in distributions.items()}

        # Compute Sobol' indices: Saltelli sampling (fixed SOBOL_BASE_SAMPLES, V36)
        # + single evaluate_sumo() batch
        results = evaluate_sobol_indices(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            mapped_output_var,
            distributions_dict,
            preprocessor,
            seed=seed,
        )

        # Map sobol results (already keyed by original input variable names)
        response_data = {
            "sobol": results["sobol"],
            "sobol_second_order": results["sobolSecondOrder"],
        }
        validated_response = SobolIndicesResponse.model_validate(response_data)

        _logger.debug("Sobol' indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 400)
    except ValueError as e:
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
    Returns cross-validation accuracy metrics (RMSE, MAE, and other error statistics), a paired
    t-test on the CV actual-vs-predicted residuals (bias significance, V26), and a convergence
    series of the accuracy metric across increasing training-sample-count subsets (V27).
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

        # Run the manual (per-fold) CV evaluation once to get real actual/predicted pairs.
        # NB: this replaces the previous `evaluate_sumo_crossvalidation` (Dakota stdout-log
        # parsing) path, which always produced empty results because Dakota's CV log was
        # never captured (see backprop B11) - metrics below are derived directly from the
        # same actual/predicted arrays `/sumo_cross_validation` already computes.
        cv_results = evaluate_sumo_manual_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response,
        )
        actual = cv_results[output_response]
        predicted = cv_results[output_response + "_hat"]

        accuracy_metrics = compute_cv_accuracy_metrics(actual, predicted)
        t_test = compute_paired_ttest(actual, predicted)
        convergence = compute_cv_convergence(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response,
        )

        # Validate and structure response
        response_data = {
            "metrics": {output_response: CVAccuracyMetrics(**accuracy_metrics)},
            "t_test": PairedTTestResult(**t_test),
            "convergence": [CVConvergencePoint(**point) for point in convergence],
        }
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
