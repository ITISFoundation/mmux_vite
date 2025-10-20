import os
import json
import logging
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Literal
from pydantic import ValidationError
#
from flask import Blueprint, jsonify
from flask import request, abort, make_response
#
from mmux_flaskapi.blueprints.dakota_models import FunctionJob, ManualUQWithUncertaintyRequest, UQWithUncertaintyResponse
# 
from mmux_flaskapi.utils.helpers import sanitize_varnames, create_run_dir
from mmux_flaskapi.blueprints import dakota_models

## TODO eventually have it installed as a package -- absolute paths are risky...
base_dir = Path(__file__).parent.parent.parent.parent # /faskapi
print("Adding to sys.path: ", str(base_dir.parent)) # /mmux_vite
sys.path.append(str(base_dir.parent))
from flaskapi.mmux_python.utils.funs_evaluate import evaluate_sumo_along_axes, evaluate_sumo, evaluate_sumo_crossvalidation, evaluate_sumo_manual_crossvalidation, evaluate_sumo_on_grid, perform_moga_optimization
from flaskapi.mmux_python.utils.funs_data_processing import (
    process_input_file,
    create_manual_uq_samples,
    sanitize_varnames,
)


_logger = logging.getLogger(__name__)
dakota_bp = Blueprint('dakota', __name__, url_prefix='/dakota')


########################################################
def _create_training_file_from_jobs(jobs: List[FunctionJob], input_vars: List[str], output_response: str | List[str], folder_name: str = "evaluate") -> Path:
    """
    Create training file from validated jobs.
    This function can now assume that jobs are already validated by Pydantic.
    """
    output_response_sanitized = sanitize_varnames(output_response)
    # No need for manual validation - Pydantic already ensured we have >= 5 completed jobs
    completed_jobs = [job for job in jobs if job.status in ["completed", "success"]]
    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")

    def get_job_dict(job):
        d = {sanitize_varnames(key): job.inputs[key] for key in input_vars}
        output_response_sanitized_list = [output_response_sanitized] if isinstance(output_response_sanitized, str) else output_response_sanitized
        for res in output_response_sanitized_list:
            d[res] = job.outputs[res]
        return d
    
    df_jobs = pd.DataFrame([get_job_dict(job) for job in completed_jobs])
    run_dir = create_run_dir(base_dir, folder_name)
    TRAINING_FILE = run_dir / "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE
########################################################

