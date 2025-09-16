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

