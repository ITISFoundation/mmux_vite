"""
Tests for job status endpoints and status mapping.

This module tests job status-related endpoints and their mapping to frontend
status classifications used in components like ParallelRunner.tsx.
"""

import json
import pytest
from unittest.mock import Mock, patch


def test_get_function_job_with_frontend_status_mapping(client, mock_osparc_config):
    """Test get_function_job with status values that match frontend expectations."""
    job_uid = "frontend-job-uid-123"
    
    # Mock job with status that frontend expects
    mock_job = Mock()
    mock_job.to_dict.return_value = {
        "uid": job_uid,
        "functionUid": "frontend-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z"
    }
    
    # Frontend expects these status values based on ParallelRunner.tsx
    frontend_statuses = ["SUCCESS", "FAILED", "STARTED", "PENDING", "UNKNOWN", "PUBLISHED", "NOT_STARTED", "WAITING_FOR_RESOURCES", "ABORTED", "WAITING_FOR_CLUSTER"]
    
    for status in frontend_statuses:
        mock_status = Mock()
        mock_status.status = status
        
        mock_osparc_config.get_job_api.return_value.get_function_job.return_value = mock_job
        mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
        mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = {"result": 3.0}
        
        response = client.get(f'/flask/get_function_job?jobUid={job_uid}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["uid"] == job_uid
        assert data["status"] == status


def test_job_status_classification_for_frontend(client, mock_osparc_config):
    """Test job status values that match the classification logic in ParallelRunner.tsx."""
    job_uid = "status-classification-job-uid-123"
    
    # Status mapping from ParallelRunner.tsx classifyJobStatus function
    status_mappings = {
        "UNKNOWN": None,
        "PUBLISHED": "PENDING",
        "NOT_STARTED": "PENDING", 
        "PENDING": "PENDING",
        "WAITING_FOR_RESOURCES": "PENDING",
        "STARTED": "RUNNING",
        "SUCCESS": "COMPLETED",
        "FAILED": "FAILED",
        "ABORTED": "FAILED",
        "WAITING_FOR_CLUSTER": "PENDING"
    }
    
    for raw_status, expected_classification in status_mappings.items():
        if expected_classification is None:
            continue  # Skip UNKNOWN status
            
        mock_status = Mock()
        mock_status.status = raw_status
        
        mock_osparc_config.get_job_api.return_value.function_job_status.return_value = mock_status
        
        response = client.get(f'/flask/get_function_job_status?jobUid={job_uid}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == raw_status  # API returns raw status, frontend classifies it


def test_get_function_job_outputs_with_frontend_display_format(client, mock_osparc_config):
    """Test getting job outputs in the format expected by JobRow component."""
    job_uid = "frontend-output-job-uid-123"
    
    # Mock outputs that match what JobRow.tsx expects to display
    frontend_outputs = {
        "primary_result": 42.5,
        "secondary_result": 1.23e-4,
        "confidence": 0.95,
        "processing_time": 1.23
    }
    
    mock_osparc_config.get_job_api.return_value.function_job_outputs.return_value = frontend_outputs
    
    response = client.get(f'/flask/get_function_job_outputs?jobUid={job_uid}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == frontend_outputs
    
    # Verify the outputs can be displayed as expected in JobRow
    for key, value in data.items():
        if isinstance(value, (int, float)):
            # JobRow uses toExponential(3) for display
            formatted = f"{value:.3e}"
            assert len(formatted) > 0
