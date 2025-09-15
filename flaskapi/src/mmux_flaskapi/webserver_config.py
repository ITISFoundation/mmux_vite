"""
Configuration module for Flask workflows.
Handles different environments and API connection setup.
"""
import os
import logging
from typing import Optional
from osparc import Configuration as OsparcConfiguration
from osparc import ApiClient, UsersApi, StudiesApi
from osparc_client.api.functions_api import FunctionsApi
from osparc_client.api.function_jobs_api import FunctionJobsApi
from osparc_client.api.function_job_collections_api import FunctionJobCollectionsApi

_logger = logging.getLogger(__name__)


class OsparcApi:
    """Configuration class for OSPARC API connections."""
    
    def __init__(self):
        self._setup_configuration()
        self._test_connection()
        
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
            self._anonymize(self._configuration.password, 4, 6)
        )
    
    def _anonymize(self, s: str, n: int = 4, m: Optional[int] = None) -> str:
        """Anonymize sensitive strings for logging."""
        if not s:
            return ""
        if m is None:
            m = len(s) - n
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
    
    def is_connected(self) -> bool:
        """Check if API is connected."""
        if not hasattr(self, "_is_connected") or not self._is_connected:
            self._test_connection()
        
        return self._is_connected
