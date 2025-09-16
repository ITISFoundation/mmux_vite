
# Ensure imports before Blueprint usage
import logging
from pathlib import Path
from typing import Callable, Dict, Any
from functools import wraps
from flask import Blueprint, jsonify, request, make_response
from osparc_client.models.function_job_status import FunctionJobStatus
from mmux_flaskapi.utils.helpers import dict_keys_camel_to_snake, _get_all_items, is_test_environment
from mmux_flaskapi.utils.webserver_config import OsparcApi

# Import the base API exception from the osparc_client (adjust if needed)
try:
    from osparc_client.exceptions import ApiException as OsparcApiException
except ImportError:
    # Fallback if the exception is in a different location
    OsparcApiException = Exception


#####################################################################################
# Initialize logger and OsparcApi
#####################################################################################
_logger = logging.getLogger(__name__)
osparc_bp = Blueprint('osparc', __name__, url_prefix='/osparc')

# Initialize osparc_api
osparc_api = OsparcApi()
if not is_test_environment():
    _logger.info("Testing API connection...")
    osparc_api._test_connection()

#####################################################################################
# Decorators for error handling and logging
#####################################################################################
def api_endpoint(func: Callable) -> Callable:
    """
    Decorator for API endpoints to handle errors, logging, and return proper HTTP status codes.
    Propagates downstream OsparcApiException errors with their status code and message.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        _logger.debug(f"Starting flask function: {func.__name__}")
        _logger.debug(f"Cwd: {Path.cwd()}")
        try:
            result = func(*args, **kwargs)
            # If the endpoint returns a tuple (data, status), use it directly
            if isinstance(result, tuple) and len(result) == 2:
                data, status = result
                return make_response(jsonify(data), status)
            # If the endpoint returns a Flask response, return as is
            return jsonify(result)
        except KeyError as e:
            _logger.error(f"Missing required parameter: {e}")
            return make_response(jsonify({"error": f"Missing required parameter: {e}"}), 400)
        except ValueError as e:
            _logger.error(f"Invalid value: {e}")
            return make_response(jsonify({"error": str(e)}), 422)
        except OsparcApiException as e:
            # Propagate downstream API error with its status code and message
            status_code = getattr(e, 'status', getattr(e, 'status_code', 500))
            error_msg = getattr(e, 'body', str(e))
            _logger.error(f"Downstream API error: {status_code} - {error_msg}")
            return make_response(jsonify({"error": error_msg}), status_code)
        except Exception as e:
            _logger.error(f"Internal server error: {e}")
            return make_response(jsonify({"error": str(e)}), 500)
    return wrapper

#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################

@osparc_bp.route("/list_functions", methods=["GET"])
@api_endpoint
def flask_list_functions():
    functions = _get_all_items(osparc_api.get_functions_api().list_functions)
    functions = functions[::-1]  # put last-created first? FIXME still need to expose "created_at" in the response
    _logger.debug(f"N Functions: {len(functions)}")
    return functions, 200

@osparc_bp.route("/list_jobs", methods=["GET"])
@api_endpoint
def flask_list_jobs():
    jobs = _get_all_items(osparc_api.get_job_api().list_function_jobs)
    _logger.debug(f"N Jobs: {len(jobs)}")
    return jobs, 200


@osparc_bp.route("/list_function_job_collections", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections():
    # this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
    job_collections = _get_all_items(osparc_api.get_job_collection_api().list_function_job_collections)
    _logger.debug(f"N Job collections: {len(job_collections)}")
    return job_collections, 200


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################

@osparc_bp.route("/list_function_jobs_for_functionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_functionid():
    function_uid = request.args["functionUid"]
    _logger.info(f"Function ID: {function_uid}")
    jobs = _get_all_items(osparc_api.get_functions_api().list_function_jobs_for_functionid, function_uid)
    _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
    for j in jobs:
        status: FunctionJobStatus = osparc_api.get_job_api().function_job_status(j["uid"])
        j["status"] = status.status
    return jobs, 200

@osparc_bp.route("/list_function_jobs_for_jobcollectionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_jobcollectionid():
    jc_uid = request.args["JobCollectionUid"]
    _logger.debug(f"jc ID: {jc_uid}")
    jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
    jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids]  # type: ignore
    _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
    return jobs, 200

@osparc_bp.route("/list_function_job_collections_for_functionid", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections_for_functionid():
    _logger.debug(f"Request args: {request.args}")
    function_uid = request.args["functionUid"]
    _logger.debug(f"Function ID: {function_uid}")
    response = osparc_api.get_job_collection_api().list_function_job_collections(has_function_id=function_uid)
    job_collections = [dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
    return job_collections, 200

###########################################################################################
## Endpoints to get a single Job information (general info, status, outputs) from its UID
###########################################################################################

@osparc_bp.route("/get_function_job", methods=["GET"])
@api_endpoint
def flask_get_function_job():
    job_uid = request.args["jobUid"]
    return _get_function_job_from_uid(job_uid), 200

def _get_function_job_from_uid(job_uid: str) -> Dict[str, Any]:
    """
    Helper function to get a Job information (including status) from its UID.
    Raises ValueError if job_uid is invalid or job not found.
    """
    if not job_uid:
        _logger.error("Job UID is required.")
        raise ValueError("Job UID is required.")
    _logger.debug(f"Job ID: {job_uid}")
    job = osparc_api.get_job_api().get_function_job(job_uid)
    job_dict = dict_keys_camel_to_snake(job.to_dict())  # type: ignore
    _logger.debug(f"'Raw' Job: {job_dict}")
    job_dict["status"] = osparc_api.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_api.get_job_api().function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")
    return job_dict

@osparc_bp.route("/get_function_job_status", methods=["GET"])
@api_endpoint
def flask_get_function_job_status():
    job_uid = request.args["jobUid"]
    job_status = osparc_api.get_job_api().function_job_status(job_uid).status
    return {"status": job_status}, 200

@osparc_bp.route("/get_function_job_outputs", methods=["GET"])
@api_endpoint
def flask_get_function_job_outputs():
    job_uid = request.args["jobUid"]
    job_outputs = osparc_api.get_job_api().function_job_outputs(job_uid)
    return job_outputs, 200

def test_job_retrieval_endpoints_speed(job_uid: str, N: int = 1):
    def _timeit(fun: Callable, N: int, *args, **kwargs):
        """Helper function to time the execution of a function N times."""
        import time
        start_time = time.time()
        for i in range(N):
            result = fun(*args, **kwargs)
            _logger.info(f"Iteration {i+1}/{N}: {result}")   # Print the result of each iteration
        end_time = time.time()
        return (end_time - start_time) / N
    time_job_full = _timeit(osparc_api.get_job_api().get_function_job, N, job_uid)
    time_job_outputs = _timeit(osparc_api.get_job_api().function_job_outputs, N, job_uid)
    time_job_status = _timeit(osparc_api.get_job_api().function_job_status, N, job_uid)

    _logger.debug(f"Average time to retrieve full job: {time_job_full:.4f} seconds")
    _logger.debug(f"Average time to retrieve job outputs: {time_job_outputs:.4f} seconds")
    _logger.debug(f"Average time to retrieve job status: {time_job_status:.4f} seconds")

def test_job_retrieval_paginated(function_uid: str):
    def _timeit(fun: Callable, *args, **kwargs):
        import time
        start_time = time.time()
        result = fun(*args, **kwargs)
        end_time = time.time()
        _logger.info(f"Retrieved {len(result)} items in {end_time - start_time:.4f} seconds")
        _logger.info(f"First item: {result[0] if result else 'No items retrieved'}")
        _logger.info(f"Last item: {result[-1] if result else 'No items retrieved'}")
        if result:
            _logger.info(f"That is {(end_time - start_time)/len(result):.2f} seconds per item")
    _timeit(_get_all_items, api_call=osparc_api.get_functions_api().list_function_jobs_for_functionid, function_id=function_uid)  # type: ignore
