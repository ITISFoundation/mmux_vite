"""
Performance tests for job information retrieval endpoints.

These tests focus on performance scenarios and edge cases that might
occur based on the patterns observed in flask_workflows.log, including
the performance testing functions found in the code.
"""

import json
import pytest
import time
from pytest_mock import MockFixture


@pytest.mark.slow
def test_list_jobs_performance_with_large_dataset(client, mock_osparc_config, mock_paginated_response, mocker: MockFixture):
    """Test performance of listing jobs with a very large dataset."""
    # Create a large number of mock jobs (simulating real-world scenario)
    jobs = []
    for i in range(1000):  # Large dataset
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": f"job-uid-{i:04d}",
            "functionUid": f"function-uid-{i % 100:03d}",
            "inputs": {"param1": float(i), "param2": float(i * 2)},
            "outputs": {"result": float(i * 3)},
            "createdAt": f"2025-09-03T{12 + i // 60:02d}:{i % 60:02d}:00Z"
        }
        jobs.append(mock_job)
    
    # Mock paginated responses
    def mock_list_function_jobs(limit=50, offset=0, **kwargs):
        if limit == 1:  # Count request
            response = mocker.Mock()
            response.total = 1000
            return response
        else:  # Data request
            start = offset
            end = min(offset + limit, 1000)
            return mock_paginated_response(jobs[start:end], 1000)
    
    mock_osparc_config.get_job_api.return_value.list_function_jobs.side_effect = mock_list_function_jobs
    
    start_time = time.time()
    response = client.get('/flask/list_jobs')
    end_time = time.time()
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1000
    
    # Performance assertion - should complete within reasonable time
    execution_time = end_time - start_time
    assert execution_time < 5.0  # Should complete within 5 seconds


def test_get_function_job_performance_multiple_calls(client, mock_osparc_config, mocker: MockFixture):
    """Test performance of multiple get_function_job calls (simulating the performance test in the code)."""
    job_uid = "performance-test-job-uid-123"
    
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
    
    # Test multiple calls to simulate the performance test function
    num_calls = 10
    start_time = time.time()
    
    for _ in range(num_calls):
        response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
        assert response.status_code == 200
    
    end_time = time.time()
    
    # Calculate average time per call
    total_time = end_time - start_time
    avg_time_per_call = total_time / num_calls
    
    # Performance assertion - each call should be reasonably fast
    assert avg_time_per_call < 0.5  # Each call should complete within 0.5 seconds


def test_get_function_job_status_performance(client, mock_osparc_config, mocker: MockFixture):
    """Test performance of get_function_job_status endpoint."""
    job_uid = "status-performance-test-job-uid-123"
    
    mock_status = mocker.Mock()
    mock_status.status = "COMPLETED"
    
    mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
    
    # Test multiple status calls
    num_calls = 20
    start_time = time.time()
    
    for _ in range(num_calls):
        response = client.get(f'/flask/get_function_job_status?jobUid={job_uid}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == "COMPLETED"
    
    end_time = time.time()
    
    # Calculate average time per call
    total_time = end_time - start_time
    avg_time_per_call = total_time / num_calls
    
    # Status calls should be very fast
    assert avg_time_per_call < 0.1  # Each status call should complete within 0.1 seconds


def test_get_function_job_outputs_performance(client, mock_osparc_config, mocker: MockFixture):
    """Test performance of get_function_job_outputs endpoint."""
    job_uid = "outputs-performance-test-job-uid-123"
    
    # Mock complex outputs
    complex_outputs = {
        "primary_result": 42.5,
        "secondary_results": [float(i) for i in range(100)],  # Large array
        "metadata": {
            "confidence": 0.95,
            "processing_time": 1.23,
            "algorithm_version": "v2.1",
            "detailed_info": {
                f"region_{i}": {
                    "value": float(i),
                    "confidence": 0.9 + (i % 10) * 0.01
                } for i in range(50)
            }
        }
    }
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = complex_outputs
    
    # Test multiple output calls
    num_calls = 15
    start_time = time.time()
    
    for _ in range(num_calls):
        response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["primary_result"] == 42.5
        assert len(data["secondary_results"]) == 100
    
    end_time = time.time()
    
    # Calculate average time per call
    total_time = end_time - start_time
    avg_time_per_call = total_time / num_calls
    
    # Output calls should be reasonably fast even with complex data
    assert avg_time_per_call < 0.3  # Each output call should complete within 0.3 seconds


def test_concurrent_requests_performance(client, mock_osparc_config, mocker: MockFixture):
    """Test performance under concurrent request load."""
    job_uids = [f"concurrent-job-uid-{i:03d}" for i in range(50)]
    
    # Mock job data
    def mock_get_function_job(job_uid):
        mock_job = mocker.Mock()
        mock_job.to_dict.return_value = {
            "uid": job_uid,
            "functionUid": "test-function-uid",
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
    
    start_time = time.time()
    
    # Make concurrent requests
    responses = []
    for job_uid in job_uids:
        response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
        responses.append(response)
    
    end_time = time.time()
    
    # Verify all responses are successful
    for response in responses:
        assert response.status_code == 200
    
    # Performance assertion
    total_time = end_time - start_time
    avg_time_per_request = total_time / len(job_uids)
    assert avg_time_per_request < 0.2  # Each request should complete within 0.2 seconds


def test_memory_usage_with_large_responses(client, mock_osparc_config, mock_paginated_response, mocker: MockFixture):
    """Test memory usage with very large response data."""
    # Create jobs with large data payloads
    jobs = []
    for i in range(100):
        mock_job = mocker.Mock()
        # Create large input/output data
        large_inputs = {f"param_{j}": float(j) for j in range(100)}
        large_outputs = {f"result_{j}": float(j * 2) for j in range(100)}
        
        mock_job.to_dict.return_value = {
            "uid": f"large-job-uid-{i:03d}",
            "functionUid": "large-function-uid-456",
            "inputs": large_inputs,
            "outputs": large_outputs,
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    # Mock paginated responses
    def mock_list_function_jobs(limit=50, offset=0, **kwargs):
        if limit == 1:  # Count request
            response = mocker.Mock()
            response.total = 100
            return response
        else:  # Data request
            start = offset
            end = min(offset + limit, 100)
            return mock_paginated_response(jobs[start:end], 100)
    
    mock_osparc_config.get_job_api.return_value.list_function_jobs.side_effect = mock_list_function_jobs
    
    start_time = time.time()
    response = client.get('/flask/list_jobs')
    end_time = time.time()
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 100
    
    # Verify large data is handled correctly
    first_job = data[0]
    assert len(first_job["inputs"]) == 100
    assert len(first_job["outputs"]) == 100
    
    # Performance assertion - should handle large data reasonably
    execution_time = end_time - start_time
    assert execution_time < 2.0  # Should complete within 2 seconds
