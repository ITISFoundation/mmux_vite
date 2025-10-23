import os
import json
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from pydantic import ValidationError

#
from flask import Blueprint, jsonify
from flask import request, abort, make_response

#

from mmux_flaskapi.blueprints.dakota_models import (
    FunctionJob,
    ManualUQWithUncertaintyRequest,
    SumoCrossValidationRequest,
    UQWithUncertaintyResponse,
    SumoAlongAxesRequest,
    SumoAlongAxesResponse,
    SumoGridEvaluationRequest,
    SumoGridEvaluationResponse,
    SumoCVAccuracyMetricsRequest,
    SumoCVAccuracyMetricsResponse,
    CVAccuracyMetrics,
    MOGAOptimizationRequest,
    MOGAOptimizationResponse,
)

#
from mmux_flaskapi.utils.helpers import sanitize_varnames, create_run_dir
from mmux_flaskapi.utils.data_preprocessor import DataPreprocessor
from mmux_python.funs_evaluate import (
    evaluate_sumo_along_axes,
    evaluate_sumo,
    evaluate_sumo_crossvalidation,
    evaluate_sumo_manual_crossvalidation,
    evaluate_sumo_on_grid,
    perform_moga_optimization,
)
from mmux_python.funs_data_processing import (
    process_input_file,
    create_manual_uq_samples,
    sanitize_varnames,
)


_logger = logging.getLogger(__name__)
dakota_bp = Blueprint("dakota", __name__)

DAKOTA_RUNS_DIR = Path.cwd().parent.parent.parent / "runs_dakota"
_logger.info(f"Saving runs in {DAKOTA_RUNS_DIR}")
DAKOTA_RUNS_DIR.mkdir(exist_ok=True)
assert DAKOTA_RUNS_DIR.is_dir(), "Dakota Runs Dir does not exist!!"

"""
def _check_jobs(jobs: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    completed_jobs = [job for job in jobs if job["status"].lower() == "completed" or job["status"].lower() == "success"]  # type: ignore

    for job in completed_jobs:
        assert "outputs" in job, f"No outputs key found for completed job: {job} with status: {job['status']}"  # type: ignore

    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")

    if len(completed_jobs) == 0:
        raise ValueError("No completed jobs found. Cannot create training file.")
    elif len(completed_jobs) < 5:
        raise ValueError(
            "At least 5 samples are necessary to build a surrogate model in Dakota - a crash would occur otherwise."
        )

    return completed_jobs


def _jobs_to_df(jobs: list[Dict[str, Any]]) -> pd.DataFrame:
    assert jobs[0]["inputs"] is not None, f"No inputs found for job: {jobs[0]}"
    assert jobs[0]["outputs"] is not None, f"No outputs found for job: {jobs[0]}"
    input_vars = list(jobs[0]["inputs"].keys())
    output_vars = list(jobs[0]["outputs"].keys())

    list_of_dicts = []
    for job in jobs:
        d = {}
        for key in input_vars:
            assert job["inputs"] is not None, f"No inputs found for job: {job}"
            assert key in job["inputs"].keys(), f"Input {key} not in job: {job}"
            d[key] = job["inputs"][key]
        for res in output_vars:
            assert job["outputs"] is not None, f"No outputs found for job: {job}"
            assert res in job["outputs"].keys(), f"Output {res} not in job: {job}"
            d[res] = job["outputs"][res]
        list_of_dicts.append(d)
    return pd.DataFrame(list_of_dicts)

def _get_job_dict(job: Dict[str, Any], output_response_sanitized: str | list[str]) -> Dict[str, Any]:
    assert job["inputs"] is not None, f"No inputs found for job: {job}"
    assert job["outputs"] is not None, f"No outputs found for job: {job}"
    d = {key: job["inputs"][key] for key in job["inputs"].keys()}
    output_response_sanitized_list = (
        [output_response_sanitized]
        if isinstance(output_response_sanitized, str)
        else output_response_sanitized
    )
    for res in output_response_sanitized_list:
        assert res in job["outputs"].keys(), f"Output {res} not in job: {job}"
        d[res] = job["outputs"][res]  # type: ignore
    return d

### DEPRECATED
def _create_training_file_from_jobs(
    jobs: list[Dict[str, Any]],
    input_vars: list[str],
    output_response: str | list[str],
    folder_name: str = "evaluate",
) -> Path:
    print(
        "_create_training_file_from_jobs is deprecated. Use create_training_file_from_preprocessed_jobs instead."
    )
    completed_jobs = _check_jobs(jobs)
    output_response_sanitized = sanitize_varnames(output_response)

    df_jobs = pd.DataFrame([_get_job_dict(job, output_response_sanitized) for job in completed_jobs])

    run_dir = create_run_dir(RUNS_DIR, folder_name)
    TRAINING_FILE = run_dir / "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE
########################################################
"""


