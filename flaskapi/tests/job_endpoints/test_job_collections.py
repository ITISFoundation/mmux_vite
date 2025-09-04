"""
Tests for job collection endpoints.

This module tests job collection-related endpoints and their structure
as expected by frontend components like JobSelector.tsx.
"""

import json
import pytest
from unittest.mock import Mock, patch


def test_get_function_job_collections_with_frontend_structure(client, mock_osparc_config):
    """Test getting job collections with the structure expected by frontend components."""
    function_uid = "frontend-function-uid-456"
    
    # Mock job collection structure as used in JobSelector.tsx
    mock_jc = Mock()
    mock_jc.to_dict.return_value = {
        "uid": "frontend-job-collection-uid-789",
        "functionUid": function_uid,
        "jobIds": ["job-uid-1", "job-uid-2", "job-uid-3"],
        "title": "Frontend Test Job Collection",
        "description": "A job collection for frontend testing",
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    mock_response = Mock()
    mock_response.items = [mock_jc]
    mock_response.total = 1
    
    mock_osparc_config.get_job_collection_api.return_value.list_function_job_collections.return_value = mock_response
    
    response = client.get(f'/flask/list_function_job_collections_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 1
    
    job_collection = data[0]
    assert job_collection["uid"] == "frontend-job-collection-uid-789"
    assert job_collection["title"] == "Frontend Test Job Collection"
    assert len(job_collection["job_ids"]) == 3


def test_job_collection_status_aggregation(client, mock_osparc_config):
    """Test job collection status aggregation as used in JobSelector getJobCollectionStatus."""
    jc_uid = "status-aggregation-job-collection-uid-789"
    
    # Mock job collection with jobs in different statuses
    mock_jc = Mock()
    mock_jc.job_ids = ["job-uid-1", "job-uid-2", "job-uid-3", "job-uid-4"]
    
    # Create jobs with mixed statuses
    job_statuses = ["SUCCESS", "SUCCESS", "STARTED", "FAILED"]
    jobs = []
    
    for i, status in enumerate(job_statuses):
        mock_job = Mock()
        mock_job.to_dict.return_value = {
            "uid": f"job-uid-{i+1}",
            "functionUid": "frontend-function-uid-456",
            "inputs": {"param1": float(i+1)},
            "outputs": {"result": float((i+1) * 2)},
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
        return {"result": float((job_index + 1) * 2)}
    
    mock_osparc_config.get_job_collection_api.return_value.get_function_job_collection.return_value = mock_jc
    mock_osparc_config.get_job_api.return_value.get_function_job.side_effect = mock_get_function_job
    mock_osparc_config.get_job_api.return_value.function_job_status.side_effect = mock_function_job_status
    mock_osparc_config.get_job_api.return_value.function_job_outputs.side_effect = mock_function_job_outputs
    
    response = client.get(f'/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid={jc_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 4
    
    # Verify the status distribution matches frontend expectations
    statuses = [job["status"] for job in data]
    assert "SUCCESS" in statuses
    assert "STARTED" in statuses
    assert "FAILED" in statuses


def test_function_list_job_count_aggregation(client, mock_osparc_config):
    """Test job count aggregation as used in FunctionList.tsx fetchJobJobCollectionCount."""
    function_uid = "job-count-function-uid-456"
    
    # Mock multiple job collections with different job counts
    job_collections = []
    for i in range(3):
        mock_jc = Mock()
        mock_jc.to_dict.return_value = {
            "uid": f"job-collection-uid-{i+1}",
            "functionUid": function_uid,
            "jobIds": [f"job-uid-{j+1}" for j in range((i+1) * 2)],  # 2, 4, 6 jobs
            "title": f"Job Collection {i+1}",
            "description": f"Collection with {(i+1) * 2} jobs",
            "createdAt": "2025-09-03T12:00:00Z"
        }
        job_collections.append(mock_jc)
    
    mock_response = Mock()
    mock_response.items = job_collections
    mock_response.total = len(job_collections)
    
    mock_osparc_config.get_job_collection_api.return_value.list_function_job_collections.return_value = mock_response
    
    response = client.get(f'/flask/list_function_job_collections_for_functionid?functionUid={function_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 3
    
    # Verify job count aggregation matches frontend logic
    total_jobs = sum(len(jc["job_ids"]) for jc in data)
    assert total_jobs == 12  # 2 + 4 + 6
