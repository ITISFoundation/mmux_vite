# Ensure imports before Blueprint usage
import logging
from collections.abc import Callable
from dataclasses import dataclass
from functools import wraps
from pathlib import Path
from typing import Any, cast

from flask import Blueprint, jsonify, make_response, request

#
from osparc_client.models.function_job_status import FunctionJobStatus

#
from mmux_flaskapi.utils.helpers import _get_all_items
from mmux_flaskapi.utils.local_job_store import (
    get_local_function,
    get_local_job,
    get_local_job_collection,
    is_local_function_uid,
    is_local_job_collection_uid,
    is_local_job_uid,
    list_local_functions,
    list_local_job_collections,
    list_local_job_collections_for_function,
    list_local_jobs,
    list_local_jobs_for_collection,
    list_local_jobs_for_function,
)
from mmux_flaskapi.utils.webserver_config import (
    OsparcApi,
    OsparcApiException,
    get_osparc_api_if_configured,
    get_osparc_api_if_connected,
)

#####################################################################################
# Initialize logger and OsparcApi
#####################################################################################
_logger = logging.getLogger(__name__)
osparc_bp = Blueprint("osparc", __name__)


def _get_osparc_api_if_available() -> OsparcApi | None:
    """
    Single availability gate for the oSPARC backend, used by every endpoint below instead
    of each branching on DEPLOYMENT_MODE itself (flaskapi/SPEC.md V15/V29): local-store data
    always merges into results, and an unavailable backend always degrades gracefully
    (empty/local-only, never a 500) -- in every DEPLOYMENT_MODE, not just LOCAL. A None
    return here always means "no remote data available right now", never an error.
    """
    osparc_api = get_osparc_api_if_configured()
    if osparc_api is None:
        # Missing/blank credentials are a static config state, not a per-request network
        # probe, so this stays a plain per-request WARNING (unlike the debounced one below).
        _logger.warning("oSPARC is not configured - returning no remote data")
        return None

    # The unreachable-backend WARNING (once per unreachability episode, not per request) is
    # logged inside get_osparc_api_if_connected() itself (flaskapi/SPEC.md V28).
    return get_osparc_api_if_connected()


@dataclass(frozen=True)
class _ResourceKind:
    """
    Bundles the local_job_store + oSPARC-SDK accessors for one resource kind (function, job
    collection, or job), so the merge/degrade skeleton is written once (in `_list_merged`,
    `_get_by_id`, `_list_merged_for_parent` below) and reused for all three kinds instead of
    duplicated per endpoint (flaskapi/SPEC.md V15/V29).
    """

    label: str
    is_local_uid: Callable[[str], bool]
    list_local: Callable[[], list[dict[str, Any]]]
    get_local: Callable[[str], dict[str, Any] | None]
    fetch_remote_list: Callable[[OsparcApi], list[dict[str, Any]]]
    fetch_remote_by_id: Callable[[OsparcApi, str], dict[str, Any]] | None = None


def _fetch_remote_job(osparc_api: OsparcApi, job_uid: str) -> dict[str, Any]:
    """Fetch a single real (non-local) job, enriched with its status and outputs."""
    job = osparc_api.get_job_api().get_function_job(job_uid)
    job_dict = cast(dict[str, Any], job.to_dict())
    job_dict["status"] = osparc_api.get_job_api().function_job_status(job_uid).status
    job_dict["outputs"] = osparc_api.get_job_api().function_job_outputs(job_uid)
    return job_dict


_FUNCTION_KIND = _ResourceKind(
    label="function",
    is_local_uid=is_local_function_uid,
    list_local=list_local_functions,
    get_local=get_local_function,
    fetch_remote_list=lambda api: _get_all_items(api.get_functions_api().list_functions),
    fetch_remote_by_id=lambda api, uid: cast(
        dict[str, Any], api.get_functions_api().get_function(uid).to_dict()
    ),
)

_JOB_COLLECTION_KIND = _ResourceKind(
    label="job collection",
    is_local_uid=is_local_job_collection_uid,
    list_local=list_local_job_collections,
    get_local=get_local_job_collection,
    fetch_remote_list=lambda api: _get_all_items(
        api.get_job_collection_api().list_function_job_collections
    ),
)

_JOB_KIND = _ResourceKind(
    label="job",
    is_local_uid=is_local_job_uid,
    list_local=list_local_jobs,
    get_local=get_local_job,
    fetch_remote_list=lambda api: _get_all_items(api.get_job_api().list_function_jobs),
    fetch_remote_by_id=_fetch_remote_job,
)