########################################################
def _create_training_file_from_jobs(
    jobs: list[FunctionJob],
    input_vars: list[str],
    output_response: str | list[str],
    folder_name: str = "evaluate",
) -> Path:
    output_response_sanitized = sanitize_varnames(output_response)
    completed_jobs = [
        job
        for job in jobs
        if job.status.lower() == "completed" or job.status.lower() == "success"
    ]
    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")

    if len(completed_jobs) == 0:
        raise ValueError("No completed jobs found. Cannot create training file.")
    elif len(completed_jobs) < 5:
        raise ValueError(
            "At least 5 samples are necessary to build a surrogate model in Dakota - a crash would occur otherwise."
        )

    def get_job_dict(job):
        d = {sanitize_varnames(key): job.inputs[key] for key in input_vars}
        if not hasattr(job, "outputs") or not job.outputs:
            raise ValueError(f"Missing outputs in job: {job}")
        output_response_sanitized_list = (
            [output_response_sanitized]
            if isinstance(output_response_sanitized, str)
            else output_response_sanitized
        )
        for res in output_response_sanitized_list:
            if res not in job.outputs.keys():
                raise ValueError(f"Missing required output variable '{res}' in job")
            d[res] = job.outputs[res]
        return d

    df_jobs = pd.DataFrame([get_job_dict(job) for job in completed_jobs])
    run_dir = create_run_dir(DAKOTA_RUNS_DIR, folder_name)
    TRAINING_FILE = run_dir / "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE


