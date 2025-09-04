"""
Tests for specialized workflow endpoints.

This module tests job endpoints for specific workflows like LHS sampling
and job context persistence as used in specialized frontend components.
"""

import json
import pytest
from unittest.mock import Mock, patch


def test_lhs_sampling_job_processing(client, mock_osparc_config):
    """Test job processing as used in LHSSampling.tsx for job collection handling."""
    jc_uid = "lhs-sampling-job-collection-uid-789"
    
    # Mock job collection with multiple jobs for LHS sampling
    mock_jc = Mock()
    mock_jc.job_ids = [f"lhs-job-uid-{i:03d}" for i in range(10)]
    
    # Create jobs with SUCCESS status (as expected by LHS sampling)
    jobs = []
    for i in range(10):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"lhs-job-uid-{i:03d}",
            "functionUid": "lhs-function-uid-456",
            "inputs": {"param1": float(i), "param2": float(i * 2)},
            "outputs": {"result": float(i * 3)},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    def mock_get_function_job(job_uid):
        job_index = int(job_uid.split("-")[-1])
        return jobs[job_index]
    
    def mock_function_job_status(job_uid):
        mock_status = Mock()
        mock_status.status = "SUCCESS"  # LHS sampling expects SUCCESS jobs
        return mock_status
    
    def mock_function_job_outputs(job_uid):
        job_index = int(job_uid.split("-")[-1])
        return {"result": float(job_index * 3)}
    
    mock_osparc_config.get_job_collection_api.return_value.get_function_job_collection.return_value = mock_jc
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = mock_get_function_job
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = mock_function_job_outputs
    
    response = client.get(f'/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid={jc_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 10
    
    # Verify all jobs have SUCCESS status (required for LHS sampling)
    for job in data:
        assert job["status"] == "SUCCESS"
        assert "inputs" in job
        assert "outputs" in job


def test_job_context_persistence_structure(client, mock_osparc_config):
    """Test job data structure that matches JobContext persistence requirements."""
    function_uid = "persistence-function-uid-456"
    
    # Mock job collection structure that matches JobContext persistence
    mock_jc = Mock()
    mock_jc.to_dict.return_value = {
        "uid": "persistence-job-collection-uid-789",
        "functionUid": function_uid,
        "jobIds": ["persistence-job-uid-1", "persistence-job-uid-2"],
        "title": "Persistence Test Collection",
        "description": "Collection for testing persistence",
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    # Mock jobs with structure expected by JobContext
    jobs = []
    for i in range(2):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"persistence-job-uid-{i+1}",
            "functionUid": function_uid,
            "inputs": {"param1": float(i+1), "param2": float((i+1) * 2)},
            "outputs": {"result": float((i+1) * 3)},
            "createdAt": "2025-09-03T12:00:00Z"
        }
        jobs.append(mock_job)
    
    mock_response = Mock()
    mock_response.items = [mock_jc]
    mock_response.total = 1
    
    def mock_get_function_job(job_uid):
        job_index = int(job_uid.split("-")[-1]) - 1
        return jobs[job_index]
    
    def mock_function_job_status(job_uid):
        mock_status = Mock()
        mock_status.status = "SUCCESS"
        return mock_status
    
    def mock_function_job_outputs(job_uid):
        job_index = int(job_uid.split("-")[-1]) - 1
        return {"result": float((job_index + 1) * 3)}
    
    mock_osparc_config.get_job_collection_api.return_value.list_function_job_collections.return_value = mock_response
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = mock_get_function_job
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = mock_function_job_outputs
    
    # Test job collection listing
    response = client.get(f'/flask/list_function_job_collections_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1
    
    job_collection = data[0]
    assert job_collection["uid"] == "persistence-job-collection-uid-789"
    assert len(job_collection["job_ids"]) == 2
    
    # Test individual job retrieval
    for job_id in job_collection["job_ids"]:
        job_response = client.get(f'/flask/get_function_job?jobUid={job_id}')
        assert job_response.status_code == 200
        job_data = json.loads(job_response.data)
        assert job_data["uid"] == job_id
        assert job_data["status"] == "SUCCESS"
