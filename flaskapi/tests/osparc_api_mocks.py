"""
Pytest fixtures and mocks for osparc_client.api.functions_api.FunctionsApi.list_functions
Covers: success, empty, and error (422) cases for /flask/osparc/list_functions endpoint.
"""

from unittest.mock import MagicMock, patch

import pytest
from osparc_client.exceptions import ApiException as OsparcApiException


@pytest.fixture(autouse=True)
def patch_users_profile_success():
    """Avoid real network calls when OsparcApi tests connection via UsersApi.get_my_profile."""
    with patch(
        "osparc.UsersApi.get_my_profile",
        return_value=MagicMock(model_dump_json=lambda **kwargs: "{}"),
    ):
        yield


#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################

# --- Mock FunctionsApi.list_functions() ---


def mock_list_functions_success(*args, **kwargs):
    """Standard successful response with multiple function entries."""
    return MagicMock(
        items=[
            MagicMock(
                to_dict=lambda: {
                    "uid": "func1",
                    "name": "Function One",
                    "description": "First test function",
                }
            ),
            MagicMock(
                to_dict=lambda: {
                    "uid": "func2",
                    "name": "Function Two",
                    "description": "Second test function",
                }
            ),
            MagicMock(
                to_dict=lambda: {
                    "uid": "func-3",
                    "name": "Function Three",
                    "description": "Third test function",
                }
            ),
        ],
        total=3,
    )


def mock_list_functions_empty(*args, **kwargs):
    """Empty result set."""
    return MagicMock(items=[], total=0)


def mock_list_functions_422(*args, **kwargs):
    """Simulate a 422 Validation Error from the API client."""
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


# --- Fixtures for patching ---


@pytest.fixture
def patch_list_functions_success():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_functions",
        return_value=mock_list_functions_success(),
    ):
        yield


@pytest.fixture
def patch_list_functions_empty():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_functions",
        return_value=mock_list_functions_empty(),
    ):
        yield


@pytest.fixture
def patch_list_functions_422():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_functions",
        side_effect=mock_list_functions_422,
    ):
        yield


# ---------------------------------------------------------------


# --- Mock JobsApi.list_function_jobs() ---


def mock_list_function_jobs_success(*args, **kwargs):
    """Standard successful response with multiple job entries."""
    # The API returns a paginated object with 'items' and 'total'.
    return MagicMock(
        items=[
            MagicMock(
                to_dict=lambda: {
                    "uid": "job-1",
                    "function_uid": "func1",
                    "status": "SUCCESS",
                    "created_at": "2025-09-01T12:00:00Z",
                    "inputs": {"x": 1, "y": 2},
                    "outputs": {"result": 3},
                    "user_id": "user-1",
                }
            ),
            MagicMock(
                to_dict=lambda: {
                    "uid": "job-2",
                    "function_uid": "func2",
                    "status": "PENDING",
                    "created_at": "2025-09-02T13:00:00Z",
                    "inputs": {"x": 10, "y": 20},
                    "outputs": None,
                    "user_id": "user-2",
                }
            ),
        ],
        total=2,
    )


def mock_list_function_jobs_empty(*args, **kwargs):
    """Empty result set."""
    return MagicMock(items=[], total=0)


def mock_list_function_jobs_422(*args, **kwargs):
    """Simulate a 422 Validation Error from the API client."""
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


# --- Fixtures for patching ---


@pytest.fixture
def patch_list_function_jobs_success():
    """Patch FunctionJobsApi.list_function_jobs to return a successful response."""
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs",
        return_value=mock_list_function_jobs_success(),
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_empty():
    """Patch FunctionJobsApi.list_function_jobs to return an empty response."""
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs",
        return_value=mock_list_function_jobs_empty(),
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_422():
    """Patch FunctionJobsApi.list_function_jobs to raise a 422 error."""
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs",
        side_effect=mock_list_function_jobs_422,
    ):
        yield


# --- Mock FunctionJobCollectionsApi.list_function_job_collections() ---
def mock_list_function_job_collections_success(*args, **kwargs):
    """Return a paginated object with two job collections."""
    collections = [
        MagicMock(
            to_dict=lambda: {
                "uid": "jc-1",
                "job_ids": ["job-1", "job-2"],
                "name": "Collection One",
            }
        ),
        MagicMock(
            to_dict=lambda: {
                "uid": "jc-2",
                "job_ids": ["job-3"],
                "name": "Collection Two",
            }
        ),
    ]
    return MagicMock(items=collections, total=len(collections))