@dakota_bp.route("/sumo_cross_validation", methods=["POST"])
def flask_sumo_cross_validation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    request_model = SumoCrossValidationRequest

    # Parse request data
    try:
        request_data: dict = json.loads(request.data.decode("utf-8"))
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400

    # Validate request using Pydantic model
    try:
        validated_request = request_model.model_validate(request_data)
    except Exception as e:
        _logger.warning(f"Validation failed for {request_model.__name__}: {str(e)}")
        return jsonify({"error": str(e)}), 400

    # At this point, all validation is complete and we have a validated request object
    try:
        jobs: list[FunctionJob] = validated_request.FunctionJobs
        input_vars: list[str] = validated_request.inputVars
        output_var: str = validated_request.output

        TRAINING_FILE = _create_training_file_from_jobs(
            jobs,
            input_vars,
            output_var,
        )
        run_dir = TRAINING_FILE.parent
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + [output_var],
        )
        results = evaluate_sumo_manual_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_var,
        )

        # Validate that "results" contains the expected keys: estimate of output (_hat) and its std (_std_hat)
        expected_keys = [output_var + "_hat", output_var + "_std_hat"]
        missing_keys = [key for key in expected_keys if key not in results]
        if missing_keys:
            _logger.error(f"Missing expected keys in results: {missing_keys}")
            return (
                jsonify({"error": f"Missing expected keys in results: {missing_keys}"}),
                422,
            )  # Unprocessable Entity

        _logger.debug("Done!!")
        return jsonify(results)
    except Exception as e:
        _logger.error(f"Error during cross-validation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@dakota_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    """
    Perform manual UQ propagation with uncertainty quantification.

    This endpoint creates multiple histogram realizations using uncertainty estimates
    from a trained surrogate model to quantify the uncertainty in the UQ results.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug(
        "Starting flask function: flask_manual_uq_propagation_with_uncertainty"
    )
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Parse and validate request using Pydantic
        request_data: dict = json.loads(request.data.decode("utf-8"))
        _logger.debug(f"Request data received with keys: {list(request_data.keys())}")

        validated_request = ManualUQWithUncertaintyRequest(**request_data)
        _logger.debug(
            f"Request validation successful. Processing {len(validated_request.FunctionJobs)} jobs"
        )

        # Extract validated parameters
        output_response = validated_request.output
        input_vars = validated_request.inputVars
        distributions = validated_request.distributions
        num_samples = validated_request.numSamples
        jobs = validated_request.FunctionJobs
        n_histograms = validated_request.nHistograms
        seed = validated_request.seed

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(
            jobs, input_vars, output_response
        )
        run_dir = TRAINING_FILE.parent
        _logger.debug(f"Training file created: {TRAINING_FILE}")

        # Process training data
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + [output_response],
        )

        # Generate UQ samples using provided distributions
        _logger.debug(f"Generating {num_samples} UQ samples with seed {seed}")
        # Convert Pydantic models to dict format expected by create_manual_uq_samples
        distributions_dict = {
            var: dist.model_dump() for var, dist in distributions.items()
        }
        samples = create_manual_uq_samples(
            input_vars, distributions_dict, num_samples, seed
        )
        df = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")

        # Process UQ samples
        PROCESSED_UQ_SAMPLES_FILE = process_input_file(
            UQ_SAMPLES_FILE,
            columns_to_keep=input_vars,
        )

        # Evaluate surrogate model on UQ samples
        _logger.debug("Evaluating surrogate model on UQ samples")
        results = evaluate_sumo(
            run_dir,
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            input_vars,
            output_response,
        )

        # Verify uncertainty predictions are available
        uncertainty_key = output_response + "_std_hat"
        prediction_key = output_response + "_hat"

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

        _logger.debug(
            f"Found required predictions: {prediction_key} and {uncertainty_key}"
        )

        # Perform uncertainty propagation using error function inverse
        _logger.debug(
            f"Generating {n_histograms} histogram realizations for uncertainty quantification"
        )
        from scipy.special import erfinv  # type: ignore

        # Set random seed for reproducibility
        np.random.seed(seed)

        all_results = np.empty(shape=(n_histograms, num_samples), dtype=float)
        for i in range(n_histograms):
            # Generate random samples from uniform distribution and transform via erfinv
            r = erfinv(
                np.random.uniform(-1 + 1e-10, 1 - 1e-10, size=num_samples)
            )  # Avoid exact -1,1 for erfinv
            all_results[i, :] = results[prediction_key] + r * results[uncertainty_key]

        # Compute histogram statistics
        _logger.debug("Computing histogram and statistical summaries")
        all_values = all_results.flatten()
        num_bins = min(
            50, max(10, num_samples // 10)
        )  # Ensure reasonable number of bins
        hist_min, hist_max = np.percentile(all_values, 1), np.percentile(all_values, 99)

        # Handle edge case where hist_min == hist_max
        if hist_min == hist_max:
            hist_range = max(
                1e-10, abs(hist_min) * 1e-6
            )  # Small range around the value
            hist_min -= hist_range
            hist_max += hist_range

        bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

        # Compute histograms for each realization
        histograms = np.array(
            [
                np.histogram(all_results[i, :], bins=bin_edges, density=True)[0]
                for i in range(n_histograms)
            ]
        )

        # Calculate statistics across histogram realizations
        bin_means = np.mean(histograms, axis=0)
        bin_stds = np.std(histograms, axis=0)

        # Calculate box plot quantities
        q1 = np.percentile(all_values, 25)
        median = np.percentile(all_values, 50)
        q3 = np.percentile(all_values, 75)
        iqr = q3 - q1

        # Calculate whisker boundaries (1.5 * IQR rule)
        whisker_min = max(hist_min, q1 - 1.5 * iqr)
        whisker_max = min(hist_max, q3 + 1.5 * iqr)

        # Identify outliers
        outliers = all_values[(all_values < whisker_min) | (all_values > whisker_max)]

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
            "mean": float(np.mean(all_values)),
            "std": float(np.std(all_values)),
            "min": float(np.min(all_values)),
            "max": float(np.max(all_values)),
        }

        # Validate response using Pydantic
        validated_response = UQWithUncertaintyResponse(**response_data)
        _logger.debug("UQ with uncertainty analysis completed successfully")

        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Request validation error: {e}")
        abort(make_response(jsonify({"error": f"Validation error: {str(e)}"}), 400))
    except ValueError as e:
        _logger.error(f"Value error during UQ with uncertainty: {e}")
        abort(make_response(jsonify({"error": str(e)}), 400))
    except Exception as e:
        _logger.error(f"Unexpected error during UQ with uncertainty: {e}")
        abort(
            make_response(jsonify({"error": f"Internal server error: {str(e)}"}), 500)
        )


