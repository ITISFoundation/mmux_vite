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

import os
from pathlib import Path
import shutil
import json
import logging
from typing import List, Dict
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify 
from flask_cors import CORS
from osparc_client.configuration import Configuration as OsparcConfiguration
from osparc_client.api_client import ApiClient
from osparc_client.api.functions_api import FunctionsApi
from osparc_client.api.function_jobs_api import FunctionJobsApi, FunctionJobStatus
from osparc_client.api.function_job_collections_api import FunctionJobCollectionsApi
from osparc_client.models.function_job import FunctionJob

from mmux_python.utils.funs_data_processing import (
    process_input_file,
)
from mmux_python.utils.funs_evaluate import create_run_dir
from mmux_python.utils.funs_evaluate import evaluate_sumo_along_axes, propagate_uq #, evaluate_sumo_crossvalidation

### TypeScript expects camelCase, but Python API is getting snake_case. 
# Convert before sending to frontend.
import re   
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


### Logger configuration ####################################
logger = logging.getLogger(__name__)
logging.basicConfig(
    filename="flask_workflows.log",
    encoding="utf-8",
    level=logging.INFO,
    filemode="w",
)
logger.info("Logging started")
#############################################################


### Flask app configuration #################################
app = Flask(__name__)
base_dir = Path(__file__).parent # this is the flaskapi directory
app = Flask(__name__)
cors = CORS(app, origins=["*"], methods=["*"], allow_headers=["*"], resources=["*"]) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'
#############################################################

### osparc client configuration #############################    
os.chdir(os.path.dirname(__file__))
conf_path = Path("./../osparc-master.conf.json")
conf_dict = json.loads(conf_path.read_text("utf-8"))
configuration = OsparcConfiguration(**conf_dict)
api_client = ApiClient(configuration)
functions_api_instance = FunctionsApi(api_client)
job_api_instance = FunctionJobsApi(api_client)
job_collection_api_instance = FunctionJobCollectionsApi(api_client)
#############################################################

@app.route("/flask/hello")
def hello_world():
    logger.info("Starting flask function: hello_world")
    logger.info("Cwd: " + str(Path.cwd()))
    return "Hello, World!"


@app.route("/flask/list_functions", methods=["GET"])
def flask_list_functions():
    logger.info("Starting flask function: flask_list_functions")
    logger.info("Cwd: " + str(Path.cwd()))
    functions = functions_api_instance.list_functions()
    ## this is a list of items of Paginated object -- deserialize into a list of function objects
    functions = [recursive_dict_keys_camel_to_snake(f.to_dict()) for f in functions_api_instance.list_functions().items] # type: ignore
    functions = functions[::-1] # put last-created first? FIXME still need to expose "created_at" in the response
    logger.info(f"N Functions: {len(functions)}")

    ## TODO temporal - filter out those without input & output schema
    functions = [f for f in functions if len(f["inputSchema"]["schemaContent"]) > 0 and len(f["outputSchema"]["schemaContent"]) > 0]
    logger.info(f"N Functions after filtering: {len(functions)}")

    return jsonify(functions)

@app.route("/flask/list_jobs", methods=["GET"])
def flask_list_jobs():
    logger.info("Starting flask function: flask_list_jobs")
    logger.info("Cwd: " + str(Path.cwd()))
    jobs = job_api_instance.list_function_jobs()
    ## this is a list of items of Paginated object -- deserialize into a list of function objects
    jobs = [recursive_dict_keys_camel_to_snake(j.to_dict()) for j in job_api_instance.list_function_jobs().items] # type: ignore
    logger.info(f"N Jobs: {len(jobs)}")

    return jsonify(jobs)

@app.route("/flask/list_function_jobs_for_functionid", methods=["GET"])
def flask_list_function_jobs_for_functionid():
    logger.info("Starting flask function: flask_get_function_jobs")
    logger.info("Cwd: " + str(Path.cwd()))
    function_uid = request.args["functionUid"]
    logger.info(f"Function ID: {function_uid}")
    ## this is a list of items of Paginated object -- deserialize into a list of function objects
    jobs = functions_api_instance.list_function_jobs_for_functionid(function_uid)
    jobs = [recursive_dict_keys_camel_to_snake(j.to_dict()) for j in jobs.items] # type: ignore
    logger.info(f"N Jobs for function {function_uid}: {len(jobs)}")
    for j in jobs:
        status : FunctionJobStatus = job_api_instance.function_job_status(j["uid"]) 
        j["status"] = status.status
    return jsonify(jobs)