def mock_list_function_job_collections_empty(*args, **kwargs):
    return MagicMock(items=[], total=0)


def mock_list_function_job_collections_422(*args, **kwargs):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


# --- Fixtures for patching FunctionJobCollectionsApi.list_function_job_collections ---
@pytest.fixture
def patch_list_function_job_collections_success():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
        side_effect=mock_list_function_job_collections_success,
    ):
        yield


@pytest.fixture
def patch_list_function_job_collections_empty():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
        side_effect=mock_list_function_job_collections_empty,
    ):
        yield


@pytest.fixture
def patch_list_function_job_collections_422():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
        side_effect=mock_list_function_job_collections_422,
    ):
        yield


# --- Mock FunctionsApi.list_function_jobs_for_functionid() and FunctionJobApi.function_job_status() ---
def mock_list_function_jobs_for_functionid_success(function_uid: str, **kwargs):
    """Standard successful response for jobs for a function UID."""
    # Return jobs only for the given function_uid
    jobs = [
        MagicMock(
            to_dict=lambda: {
                "uid": "job1",
                "function_uid": function_uid,
                "status": "SUCCESS",
                "created_at": "2025-09-01T12:00:00Z",
                "inputs": {"x": 1, "y": 2},
                "outputs": {"result": 3},
                "user_id": "user1",
            }
        ),
        MagicMock(
            to_dict=lambda: {
                "uid": "job2",
                "function_uid": function_uid,
                "status": "PENDING",
                "created_at": "2025-09-02T13:00:00Z",
                "inputs": {"x": 10, "y": 20},
                "outputs": None,
                "user_id": "user2",
            }
        ),
    ]
    return MagicMock(items=jobs, total=len(jobs))


def mock_list_function_jobs_for_functionid_empty(function_uid: str, **kwargs):
    """Empty result set for jobs for a function UID."""
    return MagicMock(items=[], total=0)


def mock_list_function_jobs_for_functionid_422(function_uid: str, **kwargs):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


def mock_list_function_jobs_for_functionid_404(function_uid: str, **kwargs):
    raise OsparcApiException(
        status=404, body=f"404 Not Found: Function UID {function_uid} does not exist"
    )


# --- Fixtures for patching FunctionsApi.list_function_jobs_for_functionid ---


@pytest.fixture
def patch_list_function_jobs_for_functionid_success():
    with (
        patch(
            "osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid",
            side_effect=mock_list_function_jobs_for_functionid_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
            side_effect=mock_get_function_job_status_success,
        ),
    ):
        ## NB list_function_jobs_for_functionid also calls function_job_status for each job
        yield


@pytest.fixture
def patch_list_function_jobs_for_functionid_empty():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid",
        side_effect=mock_list_function_jobs_for_functionid_empty,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_functionid_422():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid",
        side_effect=mock_list_function_jobs_for_functionid_422,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_functionid_404():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid",
        side_effect=mock_list_function_jobs_for_functionid_404,
    ):
        yield


# --- Mock FunctionJobCollectionsApi.get_function_job_collection and FunctionJobsApi.get_function_job ---
def mock_get_function_job_collection_success(jc_uid):
    """Return a job collection with two job IDs."""
    return MagicMock(job_ids=["job-1", "job-2"])


def mock_get_function_job_collection_empty(jc_uid):
    """Return a job collection with no job IDs."""
    return MagicMock(job_ids=[])


def mock_get_function_job_collection_422(jc_uid):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


def mock_get_function_job_collection_404(jc_uid):
    raise OsparcApiException(
        status=404, body=f"404 Not Found: Job Collection UID {jc_uid} does not exist"
    )


