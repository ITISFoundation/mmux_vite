"""
Tests for webserver_config.py.

This module tests OSPARC API configuration functionality including:
- Environment variable handling and validation
- API client creation and management
- Connection testing and error handling
- Configuration validation and error scenarios
"""

import os
from unittest.mock import Mock, patch

import pytest
from flask import Flask

from mmux_flaskapi.utils.webserver_config import OsparcApi, OsparcApiException, get_osparc_api


class TestOsparcApiConfiguration:
    """Test OSPARC API configuration and setup."""

    def test_osparc_api_successful_configuration(self):
        """Test successful OSPARC API configuration with valid environment variables."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io/",
            "OSPARC_API_KEY": "test_api_key_12345",
            "OSPARC_API_SECRET": "test_api_secret_67890",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Verify configuration is set up correctly
            assert api._configuration.host == "https://api.osparc.io"  # Should strip trailing slash
            assert api._configuration.username == "test_api_key_12345"
            assert api._configuration.password == "test_api_secret_67890"

    def test_osparc_api_missing_base_url(self):
        """Test OSPARC API configuration fails when OSPARC_API_BASE_URL is missing."""
        test_env = {"OSPARC_API_KEY": "test_api_key", "OSPARC_API_SECRET": "test_api_secret"}

        with patch.dict(os.environ, test_env, clear=True):
            with pytest.raises(KeyError, match="OSPARC_API_BASE_URL"):
                OsparcApi()

    def test_osparc_api_missing_api_key(self):
        """Test OSPARC API configuration fails when OSPARC_API_KEY is missing."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env, clear=True):
            with pytest.raises(KeyError, match="OSPARC_API_KEY"):
                OsparcApi()

    def test_osparc_api_missing_api_secret(self):
        """Test OSPARC API configuration fails when OSPARC_API_SECRET is missing."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
        }

        with patch.dict(os.environ, test_env, clear=True):
            with pytest.raises(KeyError, match="OSPARC_API_SECRET"):
                OsparcApi()

    def test_osparc_api_empty_environment_variables(self):
        """Test OSPARC API configuration with empty environment variables."""
        test_env = {"OSPARC_API_BASE_URL": "", "OSPARC_API_KEY": "", "OSPARC_API_SECRET": ""}

        with patch.dict(os.environ, test_env):
            # Based on the code, empty strings pass the None check but would create empty config
            # This should succeed but create a configuration with empty values
            api = OsparcApi()
            assert api._configuration.host == ""
            assert api._configuration.username == ""
            assert api._configuration.password == ""

    def test_osparc_api_base_url_trailing_slash_removal(self):
        """Test that trailing slashes are properly removed from base URL."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io///",
            "OSPARC_API_KEY": "test_key",
            "OSPARC_API_SECRET": "test_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()
            assert api._configuration.host == "https://api.osparc.io"

    def test_anonymize_function_normal_string(self):
        """Test anonymization function with normal strings."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Test normal anonymization
            result = api._anonymize("sensitive_data_12345", 4, 6)
            assert result == "sens******"

    def test_anonymize_function_empty_string(self):
        """Test anonymization function with empty string."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Test empty string
            result = api._anonymize("", 4, 6)
            assert result == ""

    def test_anonymize_function_auto_length(self):
        """Test anonymization function with automatic length calculation."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Test with m=None (automatic calculation)
            result = api._anonymize("test_string", 4)
            assert result == "test*******"  # 4 chars + 7 stars (11 total - 4 = 7)

    def test_anonymize_function_auto_length_short_string(self):
        """Test anonymization function masks short strings when m is omitted."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            result = api._anonymize("abc", 4)
            assert result == "ab*"

    def test_anonymize_function_short_string(self):
        """Test anonymization function with string shorter than n."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Test with short string
            result = api._anonymize("abc", 4, 6)
            assert result == "abc******"

    def test_anonymize_function_empty_string_edge_case(self):
        """Test anonymization function with empty string returns early."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            api = OsparcApi()

            # Test the early return on empty string
            result = api._anonymize("", 10, 20)
            assert result == ""