@app.route("/flask/list_function_job_collections", methods=["GET"])
def flask_get_function_job_collections():
    logger.info("Starting flask function: flask_get_function_job_collections")
    logger.info("Cwd: " + str(Path.cwd()))
    ## this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
    job_collections = job_collection_api_instance.list_function_job_collections()
    job_collections = [recursive_dict_keys_camel_to_snake(j.to_dict()) for j in job_collections.items]
    logger.info(f"N Job collections: {len(job_collections)}")
    return jsonify(job_collections)

## TODO this does not work; FUnctionJobCOllection does not have functionUid property (??) (include it)
@app.route("/flask/list_function_job_collections_for_functionid", methods=["GET"])
def flask_get_function_job_collections_for_functionid():
    logger.info("Starting flask function: flask_get_function_job_collections")
    logger.info("Cwd: " + str(Path.cwd()))
    function_uid = request.args["functionUid"]
    logger.info(f"Function ID: {function_uid}")
    ## this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
    job_collections = job_collection_api_instance.list_function_job_collections()
    job_collections = [recursive_dict_keys_camel_to_snake(j.to_dict()) for j in job_collections.items]
    logger.info(f"N Job collections: {len(job_collections)}")
    job_collections = [j for j in job_collections if j["functionUid"] == function_uid]
    logger.info(f"N Job collections for function {function_uid}: {len(job_collections)}")
    return jsonify(job_collections)

@app.route("/flask/get_function_job", methods=["GET"])
def flask_get_function_job():
    logger.info("Starting flask function: flask_get_function_job")
    logger.info("Cwd: " + str(Path.cwd()))
    job_uid = request.args["jobUid"]
    logger.info(f"Job ID: {job_uid}")
    ## this is a list of items of Paginated object -- deserialize into a list of function objects
    job = job_api_instance.get_function_job(job_uid).to_dict()
    job = recursive_dict_keys_camel_to_snake(job) # type: ignore
    job["status"] = job_api_instance.function_job_status(job_uid).status
    logger.info(f"Job: {job}")
    return jsonify(job)

def create_training_file_from_jobs(jobs: List[FunctionJob], input_vars: List[str], output_response: str) -> Path:
    completed_jobs = [job for job in jobs if job["status"].lower() == "completed"]  # type: ignore
    logger.info(f"N Completed jobs: {len(completed_jobs)}")
    def get_job_dict(job):
        d = {key: job["inputs"][key] for key in input_vars}
        assert "outputs" in job.keys(), f"Outputs not in job: {job}"
        assert output_response in job["outputs"].keys(), f"Output {output_response} not in job: {job}"
        d[output_response] = job["outputs"][output_response] # type: ignore
        return d
    df_jobs = pd.DataFrame(
            [get_job_dict(job) for job in completed_jobs]
        )
    run_dir = create_run_dir(Path("."), "evaluate")
    TRAINING_FILE = run_dir/  "df_jobs.csv"
    df_jobs.to_csv(TRAINING_FILE, index=False)
    return TRAINING_FILE