# --- Fixtures for patching /flask/osparc/list_function_jobs_for_jobcollectionid ---
@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_success():
    with (
        patch(
            "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
            side_effect=mock_get_function_job_collection_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
            side_effect=mock_get_function_job_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
            side_effect=mock_get_function_job_status_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
            side_effect=mock_function_job_outputs_success,
        ),
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_empty():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
        side_effect=mock_get_function_job_collection_empty,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_422():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
        side_effect=mock_get_function_job_collection_422,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_404():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
        side_effect=mock_get_function_job_collection_404,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_job_404():
    with (
        patch(
            "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
            side_effect=mock_get_function_job_collection_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
            side_effect=mock_get_function_job_404,
        ),
    ):
        yield


###########################################################################################
## Endpoints to get a single Job information (general info, status, outputs) from its UID
###########################################################################################

## --- Mocks for FunctionJobApi.function_job() ---


def mock_get_function_job_success(job_uid):
    return MagicMock(
        to_dict=lambda: {
            "uid": job_uid,
            "function_uid": "func1",
            "status": "SUCCESS" if job_uid == "job-1" else "PENDING",
            "created_at": "2025-09-01T12:00:00Z",
            "inputs": {"x": 1, "y": 2},
            "outputs": {"result": 3},
            "user_id": "user-1",
        }
    )


def mock_get_function_job_404(job_uid):
    raise OsparcApiException(
        status=404, body=f"404 Not Found: Job UID {job_uid} does not exist"
    )


def mock_get_function_job_422(job_uid):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


## --- Fixtures for patching FunctionJobApi.function_job() ---


@pytest.fixture
def patch_get_function_job_success():
    with (
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
            side_effect=mock_get_function_job_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
            side_effect=mock_get_function_job_status_success,
        ),
        patch(
            "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
            side_effect=mock_function_job_outputs_success,
        ),
    ):
        yield


@pytest.fixture
def patch_get_function_job_404():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
        side_effect=mock_get_function_job_404,
    ):
        yield


@pytest.fixture
def patch_get_function_job_422():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
        side_effect=mock_get_function_job_422,
    ):
        yield


## --- Mocks for FunctionJobApi.function_job_status() ---
def mock_get_function_job_status_success(job_uid):
    return MagicMock(status="SUCCESS")


def mock_get_function_job_status_422(job_uid):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


def mock_get_function_job_status_404(job_uid):
    raise OsparcApiException(
        status=404, body=f"404 Not Found: Job UID {job_uid} does not exist"
    )


## --- Fixtures for patching FunctionJobApi.function_job_status() ---
@pytest.fixture
def patch_get_function_job_status_success():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
        side_effect=mock_get_function_job_status_success,
    ):
        yield


@pytest.fixture
def patch_get_function_job_status_422():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
        side_effect=mock_get_function_job_status_422,
    ):
        yield


@pytest.fixture
def patch_get_function_job_status_404():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
        side_effect=mock_get_function_job_status_404,
    ):
        yield


## --- Mocks for FunctionJobApi.function_job_outputs() ---


def mock_function_job_outputs_success(job_uid):
    return {"result": 3}


def mock_function_job_outputs_422(job_uid):
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Validation Error"
    )


def mock_function_job_outputs_404(job_uid):
    raise OsparcApiException(
        status=404, body=f"404 Not Found: Job UID {job_uid} does not exist"
    )


# --- Fixtures for patching FunctionJobApi.function_job_outputs() ---


@pytest.fixture
def patch_get_function_job_outputs_success():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
        side_effect=mock_function_job_outputs_success,
    ):
        yield


@pytest.fixture
def patch_get_function_job_outputs_422():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
        side_effect=mock_function_job_outputs_422,
    ):
        yield


@pytest.fixture
def patch_get_function_job_outputs_404():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
        side_effect=mock_function_job_outputs_404,
    ):
        yield


#################################################################################
### check that any other error message & code simply gets propagated as is
#################################################################################
def mock_random_error(*args, **kwargs):
    import random

    from osparc_client.exceptions import ApiException

    code = random.choice([418, 429, 431, 499])
    msg = f"Random error {code}: This is a random error message."
    raise ApiException(status=code, body=msg)


@pytest.fixture
def patch_list_functions_random_error():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_functions",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_random_error():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_list_function_job_collections_random_error():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_functionid_random_error():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_list_function_jobs_for_jobcollectionid_random_error():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.get_function_job_collection",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_list_function_job_collections_for_functionid_random_error():
    with patch(
        "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_get_function_job_random_error():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.get_function_job",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_get_function_job_status_random_error():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status",
        side_effect=mock_random_error,
    ):
        yield


@pytest.fixture
def patch_get_function_job_outputs_random_error():
    with patch(
        "osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_outputs",
        side_effect=mock_random_error,
    ):
        yield


