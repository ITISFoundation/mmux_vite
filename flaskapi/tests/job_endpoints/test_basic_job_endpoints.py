"""
Basic unit tests for job information retrieval endpoints.

This module tests the core functionality of job-related endpoints with
success and error scenarios, parameter validation, and response format validation.
"""

import json
import pytest
from pytest_mock import MockFixture


def test_list_jobs_success(client, mock_osparc_config, mocker: MockFixture):
    """Test successful listing of all jobs."""
    # Mock the job API response
    mock_job = mocker.Mock()
    mock_job.to_dict.return_value = {
        "uid": "test-job-uid-123",
        "functionUid": "test-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    mock_response = mocker.Mock()
    mock_response.items = [mock_job]
    mock_response.total = 1
    
    mock_osparc_config.get_job_api.return_value.list_function_jobs.return_value = mock_response
    
    response = client.get('/flask/list_jobs')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["uid"] == "test-job-uid-123"
    assert data[0]["function_uid"] == "test-function-uid-456"


def test_list_jobs_error(client, mock_osparc_config):
    """Test error handling when listing jobs fails."""
    mock_osparc_config.get_job_api.return_value.list_function_jobs.side_effect = Exception("API Error")
    
    response = client.get('/flask/list_jobs')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "API Error" in data["error"]


def test_get_function_job_success(client, mock_osparc_config, mocker: MockFixture):
    """Test successful retrieval of a specific job."""
    job_uid = "test-job-uid-123"
    
    # Mock job data
    mock_job = mocker.Mock()
    mock_job.to_dict.return_value = {
        "uid": job_uid,
        "functionUid": "test-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    mock_status = mocker.Mock()
    mock_status.status = "COMPLETED"
    
    mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = {"result": 3.0}
    
    response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["uid"] == job_uid
    assert data["status"] == "COMPLETED"
    assert data["outputs"] == {"result": 3.0}


def test_get_function_job_missing_uid(client):
    """Test error when job UID is missing."""
    response = client.get('/flask/get_function_job')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data


def test_get_function_job_invalid_uid(client, mock_osparc_config):
    """Test error when job UID is invalid."""
    job_uid = "invalid-job-uid"
    
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = Exception("Job not found")
    
    response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "Job not found" in data["error"]


def test_get_function_job_status_success(client, mock_osparc_config, mocker: MockFixture):
    """Test successful retrieval of job status."""
    job_uid = "test-job-uid-123"
    
    mock_status = mocker.Mock()
    mock_status.status = "COMPLETED"
    
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    
    response = client.get(f'/flask/get_function_job_status?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == "COMPLETED"


def test_get_function_job_status_missing_uid(client):
    """Test error when job UID is missing."""
    response = client.get('/flask/get_function_job_status')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data


def test_get_function_job_status_invalid_uid(client, mock_osparc_config):
    """Test error when job UID is invalid."""
    job_uid = "invalid-job-uid"
    
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = Exception("Job not found")
    
    response = client.get(f'/flask/get_function_job_status?jobUid={job_uid}')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "Job not found" in data["error"]


def test_get_function_job_outputs_success(client, mock_osparc_config):
    """Test successful retrieval of job outputs."""
    job_uid = "test-job-uid-123"
    expected_outputs = {"result": 3.0, "confidence": 0.95}
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = expected_outputs
    
    response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == expected_outputs


def test_get_function_job_outputs_missing_uid(client):
    """Test error when job UID is missing."""
    response = client.get('/flask/get_function_job_outputs')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data


def test_get_function_job_outputs_invalid_uid(client, mock_osparc_config):
    """Test error when job UID is invalid."""
    job_uid = "invalid-job-uid"
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = Exception("Job not found")
    
    response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "Job not found" in data["error"]


def test_get_function_job_outputs_empty_outputs(client, mock_osparc_config):
    """Test retrieval of job with empty outputs."""
    job_uid = "test-job-uid-123"
    expected_outputs = {}
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = expected_outputs
    
    response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == expected_outputs


@pytest.mark.parametrize("status", ["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "SUCCESS", "STARTED", "UNKNOWN", "PUBLISHED", "NOT_STARTED", "WAITING_FOR_RESOURCES", "ABORTED", "WAITING_FOR_CLUSTER"])
def test_get_function_job_status_various_statuses(client, mock_osparc_config, mocker: MockFixture, status):
    """Test retrieval of job status for various status values including frontend-specific statuses."""
    job_uid = "test-job-uid-123"
    
    mock_status = mocker.Mock()
    mock_status.status = status
    
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    
    response = client.get(f'/flask/get_function_job_status?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == status


def test_job_data_structure_matches_frontend_expectations(client, mock_osparc_config, mocker: MockFixture):
    """Test that job data structure matches what the frontend expects."""
    job_uid = "frontend-structure-job-uid-123"
    
    # Mock job with structure that matches frontend expectations
    mock_job = mocker.Mock()
    mock_job.to_dict.return_value = {
        "uid": job_uid,
        "functionUid": "frontend-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0, "confidence": 0.95},
        "createdAt": "2025-09-03T12:00:00Z",
        "title": "Function job of function frontend-function-uid-456",
        "projectJobId": "project-job-id-789"
    }
    
    mock_status = mocker.Mock()
    mock_status.status = "SUCCESS"
    
    mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = {"result": 3.0, "confidence": 0.95}
    
    response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Verify structure matches frontend expectations
    assert "uid" in data
    assert "function_uid" in data  # camelCase converted to snake_case
    assert "inputs" in data
    assert "outputs" in data
    assert "status" in data
    assert "created_at" in data  # camelCase converted to snake_case
    assert "title" in data
    assert "project_job_id" in data  # camelCase converted to snake_case
    
    # Verify data types match frontend expectations
    assert isinstance(data["inputs"], dict)
    assert isinstance(data["outputs"], dict)
    assert isinstance(data["status"], str)
    assert isinstance(data["uid"], str)
