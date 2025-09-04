"""
Tests for job listing endpoints.

This module tests job listing endpoints and their structure as expected
by frontend components like JobSelector and ParallelRunner.
"""

import json
from unittest.mock import Mock


def test_list_function_jobs_for_functionid_with_job_collection_structure(client, mock_osparc_config):
    """Test listing jobs for a function with the structure expected by JobSelector component."""
    function_uid = "frontend-function-uid-456"
    
    # Create jobs that match the structure used in JobSelector.tsx
    jobs = []
    for i in range(5):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"job-uid-{i:03d}",
            "functionUid": function_uid,
            "inputs": {"param1": float(i), "param2": float(i * 2)},
            "outputs": {"result": float(i * 3)},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    mock_response = Mock()
    mock_response.items = jobs
    mock_response.total = len(jobs)
    
    # Mock status responses - frontend expects SUCCESS for completed jobs
    def mock_function_job_status(job_uid):
        mock_status = Mock()
        # Frontend logic: only SUCCESS jobs are auto-selected
        mock_status.status = "SUCCESS"
        return mock_status
    
    # Mock the API call to return the response object
    # Mock the API call to return the response object
    mock_api_call = mock_osparc_config.get_functions_api.return_value.list_function_jobs_for_functionid
    mock_api_call.return_value = mock_response
    mock_api_call.__name__ = "list_function_jobs_for_functionid"
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    
    response = client.get(f'/flask/list_function_jobs_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 5
    
    # Verify all jobs have SUCCESS status (as expected by frontend auto-selection)
    for job in data:
        assert job["status"] == "SUCCESS"


def test_get_function_jobs_from_job_collection_with_frontend_usage(client, mock_osparc_config):
    """Test getting jobs from a job collection as used in ParallelRunner and JobSelector."""
    jc_uid = "frontend-job-collection-uid-789"
    
    # Mock job collection with multiple jobs
    mock_jc = Mock()
    mock_jc.job_ids = ["job-uid-1", "job-uid-2", "job-uid-3"]
    
    # Mock individual jobs with different statuses
    job_statuses = ["SUCCESS", "FAILED", "STARTED"]
    jobs = []
    
    for i, status in enumerate(job_statuses):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"job-uid-{i+1}",
            "functionUid": "frontend-function-uid-456",
            "inputs": {"param1": float(i+1), "param2": float((i+1) * 2)},
            "outputs": {"result": float((i+1) * 3)},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    def mock_get_function_job(job_uid):
        job_index = int(job_uid.split("-")[-1]) - 1
        return jobs[job_index]
    
    def mock_function_job_status(job_uid):
        job_index = int(job_uid.split("-")[-1]) - 1
        mock_status = Mock()
        mock_status.status = job_statuses[job_index]
        return mock_status
    
    def mock_function_job_outputs(job_uid):
        job_index = int(job_uid.split("-")[-1]) - 1
        return {"result": float((job_index + 1) * 3)}
    
    mock_osparc_config.get_job_collection_api.return_value.get_function_job_collection.return_value = mock_jc
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = mock_get_function_job
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = mock_function_job_outputs
    
    response = client.get(f'/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid={jc_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 3
    
    # Verify jobs have the expected statuses
    for i, job in enumerate(data):
        assert job["uid"] == f"job-uid-{i+1}"
        assert job["status"] == job_statuses[i]


def test_minimum_job_requirement_for_surrogate_modeling(client, mock_osparc_config):
    """Test that job endpoints handle the minimum 5 jobs requirement for surrogate modeling."""
    function_uid = "surrogate-modeling-function-uid-456"
    
    # Create exactly 5 jobs (minimum required by JobContext filterSelectedJobList)
    jobs = []
    for i in range(5):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"surrogate-job-uid-{i:03d}",
            "functionUid": function_uid,
            "inputs": {"param1": float(i), "param2": float(i * 2)},
            "outputs": {"result": float(i * 3)},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    mock_response = Mock()
    mock_response.items = jobs
    mock_response.total = len(jobs)
    
    def mock_function_job_status(job_uid):
        mock_status = Mock()
        mock_status.status = "SUCCESS"
        return mock_status
    
    # Mock the API call to return the response object
    mock_api_call = mock_osparc_config.get_functions_api.return_value.list_function_jobs_for_functionid
    mock_api_call.return_value = mock_response
    mock_api_call.__name__ = "list_function_jobs_for_functionid"
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    
    response = client.get(f'/flask/list_function_jobs_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 5  # Exactly 5 jobs (minimum for surrogate modeling)
    
    # Verify all jobs have SUCCESS status
    for job in data:
        assert job["status"] == "SUCCESS"