def _list_merged(kind: _ResourceKind) -> list[dict[str, Any]]:
    """List-all: real oSPARC items (or `[]` if the backend is unavailable) + local_job_store
    items, always merged regardless of DEPLOYMENT_MODE (flaskapi/SPEC.md V15/V29)."""
    osparc_api = _get_osparc_api_if_available()
    remote = kind.fetch_remote_list(osparc_api) if osparc_api is not None else []
    merged = remote + kind.list_local()
    _logger.debug(f"N {kind.label}s (real+local): {len(merged)}")
    return merged


def _get_by_id(kind: _ResourceKind, uid: str) -> dict[str, Any]:
    """Get-by-id: routes on the uid prefix. A real (non-local) uid requires the backend to
    be available; if not, raises ValueError (-> 422 via `api_endpoint`) instead of crashing
    (flaskapi/SPEC.md V15/V29)."""
    if kind.is_local_uid(uid):
        item = kind.get_local(uid)
        if item is None:
            raise ValueError(f"Local {kind.label} {uid} not found")
        return item

    osparc_api = _get_osparc_api_if_available()
    if osparc_api is None:
        raise ValueError(f"Cannot fetch {kind.label} {uid}: oSPARC backend is not available")
    assert kind.fetch_remote_by_id is not None  # programming error if a kind omits this
    return kind.fetch_remote_by_id(osparc_api, uid)


