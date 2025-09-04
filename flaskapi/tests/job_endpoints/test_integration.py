"""
Integration tests for job information retrieval endpoints.

These tests focus on more complex scenarios and edge cases that might
occur in real-world usage based on the patterns observed in flask_workflows.log.
"""

import json
import pytest
from pytest_mock import MockFixture


def test_list_jobs_with_large_dataset(client, mock_osparc_config, mock_paginated_response, mocker: MockFixture):
    """Test listing jobs with a large dataset that requires pagination."""
    # Create a large number of mock jobs
    jobs = []
    for i in range(150):  # More than the 50-item limit
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": f"job-uid-{i:03d}",
            "functionUid": f"function-uid-{i % 10:03d}",
            "inputs": {"param1": float(i), "param2": float(i * 2)},
            "outputs": {"result": float(i * 3)},
            "createdAt": f"2025-09-03T{12 + i // 60:02d}:{i % 60:02d}:00Z"
        }
        jobs.append(mock_job)
    
    # Mock paginated responses
    def mock_list_function_jobs(limit=50, offset=0, **kwargs):
        if limit == 1:  # Count request
            response = mocker.Mock()
            response.total = 150
            return response
        else:  # Data request
            start = offset
            end = min(offset + limit, 150)
            return mock_paginated_response(jobs[start:end], 150)
    
    mock_osparc_config.get_job_api.return_value.list_function_jobs.side_effect = mock_list_function_jobs
    
    response = client.get('/flask/list_jobs')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 150
    # Verify jobs are in reverse order (last created first)
    assert data[0]["uid"] == "job-uid-149"
    assert data[-1]["uid"] == "job-uid-000"


