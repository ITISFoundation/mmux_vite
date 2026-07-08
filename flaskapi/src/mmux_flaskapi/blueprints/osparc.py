# Ensure imports before Blueprint usage
import logging
from collections.abc import Callable
from functools import wraps
from pathlib import Path
from typing import Any

from flask import Blueprint, jsonify, make_response, request

#
from osparc_client.models.function_job_status import FunctionJobStatus

#
from mmux_flaskapi.utils.helpers import _get_all_items
from mmux_flaskapi.utils.webserver_config import (
    OsparcApiException,
    get_osparc_api,
    get_osparc_api_if_configured,
)

#####################################################################################
# Initialize logger and OsparcApi
#####################################################################################
_logger = logging.getLogger(__name__)
osparc_bp = Blueprint("osparc", __name__)


def _get_query_arg(*names: str) -> str:
    """Return the first matching query argument from a list of compatible names."""
    for name in names:
        if name in request.args:
            return request.args[name]
    raise KeyError(names[0])


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
            status_code = getattr(e, "status", getattr(e, "status_code", 500))
            error_msg = getattr(e, "body", str(e))
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
    osparc_api = get_osparc_api_if_configured()
    if osparc_api is None:
        _logger.warning("oSPARC credentials are not configured - returning no remote functions")
        return [], 200

    functions = _get_all_items(osparc_api.get_functions_api().list_functions)
    functions = functions[
        ::-1
    ]  # put last-created first? FIXME still need to expose "created_at" in the response
    _logger.debug(f"N Functions: {len(functions)}")
    return functions, 200


@osparc_bp.route("/list_jobs", methods=["GET"])
@api_endpoint
def flask_list_jobs():
    osparc_api = get_osparc_api()
    jobs = _get_all_items(osparc_api.get_job_api().list_function_jobs)
    _logger.debug(f"N Jobs: {len(jobs)}")
    return jobs, 200


@osparc_bp.route("/list_function_job_collections", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections():
    osparc_api = get_osparc_api()
    # this is a list of items of Paginated object -- deserialize into a list of JobCollection objects
    job_collections = _get_all_items(
        osparc_api.get_job_collection_api().list_function_job_collections
    )
    _logger.debug(f"N Job collections: {len(job_collections)}")
    return job_collections, 200


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################


@osparc_bp.route("/list_function_jobs_for_functionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_functionid():
    osparc_api = get_osparc_api()
    function_uid = _get_query_arg("functionUid", "function_uid")
    _logger.info(f"Function ID: {function_uid}")
    jobs = _get_all_items(
        osparc_api.get_functions_api().list_function_jobs_for_functionid, function_uid
    )
    _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
    for j in jobs:
        status: FunctionJobStatus = osparc_api.get_job_api().function_job_status(j["uid"])
        j["status"] = status.status
    return jobs, 200


@osparc_bp.route("/list_function_jobs_for_jobcollectionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_jobcollectionid():
    osparc_api = get_osparc_api()
    jc_uid = _get_query_arg("JobCollectionUid", "job_collection_uid")
    _logger.debug(f"jc ID: {jc_uid}")
    jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
    jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids]  # type: ignore
    _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
    return jobs, 200


@osparc_bp.route("/list_function_job_collections_for_functionid", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections_for_functionid():
    osparc_api = get_osparc_api()
    _logger.debug(f"Request args: {request.args}")
    function_uid = _get_query_arg("functionUid", "function_uid")
    _logger.debug(f"Function ID: {function_uid}")
    response = osparc_api.get_job_collection_api().list_function_job_collections(
        has_function_id=function_uid
    )
    job_collections = [i.to_dict() for i in response.items]
    _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
    return job_collections, 200


###########################################################################################
## Endpoints to get a single Job information (general info, status, outputs) from its UID
###########################################################################################


@osparc_bp.route("/get_function_job", methods=["GET"])
@api_endpoint
def flask_get_function_job():
    job_uid = _get_query_arg("jobUid", "job_uid")
    return _get_function_job_from_uid(job_uid), 200


def _get_function_job_from_uid(job_uid: str) -> dict[str, Any]:
    """
    Helper function to get a Job information (including status) from its UID.
    Raises ValueError if job_uid is invalid or job not found.
    """
    if not job_uid:
        _logger.error("Job UID is required.")
        raise ValueError("Job UID is required.")
    _logger.debug(f"Job ID: {job_uid}")
    osparc_api = get_osparc_api()
    job = osparc_api.get_job_api().get_function_job(job_uid)
    job_dict = job.to_dict()  # type: ignore
    _logger.debug(f"'Raw' Job: {job_dict}")
    job_dict["status"] = osparc_api.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_api.get_job_api().function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")
    return job_dict


@osparc_bp.route("/get_function_job_status", methods=["GET"])
@api_endpoint
def flask_get_function_job_status():
    osparc_api = get_osparc_api()
    job_uid = _get_query_arg("jobUid", "job_uid")
    job_status = osparc_api.get_job_api().function_job_status(job_uid).status
    return {"status": job_status}, 200


@osparc_bp.route("/get_function_job_outputs", methods=["GET"])
@api_endpoint
def flask_get_function_job_outputs():
    osparc_api = get_osparc_api()
    job_uid = _get_query_arg("jobUid", "job_uid")
    job_outputs = osparc_api.get_job_api().function_job_outputs(job_uid)
    return job_outputs, 200