def _list_merged_for_parent(
    parent_uid: str,
    parent_is_local_uid: Callable[[str], bool],
    list_local_for_parent: Callable[[str], list[dict[str, Any]]],
    fetch_remote_for_parent: Callable[[OsparcApi, str], list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    """Children-of-a-parent listing shared skeleton: a local parent uid has no remote
    children by construction; a real parent uid may still have local children (e.g. a
    CSV-imported job collection created against a real function uid), so those are always
    appended (flaskapi/SPEC.md V15/V29)."""
    if parent_is_local_uid(parent_uid):
        return list_local_for_parent(parent_uid)

    osparc_api = _get_osparc_api_if_available()
    remote = fetch_remote_for_parent(osparc_api, parent_uid) if osparc_api is not None else []
    return remote + list_local_for_parent(parent_uid)


def _get_job_field_by_id(
    job_uid: str, field: str, fetch_remote_field: Callable[[OsparcApi, str], Any]
) -> Any:
    """Shared skeleton for `/get_function_job_status` and `/get_function_job_outputs`: a
    local job's field is already complete (local jobs run synchronously, see
    local_job_store.py), so it's read straight off the stored dict; a real job's field
    requires exactly one dedicated SDK call (not a full job fetch, to keep parity with the
    single-purpose calls these two endpoints made pre-refactor) and an available backend
    (flaskapi/SPEC.md V15/V29)."""
    if is_local_job_uid(job_uid):
        job = get_local_job(job_uid)
        if job is None:
            raise ValueError(f"Local job {job_uid} not found")
        return job[field]

    osparc_api = _get_osparc_api_if_available()
    if osparc_api is None:
        raise ValueError(f"Cannot fetch job {job_uid}: oSPARC backend is not available")
    return fetch_remote_field(osparc_api, job_uid)


def _get_query_arg(*names: str) -> str:
    """Return the first matching query argument from a list of compatible names."""
    for name in names:
        if name in request.args:
            return request.args[name]
    raise KeyError(names[0])


#####################################################################################
# Decorators for error handling and logging
#####################################################################################
def api_endpoint(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator for API endpoints to handle errors, logging, and return proper HTTP status codes.
    Propagates downstream OsparcApiException errors with their status code and message.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = getattr(func, "__name__", str(func))
        _logger.debug(f"Starting flask function: {func_name}")
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
    functions = _list_merged(_FUNCTION_KIND)
    functions = functions[
        ::-1
    ]  # put last-created first? FIXME still need to expose "created_at" in the response
    return functions, 200


@osparc_bp.route("/list_jobs", methods=["GET"])
@api_endpoint
def flask_list_jobs():
    return _list_merged(_JOB_KIND), 200


@osparc_bp.route("/list_function_job_collections", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections():
    return _list_merged(_JOB_COLLECTION_KIND), 200


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################


def _fetch_remote_jobs_for_function(
    osparc_api: OsparcApi, function_uid: str
) -> list[dict[str, Any]]:
    jobs = _get_all_items(
        osparc_api.get_functions_api().list_function_jobs_for_functionid, function_uid
    )
    for j in jobs:
        status: FunctionJobStatus = osparc_api.get_job_api().function_job_status(j["uid"])
        j["status"] = status.status
    return jobs


@osparc_bp.route("/list_function_jobs_for_functionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_functionid():
    function_uid = _get_query_arg("functionUid", "function_uid")
    _logger.info(f"Function ID: {function_uid}")

    jobs = _list_merged_for_parent(
        function_uid,
        is_local_function_uid,
        list_local_jobs_for_function,
        _fetch_remote_jobs_for_function,
    )
    _logger.debug(f"N Jobs for function {function_uid}: {len(jobs)}")
    return jobs, 200


def _fetch_remote_jobs_for_jobcollection(
    osparc_api: OsparcApi, jc_uid: str
) -> list[dict[str, Any]]:
    jc = osparc_api.get_job_collection_api().get_function_job_collection(jc_uid)
    job_ids = jc.job_ids or []
    return [_get_function_job_from_uid(job_uid) for job_uid in job_ids]


@osparc_bp.route("/list_function_jobs_for_jobcollectionid", methods=["GET"])
@api_endpoint
def flask_list_function_jobs_for_jobcollectionid():
    jc_uid = _get_query_arg("JobCollectionUid", "job_collection_uid")
    _logger.debug(f"jc ID: {jc_uid}")

    jobs = _list_merged_for_parent(
        jc_uid,
        is_local_job_collection_uid,
        list_local_jobs_for_collection,
        _fetch_remote_jobs_for_jobcollection,
    )
    _logger.debug(f"N Jobs for job collection {jc_uid}: {len(jobs)}")
    return jobs, 200


def _fetch_remote_job_collections_for_function(
    osparc_api: OsparcApi, function_uid: str
) -> list[dict[str, Any]]:
    return [
        i.to_dict()
        for i in osparc_api.get_job_collection_api()
        .list_function_job_collections(has_function_id=function_uid)
        .items
    ]


@osparc_bp.route("/list_function_job_collections_for_functionid", methods=["GET"])
@api_endpoint
def flask_get_function_job_collections_for_functionid():
    _logger.debug(f"Request args: {request.args}")
    function_uid = _get_query_arg("functionUid", "function_uid")
    _logger.debug(f"Function ID: {function_uid}")

    job_collections = _list_merged_for_parent(
        function_uid,
        is_local_function_uid,
        list_local_job_collections_for_function,
        _fetch_remote_job_collections_for_function,
    )
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
    Helper function to get a Job information (including status and outputs) from its UID,
    local or real oSPARC. Raises ValueError if job_uid is blank, invalid, or not found.
    Imported directly by sampling.py.
    """
    if not job_uid:
        _logger.error("Job UID is required.")
        raise ValueError("Job UID is required.")
    _logger.debug(f"Job ID: {job_uid}")
    return _get_by_id(_JOB_KIND, job_uid)


def _function_schema_vars(function_uid: str) -> tuple[list[str], list[str]]:
    """Return (input_vars, output_vars) for a function, local or real oSPARC.

    Raises ValueError (-> 422) instead of crashing when a real function's backend is
    unavailable (flaskapi/SPEC.md V15/V29). Imported directly by sampling.py.
    """
    fun = _get_by_id(_FUNCTION_KIND, function_uid)
    input_vars = list(fun["input_schema"]["schema_content"]["properties"])
    output_vars = list(fun["output_schema"]["schema_content"]["properties"])
    return input_vars, output_vars


@osparc_bp.route("/get_function_job_status", methods=["GET"])
@api_endpoint
def flask_get_function_job_status():
    job_uid = _get_query_arg("jobUid", "job_uid")
    status = _get_job_field_by_id(
        job_uid, "status", lambda api, uid: api.get_job_api().function_job_status(uid).status
    )
    return {"status": status}, 200


@osparc_bp.route("/get_function_job_outputs", methods=["GET"])
@api_endpoint
def flask_get_function_job_outputs():
    job_uid = _get_query_arg("jobUid", "job_uid")
    outputs = _get_job_field_by_id(
        job_uid, "outputs", lambda api, uid: api.get_job_api().function_job_outputs(uid)
    )
    return outputs, 200
