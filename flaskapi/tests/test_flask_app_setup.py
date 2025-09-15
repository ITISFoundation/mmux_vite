import os
from flask import Flask
from mmux_flaskapi.helpers import is_test_environment
from conftest import assert_route_exists

class TestFlaskAppSetup:
    """Test suite for the Flask app setup."""

    def test_flask_app_creation(self, app: Flask):
        """Test that the Flask app is created and configured correctly."""
        assert app is not None, "The Flask app instance should not be None."

    def test_flask_app_fixture(self, app: Flask):
        """Test the Flask app fixture."""
        assert isinstance(app, Flask)
        assert app.name == "MMUX Flask API"

    def test_is_test_environment(self):
        """Test the is_test_environment function."""
        assert is_test_environment() is True
        os.environ["OSPARC_API_BASE_URL"] = "https://production.example.com"
        assert is_test_environment() is False

class TestRouteExistence:
    def test_deployment_routes(self, app):
        """Test that the deployment-related routes exist in the Flask app."""
        assert_route_exists(app, "deployment", "health")
        assert_route_exists(app, "deployment", "service-mode")
        assert_route_exists(app, "deployment", "permissions")
        assert_route_exists(app, "deployment", "mode")

    def test_osparc_routes(self, app):
        """Test that the osparc-related routes exist in the Flask app."""
        assert_route_exists(app, "osparc", "list_functions")
        assert_route_exists(app, "osparc", "list_jobs")
        assert_route_exists(app, "osparc", "list_function_jobs_for_functionid")
        assert_route_exists(app, "osparc", "list_function_jobs_for_jobcollectionid")
        assert_route_exists(app, "osparc", "list_function_job_collections")
        assert_route_exists(app, "osparc", "list_function_job_collections_for_functionid")
        assert_route_exists(app, "osparc", "get_function_job")
        assert_route_exists(app, "osparc", "get_function_job_status")
        assert_route_exists(app, "osparc", "get_function_job_outputs")