class TestOsparcApiClients:
    """Test OSPARC API client creation and management."""

    def setup_method(self):
        """Set up test environment for each test."""
        self.test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

    def test_get_api_client_creation(self):
        """Test API client creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.ApiClient") as mock_client:
                mock_instance = Mock()
                mock_client.return_value = mock_instance

                api = OsparcApi()
                client = api.get_api_client()

                assert client == mock_instance
                mock_client.assert_called_once_with(api._configuration)

                # Test caching - should return same instance
                client2 = api.get_api_client()
                assert client2 == mock_instance
                # Should not call ApiClient constructor again
                assert mock_client.call_count == 1

    def test_get_studies_api_creation(self):
        """Test Studies API creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.StudiesApi") as mock_studies:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_studies_instance = Mock()
                    mock_studies.return_value = mock_studies_instance

                    api = OsparcApi()
                    studies_api = api.get_studies_api()

                    assert studies_api == mock_studies_instance
                    mock_studies.assert_called_once()

                    # Test caching
                    studies_api2 = api.get_studies_api()
                    assert studies_api2 == mock_studies_instance
                    assert mock_studies.call_count == 1

    def test_get_functions_api_creation(self):
        """Test Functions API creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.FunctionsApi") as mock_functions:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_functions_instance = Mock()
                    mock_functions.return_value = mock_functions_instance

                    api = OsparcApi()
                    functions_api = api.get_functions_api()

                    assert functions_api == mock_functions_instance
                    mock_functions.assert_called_once()

    def test_get_job_api_creation(self):
        """Test Function Jobs API creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.FunctionJobsApi") as mock_jobs:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_jobs_instance = Mock()
                    mock_jobs.return_value = mock_jobs_instance

                    api = OsparcApi()
                    jobs_api = api.get_job_api()

                    assert jobs_api == mock_jobs_instance
                    mock_jobs.assert_called_once()

    def test_get_job_collection_api_creation(self):
        """Test Function Job Collections API creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch(
                "mmux_flaskapi.utils.webserver_config.FunctionJobCollectionsApi"
            ) as mock_collections:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_collections_instance = Mock()
                    mock_collections.return_value = mock_collections_instance

                    api = OsparcApi()
                    collections_api = api.get_job_collection_api()

                    assert collections_api == mock_collections_instance
                    mock_collections.assert_called_once()

    def test_get_users_api_creation(self):
        """Test Users API creation and caching."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_users_instance = Mock()
                    mock_users.return_value = mock_users_instance

                    api = OsparcApi()
                    users_api = api.get_users_api()

                    assert users_api == mock_users_instance
                    mock_users.assert_called_once()

    def test_api_clients_caching_behavior(self):
        """Test that all API clients are properly cached."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.ApiClient") as mock_client:
                with patch("mmux_flaskapi.utils.webserver_config.StudiesApi") as _mock_studies:
                    with patch(
                        "mmux_flaskapi.utils.webserver_config.FunctionsApi"
                    ) as _mock_functions:
                        with patch(
                            "mmux_flaskapi.utils.webserver_config.FunctionJobsApi"
                        ) as _mock_jobs:
                            with patch(
                                "mmux_flaskapi.utils.webserver_config.FunctionJobCollectionsApi"
                            ) as _mock_collections:
                                with patch(
                                    "mmux_flaskapi.utils.webserver_config.UsersApi"
                                ) as _mock_users:
                                    # Set up mocks
                                    mock_client_instance = Mock()
                                    mock_client.return_value = mock_client_instance

                                    api = OsparcApi()

                                    # Test that hasattr returns False initially, then True after creation
                                    assert not hasattr(api, "_api_client")
                                    client1 = api.get_api_client()
                                    assert hasattr(api, "_api_client")
                                    client2 = api.get_api_client()
                                    assert client1 == client2  # Should be cached

                                    # Test all other APIs follow the same pattern
                                    assert not hasattr(api, "_studies_api")
                                    studies1 = api.get_studies_api()
                                    assert hasattr(api, "_studies_api")
                                    studies2 = api.get_studies_api()
                                    assert studies1 == studies2

                                    assert not hasattr(api, "_functions_api")
                                    functions1 = api.get_functions_api()
                                    assert hasattr(api, "_functions_api")
                                    functions2 = api.get_functions_api()
                                    assert functions1 == functions2

                                    assert not hasattr(api, "_job_api")
                                    jobs1 = api.get_job_api()
                                    assert hasattr(api, "_job_api")
                                    jobs2 = api.get_job_api()
                                    assert jobs1 == jobs2

                                    assert not hasattr(api, "_job_collection_api")
                                    collections1 = api.get_job_collection_api()
                                    assert hasattr(api, "_job_collection_api")
                                    collections2 = api.get_job_collection_api()
                                    assert collections1 == collections2

                                    assert not hasattr(api, "_users_api")
                                    users1 = api.get_users_api()
                                    assert hasattr(api, "_users_api")
                                    users2 = api.get_users_api()
                                    assert users1 == users2


class TestOsparcApiConnectionTesting:
    """Test OSPARC API connection testing functionality."""

    def setup_method(self):
        """Set up test environment for each test."""
        self.test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

    def test_connection_test_success(self):
        """Test successful connection test."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    # Mock the users API instance and profile
                    mock_users_api = Mock()
                    mock_profile = Mock()
                    mock_profile.model_dump_json.return_value = '{"user": "test"}'
                    mock_users_api.get_my_profile.return_value = mock_profile
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()
                    api._test_connection()

                    assert api._is_connected is True
                    mock_users_api.get_my_profile.assert_called_once()

    def test_connection_test_failure(self):
        """Test connection test failure."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    # Mock the users API to raise an exception
                    mock_users_api = Mock()
                    mock_users_api.get_my_profile.side_effect = OsparcApiException(
                        "Connection failed"
                    )
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()
                    api._test_connection()

                    assert api._is_connected is False

    def test_connection_test_generic_exception(self):
        """Test connection test with generic exception."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    # Mock the users API to raise a generic exception
                    mock_users_api = Mock()
                    mock_users_api.get_my_profile.side_effect = Exception("Network error")
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()
                    api._test_connection()

                    assert api._is_connected is False

    def test_is_connected_property_triggers_test(self):
        """Test that is_connected property triggers connection test when needed."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_users_api = Mock()
                    mock_profile = Mock()
                    mock_profile.model_dump_json.return_value = '{"user": "test"}'
                    mock_users_api.get_my_profile.return_value = mock_profile
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()

                    # First call should trigger connection test
                    result = api.is_connected()
                    assert result is True
                    mock_users_api.get_my_profile.assert_called_once()

                    # Second call should use cached result
                    result2 = api.is_connected()
                    assert result2 is True
                    # Should still be called only once
                    assert mock_users_api.get_my_profile.call_count == 1

    def test_is_connected_property_retests_after_failure(self):
        """Test that is_connected property retests after a failure."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_users_api = Mock()
                    mock_users_api.get_my_profile.side_effect = Exception("Connection failed")
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()

                    # First call should fail
                    result = api.is_connected()
                    assert result is False

                    # Second call should test again (because connection failed)
                    result2 = api.is_connected()
                    assert result2 is False

                    # Should have been called twice
                    assert mock_users_api.get_my_profile.call_count == 2

    def test_is_connected_initial_state(self):
        """Test is_connected behavior when _is_connected attribute doesn't exist initially."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_users_api = Mock()
                    mock_profile = Mock()
                    mock_profile.model_dump_json.return_value = '{"user": "test"}'
                    mock_users_api.get_my_profile.return_value = mock_profile
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()

                    # Ensure _is_connected doesn't exist initially
                    assert not hasattr(api, "_is_connected")

                    # First call should trigger connection test
                    result = api.is_connected()
                    assert result is True
                    assert hasattr(api, "_is_connected")
                    assert api._is_connected is True

    def test_is_connected_existing_true_state(self):
        """Test is_connected when _is_connected already exists and is True."""
        with patch.dict(os.environ, self.test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    mock_users_api = Mock()
                    mock_users_api_class.return_value = mock_users_api

                    api = OsparcApi()

                    # Manually set _is_connected to True
                    api._is_connected = True

                    # Should return True without calling _test_connection
                    result = api.is_connected()
                    assert result is True

                    # Should not have called get_my_profile
                    mock_users_api.get_my_profile.assert_not_called()


class TestGetOsparcApiHelper:
    """Test the get_osparc_api helper function."""

    def test_get_osparc_api_success(self):
        """Test successful retrieval of OSPARC API from Flask app context."""
        from mmux_flaskapi.app import MMUXFlask

        # Create a mock Flask app
        mock_app = Mock(spec=MMUXFlask)
        mock_osparc_api = Mock()
        mock_osparc_api.is_connected = True
        mock_app.osparc_api = mock_osparc_api

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            result = get_osparc_api()
            assert result == mock_osparc_api

    def test_get_osparc_api_wrong_app_type(self):
        """Test get_osparc_api with wrong Flask app type."""
        # Mock a regular Flask app instead of MMUXFlask
        mock_app = Mock(spec=Flask)

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            with pytest.raises(AssertionError, match="current_app is not an instance of MMUXFlask"):
                get_osparc_api()

    def test_get_osparc_api_none_instance(self):
        """Test get_osparc_api when osparc_api is None."""
        from mmux_flaskapi.app import MMUXFlask

        mock_app = Mock(spec=MMUXFlask)
        mock_app.osparc_api = None

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            with pytest.raises(
                ValueError, match="OsparcApi instance is not initialized in the Flask app"
            ):
                get_osparc_api()


class TestGetOsparcApiIfConfiguredHelper:
    """Test the get_osparc_api_if_configured helper function.

    Regression tests for SPEC.md B11/V24: the helper used to call
    get_osparc_api() (which asserts the app is initialized and connected)
    BEFORE checking whether the oSPARC credentials were blank. That order
    risked surfacing get_osparc_api()'s exceptions for the "not configured"
    case instead of honoring the documented "return None" contract.
    """

    def test_returns_none_for_blank_credentials_without_raising(self):
        from mmux_flaskapi.app import MMUXFlask
        from mmux_flaskapi.utils.webserver_config import get_osparc_api_if_configured

        mock_app = Mock(spec=MMUXFlask)
        mock_osparc_api = Mock()
        mock_osparc_api._configuration.host = ""
        mock_osparc_api._configuration.username = ""
        mock_osparc_api._configuration.password = ""
        mock_app.osparc_api = mock_osparc_api

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            # get_osparc_api() would raise if reached before the blank-credential
            # check short-circuits; force that to fail loudly if the ordering
            # regresses.
            with patch(
                "mmux_flaskapi.utils.webserver_config.get_osparc_api",
                side_effect=AssertionError(
                    "get_osparc_api() must not be called before the config check"
                ),
            ):
                assert get_osparc_api_if_configured() is None

    def test_returns_none_when_osparc_api_not_initialized(self):
        from mmux_flaskapi.app import MMUXFlask
        from mmux_flaskapi.utils.webserver_config import get_osparc_api_if_configured

        mock_app = Mock(spec=MMUXFlask)
        mock_app.osparc_api = None

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            assert get_osparc_api_if_configured() is None

    def test_delegates_to_get_osparc_api_when_configured(self):
        from mmux_flaskapi.app import MMUXFlask
        from mmux_flaskapi.utils.webserver_config import get_osparc_api_if_configured

        mock_app = Mock(spec=MMUXFlask)
        mock_osparc_api = Mock()
        mock_osparc_api._configuration.host = "https://api.osparc.io"
        mock_osparc_api._configuration.username = "key"
        mock_osparc_api._configuration.password = "secret"
        mock_osparc_api.is_connected.return_value = True
        mock_app.osparc_api = mock_osparc_api

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            assert get_osparc_api_if_configured() == mock_osparc_api

    def test_delegates_to_get_osparc_api_for_duck_typed_double_without_configuration(self):
        """Regression test for SPEC.md B12/V25.

        The e2e in-backend test-double (tests/e2e/mock_osparc/api.py
        `MockOsparcApi`) duck-types `OsparcApi` without a `_configuration`
        attribute. Unconditionally reading `osparc_api._configuration` raised
        `AttributeError` for every e2e `/flask/osparc/list_functions` call,
        which the blueprint's generic exception handler turned into a 500
        surfaced in the UI as "Error fetching functions from the server" for
        all 3 read-only e2e specs.
        """
        from mmux_flaskapi.app import MMUXFlask
        from mmux_flaskapi.utils.webserver_config import get_osparc_api_if_configured

        class DuckTypedOsparcApiDouble:
            """Mirrors MockOsparcApi's shape: no `_configuration` attribute."""

            def is_connected(self) -> bool:
                return True

        mock_app = Mock(spec=MMUXFlask)
        duck_typed_api = DuckTypedOsparcApiDouble()
        mock_app.osparc_api = duck_typed_api

        with patch("mmux_flaskapi.utils.webserver_config.current_app", mock_app):
            assert get_osparc_api_if_configured() is duck_typed_api


