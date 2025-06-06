"""TODOs
- implement other metrics of SuMo assessment (can do wo internet)
*** need to find where I have those codes (download some other repos!)
DONE - implement a mock function 
& LHS running (can do wo internet) in Setup screen
- implement Running visualization (based on ParallelRunner GUI)

- implement MUI table w dropdowns to select Jobs in SuMo screen (NEED Copilot)
- implement UQ (better w Copilot, to do the pop-up to define the distribution, params, etc of each input variable).
- implement report generation --  later, check w Melanie & Reboux

FIXME crashing error when I already have SuMo plots open & went back to setup & choose Sinc Python function
"""

import re
import os
from pathlib import Path
import json
import logging
from typing import List, Dict, Callable, Literal, Optional
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import osparc_client
from osparc_client.configuration import Configuration as OsparcConfiguration
from osparc_client.api_client import ApiClient
from osparc_client.api.functions_api import FunctionsApi
from osparc_client.api.function_jobs_api import FunctionJobsApi
from osparc_client.api.users_api import UsersApi
from osparc_client.api.function_job_collections_api import FunctionJobCollectionsApi
from osparc_client.models.function_job import FunctionJob
from osparc_client.models.function_job_status import FunctionJobStatus
from osparc_client.configuration import Configuration as OsparcConfiguration

from mmux_python.utils.funs_data_processing import (
    process_input_file,
    create_manual_uq_samples,
)
from mmux_python.utils.funs_evaluate import create_run_dir
from mmux_python.utils.funs_evaluate import evaluate_sumo_along_axes, propagate_uq, evaluate_sumo, evaluate_sumo_crossvalidation, evaluate_sumo_manual_crossvalidation, evaluate_sumo_on_grid

### Logger configuration ####################################
_logger = logging.getLogger(__name__)

