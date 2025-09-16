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
    run_dir = create_run_dir(base_dir, folder_name)  ## TODO move create_run_dir invocation to the workflow function
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

