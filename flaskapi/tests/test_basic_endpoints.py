"""
Tests for basic Flask endpoints (health, service mode, permissions).
"""

import json


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/flask/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
