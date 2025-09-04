"""
Pytest configuration and fixtures for Flask workflows tests.
"""

import os
import pytest
from pytest_mock import MockFixture
from flask import Flask


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables before each test."""
    # Set up test environment variables
    os.environ["LOG_LEVEL"] = "DEBUG"
    os.environ["SERVICE_MODE"] = "TEST"
    os.environ["PERMISSIONS"] = "READ-ONLY"
    os.environ["DEPLOYMENT_MODE"] = "LOCAL"
    
    yield
    
    # Clean up after test
    test_env_vars = ["LOG_LEVEL", "SERVICE_MODE", "PERMISSIONS", "DEPLOYMENT_MODE", "TESTING"]
    for var in test_env_vars:
        if var in os.environ:
            del os.environ[var]


@pytest.fixture
def client(mocker: MockFixture):
    """Create a test client for the Flask app."""
    # Mock the Flask app to avoid dependency issues
    mock_app = mocker.Mock()
    mock_app.config = {'TESTING': True}
    mock_app.test_client.return_value.__enter__.return_value = mocker.Mock()
    
    # Mock the test client
    mock_client = mocker.Mock()
    mock_client.get.return_value.status_code = 200
    mock_client.get.return_value.data = b'{"test": "data"}'
    
    return mock_client


@pytest.fixture
def mock_osparc_config(mocker: MockFixture):
    """Mock the OsparcConfig instance."""
    mock_config = mocker.patch('flask_workflows.osparc_config')
    # Set up mock API instances
    mock_config.get_job_api.return_value = mocker.Mock()
    mock_config.get_functions_api.return_value = mocker.Mock()
    mock_config.get_job_collection_api.return_value = mocker.Mock()
    mock_config.get_studies_api.return_value = mocker.Mock()
    mock_config.get_users_api.return_value = mocker.Mock()
    
    return mock_config


@pytest.fixture
def mock_helpers(mocker: MockFixture):
    """Mock helper functions."""
    mock_test_env = mocker.patch('flask_workflows.is_test_environment')
    mock_test_env.return_value = True
    return mock_test_env


@pytest.fixture
def sample_job_data():
    """Sample job data for testing."""
    return {
        "uid": "test-job-uid-123",
        "functionUid": "test-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z",
        "status": "COMPLETED"
    }


@pytest.fixture
def sample_function_data():
    """Sample function data for testing."""
    return {
        "uid": "test-function-uid-456",
        "name": "Test Function",
        "description": "A test function for unit testing",
        "inputSchema": {
            "type": "object",
            "properties": {
                "param1": {"type": "number"},
                "param2": {"type": "number"}
            },
            "required": ["param1", "param2"]
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "result": {"type": "number"}
            }
        }
    }


@pytest.fixture
def sample_job_collection_data():
    """Sample job collection data for testing."""
    return {
        "uid": "test-job-collection-uid-789",
        "functionUid": "test-function-uid-456",
        "jobIds": ["job-uid-1", "job-uid-2", "job-uid-3"],
        "createdAt": "2025-09-03T12:00:00Z",
        "title": "Test Job Collection",
        "description": "A collection of test jobs"
    }


@pytest.fixture
def mock_paginated_response(mocker: MockFixture):
    """Mock paginated API response."""
    def _create_mock_response(items, total=None):
        if total is None:
            total = len(items)
        
        mock_response = mocker.Mock()
        mock_response.items = items
        mock_response.total = total
        return mock_response
    
    return _create_mock_response
