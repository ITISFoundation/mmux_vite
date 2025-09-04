"""
Pytest configuration and fixtures for Flask workflows tests.
"""

from pytest_mock import MockFixture


def sample_job():
    """Sample job data for testing."""
    return {
        "uid": "test-job-uid-123",
        "functionUid": "test-function-uid-456",
        "inputs": {"param1": 1.0, "param2": 2.0},
        "outputs": {"result": 3.0},
        "createdAt": "2025-09-03T12:00:00Z",
        "status": "COMPLETED"
    }


def sample_function():
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


def sample_job_collection():
    """Sample job collection data for testing."""
    return {
        "uid": "test-job-collection-uid-789",
        "functionUid": "test-function-uid-456",
        "jobIds": ["job-uid-1", "job-uid-2", "job-uid-3"],
        "createdAt": "2025-09-03T12:00:00Z",
        "title": "Test Job Collection",
        "description": "A collection of test jobs"
    }


def mock_paginated_response(mocker: MockFixture):
    """Helper to fabricate a Paginated-like response with items/total."""
    def _factory(items, total=None):
        if total is None:
            total = len(items)
        resp = mocker.Mock()
        resp.items = items
        resp.total = total
        return resp
    return _factory

def 