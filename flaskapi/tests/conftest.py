import logging
import os
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

#
import pytest
from flask import Flask

import mmux_flaskapi.utils.local_job_store as local_job_store
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


@pytest.fixture(autouse=True)
def default_osparc_reachable():
    """Default the oSPARC connectivity probe (`OsparcApi.is_connected()`) to "reachable"
    across the suite, by making the underlying `UsersApi.get_my_profile()` call it makes
    succeed without a real network request.

    Needed because osparc.py's endpoints now check reachability unconditionally (not just
    in DEPLOYMENT_MODE=LOCAL, see flaskapi/SPEC.md V15/V29), so any test relying only on a
    `patch_list_functions_*`-style SDK-call fixture would otherwise also trigger a real
    (failing) network probe. Tests exercising actual unreachability override this within
    their own scope, e.g. by patching `mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected`
    directly.
    """
    with patch(
        "osparc_client.api.users_api.UsersApi.get_my_profile",
        return_value=MagicMock(model_dump_json=lambda **kwargs: "{}"),
    ):
        yield


@pytest.fixture(autouse=True)
def isolate_local_job_store(monkeypatch, tmp_path):
    """Keep endpoint tests independent from repository-local imported CSV artifacts."""
    store_dir = tmp_path / "runs_local"
    monkeypatch.setattr(local_job_store, "LOCAL_STORE_DIR", store_dir)
    monkeypatch.setattr(
        local_job_store, "LOCAL_STORE_FILE", store_dir / "uploaded_job_collections_store.json"
    )


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


from osparc_api_mocks import *  # noqa: E402, F401, F403
