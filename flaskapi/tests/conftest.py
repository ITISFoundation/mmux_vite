import os
import pytest
from unittest.mock import patch
from flask import Flask
from mmux_flaskapi.app import create_flask_app

@pytest.fixture
def mock_osparc_env_vars(monkeypatch):
    """Fixture to mock OSPARC-related environment variables."""
    monkeypatch.setenv("OSPARC_API_BASE_URL", "https://test.example.io")
    monkeypatch.setenv("OSPARC_API_KEY", "test_key")
    monkeypatch.setenv("OSPARC_API_SECRET", "test_secret")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")

@pytest.fixture
def test_app(mock_osparc_env_vars) -> Flask:
    """Fixture to initialize the Flask app in test mode."""
    app = create_flask_app()
    return app

@pytest.fixture(scope='module')
def test_client():
    """Fixture to provide a test client for the Flask app."""
    os.environ['CONFIG_TYPE'] = 'config.TestingConfig'
    flask_app = test_app()

    # Create a test client using the Flask application configured for testing
    with flask_app.test_client() as testing_client:
        # Establish an application context
        with flask_app.app_context():
            yield testing_client  # this is where the testing happens!


def assert_route_exists(app: Flask, prefix: str, route: str):
    """Helper function to assert that a specific route exists in the Flask app."""
    routes = [rule.rule for rule in app.url_map.iter_rules()]
    prefix = f"/{prefix.strip('/')}"
    full_route = f"{prefix}/{route}"
    assert full_route in routes, f"The route '{full_route}' should be registered."

@pytest.fixture
def mock_list_functions():
    """Fixture to mock osparc.functions_api.list_functions."""
    mock_functions = [
        {
        "uid": "test-function-uid-456",
        "name": "Test Function",
        "description": "A test function for unit testing",
        "inputSchema": {
            "type": "object",
            "properties": {
                "param1": {"type": "number"},
                "param2": {"type": "number"}
            },
            "required": ["param1", "param2"]
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "result": {"type": "number"}
            }
        }
    }
    ] * 3  # Return a list with 3 identical functions for testing

    with patch('osparc_client.api.functions_api.FunctionsApi.list_functions') as mock_get_functions_api:
        response = ... # TODO check api_call(offset = retrieved, *args, **kwargs) response -- prob inc error code, etc
        mock_get_functions_api.return_value = mock_functions
        yield mock_get_functions_api
        ### TODO can I ask the IA to study the osparc-client pkg & properly mock the relevant functions??

def sample_job():
    """Sample job data for testing."""
    return {
        "uid": "test-job-uid-123",
        "functionUid": "test-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z",
        "status": "COMPLETED"
    }


def sample_job_collection():
    """Sample job collection data for testing."""
    return {
        "uid": "test-job-collection-uid-789",
        "functionUid": "test-function-uid-456",
        "jobIds": ["job-uid-1", "job-uid-2", "job-uid-3"],
        "createdAt": "2025-09-03T12:00:00Z",
        "title": "Test Job Collection",
        "description": "A collection of test jobs"
    }
