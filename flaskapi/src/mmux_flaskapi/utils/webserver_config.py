"""
Configuration module for Flask workflows.
Handles different environments and API connection setup.
"""

import logging
import os

from flask import current_app
from osparc import ApiClient, StudiesApi, UsersApi
from osparc import Configuration as OsparcConfiguration
from osparc_client.api.function_job_collections_api import FunctionJobCollectionsApi
from osparc_client.api.function_jobs_api import FunctionJobsApi
from osparc_client.api.functions_api import FunctionsApi
from osparc_client.exceptions import (
    ApiException as OsparcApiException,
)  # to be exposed downstream

_logger = logging.getLogger(__name__)


class OsparcApi:
    """Configuration class for OSPARC API connections."""

    def __init__(self):
        self._logged_unreachable_warning: bool = False
        self._setup_configuration()

    @property
    def logged_unreachable_warning(self) -> bool:
        """Whether the unreachable-backend WARNING (SPEC.md V28) was already logged
        for the current unreachability episode; reset once the backend recovers."""
        return self._logged_unreachable_warning

    @logged_unreachable_warning.setter
    def logged_unreachable_warning(self, value: bool) -> None:
        self._logged_unreachable_warning = value

    def _setup_configuration(self):
        """Set up OSPARC configuration from environment variables."""
        self._configuration = OsparcConfiguration(
            host=os.environ["OSPARC_API_BASE_URL"].rstrip("/"),
            username=os.environ["OSPARC_API_KEY"],
            password=os.environ["OSPARC_API_SECRET"],
        )

        # Validate configuration
        assert self._configuration.host is not None, "OSPARC_API_BASE_URL is not set"
        assert self._configuration.username is not None, "OSPARC_API_KEY is not set"
        assert self._configuration.password is not None, "OSPARC_API_SECRET is not set"

        _logger.info(
            "Detected osparc_client configuration: host=%s, username=%s, password=%s",
            self._configuration.host,
            self._anonymize(self._configuration.username, 4, 6),
            self._anonymize(self._configuration.password, 4, 6),
        )

    def _anonymize(self, s: str, n: int = 4, m: int | None = None) -> str:
        """Anonymize sensitive strings for logging."""
        if not s:
            return ""
        if m is None:
            if len(s) <= 1:
                return "*" * len(s)
            prefix_len = min(n, len(s) - 1)
            return s[:prefix_len] + "*" * (len(s) - prefix_len)
        return s[:n] + "*" * m

    def get_api_client(self) -> ApiClient:
        """Get or create API client."""
        if not hasattr(self, "_api_client"):
            self._api_client = ApiClient(self._configuration)

        return self._api_client

    def get_studies_api(self) -> StudiesApi:
        """Get or create Studies API instance."""
        if not hasattr(self, "_studies_api"):
            self._studies_api = StudiesApi(self.get_api_client())

        return self._studies_api

    def get_functions_api(self) -> FunctionsApi:
        """Get or create Functions API instance."""
        if not hasattr(self, "_functions_api"):
            self._functions_api = FunctionsApi(self.get_api_client())

        return self._functions_api

    def get_job_api(self) -> FunctionJobsApi:
        """Get or create Function Jobs API instance."""
        if not hasattr(self, "_job_api"):
            self._job_api = FunctionJobsApi(self.get_api_client())

        return self._job_api

    def get_job_collection_api(self) -> FunctionJobCollectionsApi:
        """Get or create Function Job Collections API instance."""
        if not hasattr(self, "_job_collection_api"):
            self._job_collection_api = FunctionJobCollectionsApi(self.get_api_client())

        return self._job_collection_api

    def get_users_api(self) -> UsersApi:
        """Get or create Users API instance."""
        if not hasattr(self, "_users_api"):
            self._users_api = UsersApi(self.get_api_client())

        return self._users_api

    def _test_connection(self):
        """Test the API connection and return True if successful."""
        try:
            _logger.info("Testing API connection...")
            users_api = self.get_users_api()
            profile = users_api.get_my_profile()
            _logger.info("User profile info:\n%s", profile.model_dump_json(indent=2))
            ## if no error found, connection is successful
            self._is_connected = True
        except Exception as e:
            ## else, flag the connection as failed
            _logger.warning(f"API connection test failed: {e}")
            self._is_connected = False

    def is_connected(self, force_recheck: bool = False) -> bool:
        """Check if API is connected.

        The result of the first probe (success or failure) is cached and
        reused on subsequent calls, so a persistently unreachable backend
        does not incur a new network round-trip on every call (e.g. once per
        incoming request in the LOCAL-mode graceful-degradation path). Pass
        `force_recheck=True` to explicitly re-run the probe, e.g. to detect a
        backend that has since come back online.
        """
        if force_recheck or not hasattr(self, "_is_connected"):
            self._test_connection()

        return self._is_connected


def get_osparc_api() -> OsparcApi:
    """Helper to get the OsparcApi instance from the current Flask app context."""
    from mmux_flaskapi.app import MMUXFlask

    assert isinstance(current_app, MMUXFlask), "current_app is not an instance of MMUXFlask"
    osparc_api = current_app.osparc_api
    if osparc_api is None:
        raise ValueError("OsparcApi instance is not initialized in the Flask app")

    return osparc_api


def get_osparc_api_if_configured() -> OsparcApi | None:
    """Return the OsparcApi instance only when local credentials are nonblank.

    Checks the configured host/username/password directly on the app's OsparcApi
    instance before delegating to `get_osparc_api()`, so a blank/missing
    credential set is treated as "not configured" (returns None) rather than
    risking whatever exception `get_osparc_api()` raises for an uninitialized or
    disconnected client.

    `app.osparc_api` may instead be a duck-typed test double (e.g. the e2e
    in-backend `MockOsparcApi`, see tests/e2e/mock_osparc/api.py) that never
    implements `_configuration` at all. Such a double is always "configured"
    by construction, so a missing `_configuration` attribute is treated as
    configured rather than raising `AttributeError` (SPEC.md B12/V25).
    """
    from mmux_flaskapi.app import MMUXFlask

    assert isinstance(current_app, MMUXFlask), "current_app is not an instance of MMUXFlask"
    osparc_api = current_app.osparc_api
    if osparc_api is None:
        return None
    configuration = getattr(osparc_api, "_configuration", None)
    if configuration is not None and (
        not configuration.host or not configuration.username or not configuration.password
    ):
        return None
    return get_osparc_api()


def get_osparc_api_if_connected() -> OsparcApi | None:
    """Return the OsparcApi instance only when the backend is reachable.

    When unreachable, this is called on every incoming request in the
    LOCAL-mode graceful-degradation path (SPEC.md V15), so a persistently-down
    backend must not spam the log once per request. The WARNING is therefore
    logged only once per unreachability episode; it fires again if the
    backend later recovers and then drops a second time.
    """
    from mmux_flaskapi.app import MMUXFlask

    assert isinstance(current_app, MMUXFlask), "current_app is not an instance of MMUXFlask"
    osparc_api = current_app.osparc_api
    if osparc_api is None:
        return None
    if not osparc_api.is_connected():
        if not osparc_api.logged_unreachable_warning:
            _logger.warning("oSPARC is configured but not reachable - degrading gracefully")
            osparc_api.logged_unreachable_warning = True
        return None
    else:
        osparc_api.logged_unreachable_warning = False
        return osparc_api


__all__ = [
    "OsparcApi",
    "get_osparc_api",
    "get_osparc_api_if_configured",
    "get_osparc_api_if_connected",
    "OsparcApiException",
]