logging.basicConfig(
    level=os.environ["LOG_LEVEL"],
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
# Make Flask propagate its logs to the root logger
flask_logger = logging.getLogger("flask")
flask_logger.propagate = True

# Same for Werkzeug (Flask's underlying WSGI library)
werkzeug_logger = logging.getLogger("werkzeug")
werkzeug_logger.propagate = True



_logger.info("Logging started")
#############################################################

### TypeScript expects camelCase, but Python API is getting snake_case. 
# Convert before sending to frontend.
 
def camel_to_snake(s: str) -> str:
    res = re.sub(r'_([a-z])', lambda match: match.group(1).upper(),s)
    return res

def dict_keys_camel_to_snake(d: dict) -> dict:
    return {camel_to_snake(k): v for k, v in d.items()}

def recursive_dict_keys_camel_to_snake(d: dict) -> dict:
    for k, v in d.items():
        if isinstance(v, dict):
            d[k] = recursive_dict_keys_camel_to_snake(v)
        elif isinstance(v, list):
            d[k] = [recursive_dict_keys_camel_to_snake(i) if isinstance(i, dict) else i for i in v]
    return {camel_to_snake(k): v for k, v in d.items()}


### osparc client configuration #############################    
os.chdir(os.path.dirname(__file__))

configuration = OsparcConfiguration(
        host=os.environ["OSPARC_API_BASE_URL"].rstrip("/"),  # Ensure no trailing slash
        username=os.environ["OSPARC_API_KEY"],
        password=os.environ["OSPARC_API_SECRET"],
)
_logger.info("Detected osparc_client configuration: host=%s, username=%s, password=%s",
    configuration.host,
    configuration.username,
    configuration.password
)

api_client = ApiClient(configuration)
functions_api_instance = FunctionsApi(api_client)
job_api_instance = FunctionJobsApi(api_client)
job_collection_api_instance = FunctionJobCollectionsApi(api_client)


# check that API is responsive
_logger.info("Checking if the API is responsive...")
_logger.info("osparc_client version %s", osparc_client.__version__)
users_api = UsersApi(api_client)
profile = users_api.get_my_profile()
_logger.info("User profile info:\n%s", profile.model_dump_json(indent=2))

#############################################################

### Flask app configuration #################################
app = Flask(__name__)
base_dir = Path(__file__).parent # this is the flaskapi directory
app = Flask(__name__)
#############################################################


@app.route("/flask/health")
def health_check():
    """Used by docker to check the health of the Flask app."""
    return jsonify({'status': 'healthy'}), 200

def get_all_items(api_call: Callable, *args, **kwargs):
    """Helper function to get all items from a paginated API call."""
    list_len = api_call(limit=1,*args, **kwargs).total
    retrieved = 0
    items = []
    page = 1
    while retrieved < list_len:
        _logger.debug(f"Retrieving page {page} of {api_call.__name__} (offset: {retrieved})")
        response = api_call(offset = retrieved, *args, **kwargs)
        retrieved += len(response.items)  # type: ignore
        items += [recursive_dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    return items

def get_first_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get first N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(limit = max(1, N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items

def get_last_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get last N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(offset=list_len - N, limit=max(1,N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items

@app.route("/flask/list_functions", methods=["GET"])
def flask_list_functions():
    _logger.debug("Starting flask function: flask_list_functions")
    _logger.debug("Cwd: " + str(Path.cwd()))
    functions = get_all_items(functions_api_instance.list_functions)
    # functions = get_first_N_items(functions_api_instance.list_functions, N=5)
    # functions = get_last_N_items(functions_api_instance.list_functions, N=50)
    functions = functions[::-1] # put last-created first? FIXME still need to expose "created_at" in the response
    _logger.debug(f"N Functions: {len(functions)}")

    ## optional - filter out those without input & output schema
    # functions = [f for f in functions if len(f["inputSchema"]["schemaContent"]) > 0 and len(f["outputSchema"]["schemaContent"]) > 0]
    # _logger.debug(f"N Functions after filtering: {len(functions)}")

    return jsonify(functions)

@app.route("/flask/list_jobs", methods=["GET"])
def flask_list_jobs():
    _logger.debug("Starting flask function: flask_list_jobs")
    _logger.debug("Cwd: " + str(Path.cwd()))
    jobs = get_all_items(job_api_instance.list_function_jobs)
    _logger.debug(f"N Jobs: {len(jobs)}")

    return jsonify(jobs)

@app.route("/flask/list_function_jobs_for_functionid", methods=["GET"])
def flask_list_function_jobs_for_functionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_functionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = request.args["functionUid"]
    _logger.info(f"Function ID: {function_uid}")
    jobs = get_all_items(functions_api_instance.list_function_jobs_for_functionid, function_uid)
    _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
    for j in jobs:
        status : FunctionJobStatus = job_api_instance.function_job_status(j["uid"]) 
        j["status"] = status.status
    return jsonify(jobs)

@app.route("/flask/list_function_jobs_for_jobcollectionid", methods=["GET"])
def flask_list_function_jobs_for_jobcollectionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_jobcollectionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    jc_uid = request.args["JobCollectionUid"]
    _logger.debug(f"jc ID: {jc_uid}")
    jc = job_collection_api_instance.get_function_job_collection(jc_uid)
    jobs = [get_function_job_from_uid(job_uid) for job_uid in jc.job_ids] # type: ignore
    _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
    return jsonify(jobs)

@app.route("/flask/list_function_job_collections", methods=["GET"])
def flask_get_function_job_collections():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    ## this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
    job_collections = get_all_items(job_collection_api_instance.list_function_job_collections)
    _logger.debug(f"N Job collections: {len(job_collections)}")
    return jsonify(job_collections)

## TODO this does not work; FUnctionJobCOllection does not have functionUid property (??) (include it)
@app.route("/flask/list_function_job_collections_for_functionid", methods=["GET"])
def flask_get_function_job_collections_for_functionid():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = request.args["functionUid"]
    _logger.debug(f"Function ID: {function_uid}")
    # job_collections = get_all_items(job_collection_api_instance.list_function_job_collections, has_function_id=function_uid)
    response = job_collection_api_instance.list_function_job_collections(has_function_id=function_uid)
    job_collections = [recursive_dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
    return jsonify(job_collections)

@app.route("/flask/get_function_job", methods=["GET"])
def flask_get_function_job():
    _logger.debug("Starting flask function: flask_get_function_job")
    _logger.debug("Cwd: " + str(Path.cwd()))
    return jsonify(get_function_job_from_uid(request.args["jobUid"]))
    
def get_function_job_from_uid(job_uid: str) -> Dict[str, str]:
    """Helper function to get a Job information (including status) from its UID."""
    _logger.debug(f"Job ID: {job_uid}")
    job = job_api_instance.get_function_job(job_uid)
    job_dict = recursive_dict_keys_camel_to_snake(job.to_dict()) # type: ignore
    job_dict["status"] = job_api_instance.function_job_status(job_uid).status
    outputs = job_api_instance.function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")
    job_dict["outputs"] = outputs
    _logger.debug(f"Job: {job_dict}")

    return job_dict

def sanitize_varname(varname: str) -> str:
    """Sanitize variable names by replacing spaces and non-alphanumeric characters with underscores."""
    return re.sub(r'[^0-9a-zA-Z_]', '_', varname.replace(' ', '_'))

def sanitize_varnames(varnames):
    return [sanitize_varname(v) for v in varnames]

def create_training_file_from_jobs(jobs: List[FunctionJob], input_vars: List[str], output_response: str, folder_name: str = "evaluate") -> Path:
    output_response_sanitized = sanitize_varname(output_response)
    completed_jobs = [job for job in jobs if job["status"].lower() == "completed" or job["status"].lower() == "success"]  # type: ignore
    _logger.debug(f"N Completed jobs: {len(completed_jobs)}")
    def get_job_dict(job):
        d = {sanitize_varname(key): job["inputs"][key] for key in input_vars}
        assert "outputs" in job.keys(), f"Outputs not in job: {job}"
        assert output_response in job["outputs"].keys(), f"Output {output_response} not in job: {job}"
        d[output_response_sanitized] = job["outputs"][output_response] # type: ignore
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
    
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputVars"]
    
    jobs: List[FunctionJob] = request_data["FunctionJobs"]
    make_log: bool = request_data.get("log", False)

    # Sanitize variable names
    input_vars_sanitized = sanitize_varnames(input_vars)
    output_response_sanitized = sanitize_varname(output_response)

    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
    run_dir = TRAINING_FILE.parent

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars_sanitized + [output_response_sanitized], # type: ignore
    )
    if make_log:  # FIXME for now log applies to all inputs & the output
        input_vars_sanitized = [f"log_{var}" for var in input_vars_sanitized]
        output_response_sanitized = f"log_{output_response_sanitized}"

    results = evaluate_sumo_manual_crossvalidation(
        run_dir,
        PROCESSED_TRAINING_FILE,
        input_vars_sanitized,
        output_response_sanitized, # type: ignore
    )
    _logger.debug("Done!!")

    return jsonify(results) 


### First do "normal" manual UQ propagation & compare w the outputs of Dakota. Then do the N times w error.
@app.route("/flask/manual_uq_propagation", methods=["POST"])
def flask_manual_uq_propagation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputVars"]
    distributions = request_data["distributions"]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
    num_samples: int = request_data["numSamples"]
    jobs: List[FunctionJob] = request_data["FunctionJobs"]
    make_log: bool = request_data.get("log", False)

    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
    run_dir = TRAINING_FILE.parent

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response], # type: ignore
    )

    # if make_log:  # FIXME for now log applies to all inputs & the output
    #     input_vars = [f"log_{var}" for var in input_vars]
    #     output_response = f"log_{output_response}"
    #     means = {f"log_{key}": np.log(val) for key, val in means.items()}
    #     stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

    ## for some reason, much more noisy than Dakota's sampling
    samples = create_manual_uq_samples(input_vars, distributions, num_samples)
    df = pd.DataFrame(samples)
    UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
    df.to_csv(UQ_SAMPLES_FILE, index=False)
    _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
    
    PROCESSED_UQ_SAMPLES_FILE = process_input_file(
        UQ_SAMPLES_FILE,
        make_log=make_log,
        columns_to_keep=input_vars,
    )
    results = evaluate_sumo(
        run_dir, 
        PROCESSED_TRAINING_FILE,
        PROCESSED_UQ_SAMPLES_FILE,
        input_vars,
        output_response,
    )

    _logger.debug("Done!!")
    # return jsonify(results) 
    return jsonify(results[output_response+"_hat"]) # for compatibility w normal dakota UQ


### First do "normal" manual UQ propagation & compare w the outputs of Dakota. Then do the N times w error.
@app.route("/flask/manual_uq_propagation_with_uncertainty", methods=["POST"])
def flask_manual_uq_propagation_with_uncertainty():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))
    
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputVars"]
    distributions = request_data["distributions"]  # this is a dict of input_vars to distributions, e.g. {"input1": "normal", "input2": "uniform"}
    num_samples: int = request_data["numSamples"]
    jobs: List[FunctionJob] = request_data["FunctionJobs"]
    make_log: bool = request_data.get("log", False)
    n_histograms: int = request_data["nHistograms"] # number of histograms - to give uncertainty over it

    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
    run_dir = TRAINING_FILE.parent

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response], # type: ignore
    )

    # if make_log:  # FIXME for now log applies to all inputs & the output
    #     input_vars = [f"log_{var}" for var in input_vars]
    #     output_response = f"log_{output_response}"
    #     means = {f"log_{key}": np.log(val) for key, val in means.items()}
    #     stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

    ## for some reason, much more noisy than Dakota's sampling
    samples = create_manual_uq_samples(input_vars, distributions, num_samples)
    df = pd.DataFrame(samples)
    UQ_SAMPLES_FILE = run_dir / "manual_uq_samples.csv"
    df.to_csv(UQ_SAMPLES_FILE, index=False)
    _logger.debug(f"Generated manual UQ samples saved to {UQ_SAMPLES_FILE}")
    
    PROCESSED_UQ_SAMPLES_FILE = process_input_file(
        UQ_SAMPLES_FILE,
        make_log=make_log,
        columns_to_keep=input_vars,
    )
    results = evaluate_sumo(
        run_dir, 
        PROCESSED_TRAINING_FILE,
        PROCESSED_UQ_SAMPLES_FILE,
        input_vars,
        output_response,
    )
    
    ## now, use the prediction of std_hat to get an estimation of the uncertainty over the UQ
    assert output_response + "_std_hat" in results, f"Cannot perform uncertainty of UQ if there is no prediction of the uncertainty"
    from scipy.special import erfinv
    all_results = np.empty(shape=(n_histograms, num_samples), dtype=float) # create an empty array to store the results
    for i in range(n_histograms):
        _logger.debug(f"Running histogram {i+1}/{n_histograms}")
        r = erfinv(np.random.uniform(-1, 1, size=num_samples)) # generate random samples from an uniform distribution
        all_results[i, :] = results[output_response+"_hat"] + r * results[output_response+"_std_hat"]
    
    # Compute common bin edges for all histograms
    all_values = all_results.flatten()
    num_bins = min(50, num_samples // 10)  # or set as needed
    hist_min, hist_max = np.percentile(all_values, 1), np.percentile(all_values, 99)
    bin_edges = np.linspace(hist_min, hist_max, num_bins + 1)

    # Compute histograms for each row (histogram per UQ run)
    histograms = np.array([
        np.histogram(all_results[i, :], bins=bin_edges)[0]
        for i in range(n_histograms)
    ])

    # Calculate mean and std of bin heights across histograms
    bin_means = np.mean(histograms, axis=0)
    bin_stds = np.std(histograms, axis=0)

    output = {
        "bins_start": float(hist_min),
        "bins_end": float(hist_max),
        "bin_means": bin_means.tolist(),
        "bin_stds": bin_stds.tolist(),
        # "histograms": histograms.tolist()  # optional, for debugging/plotting
    }

    _logger.debug("Done!!")
    return jsonify(output) 

@app.route("/flask/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputs"]
    make_log: bool = request_data.get("log", False)
    jobs: List[FunctionJob] = request_data["FunctionJobs"]
    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
    run_dir = TRAINING_FILE.parent

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response], # type: ignore
    )
    if make_log:  # FIXME for now log applies to all inputs & the output
        input_vars = [f"log_{var}" for var in input_vars]
        output_response = f"log_{output_response}"

    results = evaluate_sumo_along_axes(
        run_dir,
        PROCESSED_TRAINING_FILE,
        input_vars,
        output_response, # type: ignore
    )
    
    _logger.debug("Done!!")
    return jsonify(results) # check if jsonify is needed

