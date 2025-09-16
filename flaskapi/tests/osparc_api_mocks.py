"""
Pytest fixtures and mocks for osparc_client.api.functions_api.FunctionsApi.list_functions
Covers: success, empty, and error (422) cases for /osparc/list_functions endpoint.
"""
import pytest
from unittest.mock import patch
from unittest.mock import MagicMock

# --- Mock FunctionsApi.list_functions() ---

def mock_list_functions_success():
    """Standard successful response with multiple function entries."""
    return MagicMock(
        items=[
            MagicMock(to_dict=lambda: {
                "uid": "func-1",
                "name": "Function One",
                "description": "First test function"
            }),
            MagicMock(to_dict=lambda: {
                "uid": "func-2",
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
                "function_uid": "func-1",
                "status": "SUCCESS",
                "created_at": "2025-09-01T12:00:00Z",
                "inputs": {"x": 1, "y": 2},
                "outputs": {"result": 3},
                "user_id": "user-1"
            }),
            MagicMock(to_dict=lambda: {
                "uid": "job-2",
                "function_uid": "func-2",
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
