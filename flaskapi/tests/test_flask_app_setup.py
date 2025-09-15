import os
from flask import Flask
from mmux_flaskapi.helpers import is_test_environment

def test_create_flask_app(app: Flask):
    """Test that the Flask app is created and configured correctly."""
    assert app is not None
    assert app.config["TESTING"] is True
    assert is_test_environment() is True

def test_is_test_environment():
    """Test the is_test_environment function."""
    os.environ["OSPARC_API_BASE_URL"] = "https://test.example.com"
    assert is_test_environment() is True

    os.environ["OSPARC_API_BASE_URL"] = "https://production.example.com"
    assert is_test_environment() is False