## This method could probably be generic for N-D (thus not needing the 1D version above)
@app.route("/flask/sumo_grid_evaluation", methods=["POST"])
def flask_sumo_grid_evaluation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    grid_vars: List[str] = request_data["gridVars"]
    input_vars: List[str] = request_data["inputVars"]
    make_log: bool = request_data.get("log", False)
    jobs: List[FunctionJob] = request_data["FunctionJobs"]
    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
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
    )
    _logger.debug("Done!!")
    print(results)
    return jsonify(results) # check if jsonify is needed

@app.route("/flask/uq_propagation", methods=["POST"])
def flask_uq_propagation():
    os.chdir(Path(__file__).parent)
    _logger.debug("Starting flask function: flask_uq_propagation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    input_vars: List[str] = request_data["inputVars"]
    output_response = request_data["output"]
    num_samples: int = request_data["numSamples"]
    ######### TODO make this more generic, not only for normal distribution
    means: Dict[str, float] = request_data["means"]
    stds: Dict[str, float] = request_data["stds"]
    ####################################################################
    make_log: bool = request_data.get("log", False)
    jobs: List[FunctionJob] = request_data["FunctionJobs"]

    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
    run_dir = TRAINING_FILE.parent

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response], # type: ignore
    )


    if make_log:  # FIXME for now log applies to all inputs & the output
        input_vars = [f"log_{var}" for var in input_vars]
        output_response = f"log_{output_response}"
        means = {f"log_{key}": np.log(val) for key, val in means.items()}
        stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

    samples = propagate_uq(
        run_dir,
        PROCESSED_TRAINING_FILE,
        input_vars,
        output_response,
        ## TODO make distributions other than normal functional!!
        means,
        stds,
        n_samples=num_samples,
    )

    return jsonify(samples) 

