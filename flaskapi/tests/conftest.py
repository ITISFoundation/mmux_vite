import os
from datetime import datetime
import logging
from pathlib import Path

#
import pytest
from unittest.mock import patch
from flask import Flask
from mmux_flaskapi.app import create_flask_app

TEST_RUNS_DIR = Path.cwd() / "runs_test"


@pytest.fixture(autouse=True)
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


@pytest.fixture(autouse=True)
def mock_test_env_vars():
    """Fixture to set environment variables for testing."""
    with patch.dict(
        "os.environ",
        {
            "OSPARC_API_BASE_URL": "https://test.example.io",
            "OSPARC_API_KEY": "test_key",
            "OSPARC_API_SECRET": "test_secret",
        },
    ):
        yield


@pytest.fixture
def test_app() -> Flask:
    """Fixture to initialize the Flask app in test mode."""
    app = create_flask_app()
    return app


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
    prefix = f"/flask/{prefix.strip('/')}"
    full_route = f"{prefix}/{route}"
    assert full_route in routes, f"The route '{full_route}' should be registered."


from osparc_api_mocks import *
