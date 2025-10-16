"""
Improved Dakota API endpoints with Pydantic validation.
This demonstrates how to replace the manual validation with Pydantic models.
"""
import os
import json
import logging
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Literal
#
from flask import Blueprint, jsonify
from flask import request, abort, make_response
#
from mmux_flaskapi.blueprints.dakota_models import FunctionJob
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
dakota_improved_bp = Blueprint('dakota_improved', __name__, url_prefix='/dakota-v2')

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


@dakota_improved_bp.route("/sumo_cross_validation", methods=["POST"])
def flask_sumo_cross_validation():
    """
    Improved SUMO cross-validation endpoint with Pydantic validation.
    
    Compare this implementation to the original - it's much cleaner and more maintainable.
    """
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    request_model = dakota_models.SumoCrossValidationRequest

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
        inputs: list[str] = validated_request.inputVars
        output: str = validated_request.output

        TRAINING_FILE = _create_training_file_from_jobs(
            jobs,
            inputs,
            output,
        )
        run_dir = TRAINING_FILE.parent
        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            columns_to_keep=validated_request.inputVars + [validated_request.output],
        )
        results = evaluate_sumo_manual_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            validated_request.inputVars,
            validated_request.output,
        )

        _logger.debug("Done!!")
        return jsonify(results) 
    except Exception as e:
        _logger.error(f"Error during cross-validation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@dakota_improved_bp.route("/manual_uq_propagation", methods=["POST"])
def flask_manual_uq_propagation():
    """Improved manual UQ propagation endpoint with Pydantic validation."""
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        request_data: dict = json.loads(request.data.decode("utf-8"))
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400

    # Validate request using Pydantic model
    validated_request, error_msg = validate_request_json(request_data, ManualUQPropagationRequest)
    if error_msg:
        return jsonify({"error": error_msg}), 400

    try:
        input_vars_sanitized = sanitize_varnames(validated_request.inputVars)
        output_response_sanitized = sanitize_varnames(validated_request.output)
        distributions = sanitize_varnames(validated_request.distributions)

        TRAINING_FILE = _create_training_file_from_jobs(
            validated_request.FunctionJobs, 
            validated_request.inputVars, 
            validated_request.output
        )
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=validated_request.log,
            columns_to_keep=input_vars_sanitized + [output_response_sanitized],
        )

        # Generate UQ samples
        samples = create_manual_uq_samples(
            input_vars_sanitized, 
            distributions, 
            validated_request.numSamples
        )
        df = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
        
        PROCESSED_UQ_SAMPLES_FILE = process_input_file(
            UQ_SAMPLES_FILE,
            make_log=validated_request.log,
            columns_to_keep=input_vars_sanitized,
        )
        results_sanitized = evaluate_sumo(
            run_dir, 
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            input_vars_sanitized,
            output_response_sanitized,
        )
        
        results = {
            key.replace(output_response_sanitized, validated_request.output): val 
            for key, val in results_sanitized.items()
        }
        
        _logger.debug("Done!!")
        return jsonify(results[validated_request.output + "_hat"])
    
    except Exception as e:
        _logger.error(f"Error during manual UQ propagation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@dakota_improved_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    """Improved manual UQ propagation with uncertainty endpoint using Pydantic validation."""
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        request_data: dict = json.loads(request.data.decode("utf-8"))
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400

    # Validate request using Pydantic model
    validated_request, error_msg = validate_request_json(request_data, ManualUQWithUncertaintyRequest)
    if error_msg:
        return jsonify({"error": error_msg}), 400
    
    try:
        # Sanitize variable names
        input_vars_sanitized = sanitize_varnames(validated_request.inputVars)
        output_response_sanitized = sanitize_varnames(validated_request.output)

        TRAINING_FILE = _create_training_file_from_jobs(
            validated_request.FunctionJobs, 
            validated_request.inputVars, 
            validated_request.output
        )
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=validated_request.log,
            columns_to_keep=input_vars_sanitized + [output_response_sanitized],
        )

        # Generate UQ samples
        samples = create_manual_uq_samples(
            input_vars_sanitized, 
            validated_request.distributions, 
            validated_request.numSamples, 
            validated_request.seed
        )
        df = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
        
        PROCESSED_UQ_SAMPLES_FILE = process_input_file(
            UQ_SAMPLES_FILE,
            make_log=validated_request.log,
            columns_to_keep=input_vars_sanitized,
        )
        results_sanitized = evaluate_sumo(
            run_dir, 
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            input_vars_sanitized,
            output_response_sanitized,
        )
        results = {
            key.replace(output_response_sanitized, validated_request.output): val 
            for key, val in results_sanitized.items()
        }

        # Check that we have uncertainty prediction
        uncertainty_key = validated_request.output + "_std_hat"
        if uncertainty_key not in results:
            raise ValueError("Cannot perform uncertainty of UQ if there is no prediction of the uncertainty")
        
        # Generate uncertainty estimation using multiple histograms
        from scipy.special import erfinv
        all_results = np.empty(shape=(validated_request.nHistograms, validated_request.numSamples), dtype=float)
        for i in range(validated_request.nHistograms):
            r = erfinv(np.random.uniform(-1, 1, size=validated_request.numSamples))
            all_results[i, :] = results[validated_request.output + "_hat"] + r * results[uncertainty_key]

        # Compute common bin edges for all histograms
        all_values = all_results.flatten()
        num_bins = min(50, validated_request.numSamples // 10)
        hist_min, hist_max = np.percentile(all_values, 1), np.percentile(all_values, 99)
        bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

        # Compute histograms for each row
        histograms = np.array([
            np.histogram(all_results[i, :], bins=bin_edges, density=True)[0]
            for i in range(validated_request.nHistograms)
        ])

        # Calculate statistics
        bin_means = np.mean(histograms, axis=0)
        bin_stds = np.std(histograms, axis=0)
        
        # Calculate quantities for whisker-plot
        all_results_flat = all_results.flatten()
        q1 = np.percentile(all_results_flat, 25)
        median = np.percentile(all_results_flat, 50)
        q3 = np.percentile(all_results_flat, 75)
        iqr = q3 - q1
        whisker_min = np.maximum(hist_min, q1 - 1.5 * iqr)
        whisker_max = np.minimum(hist_max, q3 + 1.5 * iqr)
        outliers = all_results_flat[(all_results_flat < whisker_min) | (all_results_flat > whisker_max)]

        output = {
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
            "mean": float(np.mean(all_results_flat)),
            "std": float(np.std(all_results_flat)),
            "min": float(np.min(all_results_flat)),
            "max": float(np.max(all_results_flat)),
        }

        _logger.debug("Done!!")
        return jsonify(output) 
    except Exception as e:
        _logger.error(f"Error during manual UQ propagation with uncertainty: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


# Additional endpoints can be implemented similarly...
# The pattern is always:
# 1. Parse JSON
# 2. Validate with Pydantic model  
# 3. Use validated data in business logic
# 4. Handle exceptions

_logger.info("Improved Flask Dakota module loaded successfully!")