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
from osparc_client.models.function_job import FunctionJob
# 
from mmux_flaskapi.utils.helpers import sanitize_varnames, create_run_dir ## taken over from mmux_python

## TODO eventually have it installed as a package -- absolute paths are risky...
print("Adding to sys.path: ", str(Path(__file__).parent.parent.parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent.parent.parent))
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
    output_response_sanitized = sanitize_varnames(output_response)
    completed_jobs = [job for job in jobs if job["status"].lower() == "completed" or job["status"].lower() == "success"]  # type: ignore
    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")

    if len(completed_jobs) == 0:
        raise ValueError("No completed jobs found. Cannot create training file.")
    elif len(completed_jobs)<5:
        raise ValueError("At least 5 samples are necessary to build a surrogate model in Dakota - a crash would occur otherwise.")

    def get_job_dict(job):
        d = {sanitize_varnames(key): job["inputs"][key] for key in input_vars}
        assert "outputs" in job.keys(), f"Outputs not in job: {job}"
        output_response_sanitized_list = [output_response_sanitized] if isinstance(output_response_sanitized, str) else output_response_sanitized
        for res in output_response_sanitized_list:
            assert res in job["outputs"].keys(), f"Output {res} not in job: {job}"
            d[res] = job["outputs"][res] # type: ignore
        return d
    df_jobs = pd.DataFrame(
            [get_job_dict(job) for job in completed_jobs]
        )
    run_dir = create_run_dir(Path("."), folder_name)  ## TODO move create_run_dir invocation to the workflow function
    TRAINING_FILE = run_dir/  "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE
########################################################