class TestOsparcApiLogging:
    """Test logging functionality in OSPARC API configuration."""

    def test_configuration_logging(self):
        """Test that configuration setup logs appropriately."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key_very_long",
            "OSPARC_API_SECRET": "test_api_secret_very_long",
        }

        with patch.dict(os.environ, test_env):
            with patch("mmux_flaskapi.utils.webserver_config._logger") as mock_logger:
                _api = OsparcApi()

                # Verify that configuration was logged
                mock_logger.info.assert_called()
                call_args = mock_logger.info.call_args[0]

                # Check that the log message contains the expected information
                assert "Detected osparc_client configuration" in call_args[0]
                assert "https://api.osparc.io" in call_args[1]  # host
                assert "test******" in call_args[2]  # anonymized username
                assert "test******" in call_args[3]  # anonymized password

    def test_connection_test_success_logging(self):
        """Test logging during successful connection test."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    with patch("mmux_flaskapi.utils.webserver_config._logger") as mock_logger:
                        mock_users_api = Mock()
                        mock_profile = Mock()
                        mock_profile.model_dump_json.return_value = '{"user": "test_user"}'
                        mock_users_api.get_my_profile.return_value = mock_profile
                        mock_users_api_class.return_value = mock_users_api

                        api = OsparcApi()
                        api._test_connection()

                        # Check that connection test was logged
                        log_calls = [call[0][0] for call in mock_logger.info.call_args_list]
                        assert any("Testing API connection" in call for call in log_calls)
                        assert any("User profile info" in call for call in log_calls)

    def test_connection_test_failure_logging(self):
        """Test logging during failed connection test."""
        test_env = {
            "OSPARC_API_BASE_URL": "https://api.osparc.io",
            "OSPARC_API_KEY": "test_api_key",
            "OSPARC_API_SECRET": "test_api_secret",
        }

        with patch.dict(os.environ, test_env):
            with patch("mmux_flaskapi.utils.webserver_config.UsersApi") as mock_users_api_class:
                with patch("mmux_flaskapi.utils.webserver_config.ApiClient"):
                    with patch("mmux_flaskapi.utils.webserver_config._logger") as mock_logger:
                        mock_users_api = Mock()
                        mock_users_api.get_my_profile.side_effect = Exception("Network timeout")
                        mock_users_api_class.return_value = mock_users_api

                        api = OsparcApi()
                        api._test_connection()

                        # Check that failure was logged
                        mock_logger.warning.assert_called()
                        warning_call = mock_logger.warning.call_args[0][0]
                        assert "API connection test failed" in warning_call
                        assert "Network timeout" in warning_call
