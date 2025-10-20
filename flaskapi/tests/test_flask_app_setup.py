import os
from flask import Flask
from unittest.mock import patch, MagicMock
#
from osparc import Configuration as OsparcConfiguration
from osparc import ApiClient
#
from mmux_flaskapi.app import MMUXFlask
from mmux_flaskapi.utils.helpers import is_test_environment
from mmux_flaskapi.utils.webserver_config import OsparcApi
from conftest import assert_route_exists


class TestFlaskAppSetup:
    """Test suite for the Flask app setup."""

    def test_flask_app_creation(self, test_app: Flask):
        """Test that the Flask app is created and configured correctly."""
        assert test_app is not None, "The Flask app instance should not be None."

    def test_flask_app_fixture(self, test_app: Flask):
        """Test the Flask app fixture."""
        assert isinstance(test_app, Flask)
        assert test_app.name == "MMUX Flask API"

    def test_is_test_environment(self, test_app: Flask):
        """Test the is_test_environment function."""
        assert test_app is not None
        assert is_test_environment() is True
        os.environ["OSPARC_API_BASE_URL"] = "https://production.example.com"
        assert is_test_environment() is False

class TestRouteExistence:
    def test_deployment_routes(self, test_app: Flask):
        """Test that the deployment-related routes exist in the Flask app."""
        assert_route_exists(test_app, "deployment", "health")
        assert_route_exists(test_app, "deployment", "service-mode")
        assert_route_exists(test_app, "deployment", "permissions")
        assert_route_exists(test_app, "deployment", "mode")

    def test_osparc_routes(self, test_app: Flask):
        """Test that the osparc-related routes exist in the Flask app."""
        assert_route_exists(test_app, "osparc", "list_functions")
        assert_route_exists(test_app, "osparc", "list_jobs")
        assert_route_exists(test_app, "osparc", "list_function_jobs_for_functionid")
        assert_route_exists(test_app, "osparc", "list_function_jobs_for_jobcollectionid")
        assert_route_exists(test_app, "osparc", "list_function_job_collections")
        assert_route_exists(test_app, "osparc", "list_function_job_collections_for_functionid")
        assert_route_exists(test_app, "osparc", "get_function_job")
        assert_route_exists(test_app, "osparc", "get_function_job_status")
        assert_route_exists(test_app, "osparc", "get_function_job_outputs")
    
    def test_textfile_routes(self, test_app: Flask):
        """Test that the textfile-related routes exist in the Flask app."""
        assert_route_exists(test_app, "text-file", "")
        assert_route_exists(test_app, "text-file", "<filename>")

    def test_sampling_routes(self, test_app: Flask):
        """Test that the sampling-related routes exist in the Flask app."""
        assert_route_exists(test_app, "sampling", "lhs")
        assert_route_exists(test_app, "sampling", "grid")
        assert_route_exists(test_app, "sampling", "test_job")
        assert_route_exists(test_app, "sampling", "clone_job")

    def test_dakota_routes(self, test_app: Flask):
        """Test that the dakota-related routes exist in the Flask app."""
        assert_route_exists(test_app, "dakota", "sumo_cross_validation")
        assert_route_exists(test_app, "dakota", "sumo_along_axes")
        assert_route_exists(test_app, "dakota", "sumo_grid_evaluation")
        assert_route_exists(test_app, "dakota", "manual_uq_propagation_with_uncertainty")
        assert_route_exists(test_app, "dakota", "get_sumo_cv_accuracy_metrics")
        assert_route_exists(test_app, "dakota", "perform_moga_optimization")


class TestOsparcConfig:
    """Test suite for the OsparcConfig class."""

    def test_setup_configuration(self, test_app: MMUXFlask):
        """Test that the configuration is set up correctly."""
        osparc_config = test_app.osparc_api._configuration
        assert isinstance(osparc_config, OsparcConfiguration)
        assert osparc_config.host == "https://test.example.io"
        assert osparc_config.username == "test_key"
        assert osparc_config.password == "test_secret"

    def test_anonymize(self):
        """Test the anonymization of sensitive strings."""
        config = OsparcApi()
        anonymized = config._anonymize("sensitive_data", 4)
        assert anonymized == "sens**********"

    def test_get_api_client(self):
        """Test that the API client is created correctly."""
        config = OsparcApi()
        api_client = config.get_api_client()
        assert api_client is not None
        assert isinstance(config._api_client, ApiClient)

    @patch("mmux_flaskapi.utils.webserver_config.UsersApi")
    def test_test_connection_success(self, mock_users_api):
        """Test a successful API connection."""
        mock_users_api.return_value.get_my_profile.return_value = MagicMock()
        config = OsparcApi()
        assert config.is_connected() is True

    @patch("mmux_flaskapi.utils.webserver_config.UsersApi")
    def test_test_connection_failure(self, mock_users_api):
        """Test a failed API connection."""
        mock_users_api.return_value.get_my_profile.side_effect = Exception("Connection failed")
        config = OsparcApi()
        assert config.is_connected() is False