@dakota_bp.route("/sumo_cross_validation", methods=["POST"])
def flask_sumo_cross_validation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        output_response = request_data["output"]
        input_vars: List[str] = request_data["inputVars"]
        
        jobs: List[FunctionJob] = request_data["FunctionJobs"]
        make_log: bool = request_data.get("log", False)

        # Sanitize variable names
        input_vars_sanitized = sanitize_varnames(input_vars)
        output_response_sanitized = sanitize_varnames(output_response)

        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized + [output_response_sanitized], # type: ignore
        )
        if make_log:  # FIXME for now log applies to all inputs & the output
            input_vars_sanitized = [f"log_{var}" for var in input_vars_sanitized]
            output_response_sanitized = f"log_{output_response_sanitized}"

        results_sanitized = evaluate_sumo_manual_crossvalidation(
            run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars_sanitized,
            output_response_sanitized, # type: ignore
        )
        ## now need to de-sanitize the result keys before returning the results
        results = {key.replace(output_response_sanitized, output_response): val for key, val in results_sanitized.items()}

        _logger.debug("Done!!")

        return jsonify(results) 
    except Exception as e:
        _logger.error(f"Error during cross-validation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


### First do "normal" manual UQ propagation & compare w the outputs of Dakota. Then do the N times w error.
@dakota_bp.route("/manual_uq_propagation", methods=["POST"])
def flask_manual_uq_propagation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        output_response = request_data["output"]
        input_vars: List[str] = request_data["inputVars"]
        distributions: Dict[str, Dict[str, float]] = request_data["distributions"]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
        num_samples: int = request_data["numSamples"]
        jobs: List[FunctionJob] = request_data["FunctionJobs"]
        make_log: bool = request_data.get("log", False)
    
        input_vars_sanitized = sanitize_varnames(input_vars)
        output_response_sanitized = sanitize_varnames(output_response)
        distributions = sanitize_varnames(distributions)

        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized + [output_response_sanitized], # type: ignore
        )

        # if make_log:  # FIXME for now log applies to all inputs & the output
        #     input_vars = [f"log_{var}" for var in input_vars]
        #     output_response = f"log_{output_response}"
        #     means = {f"log_{key}": np.log(val) for key, val in means.items()}
        #     stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

        ## for some reason, much more noisy than Dakota's sampling
        samples = create_manual_uq_samples(input_vars_sanitized, distributions, num_samples)
        df = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
        
        PROCESSED_UQ_SAMPLES_FILE = process_input_file(
            UQ_SAMPLES_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized,
        )
        results_sanitized = evaluate_sumo(
            run_dir, 
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            input_vars_sanitized,
            output_response_sanitized,
        )
        
        results = {key.replace(output_response_sanitized, output_response): val for key, val in results_sanitized.items()}
        
        _logger.debug("Done!!")
        # return jsonify(results) 
        return jsonify(results[output_response+"_hat"]) # for compatibility w normal dakota UQ
    
    except Exception as e:
        _logger.error(f"Error during manual UQ propagation: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


### First do "normal" manual UQ propagation & compare w the outputs of Dakota. Then do the N times w error.
@dakota_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        _logger.debug(f"Request data: {request_data}")
        output_response = request_data["output"]
        input_vars: List[str] = request_data["inputVars"]
        distributions = request_data["distributions"]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
        num_samples: int = request_data["numSamples"]
        jobs: List[FunctionJob] = request_data["FunctionJobs"]
        make_log: bool = request_data.get("log", False)
        n_histograms: int = request_data["nHistograms"] # number of histograms - to give uncertainty over it
        seed: int = request_data["seed"] 
    
        # Sanitize variable names
        input_vars_sanitized = sanitize_varnames(input_vars)
        output_response_sanitized = sanitize_varnames(output_response)

        TRAINING_FILE = _create_training_file_from_jobs(jobs, input_vars, output_response)
        run_dir = TRAINING_FILE.parent

        PROCESSED_TRAINING_FILE = process_input_file(
            TRAINING_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized + [output_response_sanitized], # type: ignore
        )

        # if make_log:  # FIXME for now log applies to all inputs & the output
        #     input_vars = [f"log_{var}" for var in input_vars]
        #     output_response = f"log_{output_response}"
        #     means = {f"log_{key}": np.log(val) for key, val in means.items()}
        #     stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

        ## for some reason, much more noisy than Dakota's sampling
        samples = create_manual_uq_samples(input_vars_sanitized, distributions, num_samples, seed)
        df = pd.DataFrame(samples)
        UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
        df.to_csv(UQ_SAMPLES_FILE, index=False)
        _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
        
        PROCESSED_UQ_SAMPLES_FILE = process_input_file(
            UQ_SAMPLES_FILE,
            make_log=make_log,
            columns_to_keep=input_vars_sanitized,
        )
        results_sanitized = evaluate_sumo(
            run_dir, 
            PROCESSED_TRAINING_FILE,
            PROCESSED_UQ_SAMPLES_FILE,
            input_vars_sanitized,
            output_response_sanitized,
        )
        results = {key.replace(output_response_sanitized, output_response): val for key, val in results_sanitized.items()}

        ## now, use the prediction of std_hat to get an estimation of the uncertainty over the UQ
        assert output_response + "_std_hat" in results, f"Cannot perform uncertainty of UQ if there is no prediction of the uncertainty"
        
        ## TODO change by normal (gaussian) sampling
        from scipy.special import erfinv # type: ignore
        all_results = np.empty(shape=(n_histograms, num_samples), dtype=float) # create an empty array to store the results
        for i in range(n_histograms):
            r = erfinv(np.random.uniform(-1, 1, size=num_samples)) # generate random samples from an uniform distribution
            all_results[i, :] = results[output_response+"_hat"] + r * results[output_response+"_std_hat"]

        # Compute common bin edges for all histograms
        all_values = all_results.flatten()
        num_bins = min(50, num_samples // 10)  # or set as needed
        hist_min, hist_max = np.percentile(all_values, 1), np.percentile(all_values, 99)
        bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

        # Compute histograms for each row (histogram per UQ run)
        histograms = np.array([
            np.histogram(all_results[i, :], bins=bin_edges, density=True)[0]
            for i in range(n_histograms)
        ])

        # Calculate mean and std of bin heights across histograms
        bin_means = np.mean(histograms, axis=0)
        bin_stds = np.std(histograms, axis=0)
        
        # calculate quantities for whisker-plot
        all_results = all_results.flatten()
        q1 = np.percentile(all_results, 25, axis=0)
        median = np.percentile(all_results, 50, axis=0)
        q3 = np.percentile(all_results, 75, axis=0)
        iqr = q3 - q1  # Interquartile range for whisker plot
        whisker_min = np.maximum(hist_min, q1 - 1.5 * iqr)
        whisker_max = np.minimum(hist_max, q3 + 1.5 * iqr)
        outliers = all_results[(all_results < whisker_min) | (all_results > whisker_max)]

        output = {
            "bins_start": float(hist_min),
            "bins_end": float(hist_max),
            "bin_means": bin_means.tolist(),
            "bin_stds": bin_stds.tolist(),
            # "histograms": histograms.tolist()  # optional, for debugging/plotting
            "q1": float(q1),
            "median": float(median),
            "q3": float(q3),
            "whisker_min": float(whisker_min),
            "whisker_max": float(whisker_max),
            "outliers": outliers.tolist(),
            ## changed now the metrics that are displayed with the Histogram (instead of Whisker Plot)
            "mean": float(np.mean(all_results)),
            "std": float(np.std(all_results)),
            "min": float(np.min(all_results)),
            "max": float(np.max(all_results)),
        }

        _logger.debug("Done!!")
        return jsonify(output) 
    except Exception as e:
        _logger.error(f"Error during manual UQ propagation with uncertainty: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

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