def test_get_function_job_with_complex_outputs(client, mock_osparc_config, mocker: MockFixture):
    """Test getting a job with complex nested output structure."""
    job_uid = "complex-job-uid-123"
    
    # Mock job with complex outputs
    mock_job = mocker.Mock()
    mock_job.to_dict.return_value = {
        "uid": job_uid,
        "functionUid": "complex-function-uid-456",
        "inputs": {
            "input_array": [1.0, 2.0, 3.0],
            "input_object": {"nested": {"value": 42.0}},
            "input_string": "test_string"
        },
        "outputs": {
            "primary_result": 42.5,
            "secondary_results": [1.1, 2.2, 3.3],
            "metadata": {
                "confidence": 0.95,
                "processing_time": 1.23,
                "algorithm_version": "v2.1",
                "warnings": ["Low confidence in region 3"],
                "nested_data": {
                    "level1": {
                        "level2": {
                            "final_value": 999.99
                        }
                    }
                }
            }
        },
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    mock_status = mocker.Mock()
    mock_status.status = "COMPLETED"
    
    complex_outputs = {
        "primary_result": 42.5,
        "secondary_results": [1.1, 2.2, 3.3],
        "metadata": {
            "confidence": 0.95,
            "processing_time": 1.23,
            "algorithm_version": "v2.1",
            "warnings": ["Low confidence in region 3"],
            "nested_data": {
                "level1": {
                    "level2": {
                        "final_value": 999.99
                    }
                }
            }
        }
    }
    
    mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = complex_outputs
    
    response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["uid"] == job_uid
    assert data["status"] == "COMPLETED"
    assert data["outputs"]["primary_result"] == 42.5
    assert len(data["outputs"]["secondary_results"]) == 3
    assert data["outputs"]["metadata"]["nested_data"]["level1"]["level2"]["final_value"] == 999.99


def test_list_function_jobs_for_functionid_with_mixed_statuses(client, mock_osparc_config, mocker: MockFixture):
    """Test listing jobs for a function with jobs in various statuses."""
    function_uid = "mixed-status-function-uid-456"
    
    # Create jobs with different statuses
    job_data = [
        ("job-completed-123", "COMPLETED"),
        ("job-running-456", "RUNNING"),
        ("job-failed-789", "FAILED"),
        ("job-pending-012", "PENDING"),
        ("job-cancelled-345", "CANCELLED")
    ]
    
    jobs = []
    for job_uid, status in job_data:
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": job_uid,
            "functionUid": function_uid,
            "inputs": {"param1": 1.0, "param2": 2.0},
            "outputs": {"result": 3.0},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    mock_response = mocker.Mock()
    mock_response.items = jobs
    mock_response.total = len(jobs)
    
    # Mock status responses
    def mock_function_job_status(job_uid):
        status_map = dict(job_data)
        mock_status = mocker.Mock()
        mock_status.status = status_map[job_uid]
        return mock_status
    
    mock_osparc_config.get_functions_api.return_value.list_function_jobs_for_functionid.return_value = mock_response
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    
    response = client.get(f'/flask/list_function_jobs_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 5
    
    # Verify all statuses are present
    statuses = [job["status"] for job in data]
    assert "COMPLETED" in statuses
    assert "RUNNING" in statuses
    assert "FAILED" in statuses
    assert "PENDING" in statuses
    assert "CANCELLED" in statuses


def test_list_function_jobs_for_jobcollectionid_with_empty_collection(client, mock_osparc_config, mocker: MockFixture):
    """Test listing jobs for an empty job collection."""
    jc_uid = "empty-job-collection-uid-789"
    
    # Mock empty job collection
    mock_jc = mocker.Mock()
    mock_jc.job_ids = []
    
    mock_osparc_config.get_job_collection_api.return_value.get_function_job_collection.return_value = mock_jc
    
    response = client.get(f'/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid={jc_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_function_job_outputs_with_none_values(client, mock_osparc_config, mocker: MockFixture):
    """Test getting job outputs that contain None values."""
    job_uid = "none-outputs-job-uid-123"
    
    outputs_with_none = {
        "result": 42.5,
        "confidence": None,
        "metadata": {
            "processing_time": 1.23,
            "error_message": None,
            "warnings": None
        },
        "optional_field": None
    }
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = outputs_with_none
    
    response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["result"] == 42.5
    assert data["confidence"] is None
    assert data["metadata"]["processing_time"] == 1.23
    assert data["metadata"]["error_message"] is None
    assert data["optional_field"] is None


def test_concurrent_job_requests(client, mock_osparc_config, mocker: MockFixture):
    """Test handling multiple concurrent job requests."""
    job_uids = ["job-uid-1", "job-uid-2", "job-uid-3"]
    
    # Mock different job data for each UID
    def mock_get_function_job(job_uid):
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": job_uid,
            "functionUid": f"function-{job_uid}",
            "inputs": {"param": 1.0},
            "outputs": {"result": 2.0},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        return mock_job
    
    def mock_function_job_status(job_uid):
        mock_status = mocker.Mock()
        mock_status.status = "COMPLETED"
        return mock_status
    
    def mock_function_job_outputs(job_uid):
        return {"result": 2.0}
    
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = mock_get_function_job
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = mock_function_job_outputs
    
    # Make concurrent requests
    responses = []
    for job_uid in job_uids:
        response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
        responses.append(response)
    
    # Verify all responses are successful
    for i, response in enumerate(responses):
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["uid"] == job_uids[i]
        assert data["status"] == "COMPLETED"


def test_job_endpoints_with_special_characters_in_uids(client, mock_osparc_config, mocker: MockFixture):
    """Test job endpoints with UIDs containing special characters."""
    # UIDs with special characters that might appear in real systems
    special_uids = [
        "job-uid-with-dashes-123",
        "job_uid_with_underscores_456",
        "job.uid.with.dots.789",
        "job-uid-with-mixed_chars.012"
    ]
    
    for uid in special_uids:
        # Test get_function_job
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": uid,
            "functionUid": "test-function-uid",
            "inputs": {"param": 1.0},
            "outputs": {"result": 2.0},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        
        mock_status = mocker.Mock()
        mock_status.status = "COMPLETED"
        
        mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
        mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
        mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = {"result": 2.0}
        
        response = client.get(f'/flask/get_function_job?jobUid={uid}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["uid"] == uid


def test_error_handling_with_malformed_responses(client, mock_osparc_config, mocker: MockFixture):
    """Test error handling when API returns malformed responses."""
    job_uid = "malformed-response-job-uid-123"
    
    # Mock a job that returns malformed data
    mock_job = mocker.Mock()
    mock_job.to_dict.side_effect = Exception("Serialization error")
    
    mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
    
    response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "error" in data
    assert "Serialization error" in data["error"]
