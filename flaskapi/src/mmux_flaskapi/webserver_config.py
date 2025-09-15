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


class OsparcConfig:
    """Configuration class for OSPARC API connections."""
    
    def __init__(self):
        self._configuration: Optional[OsparcConfiguration] = None
        self._api_client: Optional[ApiClient] = None
        self._studies_api: Optional[StudiesApi] = None
        self._functions_api: Optional[FunctionsApi] = None
        self._job_api: Optional[FunctionJobsApi] = None
        self._job_collection_api: Optional[FunctionJobCollectionsApi] = None
        self._users_api: Optional[UsersApi] = None
        self._is_connected: bool = False
        
    def _setup_configuration(self) -> OsparcConfiguration:
        """Set up OSPARC configuration from environment variables."""
        if self._configuration is None:
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
            
        return self._configuration
    
    def _anonymize(self, s: str, n: int = 4, m: Optional[int] = None) -> str:
        """Anonymize sensitive strings for logging."""
        if not s:
            return ""
        if m is None:
            m = len(s) - n
        return s[:n] + "*" * m
    
    def get_api_client(self) -> ApiClient:
        """Get or create API client."""
        if self._api_client is None:
            configuration = self._setup_configuration()
            self._api_client = ApiClient(configuration)
        return self._api_client
    
    def get_studies_api(self) -> StudiesApi:
        """Get or create Studies API instance."""
        if self._studies_api is None:
            self._studies_api = StudiesApi(self.get_api_client())
        return self._studies_api
    
    def get_functions_api(self) -> FunctionsApi:
        """Get or create Functions API instance."""
        if self._functions_api is None:
            self._functions_api = FunctionsApi(self.get_api_client())
        return self._functions_api
    
    def get_job_api(self) -> FunctionJobsApi:
        """Get or create Function Jobs API instance."""
        if self._job_api is None:
            self._job_api = FunctionJobsApi(self.get_api_client())
        return self._job_api
    
    def get_job_collection_api(self) -> FunctionJobCollectionsApi:
        """Get or create Function Job Collections API instance."""
        if self._job_collection_api is None:
            self._job_collection_api = FunctionJobCollectionsApi(self.get_api_client())
        return self._job_collection_api
    
    def get_users_api(self) -> UsersApi:
        """Get or create Users API instance."""
        if self._users_api is None:
            self._users_api = UsersApi(self.get_api_client())
        return self._users_api
    
    def test_connection(self) -> bool:
        """Test the API connection and return True if successful."""
        try:
            if not self._is_connected:
                _logger.info("Testing API connection...")
                users_api = self.get_users_api()
                profile = users_api.get_my_profile()
                _logger.info("User profile info:\n%s", profile.model_dump_json(indent=2))
                self._is_connected = True
            return True
        except Exception as e:
            _logger.warning(f"API connection test failed: {e}")
            return False
    
    def is_connected(self) -> bool:
        """Check if API is connected."""
        return self._is_connected
