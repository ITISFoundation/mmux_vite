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
from typing import List, Dict, Callable
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify 
from flask_cors import CORS, cross_origin


from mmux_python.utils.funs_data_processing import (
    get_variable_names,
    process_input_file,
)
from mmux_python.utils.funs_evaluate import create_run_dir
from mmux_python.utils.funs_evaluate import evaluate_sumo_along_axes, propagate_uq

#########################################################################
# NIH-in-Silico specific logic -- ideally, we would eventually remove it, have agnostic
# (but useful) workflows, and some way to do / pass the normalization, relabeling...
from mmux_python.scripts.NIHinSilico.sumo_visualization_nih import (
    nih_label_conversion,
    normalize_nih_results,
)
NORMALIZING_FUNCTION: Callable = normalize_nih_results
LABEL_CONVERSION_FUNCTION: Callable = nih_label_conversion
#########################################################################
#########################################################################


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

## custom functionality while the FunctionsAPI is not yet available
# ideally we would register that function; and available datapoints as an existing JobCollection
@app.route("/flask/get_nih_inputs_outputs")
@cross_origin()
def flask_get_nih_inputs_outputs() -> Dict[str, List[str]]:
    logger.info("Starting flask function: flask_get_nih_inputs_outputs")
    logger.info("Cwd: " + str(Path.cwd()))
    filename = request.args["filename"]
    logger.info("Inputs of the request: ", request.args)
    TRAINING_FILE = base_dir / "mmux_python" / "data" / filename
    logger.info(f"TRAINING_FILE: {TRAINING_FILE} does exist: {TRAINING_FILE.exists()}")
    var_names = get_variable_names(TRAINING_FILE)
    logger.info(f"var_names: {var_names}")

    ## NIH-in-Silico specific logic
    from mmux_python.scripts.NIHinSilico.nih_utils import get_nih_inputs_outputs
    input_vars, output_vars = get_nih_inputs_outputs(TRAINING_FILE)
    logger.info(f"input_vars: {input_vars}")
    logger.info(f"output_vars: {output_vars}")
    return {"input_vars": input_vars, "output_vars": output_vars}

#########################################################################
#########################################################################


@app.route("/flask/sumo_along_axes", methods=["POST"])
def flask_evaluate_sumo_along_axes():
    os.chdir(Path(__file__).parent)
    logger.info("Starting flask function: flask_evaluate_sumo_along_axes")
    logger.info("Cwd: " + str(Path.cwd()))

    # Convert request data into a Python dictionary
    request_data: dict = json.loads(request.data.decode("utf-8"))
    output_response = request_data["output"]
    input_vars: List[str] = request_data["inputs"]
    make_log = request_data.get("log", False)
    jobs = request_data["FunctionJobs"]
    completed_jobs = [job for job in jobs if job["status"].lower() == "completed"]
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

    PROCESSED_TRAINING_FILE = process_input_file(
        TRAINING_FILE,
        make_log=make_log,
        columns_to_keep=input_vars + [output_response], # type: ignore
        custom_operations=NORMALIZING_FUNCTION,
    )
    if make_log:  # FIXME for now log applies to all inputs & the output
        input_vars = [f"log_{var}" for var in input_vars]
        output_response = f"log_{output_response}"

    results = evaluate_sumo_along_axes(
        run_dir,
        PROCESSED_TRAINING_FILE,
        input_vars,
        output_response, # type: ignore
        label_converter=LABEL_CONVERSION_FUNCTION,
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
        custom_operations=NORMALIZING_FUNCTION,
    )

    # TODO make available as JSON from the training data to React? To display as defaults?
    means = {
        "SigmaMuscle": 0.46,
        "SigmaEpineurium": 0.0826,
        "SigmaPerineurium": 0.0021,
        "SigmaAlongFascicles": 0.571,
        "SigmaTransverseFascicles": 0.0826,
        "ThermalConductivity_Saline": 0.49,
        "ThermalConductivity_Fascicles": 0.48,
        "ThermalConductivity_Connective_Tissue": 0.39,
        "HeatTransferRate_Fascicles": 14896,
        "HeatTransferRate_Saline": 2722,
        "HeatTransferRate_Connective_Tissue": 2565,
    }
    stds = {
        "SigmaMuscle": 1.4,
        "SigmaEpineurium": 1.4,
        "SigmaPerineurium": 1.4,
        "SigmaAlongFascicles": 1.4,
        "SigmaTransverseFascicles": 1.4,
        "ThermalConductivity_Fascicles": 1.1,
        "ThermalConductivity_Saline": 1.08,
        "ThermalConductivity_Connective_Tissue": 1.128,
        "HeatTransferRate_Fascicles": 1.4,
        "HeatTransferRate_Saline": 1.35,
        "HeatTransferRate_Connective_Tissue": 1.4,
    }

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
        label_converter=LABEL_CONVERSION_FUNCTION,
    )
    # _save_in_react_public_folder(savepath)
    return {"imagePath": savepath.name}

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
    logger.info("LHS config: ")
    logger.info(config)
    seed = request_data["seed"]
    n = config[0]["points"]
    k = len(config)
    
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

    return jsonify(samples)