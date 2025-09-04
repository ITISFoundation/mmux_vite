import os
from pathlib import Path
import json
import logging
from datetime import datetime
from typing import List, Dict, Callable, NamedTuple, Final, Literal
#
import numpy as np
import pandas as pd
from flask import Flask, request, abort, jsonify, make_response
#
from osparc_client.models.function_job import FunctionJob
from osparc_client.models.function_job_status import FunctionJobStatus
from osparc_client.models.body_clone_study_v0_studies_study_id_clone_post import BodyCloneStudyV0StudiesStudyIdClonePost
#
from webserver_config import OsparcConfig
from helpers import is_test_environment, recursive_dict_keys_camel_to_snake, dict_keys_camel_to_snake, dict_keys_snake_to_camel
#
from mmux_python.utils.funs_data_processing import (
    process_input_file,
    create_manual_uq_samples,
    sanitize_varnames,
)
from mmux_python.utils.funs_evaluate import create_run_dir, evaluate_sumo_along_axes, evaluate_sumo, evaluate_sumo_crossvalidation, evaluate_sumo_manual_crossvalidation, evaluate_sumo_on_grid, perform_moga_optimization

### Logger configuration ####################################
_logger = logging.getLogger(__name__)

# # Create logs directory - use environment variable or default to user's home
# ### TODO put it back if flaskapi directory but w the right user permissions
# log_path = os.environ.get("MMUX_LOG_PATH", str(Path.home() / "mmux_logs" / "flask_workflows.log"))
# log_file = Path(log_path)
# log_file.parent.mkdir(parents=True, exist_ok=True)
log_file = Path(__file__).parent / f"flask_workflows_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=os.environ["LOG_LEVEL"],
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
# Make Flask propagate its logs to the root logger
flask_logger = logging.getLogger("flask")
flask_logger.propagate = True

# Same for Werkzeug (Flask's underlying WSGI library)
werkzeug_logger = logging.getLogger("werkzeug")
werkzeug_logger.propagate = True
_logger.info("Logging started")
#############################################################



### osparc client configuration #############################    
os.chdir(os.path.dirname(__file__))

# Get the OSPARC configuration instance
osparc_config = OsparcConfig()
if not is_test_environment():
    _logger.info("Testing API connection...")
    osparc_config.test_connection()

#############################################################

### Flask app configuration #################################
app = Flask(__name__)
base_dir = Path(__file__).parent # this is the flaskapi directory

FILES_STORAGE_DIR: Final[Path] = Path("/text-files")
#############################################################


@app.route("/flask/health")
def health_check():
    """Used by docker to check the health of the Flask app."""
    return jsonify({'status': 'healthy'}), 200

@app.route("/flask/service-mode")
def service_mode():
    """Used to check the environment variable SERVICE_MODE."""
    try:
        service_mode = os.environ["SERVICE_MODE"]
        _logger.info(f"Service mode: {service_mode}")
        return jsonify({"service_mode": service_mode}), 200
    except KeyError:
        _logger.error("SERVICE_MODE environment variable is not set.")
        return jsonify({"error": "SERVICE_MODE environment variable is not set."}), 500

@app.route("/flask/permissions")
def permissions():
    """Used to check the environment variable PERMISSIONS."""
    try:
        permissions = os.environ["PERMISSIONS"]
        _logger.info(f"permissions: {permissions}")
        return jsonify({"permissions": permissions}), 200
    except KeyError:
        _logger.error("PERMISSIONS environment variable is not set.")
        return jsonify({"error": "PERMISSIONS environment variable is not set."}), 500
    
def _deployment_mode() -> str:
    """Used to check the environment variable DEPLOYMENT_MODE. 
    Will only be used within the backend (in principle), so no need to expose an endpoint (for now)."""
    try:
        deployment_mode = os.environ["DEPLOYMENT_MODE"]
        _logger.info(f"deployment mode: {deployment_mode}")
        return deployment_mode
    except KeyError:
        _logger.error("DEPLOYMENT_MODE environment variable is not set.")
        raise ValueError("DEPLOYMENT_MODE environment variable is not set.")

