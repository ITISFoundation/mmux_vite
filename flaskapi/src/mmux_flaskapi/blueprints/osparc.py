# Ensure imports before Blueprint usage
import csv
import io
import logging
from collections.abc import Callable
from functools import wraps
from pathlib import Path
from typing import Any

from flask import Blueprint, jsonify, make_response, request

#
from osparc_client.models.function_job_status import FunctionJobStatus

#
from mmux_flaskapi.utils.helpers import _get_all_items, dict_keys_camel_to_snake
from mmux_flaskapi.utils.local_job_store import (
    get_local_job,
    get_local_job_collection,
    is_local_function_uid,
    is_local_job_collection_uid,
    is_local_job_uid,
    list_local_functions,
    list_local_job_collections,
    list_local_jobs_for_collection,
)
from mmux_flaskapi.utils.webserver_config import OsparcApiException, get_osparc_api

#####################################################################################
# Initialize logger and OsparcApi
#####################################################################################
_logger = logging.getLogger(__name__)
osparc_bp = Blueprint("osparc", __name__)


#####################################################################################
# Decorators for error handling and logging
#####################################################################################
def api_endpoint(func: Callable) -> Callable:
    """
    Decorate API endpoints with logging and HTTP-friendly error handling.

    Downstream `OsparcApiException` errors are propagated with their original
    status code and message.
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
    osparc_api = get_osparc_api()
    functions = _get_all_items(osparc_api.get_functions_api().list_functions)
    functions += list_local_functions()
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
    # Deserialize the paginated response into plain JobCollection dictionaries.
    job_collections = _get_all_items(
        osparc_api.get_job_collection_api().list_function_job_collections
    )
    job_collections += list_local_job_collections()
    _logger.debug(f"N Job collections: {len(job_collections)}")
    return job_collections, 200


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################


@osparc_bp.route("/list_function_jobs_for_functionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_functionid():
    osparc_api = get_osparc_api()
    request_args = dict_keys_camel_to_snake(request.args.to_dict())
    function_uid = request_args["function_uid"]
    if is_local_function_uid(function_uid):
        collections = list_local_job_collections(function_uid)
        local_jobs: list[dict[str, Any]] = []
        for collection in collections:
            local_jobs += list_local_jobs_for_collection(collection["uid"])
        return local_jobs, 200

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
    request_args = dict_keys_camel_to_snake(request.args.to_dict())
    jc_uid = request_args["job_collection_uid"]
    _logger.debug(f"jc ID: {jc_uid}")
    if is_local_job_collection_uid(jc_uid):
        local_jobs = list_local_jobs_for_collection(jc_uid)
        _logger.debug(f"N local jobs for job collection {jc_uid}: {len(local_jobs)}")
        return local_jobs, 200

    osparc_api = get_osparc_api()
    jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
    jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids]  # type: ignore
    _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
    return jobs, 200


@osparc_bp.route("/list_function_job_collections_for_functionid", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections_for_functionid():
    _logger.debug(f"Request args: {request.args}")
    request_args = dict_keys_camel_to_snake(request.args.to_dict())
    function_uid = request_args["function_uid"]
    _logger.debug(f"Function ID: {function_uid}")

    local_collections = list_local_job_collections(function_uid)
    normalized_local_collections = [
        {
            **jc,
            "jobIds": jc.get("job_ids", []),
            "job_ids": jc.get("job_ids", []),
        }
        for jc in local_collections
    ]

    if is_local_function_uid(function_uid):
        _logger.debug(
            "N local Job collections for local function %s: %s",
            function_uid,
            len(normalized_local_collections),
        )
        return normalized_local_collections, 200

    osparc_api = get_osparc_api()
    response = osparc_api.get_job_collection_api().list_function_job_collections(
        has_function_id=function_uid
    )
    job_collections = [dict_keys_camel_to_snake(i.to_dict()) for i in response.items]
    job_collections += normalized_local_collections
    _logger.debug(f"N Job collections for function {function_uid}: {len(job_collections)}")
    return job_collections, 200


###########################################################################################
## Endpoints to get a single Job information from its UID
###########################################################################################


@osparc_bp.route("/get_function_job", methods=["GET"])
@api_endpoint
def flask_get_function_job():
    job_uid = request.args["jobUid"]
    return _get_function_job_from_uid(job_uid), 200


def _get_function_job_from_uid(job_uid: str) -> dict[str, Any]:
    """
    Helper function to get a Job information (including status) from its UID.

    Raises ValueError if job_uid is invalid or job not found.
    """
    if not job_uid:
        _logger.error("Job UID is required.")
        raise ValueError("Job UID is required.")

    if is_local_job_uid(job_uid):
        local_job = get_local_job(job_uid)
        if local_job is None:
            raise ValueError(f"Local job UID not found: {job_uid}")
        return local_job

    _logger.debug(f"Job ID: {job_uid}")
    osparc_api = get_osparc_api()
    job = osparc_api.get_job_api().get_function_job(job_uid)
    job_dict = dict_keys_camel_to_snake(job.to_dict())  # type: ignore
    _logger.debug(f"'Raw' Job: {job_dict}")
    job_dict["status"] = osparc_api.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_api.get_job_api().function_job_outputs(job_uid)
    _logger.debug(f"Job: {job_dict}")
    return job_dict


def _serialize_csv_value(value: Any) -> str:
    if isinstance(value, (int, float, bool)):
        return str(value)
    if value is None:
        return ""
    return str(value)


def _job_collection_jobs_to_csv(
    jc_uid: str,
    jc_title: str,
    jobs: list[dict[str, Any]],
) -> str:
    input_keys = sorted(
        {key for job in jobs if isinstance(job.get("inputs"), dict) for key in job["inputs"].keys()}
    )
    output_keys = sorted(
        {
            key
            for job in jobs
            if isinstance(job.get("outputs"), dict)
            for key in job["outputs"].keys()
        }
    )

    rows: list[dict[str, str]] = []
    for job in jobs:
        row: dict[str, str] = {
            "schema_version": "1",
            "source_job_collection_uid": jc_uid,
            "source_job_collection_title": jc_title,
            "source_function_uid": _serialize_csv_value(job.get("function_uid", "")),
            "source_job_uid": _serialize_csv_value(job.get("uid", "")),
            "status": _serialize_csv_value(job.get("status", "")),
        }

        inputs = job.get("inputs")
        inputs = inputs if isinstance(inputs, dict) else {}
        outputs = job.get("outputs")
        outputs = outputs if isinstance(outputs, dict) else {}

        for key in input_keys:
            row[f"input__{key}"] = _serialize_csv_value(inputs.get(key))
        for key in output_keys:
            row[f"output__{key}"] = _serialize_csv_value(outputs.get(key))
        rows.append(row)

    base_fields = [
        "schema_version",
        "source_job_collection_uid",
        "source_job_collection_title",
        "source_function_uid",
        "source_job_uid",
        "status",
    ]
    fieldnames = (
        base_fields + [f"input__{k}" for k in input_keys] + [f"output__{k}" for k in output_keys]
    )
    csv_buffer = io.StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return csv_buffer.getvalue()


@osparc_bp.route("/download_job_collection_csv", methods=["GET"])
def flask_download_job_collection_csv():
    """Download one JobCollection and its jobs as CSV."""
    try:
        jc_uid = request.args["JobCollectionUid"]
        if is_local_job_collection_uid(jc_uid):
            local_jc = get_local_job_collection(jc_uid)
            if local_jc is None:
                return make_response(
                    jsonify({"error": "Local JobCollection not found"}),
                    404,
                )
            jobs = list_local_jobs_for_collection(jc_uid)
            jc_title = str(local_jc.get("title", ""))
        else:
            osparc_api = get_osparc_api()
            jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
            jobs = [_get_function_job_from_uid(job_uid) for job_uid in jc.job_ids]  # type: ignore[arg-type]
            jc_title = getattr(jc, "title", "")

        csv_content = _job_collection_jobs_to_csv(
            jc_uid=jc_uid,
            jc_title=jc_title,
            jobs=jobs,
        )

        response = make_response(csv_content, 200)
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        response.headers["Content-Disposition"] = (
            f'attachment; filename="job_collection_{jc_uid}.csv"'
        )
        return response
    except KeyError as e:
        _logger.error(f"Missing required parameter: {e}")
        return make_response(
            jsonify({"error": f"Missing required parameter: {e}"}),
            400,
        )
    except OsparcApiException as e:
        status_code = getattr(e, "status", getattr(e, "status_code", 500))
        error_msg = getattr(e, "body", str(e))
        _logger.error(f"Downstream API error: {status_code} - {error_msg}")
        return make_response(jsonify({"error": error_msg}), status_code)
    except Exception as e:
        _logger.error(f"Internal server error: {e}")
        return make_response(jsonify({"error": str(e)}), 500)


@osparc_bp.route("/get_function_job_status", methods=["GET"])
@api_endpoint
def flask_get_function_job_status():
    osparc_api = get_osparc_api()
    job_uid = request.args["jobUid"]
    job_status = osparc_api.get_job_api().function_job_status(job_uid).status
    return {"status": job_status}, 200


@osparc_bp.route("/get_function_job_outputs", methods=["GET"])
@api_endpoint
def flask_get_function_job_outputs():
    osparc_api = get_osparc_api()
    job_uid = request.args["jobUid"]
    job_outputs = osparc_api.get_job_api().function_job_outputs(job_uid)
    return job_outputs, 200
