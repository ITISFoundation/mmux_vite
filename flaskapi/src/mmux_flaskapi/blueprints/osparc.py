from flask import Blueprint, jsonify
import logging
from pathlib import Path
from typing import Callable, Dict
from flask import request, abort, make_response
#
from osparc_client.models.function_job import FunctionJob
from osparc_client.models.function_job_status import FunctionJobStatus
#
from mmux_flaskapi.helpers import dict_keys_camel_to_snake, _get_all_items
from mmux_flaskapi.webserver_config import OsparcApi
from mmux_flaskapi.helpers import is_test_environment

_logger = logging.getLogger(__name__)
osparc_bp = Blueprint('osparc', __name__, url_prefix='/osparc')

# Initialize osparc_api
osparc_api = OsparcApi()
if not is_test_environment():
    _logger.info("Testing API connection...")
    osparc_api._test_connection()

#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################

@osparc_bp.route("/list_functions", methods=["GET"])
def flask_list_functions():
    _logger.debug("Starting flask function: flask_list_functions")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        functions = _get_all_items(osparc_api.get_functions_api().list_functions)
        functions = functions[::-1] # put last-created first? FIXME still need to expose "created_at" in the response
        _logger.debug(f"N Functions: {len(functions)}")
        return jsonify(functions)
    except Exception as e:
        _logger.error(f"Error while listing functions: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@osparc_bp.route("/list_jobs", methods=["GET"])
def flask_list_jobs():
    _logger.debug("Starting flask function: flask_list_jobs")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        jobs = _get_all_items(osparc_api.get_job_api().list_function_jobs)
        _logger.debug(f"N Jobs: {len(jobs)}")
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@osparc_bp.route("/list_function_job_collections", methods=["GET"])
def flask_get_function_job_collections():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        ## this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
        job_collections = _get_all_items(osparc_api.get_job_collection_api().list_function_job_collections)
        _logger.debug(f"N Job collections: {len(job_collections)}")
        return jsonify(job_collections)
    except Exception as e:  
        _logger.error(f"Error while listing job collections: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################

@osparc_bp.route("/list_function_jobs_for_functionid", methods=["GET"])
def flask_list_function_jobs_for_functionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_functionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = None
    try:
        function_uid = request.args["functionUid"]
        _logger.info(f"Function ID: {function_uid}")
        jobs = _get_all_items(osparc_api.get_functions_api().list_function_jobs_for_functionid, function_uid)
        _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
        for j in jobs:
            status : FunctionJobStatus = osparc_api.get_job_api().function_job_status(j["uid"]) 
            j["status"] = status.status
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs for function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@osparc_bp.route("/list_function_jobs_for_jobcollectionid", methods=["GET"])
def flask_list_function_jobs_for_jobcollectionid():
    _logger.debug("Starting flask function: flask_list_function_jobs_for_jobcollectionid")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        jc_uid = request.args["JobCollectionUid"]
        _logger.debug(f"jc ID: {jc_uid}")
        jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
        jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids] # type: ignore
        _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
        return jsonify(jobs)
    except Exception as e:
        _logger.error(f"Error while listing jobs for job collection {jc_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@osparc_bp.route("/list_function_job_collections_for_functionid", methods=["GET"])
def flask_get_function_job_collections_for_functionid():
    _logger.debug("Starting flask function: flask_get_function_job_collections")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        _logger.debug(f"Request args: {request.args}")
        function_uid = request.args["functionUid"]
        _logger.debug(f"Function ID: {function_uid}")
        # job_collections = get_all_items(job_collection_api_instance.list_function_job_collections, has_function_id=function_uid)
        response = osparc_api.get_job_collection_api().list_function_job_collections(has_function_id=function_uid)
        job_collections = [dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
        _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
        return jsonify(job_collections)
    except Exception as e:
        _logger.error(f"Error while listing job collections for function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

###########################################################################################
## Endpoints to get a single Job information (general info, status, outputs) from its UID
###########################################################################################

@osparc_bp.route("/get_function_job", methods=["GET"])
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
    job = osparc_api.get_job_api().get_function_job(job_uid)
    job_dict = dict_keys_camel_to_snake(job.to_dict()) # type: ignore
    _logger.debug(f"'Raw' Job: {job_dict}")
    job_dict["status"] = osparc_api.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_api.get_job_api().function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")

    return job_dict

@osparc_bp.route("/get_function_job_status", methods=["GET"])
def flask_get_function_job_status():
    _logger.debug("Starting flask function: flask_get_function_job_status")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        job_uid = request.args["jobUid"]
        job_status = osparc_api.get_job_api().function_job_status(job_uid).status
        return jsonify(job_status)
    except Exception as e:
        _logger.error(f"Error while getting function job: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))

@osparc_bp.route("/get_function_job_outputs", methods=["GET"])
def flask_get_function_job_outputs():
    _logger.debug("Starting flask function: flask_get_function_job_outputs")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try: 
        job_uid = request.args["jobUid"]
        job_outputs = osparc_api.get_job_api().function_job_outputs(job_uid)
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
    time_job_full = _timeit(osparc_api.get_job_api().get_function_job, N, job_uid)
    time_job_outputs = _timeit(osparc_api.get_job_api().function_job_outputs, N, job_uid)
    time_job_status = _timeit(osparc_api.get_job_api().function_job_status, N, job_uid)

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
    _timeit(_get_all_items, api_call=osparc_api.get_functions_api().list_function_jobs_for_functionid, function_id=function_uid)  # type: ignore