@dakota_bp.route("/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    """
    SuMo model evaluation along each input axis with optional fixed values.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns predictions along each specified input variable axis.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Parse and validate request using Pydantic
        request_data = SumoAlongAxesRequest.model_validate(request.get_json())

        # Extract validated data
        output_response = request_data.output
        input_vars = request_data.inputs
        jobs = request_data.FunctionJobs
        slider_values = request_data.sliderValues

        _logger.debug(f"Validated request: {len(input_vars)} inputs, {len(jobs)} jobs")
        _logger.debug(f"Slider values: {slider_values}")

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(
            jobs, input_vars, output_response
        )
        run_dir = TRAINING_FILE.parent

        # Process the training file
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + [output_response],
        )

        # Evaluate SUMO along axes
        results = evaluate_sumo_along_axes(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response,
            cut_values=slider_values,
        )

        # Validate and structure response
        response_data = {"predictions": results}
        validated_response = SumoAlongAxesResponse.model_validate(response_data)

        _logger.debug("SUMO along axes evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Validation error in SUMO along axes: {e}")
        error_details = []
        for error in e.errors():
            location = (
                " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            )
            error_details.append(f"{location}: {error['msg']}")
        abort(
            make_response(
                jsonify({"error": "Validation failed", "details": error_details}), 400
            )
        )

    except Exception as e:
        _logger.error(f"Error during evaluation along axes: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


## This method could probably be generic for N-D (thus not needing the 1D version above)
@dakota_bp.route("/sumo_grid_evaluation", methods=["POST"])
def flask_sumo_grid_evaluation():
    """
    SUMO model evaluation on a grid with optional fixed values for non-grid variables.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns grid data with input coordinates and predictions.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Parse and validate request using Pydantic
        request_data = SumoGridEvaluationRequest.model_validate(request.get_json())

        # Extract validated data
        output_response = request_data.output
        grid_vars = request_data.gridVars
        input_vars = request_data.inputVars
        jobs = request_data.FunctionJobs
        slider_values = request_data.sliderValues

        _logger.debug(
            f"Validated request: {len(input_vars)} inputs, {len(grid_vars)} grid vars, {len(jobs)} jobs"
        )
        _logger.debug(f"Grid variables: {grid_vars}")
        _logger.debug(f"Slider values: {slider_values}")

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(
            jobs, input_vars, output_response
        )
        run_dir = TRAINING_FILE.parent

        # Process the training file
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + [output_response],  # type: ignore
        )

        # Evaluate SUMO on grid
        results = evaluate_sumo_on_grid(
            run_dir,
            PROCESSED_TRAINING_FILE,
            grid_vars,
            input_vars,
            output_response,  # type: ignore
            cut_values=slider_values,
        )

        # Validate and structure response
        response_data = {"grid_data": results}
        validated_response = SumoGridEvaluationResponse.model_validate(response_data)

        _logger.debug("SUMO grid evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        _logger.error(f"Validation error in SUMO grid evaluation: {e}")
        error_details = []
        for error in e.errors():
            location = (
                " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            )
            error_details.append(f"{location}: {error['msg']}")
        abort(
            make_response(
                jsonify({"error": "Validation failed", "details": error_details}), 400
            )
        )

    except Exception as e:
        _logger.error(f"Error during grid evaluation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@dakota_bp.route("/get_sumo_cv_accuracy_metrics", methods=["POST"])
def flask_get_sumo_cv_accuracy_metrics():
    """
    Get SUMO cross-validation accuracy metrics for model evaluation.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns cross-validation accuracy metrics including RMSE, MAE, and other error statistics.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Parse and validate request using Pydantic
        request_json = request.get_json()
        if request_json is None:
            abort(
                make_response(
                    jsonify({"error": "Invalid JSON or missing content-type header"}),
                    400,
                )
            )

        request_data = SumoCVAccuracyMetricsRequest.model_validate(request_json)

        # Extract validated data
        output_response = request_data.output
        input_vars = request_data.inputs
        jobs = request_data.FunctionJobs

        _logger.debug(f"Validated request: {len(input_vars)} inputs, {len(jobs)} jobs")

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(
            jobs, input_vars, output_response
        )
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

    except ValidationError as e:
        _logger.error(f"Validation error in SUMO CV accuracy metrics: {e}")
        error_details = []
        for error in e.errors():
            location = (
                " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            )
            error_details.append(f"{location}: {error['msg']}")
        abort(
            make_response(
                jsonify({"error": "Validation failed", "details": error_details}), 400
            )
        )
    except Exception as e:
        error_message = str(e)
        # Check if it's a JSON parsing error (400 Bad Request from Flask)
        if "400 Bad Request" in error_message and (
            "JSON" in error_message or "browser" in error_message
        ):
            _logger.error(f"Invalid JSON request: {e}")
            abort(
                make_response(
                    jsonify({"error": "Invalid JSON or malformed request"}), 400
                )
            )
        else:
            _logger.error(f"Error while getting SUMO CV accuracy metrics: {e}")
            abort(make_response(jsonify({"error": str(e)}), 500))


_logger.info("Flask workflows module loaded successfully!")


@dakota_bp.route("/perform_moga_optimization", methods=["POST"])
def flask_perform_moga_optimization():
    """
    Perform Multi-Objective Genetic Algorithm (MOGA) optimization.

    Uses Pydantic validation to ensure robust input validation and consistent error handling.
    Returns Pareto front solutions with input and output variable values for multi-objective optimization.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_perform_moga_optimization")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Parse and validate request using Pydantic
        request_json = request.get_json()
        if request_json is None:
            abort(
                make_response(
                    jsonify({"error": "Invalid JSON or missing content-type header"}),
                    400,
                )
            )

        request_data = MOGAOptimizationRequest.model_validate(request_json)

        # Extract validated data
        input_vars = request_data.inputVars
        input_distributions_raw = request_data.distributions
        output_var_selection = request_data.outputVarSelection
        jobs = request_data.FunctionJobs

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

        # Create mapping for converting results back to original names

        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(
            jobs, input_vars, output_responses, folder_name="moga"
        )
        run_dir = TRAINING_FILE.parent

        # Process the training file
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=input_vars + output_responses,
        )

        # Perform MOGA optimization
        results = perform_moga_optimization(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            input_distributions,
            list(output_var_selection.keys()),
            moga_kwargs={"max_function_evaluations": 1000},
        )

        _logger.debug(f"Final MOGA results before validation: {results}")
        _logger.debug(
            f"Result array lengths: {[(k, len(v)) for k, v in results.items()]}"
        )

        # Validate and structure response
        response_data = {"optimization_results": results}
        validated_response = MOGAOptimizationResponse.model_validate(response_data)

        _logger.debug("MOGA optimization completed successfully")
        return jsonify(validated_response.model_dump())

        """
        ### This is the new structure of the request:
        input_distributions: Dict[str, Dict[str, float]] = request_data[
            "inputDistributions"
        ]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
        input_vars: list[str] = [k for k in input_distributions.keys()]
        output_var_selection: Dict[str, Literal["minimize", "maximize"]] = request_data[
            "outputVarSelection"
        ]

        ## before the function
        completed_jobs = _check_jobs(jobs)
        df_completed_jobs = _jobs_to_df(completed_jobs)
        TRAINING_FILE = run_dir / "df_jobs.csv"
        df_completed_jobs.to_csv(TRAINING_FILE, index=False)

        from data_preprocessor.data_preprocessor import DataPreprocessor

        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(input_vars=list(jobs[0]["inputs"].keys()), output_vars=list(jobs[0]["outputs"].keys()))  # type: ignore
        preprocessor.setup_sign_switching(
            output_sign_switches=[
                k for k, v in output_var_selection.items() if v == "maximize"
            ]
        )
        preprocessor.filter_variables(
            include_inputs=input_vars, include_outputs=output_responses
        )

        df_preprocessed_jobs = preprocessor.fit_transform(df_completed_jobs)
        preprocessor.save_config(run_dir / "preprocessor_config.json")
        PROCESSED_TRAINING_FILE = run_dir / "df_processed_jobs.csv"
        df_preprocessed_jobs.to_csv(
            PROCESSED_TRAINING_FILE, sep=" ", index=False
        )  # Dakota expects a space-separated file

        ##### TODO abstract this as a function
        seed = moga_kwargs.get("seed", None)
        assert (
            seed is not None
        ), "MOGA settings must include a seed for the random number generator"
        numberSeeds = moga_kwargs.get("numberSeeds", None)
        _logger.debug(f"MOGA seed: {seed}, numberSeeds: {numberSeeds}")
        if numberSeeds is not None:
            assert isinstance(
                numberSeeds, int
            ), "MOGA settings must include an integer numberSeeds"
            seeds = [seed + i for i in range(numberSeeds)]
            moga_kwargs.pop("numberSeeds")  # remove it from the kwargs to avoid issues
        else:
            seeds = [seed]
        _logger.debug(f"MOGA seeds: {seeds}")

        all_results = []
        for seed in seeds:
            assert isinstance(
                seed, int
            ), "MOGA settings must include a list of integer seeds"
            moga_kwargs["seed"] = seed
            _logger.debug(
                f"Running MOGA optimization with seed {seed} and settings: {moga_kwargs}"
            )
            results: Dict[str, list[float | int]] = perform_moga_optimization(
                run_dir,
                PROCESSED_TRAINING_FILE,
                [preprocessor.get_variable_mapping()[k] for k in input_vars],
                {
                    preprocessor.get_variable_mapping()[k]: v
                    for k, v in input_distributions.items()
                },
                [preprocessor.get_variable_mapping()[k] for k in output_responses],
                moga_kwargs=moga_kwargs,
            )
            all_results.append(results)
            _logger.debug(f"Results for seed {seed}: {results}")
        assert len(all_results) == len(
            seeds
        ), "MOGA settings must include a result for each seed"
        if not all_results:
            _logger.error(
                "No results were produced by MOGA optimization (all_results is empty)."
            )
            abort(
                make_response(
                    jsonify(
                        {"error": "No results were produced by MOGA optimization."}
                    ),
                    500,
                )
            )

        results = { k: [item for resdict in all_results for item in resdict[k]]
            for k in all_results[0].keys()
        }
        _logger.debug(f"All results: {results}")
        ###################################################

        results_df = pd.DataFrame(results)
        _logger.debug("Results df: ")
        _logger.debug(results_df)
        _logger.debug("\n\nLen of results df: ", len(results_df))
        non_dominated_indices = get_non_dominated_indices(
            results_df,
            optimized_vars=[
                preprocessor.get_variable_mapping()[k] for k in output_responses
            ],
            sort_by_column=preprocessor.get_variable_mapping()[output_responses[0]],
        )
        postprocessed_results = preprocessor.inverse_transform(results)
        postprocessed_results["non_dominated_indices"] = (
            np.array(non_dominated_indices).astype(float).tolist()
        )  ## int64 is not JSON serializable
        _logger.debug(postprocessed_results)

        return jsonify(postprocessed_results)


        ### NB this pre-processing && post-processing is to be tested bfr release
        ## Then, it is to be integrated in the new package and all operations should be done there
        ## e.g. we pass input_vars, output_vars, etc and evth gets done internally
        ## Do not put effort into modifying previous workflows -- they will be fully reworked
        """

    except ValidationError as e:
        _logger.error(f"Validation error in MOGA optimization: {e}")
        error_details = []
        for error in e.errors():
            location = (
                " -> ".join(str(x) for x in error["loc"]) if error["loc"] else "root"
            )
            error_details.append(f"{location}: {error['msg']}")
        abort(
            make_response(
                jsonify({"error": "Validation failed", "details": error_details}), 400
            )
        )
    except Exception as e:
        error_message = str(e)

        # Check for specific validation errors that should return 400
        if "Missing required output variable" in error_message or (
            "Missing outputs" in error_message and "job" in error_message
        ):
            _logger.error(f"Missing output variable validation error: {e}")
            abort(
                make_response(
                    jsonify({"error": f"Validation failed: {error_message}"}), 400
                )
            )
        elif (
            "Distribution for variable" in error_message
            and "is not defined" in error_message
        ):
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
                            {
                                "error": f"Validation failed: Missing distribution - {error_message}"
                            }
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
        elif "400 Bad Request" in error_message and (
            "JSON" in error_message or "browser" in error_message
        ):
            _logger.error(f"Invalid JSON request: {e}")
            abort(
                make_response(
                    jsonify({"error": "Invalid JSON or malformed request"}), 400
                )
            )
        else:
            _logger.error(f"Error while performing MOGA optimization: {e}")
            abort(make_response(jsonify({"error": str(e)}), 500))
