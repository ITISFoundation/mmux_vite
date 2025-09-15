import os
import pytest
from flask import Flask
from mmux_flaskapi.app import create_flask_app

@pytest.fixture(scope='module')
def test_client():
    """Fixture to provide a test client for the Flask app."""
    os.environ['CONFIG_TYPE'] = 'config.TestingConfig'
    flask_app = create_flask_app()

    # Create a test client using the Flask application configured for testing
    with flask_app.test_client() as testing_client:
        # Establish an application context
        with flask_app.app_context():
            yield testing_client  # this is where the testing happens!

@pytest.fixture
def app() -> Flask:
    """Fixture to initialize the Flask app in test mode."""
    os.environ["LOG_LEVEL"] = "DEBUG"
    os.environ["OSPARC_API_BASE_URL"] = "https://test.example.com"
    app = create_flask_app()
    return app

@pytest.fixture
def mock_osparc_env_vars(monkeypatch):
    """Fixture to mock OSPARC-related environment variables."""
    monkeypatch.setenv("OSPARC_API_BASE_URL", "https://test.osparc.io")
    monkeypatch.setenv("OSPARC_API_KEY", "test_key")
    monkeypatch.setenv("OSPARC_API_SECRET", "test_secret")

def assert_route_exists(app: Flask, prefix: str, route: str):
    """Helper function to assert that a specific route exists in the Flask app."""
    routes = [rule.rule for rule in app.url_map.iter_rules()]
    prefix = f"/{prefix.strip('/')}"
    full_route = f"{prefix}/{route}"
    assert full_route in routes, f"The route '{full_route}' should be registered."