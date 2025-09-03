"""
Tests for basic Flask endpoints (health, service mode, permissions).
"""

import json


class TestBasicEndpoints:
    """Test basic Flask endpoints."""

    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get('/flask/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'

    def test_service_mode(self, client):
        """Test the service mode endpoint."""
        response = client.get('/flask/service-mode')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['service_mode'] == 'TEST'

    def test_permissions(self, client):
        """Test the permissions endpoint."""
        response = client.get('/flask/permissions')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['permissions'] == 'READ-ONLY'

    def test_service_mode_missing_env(self, client):
        """Test service mode endpoint when environment variable is missing."""
        import os
        original_value = os.environ.get("SERVICE_MODE")
        if "SERVICE_MODE" in os.environ:
            del os.environ["SERVICE_MODE"]
        
        try:
            response = client.get('/flask/service-mode')
            assert response.status_code == 500
            data = json.loads(response.data)
            assert "error" in data
        finally:
            if original_value:
                os.environ["SERVICE_MODE"] = original_value

    def test_permissions_missing_env(self, client):
        """Test permissions endpoint when environment variable is missing."""
        import os
        original_value = os.environ.get("PERMISSIONS")
        if "PERMISSIONS" in os.environ:
            del os.environ["PERMISSIONS"]
        
        try:
            response = client.get('/flask/permissions')
            assert response.status_code == 500
            data = json.loads(response.data)
            assert "error" in data
        finally:
            if original_value:
                os.environ["PERMISSIONS"] = original_value
