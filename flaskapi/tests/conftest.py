import pytest
from flask import Flask
from unittest.mock import patch
import logging
#
from osparc_api_mocks import *
from mmux_flaskapi.app import create_flask_app



# Enable logging during testing to a file in tests/logs/ with a timestamped filename
import os
from datetime import datetime

@pytest.fixture(autouse=True, scope="session")
def configure_test_logging():
    """Configure logging to write to a file in tests/logs/ with a unique timestamped filename."""
    logs_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(logs_dir, f"pytest_{timestamp}.log")

    # Remove all handlers associated with the root logger object (if any)
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    log_format = "%(asctime)s %(levelname)s %(name)s %(message)s"
    log_level = logging.DEBUG

    file_handler = logging.FileHandler(log_file, mode="w")
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format))

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(log_level)
    stream_handler.setFormatter(logging.Formatter(log_format))

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(stream_handler)

    # Optionally, reduce verbosity of noisy libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("werkzeug").setLevel(logging.INFO)
    logging.info(f"Test logging initialized. Log file: {log_file}")
    yield


@pytest.fixture
def mock_test_env_vars():
    """Fixture to set environment variables for testing."""
    with patch.dict('os.environ', {
        "OSPARC_API_BASE_URL": "https://test.example.io",
        "OSPARC_API_KEY": "test_key",
        "OSPARC_API_SECRET": "test_secret",
        "LOG_LEVEL": "DEBUG"
    }):
        yield


# @pytest.fixture(scope='module')
@pytest.fixture
def test_app(mock_test_env_vars) -> Flask:
    """Fixture to initialize the Flask app in test mode."""
    app = create_flask_app()
    return app

# @pytest.fixture(scope='module')
@pytest.fixture
def test_client(test_app):
    """Fixture to provide a test client for the Flask app."""
    # Create a test client using the Flask application configured for testing
    with test_app.test_client() as testing_client:
        # Establish an application context
        with test_app.app_context():
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