#####################################################################################
## Sampling/Mapping Function mocks for FunctionsApi.map_function()
#####################################################################################


def mock_map_function_success(*args, **kwargs):
    """Successful map_function response with job information."""
    function_id = kwargs.get("function_id", "test-function-uid")
    samples = kwargs.get("request_body", [])

    return MagicMock(
        to_dict=lambda: {
            "job_id": f"job-{function_id}-12345",
            "function_id": function_id,
            "status": "submitted",
            "samples_count": len(samples),
            "created_at": "2025-10-20T17:50:00Z",
            "inputs": samples[:3]
            if samples
            else [],  # Include first 3 samples for validation
            "result": {
                "status": "success",
                "message": f"Successfully submitted {len(samples)} samples for processing",
            },
        }
    )


def mock_map_function_invalid_function_id(*args, **kwargs):
    """Map function fails with invalid function ID."""
    raise OsparcApiException(
        status=404, body="404 Not Found: Function with given ID not found"
    )


def mock_map_function_validation_error(*args, **kwargs):
    """Map function fails with validation error for samples."""
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Invalid sample data format"
    )


def mock_map_function_server_error(*args, **kwargs):
    """Map function fails with server error."""
    raise OsparcApiException(
        status=500,
        body="500 Internal Server Error: OSPARC service temporarily unavailable",
    )


def mock_map_function_timeout(*args, **kwargs):
    """Map function fails with timeout."""
    raise OsparcApiException(
        status=408, body="408 Request Timeout: Function mapping request timed out"
    )


# --- Fixtures for patching map_function ---


@pytest.fixture
def patch_map_function_success():
    """Patch map_function to return successful response."""
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.map_function",
        side_effect=mock_map_function_success,
    ):
        yield


@pytest.fixture
def patch_map_function_invalid_function_id():
    """Patch map_function to fail with invalid function ID."""
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.map_function",
        side_effect=mock_map_function_invalid_function_id,
    ):
        yield


@pytest.fixture
def patch_map_function_validation_error():
    """Patch map_function to fail with validation error."""
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.map_function",
        side_effect=mock_map_function_validation_error,
    ):
        yield


@pytest.fixture
def patch_map_function_server_error():
    """Patch map_function to fail with server error."""
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.map_function",
        side_effect=mock_map_function_server_error,
    ):
        yield


@pytest.fixture
def patch_map_function_timeout():
    """Patch map_function to fail with timeout."""
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.map_function",
        side_effect=mock_map_function_timeout,
    ):
        yield


#####################################################################################
## Function registration and schema mocks for CSV upload flow
#####################################################################################


def _function_schema_payload(function_uid: str):
    return {
        "uid": function_uid,
        "function_class": "SOLVER",
        "title": f"Function {function_uid}",
        "description": "Mock function",
        "input_schema": {
            "schema_content": {
                "type": "object",
                "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
            }
        },
        "output_schema": {
            "schema_content": {
                "type": "object",
                "properties": {"result": {"type": "number"}},
            }
        },
        "solver_key": "simcore/services/comp/mock-solver",
        "solver_version": "1.0.0",
    }


def mock_get_function_success(function_uid):
    return MagicMock(to_dict=lambda: _function_schema_payload(function_uid))


def mock_get_function_incompatible_schema(function_uid):
    payload = _function_schema_payload(function_uid)
    payload["input_schema"]["schema_content"]["properties"] = {
        "a": {"type": "number"},
        "b": {"type": "number"},
    }
    return MagicMock(to_dict=lambda: payload)


def mock_register_function_success(function, **kwargs):
    function_dict = function.to_dict() if hasattr(function, "to_dict") else {}
    title = function_dict.get("title", "Uploaded JobCollection Function")
    payload = _function_schema_payload("new-func-1")
    payload["title"] = title
    return MagicMock(to_dict=lambda: payload)


@pytest.fixture
def patch_get_function_success():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.get_function",
        side_effect=mock_get_function_success,
    ):
        yield


@pytest.fixture
def patch_get_function_incompatible_schema():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.get_function",
        side_effect=mock_get_function_incompatible_schema,
    ):
        yield


@pytest.fixture
def patch_register_function_success():
    with patch(
        "osparc_client.api.functions_api.FunctionsApi.register_function",
        side_effect=mock_register_function_success,
    ):
        yield