@app.route("/flask/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    os.chdir(Path(__file__).parent)
    logger.info("Starting flask function: flask_evaluate_sumo_along_axes")
    logger.info("Cwd: " + str(Path.cwd()))

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
    logger.info("Done!!")
    return jsonify(results) # check if jsonify is needed


@app.route("/flask/uq_propagation")
def flask_uq_propagation() -> Dict[str, str]:
    ## TODO change to new scheme (jobs are passed here, not a filename)
    os.chdir(Path(__file__).parent)
    logger.info("Starting flask function: flask_uq_propagation")
    logger.info("Cwd: " + str(Path.cwd()))
    logger.info("Inputs of the request: ", request.args)
    TRAINING_FILE = base_dir / "mmux_python" / "data" / request.args["filename"]
    logger.info(f"TRAINING_FILE: {TRAINING_FILE} does exist: {TRAINING_FILE.exists()}")
    output_response = request.args["output"]
    input_vars = request.args["inputs"].split(",")
    make_log = False if request.args["log"].lower() == "false" else True
    logger.info(f"output_response: {output_response}")
    logger.info(f"input_vars: {input_vars}")
    logger.info(
        f"make_log: {make_log} (input {request.args['log']}) type: {type(make_log)}"
    )
    run_dir = create_run_dir(Path("."), "uq")
    TRAINING_FILE = Path(shutil.copy(TRAINING_FILE, run_dir))

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response],
    )

    ## TODO get means & stds from frontend
    means, stds = {}, {}

    if make_log:  # FIXME for now log applies to all inputs & the output
        input_vars = [f"log_{var}" for var in input_vars]
        output_response = f"log_{output_response}"
        means = {f"log_{key}": np.log(val) for key, val in means.items()}
        stds = {f"log_{key}": np.log(val) for key, val in stds.items()}

    savepath = propagate_uq(
        PROCESSED_TRAINING_FILE,
        run_dir,
        input_vars,
        output_response,
        means,
        stds,
        xscale="linear",
    )
    # _save_in_react_public_folder(savepath)
    return {"imagePath": savepath.name} ## TODO return data instead

@app.route("/flask/save_json", methods=["POST"])
def flask_save_json():
    logger.info("Starting flask function: flask_save_json")
    logger.info("Cwd: " + str(Path.cwd()))
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    filepath = base_dir.parent / request_data["filePath"]
    data = request_data["data"]
    logger.info(f"Inputs of the request: {request_data}")
    logger.info(f"filename: {filepath}")
    logger.info(f"data: {data}")
    assert Path(filepath).parent.exists(), f"The directory {Path(filepath).parent} were the file should be created does not exist."
    with open(filepath, "w+") as f:
        json.dump(data, f)
    return jsonify({"status": "success"})

@app.route("/flask/load_json", methods=["GET"])
def flask_load_json():
    logger.info("Starting flask function: flask_load_json")
    logger.info("Cwd: " + str(Path.cwd()))
    filePath = base_dir.parent / request.args["filePath"]
    logger.info(f"Inputs of the request: {request.args}")
    logger.info(f"filepath: {filePath}")
    assert Path(filePath).exists(), f"The file {filePath} does not exist."
    with open(filePath, "r") as f:
        data = json.load(f)
    logger.info(f"data: {data}")
    return jsonify(data)

@app.route("/flask/lhs_sampling", methods=["POST"])
def flask_lhs():
    logger.info("Starting flask function: flask/lhs_sampling")
    logger.info("Cwd: " + str(Path.cwd()))
    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    config = request_data["config"]
    k = len(config) # number of variables i.e. dimensions
    seed = request_data["seed"]
    n = request_data["N"]
    function_uid = request_data["funUid"]
    
    from mmux_python.utils.lhs import lhs
    logger.info(f"config: {config} \n n: {n}, k: {k}, seed: {seed}")
    H = lhs(n, k, seed=seed)
    logger.info(f"H: {H.shape}")

    samples = []
    for j in range(n):
        samples.append(
            {config[i]["variable"] : H[i, j] * (config[i]["end"] - config[i]["start"]) + config[i]["start"] for i in range(k)}
        )
    logger.info(f"Samples: {samples}")


    # Now, the running of jobs through the OSPARC API has been moved to the Python backend
    ## NB there are "registerJob(Collection)" endpoints, I could maybe use them 
    jc = functions_api_instance.map_function(function_uid, samples) ## TODO samples will need to adhere to a specific format
    return jsonify(jc.to_dict()) ## this now returns a JobCollection

@app.route("/flask/get_sumo_cv_accuracy_metrics")
def flask_get_sumo_cv_accuracy_metrics():
    logger.info("Starting flask function: flask/get_sumo_cv_accuracy_metrics")
    logger.info("Cwd: " + str(Path.cwd()))

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
    logger.info("Done!!")
    
    return jsonify(results)
