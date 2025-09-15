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