@app.route("/flask/save_json", methods=["POST"])
def flask_save_json():
    _logger.info("Starting flask function: flask_save_json")
    _logger.debug("Cwd: " + str(Path.cwd()))
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    filepath = base_dir.parent / request_data["filePath"]
    data = request_data["data"]
    _logger.debug(f"Inputs of the request: {request_data}")
    _logger.debug(f"filename: {filepath}")
    _logger.debug(f"data: {data}")
    assert Path(filepath).parent.exists(), f"The directory {Path(filepath).parent} were the file should be created does not exist."
    with open(filepath, "w+") as f:
        json.dump(data, f)
    return jsonify({"status": "success"})

@app.route("/flask/load_json", methods=["GET"])
def flask_load_json():
    _logger.debug("Starting flask function: flask_load_json")
    _logger.debug("Cwd: " + str(Path.cwd()))
    filePath = base_dir.parent / request.args["filePath"]
    _logger.debug(f"Inputs of the request: {request.args}")
    _logger.debug(f"filepath: {filePath}")
    assert Path(filePath).exists(), f"The file {filePath} does not exist."
    with open(filePath, "r") as f:
        data = json.load(f)
    _logger.debug(f"data: {data}")
    return jsonify(data)


@app.route("/flask/test_job", methods=["POST"])
def flask_test_job():
    _logger.debug("Starting flask function: flask/test_job")
    _logger.debug("Cwd: " + str(Path.cwd()))
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    config = request_data["config"]
    function_uid = request_data["funUid"]

    _logger.debug(f"Function UID: {function_uid}")
    _logger.debug(f"Config: {config}")
    sample = {config[i]["variable"]: config[i]["value"] for i in range(len(config))} 

    ## DEBUGGING
    _logger.debug("Input to validate_function_inputs: %s" , sample)
    val = functions_api_instance.validate_function_inputs(function_uid, sample)  # this is working - changing the name of the variable does return a validation error
    _logger.debug(f"Validated function inputs for function {function_uid} with sample {sample}: {val}")
    job = functions_api_instance.run_function(function_uid, sample) # type: ignore
    job: dict = job.to_dict()  # convert to dictionary for easier logging # type:ignore
    _logger.debug(f"Created job: {job}")
    status = job_api_instance.function_job_status(job["uid"])  # type: ignore
    _logger.debug(f"Job status: {status.status}")
    while status.status not in ("SUCCESS", "FAILED"):
        _logger.info(f"Job {job['uid']} is still running, status: {status.status}")
        status = job_api_instance.function_job_status(job["uid"])
    if status.status != "SUCCESS":
        _logger.error(f"Job {job['uid']} did not complete successfully. Status: {status.status}")
        return jsonify({"error": f"Job {job['uid']} did not complete successfully. Status: {status.status}"})
    else:
        outputs = job_api_instance.function_job_outputs(job["uid"])
        _logger.info(f"Job {job['uid']} completed successfully. Outputs: {outputs}")
        job["outputs"] = outputs.to_dict()  # type: ignore
    ###

    return jsonify(job)  # return the job details as a dictionary

    

@app.route("/flask/lhs_sampling", methods=["POST"])
def flask_lhs():
    _logger.debug("Starting flask function: flask/lhs_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))
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
    jc = functions_api_instance.map_function(function_uid, samples) ## TODO samples will need to adhere to a specific format
    return jsonify(jc.to_dict()) ## this now returns a JobCollection


@app.route("/flask/grid_sampling", methods=["POST"])
def flask_grid_sampling():
    _logger.debug("Starting flask function: flask/grid_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))
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
        means = [(config[var]["end"] + config[var]["start"]) / 2 for var in input_vars], # this is the mean of the grid points
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
    jc = functions_api_instance.map_function(function_uid, samples) ## TODO samples will need to adhere to a specific format
    return jsonify(jc.to_dict()) ## this now returns a JobCollection


@app.route("/flask/get_sumo_cv_accuracy_metrics")
def flask_get_sumo_cv_accuracy_metrics():
    _logger.debug("Starting flask function: flask/get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputs"]
    make_log = request_data.get("log", False)
    jobs = request_data["FunctionJobs"]
    
    TRAINING_FILE = create_training_file_from_jobs(jobs, input_vars, output_response)
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

_logger.info("Flask workflows module loaded successfully!")
