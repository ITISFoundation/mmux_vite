"""
Pytest fixtures and mocks for osparc_client.api.functions_api.FunctionsApi.list_functions
Covers: success, empty, and error (422) cases for /osparc/list_functions endpoint.
"""
import pytest
from unittest.mock import patch
from unittest.mock import MagicMock


#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################

# --- Mock FunctionsApi.list_functions() ---

def mock_list_functions_success():
    """Standard successful response with multiple function entries."""
    return MagicMock(
        items=[
            MagicMock(to_dict=lambda: {
                "uid": "func1",
                "name": "Function One",
                "description": "First test function"
            }),
            MagicMock(to_dict=lambda: {
                "uid": "func2",
                "name": "Function Two",
                "description": "Second test function"
            }), 
            MagicMock(to_dict=lambda: {
                "uid": "func-3",
                "name": "Function Three",
                "description": "Third test function"
            })
        ],
        total=3
    )

def mock_list_functions_empty():
    """Empty result set."""
    return MagicMock(items=[], total=0)

def mock_list_functions_422():
    """Simulate a 422 Validation Error from the API client."""
    class ValidationError(Exception):
        pass
    raise ValidationError("422 Unprocessable Entity: Validation Error")

# --- Fixtures for patching ---

@pytest.fixture
def patch_list_functions_success():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_functions", 
               return_value=mock_list_functions_success()):
        yield

@pytest.fixture
def patch_list_functions_empty():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_functions", 
               return_value=mock_list_functions_empty()):
        yield

@pytest.fixture
def patch_list_functions_422():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_functions", side_effect=mock_list_functions_422):
        yield

# ---------------------------------------------------------------


# --- Mock JobsApi.list_function_jobs() ---

def mock_list_function_jobs_success():
    """Standard successful response with multiple job entries."""
    # The API returns a paginated object with 'items' and 'total'.
    return MagicMock(
        items=[
            MagicMock(to_dict=lambda: {
                "uid": "job-1",
                "function_uid": "func1",
                "status": "SUCCESS",
                "created_at": "2025-09-01T12:00:00Z",
                "inputs": {"x": 1, "y": 2},
                "outputs": {"result": 3},
                "user_id": "user-1"
            }),
            MagicMock(to_dict=lambda: {
                "uid": "job-2",
                "function_uid": "func2",
                "status": "PENDING",
                "created_at": "2025-09-02T13:00:00Z",
                "inputs": {"x": 10, "y": 20},
                "outputs": None,
                "user_id": "user-2"
            })
        ],
        total=2
    )

def mock_list_function_jobs_empty():
    """Empty result set."""
    return MagicMock(items=[], total=0)

def mock_list_function_jobs_422():
    """Simulate a 422 Validation Error from the API client."""
    class ValidationError(Exception):
        pass
    raise ValidationError("422 Unprocessable Entity: Validation Error")

# --- Fixtures for patching ---

@pytest.fixture
def patch_list_function_jobs_success():
    """Patch FunctionJobsApi.list_function_jobs to return a successful response."""
    with patch("osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs", 
               return_value=mock_list_function_jobs_success()):
        yield

@pytest.fixture
def patch_list_function_jobs_empty():
    """Patch FunctionJobsApi.list_function_jobs to return an empty response."""
    with patch("osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs", 
               return_value=mock_list_function_jobs_empty()):
        yield

@pytest.fixture
def patch_list_function_jobs_422():
    """Patch FunctionJobsApi.list_function_jobs to raise a 422 error."""
    with patch("osparc_client.api.function_jobs_api.FunctionJobsApi.list_function_jobs", side_effect=mock_list_function_jobs_422):
        yield

# --- Mock FunctionJobCollectionsApi.list_function_job_collections() ---
def mock_list_function_job_collections_success(*args, **kwargs):
    """Return a paginated object with two job collections."""
    collections = [
        MagicMock(to_dict=lambda: {
            "uid": "jc-1",
            "job_ids": ["job-1", "job-2"],
            "name": "Collection One"
        }),
        MagicMock(to_dict=lambda: {
            "uid": "jc-2",
            "job_ids": ["job-3"],
            "name": "Collection Two"
        })
    ]
    return MagicMock(items=collections, total=len(collections))

def mock_list_function_job_collections_empty(*args, **kwargs):
    return MagicMock(items=[], total=0)

def mock_list_function_job_collections_422(*args, **kwargs):
    class ValidationError(Exception):
        pass
    raise ValidationError("422 Unprocessable Entity: Validation Error")

# --- Fixtures for patching FunctionJobCollectionsApi.list_function_job_collections ---
@pytest.fixture
def patch_list_function_job_collections_success():
    with patch("osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections", side_effect=mock_list_function_job_collections_success):
        yield

@pytest.fixture
def patch_list_function_job_collections_empty():
    with patch("osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections", side_effect=mock_list_function_job_collections_empty):
        yield

@pytest.fixture
def patch_list_function_job_collections_422():
    with patch("osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections", side_effect=mock_list_function_job_collections_422):
        yield



# --- Mock FunctionsApi.list_function_jobs_for_functionid() and FunctionJobApi.function_job_status() ---
def mock_list_function_jobs_for_functionid_success(function_uid: str, **kwargs):
    """Standard successful response for jobs for a function UID."""
    # Return jobs only for the given function_uid
    jobs = [
        MagicMock(to_dict=lambda: {
            "uid": "job1",
            "function_uid": function_uid,
            "status": "SUCCESS",
            "created_at": "2025-09-01T12:00:00Z",
            "inputs": {"x": 1, "y": 2},
            "outputs": {"result": 3},
            "user_id": "user1"
        }),
        MagicMock(to_dict=lambda: {
            "uid": "job2",
            "function_uid": function_uid,
            "status": "PENDING",
            "created_at": "2025-09-02T13:00:00Z",
            "inputs": {"x": 10, "y": 20},
            "outputs": None,
            "user_id": "user2"
        })
    ]
    return MagicMock(items=jobs, total=len(jobs))

def mock_list_function_jobs_for_functionid_empty(function_uid: str, **kwargs):
    """Empty result set for jobs for a function UID."""
    return MagicMock(items=[], total=0)

def mock_list_function_jobs_for_functionid_422(function_uid: str, **kwargs):
    class ValidationError(Exception):
        pass
    raise ValidationError("422 Unprocessable Entity: Validation Error")

def mock_list_function_jobs_for_functionid_404(function_uid: str, **kwargs):
    class NotFoundError(Exception):
        pass
    raise NotFoundError(f"404 Not Found: Function UID {function_uid} does not exist")


# --- Fixtures for patching FunctionsApi.list_function_jobs_for_functionid ---

@pytest.fixture
def patch_list_function_jobs_for_functionid_success():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid", side_effect=mock_list_function_jobs_for_functionid_success), \
         patch("osparc_client.api.function_jobs_api.FunctionJobsApi.function_job_status", side_effect=mock_function_job_status_success):
         ## NB list_function_jobs_for_functionid also calls function_job_status for each job
        yield

@pytest.fixture
def patch_list_function_jobs_for_functionid_empty():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid", side_effect=mock_list_function_jobs_for_functionid_empty):
        yield

@pytest.fixture
def patch_list_function_jobs_for_functionid_422():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid", side_effect=mock_list_function_jobs_for_functionid_422):
        yield

@pytest.fixture
def patch_list_function_jobs_for_functionid_404():
    with patch("osparc_client.api.functions_api.FunctionsApi.list_function_jobs_for_functionid", side_effect=mock_list_function_jobs_for_functionid_404):
        yield