def _get_all_items(api_call: Callable, *args, **kwargs):
    """Helper function to get all items from a paginated API call."""
    list_len = api_call(limit=1,*args, **kwargs).total
    if "limit" not in kwargs:
        kwargs["limit"] = int(np.min([50, list_len])) ## max allowed is 50
        
    retrieved = 0
    items = []
    page = 1
    while retrieved < list_len:
        _logger.debug(f"Retrieving page {page} of {api_call.__name__} (offset: {retrieved})")
        response = api_call(offset = retrieved, *args, **kwargs)
        retrieved += len(response.items)  # type: ignore
        items += [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    return items

def _get_first_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get first N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(limit=max(1, N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items

def _get_last_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get last N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(offset=list_len - N, limit=max(1,N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items

@app.route("/flask/list_functions", methods=["GET"])
def flask_list_functions():
    _logger.debug("Starting flask function: flask_list_functions")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        functions = _get_all_items(osparc_config.get_functions_api().list_functions)
        # functions = get_first_N_items(functions_api_instance.list_functions, N=5)
        # functions = get_last_N_items(functions_api_instance.list_functions, N=50)
        functions = functions[::-1] # put last-created first? FIXME still need to expose "created_at" in the response
        _logger.debug(f"N Functions: {len(functions)}")

        ## optional - filter out those without input & output schema
        # functions = [f for f in functions if len(f["inputSchema"]["schemaContent"]) > 0 and len(f["outputSchema"]["schemaContent"]) > 0]
        # _logger.debug(f"N Functions after filtering: {len(functions)}")

        return jsonify(functions)
    except Exception as e:
        _logger.error(f"Error while listing functions: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/list_jobs", methods=["GET"])
def flask_list_jobs():
    _logger.debug("Starting flask function: flask_list_jobs")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        jobs = _get_all_items(osparc_config.get_job_api().list_function_jobs)
        _logger.debug(f"N Jobs: {len(jobs)}")
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/list_function_jobs_for_functionid", methods=["GET"])
def flask_list_function_jobs_for_functionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_functionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = None
    try:
        function_uid = request.args["functionUid"]
        _logger.info(f"Function ID: {function_uid}")
        jobs = _get_all_items(osparc_config.get_functions_api().list_function_jobs_for_functionid, function_uid)
        _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
        for j in jobs:
            status : FunctionJobStatus = osparc_config.get_job_api().function_job_status(j["uid"]) 
            j["status"] = status.status
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs for function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/list_function_jobs_for_jobcollectionid", methods=["GET"])
def flask_list_function_jobs_for_jobcollectionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_jobcollectionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        jc_uid = request.args["JobCollectionUid"]
        _logger.debug(f"jc ID: {jc_uid}")
        jc = osparc_config.get_job_collection_api().get_function_job_collection(jc_uid)
        jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids] # type: ignore
        _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs for job collection {jc_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/list_function_job_collections", methods=["GET"])
def flask_get_function_job_collections():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        ## this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
        job_collections = _get_all_items(osparc_config.get_job_collection_api().list_function_job_collections)
        _logger.debug(f"N Job collections: {len(job_collections)}")
        return jsonify(job_collections)
    except Exception as e:  
        _logger.error(f"Error while listing job collections: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

## TODO this does not work; FUnctionJobCOllection does not have functionUid property (??) (include it)
@app.route("/flask/list_function_job_collections_for_functionid", methods=["GET"])
def flask_get_function_job_collections_for_functionid():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        _logger.debug(f"Request args: {request.args}")
        function_uid = request.args["functionUid"]
        _logger.debug(f"Function ID: {function_uid}")
        # job_collections = get_all_items(job_collection_api_instance.list_function_job_collections, has_function_id=function_uid)
        response = osparc_config.get_job_collection_api().list_function_job_collections(has_function_id=function_uid)
        job_collections = [dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
        _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
        return jsonify(job_collections)
    except Exception as e:
        _logger.error(f"Error while listing job collections for function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/get_function_job", methods=["GET"])
def flask_get_function_job():
    _logger.debug("Starting flask function: flask_get_function_job")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        return jsonify(_get_function_job_from_uid(request.args["jobUid"]))
    except Exception as e:
        _logger.error(f"Error while getting function job: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))
    
def _get_function_job_from_uid(job_uid: str) -> Dict[str, str]:
    """Helper function to get a Job information (including status) from its UID."""
    _logger.debug(f"Job ID: {job_uid}")
    job = osparc_config.get_job_api().get_function_job(job_uid)
    job_dict = dict_keys_camel_to_snake(job.to_dict()) # type: ignore
    _logger.debug(f"'Raw' Job: {job_dict}")
    job_dict["status"] = osparc_config.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_config.get_job_api().function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")

    return job_dict

@app.route("/flask/get_function_job_status", methods=["GET"])
def flask_get_function_job_status():
    _logger.debug("Starting flask function: flask_get_function_job_status")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        job_uid = request.args["jobUid"]
        job_status = osparc_config.get_job_api().function_job_status(job_uid).status
        return jsonify(job_status)
    except Exception as e:
        _logger.error(f"Error while getting function job: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@app.route("/flask/get_function_job_outputs", methods=["GET"])
def flask_get_function_job_outputs():
    _logger.debug("Starting flask function: flask_get_function_job_outputs")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        job_uid = request.args["jobUid"]
        job_outputs = osparc_config.get_job_api().function_job_outputs(job_uid)
        return jsonify(job_outputs)
    except Exception as e:
        _logger.error(f"Error while getting function job: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

def test_job_retrieval_endpoints_speed(job_uid: str, N: int = 1):
    def _timeit(fun: Callable, N: int, *args, **kwargs):
        """Helper function to time the execution of a function N times."""
        import time
        start_time = time.time()
        for _ in range(N):
            result = fun(*args, **kwargs)
            _logger.info(f"Iteration {_+1}/{N}: {result}")   # Print the result of each iteration
        end_time = time.time()
        return (end_time - start_time) / N
    time_job_full = _timeit(osparc_config.get_job_api().get_function_job, N, job_uid)
    time_job_outputs = _timeit(osparc_config.get_job_api().function_job_outputs, N, job_uid)
    time_job_status = _timeit(osparc_config.get_job_api().function_job_status, N, job_uid)

    _logger.debug(f"Average time to retrieve full job: {time_job_full:.4f} seconds")
    _logger.debug(f"Average time to retrieve job outputs: {time_job_outputs:.4f} seconds")
    _logger.debug(f"Average time to retrieve job status: {time_job_status:.4f} seconds")
# test_job_retrieval_endpoints_speed(job_uid="aa5453be-d9e5-4e8a-a7a5-29acd113f1d2", N=30)

def test_job_retrieval_paginated(function_uid: str):
    def _timeit(fun: Callable, *args, **kwargs):
        import time
        start_time = time.time()
        result = fun(*args, **kwargs)
        end_time = time.time()
        _logger.info(f"Retrieved {len(result)} items in {end_time - start_time:.4f} seconds")
        _logger.info(f"First item: {result[0] if result else 'No items retrieved'}")
        _logger.info(f"Last item: {result[-1] if result else 'No items retrieved'}")
        _logger.info(f"That is {(end_time - start_time)/len(result):.2f} seconds per item")
    _timeit(_get_all_items, api_call=osparc_config.get_functions_api().list_function_jobs_for_functionid, function_id=function_uid)  # type: ignore
# test_job_retrieval_paginated(function_uid="eea21c0d-6c2b-4cf4-91d1-116e6550cb22")

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
    run_dir = create_run_dir(Path("."), folder_name)
    TRAINING_FILE = run_dir/  "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE


@app.route("/flask/sumo_cross_validation", methods=["POST"])
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
@app.route("/flask/manual_uq_propagation", methods=["POST"])
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
@app.route("/flask/manual_uq_propagation_with_uncertainty", methods=["POST"])
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

@app.route("/flask/sumo_along_axes", methods=["POST"])
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
@app.route("/flask/sumo_grid_evaluation", methods=["POST"])
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
        

@app.route("/flask/test_job", methods=["POST"])
def flask_test_job():
    _logger.debug("Starting flask function: flask/test_job")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        config = request_data["config"]
        function_uid = request_data["funUid"]

        _logger.debug(f"Function UID: {function_uid}")
        _logger.debug(f"Config: {config}")
        sample = {config[i]["variable"]: config[i]["value"] for i in range(len(config))} 

        _logger.debug("Input to validate_function_inputs: %s" , sample)
        val = osparc_config.get_functions_api().validate_function_inputs(function_uid, sample)  # this is working - changing the name of the variable does return a validation error
        _logger.debug(f"Validated function inputs for function {function_uid} with sample {sample}: {val}")
        parent_info = _get_parent_ids()
        response = osparc_config.get_functions_api().run_function(function_uid, body=sample,
                                                       x_simcore_parent_node_id=parent_info.parent_node_id,
                                                       x_simcore_parent_project_uuid=parent_info.parent_project_id)
        _logger.debug(f"Response from run_function with sample {sample}: {response}")
        assert hasattr(response, "actual_instance"), f"Job is None for function {function_uid} with sample {sample}. Response: {response}"
        assert response.actual_instance is not None, f"Job is None for function {function_uid} with sample {sample}. Response: {response}"
        uid = response.actual_instance.uid 
        _logger.debug(f"Job UID: {uid}")
        job = _get_function_job_from_uid(uid)
        _logger.debug(f"Created job: {job}")
        return jsonify(job)  # return the job details as a dictionary
    except Exception as e:
        _logger.error(f"Error while testing job for function {function_uid} with config {config}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

class ParentInfo(NamedTuple):
    parent_node_id : str
    parent_project_id: str
    
def _get_parent_ids() -> ParentInfo:
    deployment_mode = _deployment_mode()
    if deployment_mode == "LOCAL":
        parent_node_id = "null"
        parent_project_id = "null"
    elif deployment_mode == "OSPARC":
        parent_node_id = os.environ.get("OSPARC_NODE_ID", None)
        parent_project_id = os.environ.get("OSPARC_STUDY_ID", None)
        if not parent_node_id or not parent_project_id:
            _logger.error("OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set. Cannot create a sampling campaign through map function.")
            raise ValueError("OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set.")
    else:
        _logger.error(f"Unknown value of DEPLOYMENT_MODE env variable ({deployment_mode}). Thus not able to fetch parent node and project IDs.")
        raise ValueError(f"DEPLOYMENT_MODE env variable could not be recognized ({deployment_mode}) - can not run new pipelines as there would be no billing information.")
    return ParentInfo(parent_node_id=parent_node_id, parent_project_id=parent_project_id)

def _run_sampling_map(function_uid, samples):
    parent_info = _get_parent_ids()
    jc = osparc_config.get_functions_api().map_function(function_id=function_uid, request_body=samples, 
                                             x_simcore_parent_node_id=parent_info.parent_node_id, 
                                             x_simcore_parent_project_uuid=parent_info.parent_project_id) 
    return dict_keys_snake_to_camel(jc.to_dict())


@app.route("/flask/lhs_sampling", methods=["POST"])
def flask_lhs():
    _logger.debug("Starting flask function: flask/lhs_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = None

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        config = request_data["config"]
        k = len(config) # number of variables i.e. dimensions
        seed = request_data["seed"]
        n = request_data["N"]
        function_uid = request_data["funUid"]
        
        from mmux_python.utils.lhs import lhs
        _logger.debug(f"config: {config} \n n: {n}, k: {k}, seed: {seed}")
        H = lhs(n, k, seed=seed)
        _logger.debug(f"H: {H.shape}")

        samples = []
        for j in range(n):
            samples.append(
                {config[i]["variable"] : float(H[i, j] * (config[i]["end"] - config[i]["start"]) + config[i]["start"]) for i in range(k)}
            )
        _logger.debug(f"Samples: {samples}")

        # Now, the running of jobs through the OSPARC API has been moved to the Python backend
        ## NB there are "registerJob(Collection)" endpoints, I could maybe use them 
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
    except Exception as e:
        _logger.error(f"Error while performing LHS sampling on function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))  # return an error response if the function mapping fails
        
@app.route("/flask/grid_sampling", methods=["POST"])
def flask_grid_sampling():
    _logger.debug("Starting flask function: flask/grid_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        function_uid = request_data["funUid"]
        config = request_data["config"]
        input_vars = [config[i]["variable"] for i in range(len(config))] # this is the list of input variables
        run_dir = create_run_dir(Path("."), "grid_sampling") # create a run directory for the grid sampling

        from mmux_python.utils.funs_evaluate import create_grid_samples
        from mmux_python.utils.funs_data_processing import load_data
        PROCESSED_GRIDPOINTS_INPUT_FILE = create_grid_samples(
            run_dir = run_dir,
            grid_vars = input_vars,
            input_vars = input_vars,
            mins = [config[var]["start"] for var in input_vars],
            cut_values = [(config[var]["end"] + config[var]["start"]) / 2 for var in input_vars], # this is the mean of the grid points
            maxs = [config[var]["end"] for var in input_vars],
            n_points_per_dimension=[config[var]["points"] for var in input_vars], # this is the number of points per dimension
        )

        samples = []
        df = load_data(PROCESSED_GRIDPOINTS_INPUT_FILE)
        for i in df.index:
            sample = {var: float(df.loc[i, var]) for var in input_vars} # type: ignore
            samples.append(sample)

        # Now, the running of jobs through the OSPARC API has been moved to the Python backend
        ## NB there are "registerJob(Collection)" endpoints, I could maybe use them 
        _logger.debug(f"Samples: {samples}")
        _logger.debug("Grid sampling not yet tested!! TODO Double check!")
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
    except Exception as e:
        _logger.error(f"Error while creating Grid Sampling of {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@app.route("/flask/get_sumo_cv_accuracy_metrics")
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

@app.route("/flask/clone_job", methods = ["POST"])
def flask_clone_job():
    _logger.debug("Starting flask function: flask/clone_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        project_job_id = request_data["projectJobId"]
        function_name = request_data["functionName"]
        inputs: dict = request_data["projectInputs"]
        
        # Clone the job using the job_id
        def format_inputs_for_description(inputs: dict) -> str:
            """Formats a dictionary of inputs into a human-readable string for description."""
            formatted_inputs = "\n- ".join([""]+[f"*{key}*: {float(value):.4g}" for key, value in inputs.items()])
            return f"#### Inputs:\n\n{formatted_inputs}"

        formatted_inputs = format_inputs_for_description(inputs)
        study_data = BodyCloneStudyV0StudiesStudyIdClonePost(title="Job " + function_name, 
                                     description=f"Clone of job *{project_job_id}* from function *{function_name}*.\n\n{formatted_inputs}",)
        _logger.debug("Study data: ", study_data)
        study = osparc_config.get_studies_api().clone_study(project_job_id, hidden=False,
                                                 body_clone_study_v0_studies_study_id_clone_post=study_data,)
        _logger.debug(f"Cloned study: {study.to_dict()}")
        _logger.debug("Done!!")
        return jsonify(study.to_dict())
    except Exception as e:
        _logger.error(f"Error while cloning job {project_job_id}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))  # return an error response if the function mapping fails

@app.route("/flask/text-file", methods=["POST"])
def save_file():
    """Create or update a text file in the FILES_STORAGE_DIR folder.
    Request body should be JSON with 'filename' and 'content' fields."""
    try:
        request_data = json.loads(request.data.decode("utf-8"))
        _logger.debug(f"Request data: {request_data}")

        if "filename" not in request_data or "content" not in request_data:
            return jsonify({"error": "Request must include both filename and content"}), 400
        
        filename = request_data["filename"]
        content = request_data["content"]
        
        # Basic filename validation - prevent path traversal
        if "/" in filename or "\\" in filename:
            return jsonify({"error": "Invalid filename. Must not contain path separators"}), 400
            
        file_path = FILES_STORAGE_DIR / filename
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        _logger.info(f"File saved: {filename}")
        return jsonify({"status": "success", "filename": filename}), 200
    
    except Exception as e:
        _logger.error(f"Error saving file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/flask/text-file/<filename>", methods=["GET"])
def get_file(filename):
    """Retrieve the content of a text file from the FILES_STORAGE_DIR folder."""
    try:
        # Basic filename validation - prevent path traversal
        if "/" in filename or "\\" in filename:
            return jsonify({"error": "Invalid filename. Must not contain path separators"}), 400
            
        file_path = FILES_STORAGE_DIR / filename
        
        if not file_path.exists():
            return jsonify({"error": f"File {filename} not found"}), 404
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return jsonify({"filename": filename, "content": content}), 200
    
    except Exception as e:
        _logger.error(f"Error retrieving file {filename}: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/flask/perform_moga_optimization", methods=["POST"])
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
        make_log = request_data.get("log", False)
        jobs = request_data["FunctionJobs"]

        input_distributions_sanitized = sanitize_varnames(input_distributions)
        input_vars_sanitized = sanitize_varnames(input_vars)
        output_var_selection_sanitized = sanitize_varnames(output_var_selection)
        output_responses_sanitized = [k for k in output_var_selection_sanitized.keys()]

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
            key.replace(output_response_sanitized, output_response): val for key, val in results_sanitized.items()
            for output_response_sanitized, output_response in zip(output_responses_sanitized, output_responses)
            }

        _logger.debug("Done!!")
        return jsonify(results)
    
    except Exception as e:
        _logger.error(f"Error while performing MOGA optimization: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500)) 