@dakota_bp.route("/sumo_cross_validation", methods=["POST"])
def flask_sumo_cross_validation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    request_model = dakota_models.SumoCrossValidationRequest
    # _logger.debug("request model: ", request_model.model_dump()) # type: ignore

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
        # _logger.debug("validated request: ")
        # _logger.debug(validated_request)
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
            return jsonify({"error": f"Missing expected keys in results: {missing_keys}"}), 422  # Unprocessable Entity

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
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        # Parse and validate request using Pydantic
        request_data: dict = json.loads(request.data.decode("utf-8"))
        _logger.debug(f"Request data received with keys: {list(request_data.keys())}")
        
        validated_request = ManualUQWithUncertaintyRequest(**request_data)
        _logger.debug(f"Request validation successful. Processing {len(validated_request.FunctionJobs)} jobs")

        # Extract validated parameters
        output_response = validated_request.output
        input_vars = validated_request.inputVars
        distributions = validated_request.distributions
        num_samples = validated_request.numSamples
        jobs = validated_request.FunctionJobs
        n_histograms = validated_request.nHistograms
        seed = validated_request.seed
    
        # Create training file from validated jobs
        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
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
        distributions_dict = {var: dist.model_dump() for var, dist in distributions.items()}
        samples = create_manual_uq_samples(input_vars, distributions_dict, num_samples, seed)
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
        
        _logger.debug(f"Found required predictions: {prediction_key} and {uncertainty_key}")
        
        # Perform uncertainty propagation using error function inverse
        _logger.debug(f"Generating {n_histograms} histogram realizations for uncertainty quantification")
        from scipy.special import erfinv # type: ignore
        
        # Set random seed for reproducibility
        np.random.seed(seed)
        
        all_results = np.empty(shape=(n_histograms, num_samples), dtype=float)
        for i in range(n_histograms):
            # Generate random samples from uniform distribution and transform via erfinv
            r = erfinv(np.random.uniform(-1 + 1e-10, 1 - 1e-10, size=num_samples))  # Avoid exact -1,1 for erfinv
            all_results[i, :] = results[prediction_key] + r * results[uncertainty_key]

        # Compute histogram statistics
        _logger.debug("Computing histogram and statistical summaries")
        all_values = all_results.flatten()
        num_bins = min(50, max(10, num_samples // 10))  # Ensure reasonable number of bins
        hist_min, hist_max = np.percentile(all_values, 1), np.percentile(all_values, 99)
        
        # Handle edge case where hist_min == hist_max
        if hist_min == hist_max:
            hist_range = max(1e-10, abs(hist_min) * 1e-6)  # Small range around the value
            hist_min -= hist_range
            hist_max += hist_range
        
        bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

        # Compute histograms for each realization
        histograms = np.array([
            np.histogram(all_results[i, :], bins=bin_edges, density=True)[0]
            for i in range(n_histograms)
        ])

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
        abort(make_response(jsonify({"error": f"Internal server error: {str(e)}"}), 500))

@dakota_bp.route("/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        output_response = request_data["output"]
        input_vars: List[str] = request_data["inputs"]
        make_log: bool = request_data.get("log", False)
        jobs: List[FunctionJob] = request_data["FunctionJobs"]
        slider_values = request_data.get("sliderValues", None)  # this is a dict of input_vars to cut values, e.g. {"input1": 0.5, "input2": 1.0}
        _logger.debug(f"Slider values: {slider_values}")
        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars + [output_response],
        )
        if make_log:  # FIXME for now log applies to all inputs & the output
            input_vars = [f"log_{var}" for var in input_vars]
            output_response = f"log_{output_response}"

        results = evaluate_sumo_along_axes(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response, 
            cut_values = slider_values
        )
        
        _logger.debug("Done!!")
        return jsonify(results) 
    except Exception as e:
        _logger.error(f"Error during evaluation along axes: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

## This method could probably be generic for N-D (thus not needing the 1D version above)
@dakota_bp.route("/sumo_grid_evaluation", methods=["POST"])
def flask_sumo_grid_evaluation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        output_response = request_data["output"]
        grid_vars: List[str] = request_data["gridVars"]
        input_vars: List[str] = request_data["inputVars"]
        make_log: bool = request_data.get("log", False)
        jobs: List[FunctionJob] = request_data["FunctionJobs"]
        slider_values = request_data.get("sliderValues", None)  # this is a dict of input_vars to cut values, e.g. {"input1": 0.5, "input2": 1.0}
        _logger.debug(f"Slider values: {slider_values}")
        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars + [output_response], # type: ignore
        )
        if make_log:  # FIXME for now log applies to all inputs & the output
            input_vars = [f"log_{var}" for var in input_vars]
            output_response = f"log_{output_response}"

        results = evaluate_sumo_on_grid(
            run_dir,
            PROCESSED_TRAINING_FILE,
            grid_vars,
            input_vars,
            output_response, # type: ignore
            cut_values = slider_values
        )
        _logger.debug("Done!!")
        return jsonify(results) # check if jsonify is needed
    except Exception as e:
        _logger.error(f"Error during grid evaluation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))
        



@dakota_bp.route("/get_sumo_cv_accuracy_metrics")
def flask_get_sumo_cv_accuracy_metrics():
    _logger.debug("Starting flask function: flask/get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        output_response = request_data["output"]
        input_vars: List[str] = request_data["inputs"]
        make_log = request_data.get("log", False)
        jobs = request_data["FunctionJobs"]
        
        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars + [output_response], # type: ignore
        )

        results = evaluate_sumo_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response, # type: ignore
        )
        _logger.debug("Done!!")
        return jsonify(results)
    except Exception as e:
        _logger.error(f"Error while getting SUMO CV accuracy metrics: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

_logger.info("Flask workflows module loaded successfully!")


@dakota_bp.route("/perform_moga_optimization", methods=["POST"])
def flask_perform_moga_optimization():
    _logger.debug("Starting flask function: flask/perform_moga_optimization")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        input_vars: List[str] = request_data["inputVars"]
        input_distributions: Dict[str, Dict[str, float]] = request_data["distributions"]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
        output_var_selection: Dict[str, Literal["minimize", "maximize"]] = request_data["outputVarSelection"]
        output_responses = [k for k in output_var_selection.keys()]
        _logger.debug(f"Output responses: {output_responses}")
        _logger.debug(f"Output var selection: {output_var_selection}")
        assert len(output_responses) >= 2, "At least two output responses must be selected for MOGA optimization."
        make_log = request_data.get("log", False)
        jobs = request_data["FunctionJobs"]

        input_distributions_sanitized = sanitize_varnames(input_distributions)
        input_vars_sanitized = sanitize_varnames(input_vars)
        output_var_selection_sanitized = sanitize_varnames(output_var_selection)
        output_responses_sanitized = [k for k in output_var_selection_sanitized.keys()]
        _logger.debug(f"Sanitized output responses: {output_responses_sanitized}")
        _logger.debug(f"Sanitized output var selection: {output_var_selection_sanitized}")
        sanitized_vars = input_vars_sanitized + output_responses_sanitized
        original_vars = input_vars + output_responses

        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_responses, folder_name="moga")
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized + output_responses_sanitized, # type: ignore
        )

        results_sanitized = perform_moga_optimization(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars_sanitized,
            input_distributions_sanitized,
            list(output_var_selection_sanitized.keys()),
            moga_kwargs={"max_function_evaluations": 1000},
        )

        results = {
            key.replace(sanitized, original): val for key, val in results_sanitized.items()
            for sanitized, original in zip(sanitized_vars, original_vars)
        }

        _logger.debug("Done!!")
        return jsonify(results)
    
    except Exception as e:
        _logger.error(f"Error while performing MOGA optimization: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500)) 
