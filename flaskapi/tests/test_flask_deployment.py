"""
Comprehensive tests for deployment endpoints.

This module tests all deployment-related functionality including:
- Health check endpoint
- Service mode configuration
- Permissions configuration  
- Deployment mode configuration
- Environment variable handling
- Error conditions
"""

import os
import pytest
from unittest.mock import patch
from flask import Flask


class TestDeploymentEndpoints:
    """Test class for deployment configuration endpoints."""

    def test_health_check_success(self, test_client):
        """Test successful health check endpoint."""
        response = test_client.get("/flask/deployment/health")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_health_check_method_not_allowed(self, test_client):
        """Test that POST method is not allowed on health endpoint."""
        response = test_client.post("/flask/deployment/health")
        assert response.status_code == 405  # Method Not Allowed

    @patch.dict(os.environ, {"SERVICE_MODE": "development"})
    def test_service_mode_development(self, test_client):
        """Test service mode retrieval for development environment."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "service_mode" in data
        assert data["service_mode"] == "development"

    @patch.dict(os.environ, {"SERVICE_MODE": "testing"})
    def test_service_mode_testing(self, test_client):
        """Test service mode retrieval for testing environment."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "service_mode" in data
        assert data["service_mode"] == "testing"

    @patch.dict(os.environ, {}, clear=True)
    def test_service_mode_missing_env_var(self, test_client):
        """Test service mode endpoint when SERVICE_MODE environment variable is missing."""
        # Clear any existing SERVICE_MODE
        if "SERVICE_MODE" in os.environ:
            del os.environ["SERVICE_MODE"]
            
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 500
        
        data = response.get_json()
        assert "error" in data
        assert data["error"] == "SERVICE_MODE not set"

    def test_service_mode_method_not_allowed(self, test_client):
        """Test that POST method is not allowed on service-mode endpoint."""
        response = test_client.post("/flask/deployment/service-mode")
        assert response.status_code == 405  # Method Not Allowed

    @patch.dict(os.environ, {"PERMISSIONS": "read-write"})
    def test_permissions_success(self, test_client):
        """Test successful permissions retrieval."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "read-write"

    @patch.dict(os.environ, {"PERMISSIONS": "read-only"})
    def test_permissions_read_only(self, test_client):
        """Test permissions retrieval for read-only configuration."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "read-only"

    @patch.dict(os.environ, {"PERMISSIONS": "admin"})
    def test_permissions_admin(self, test_client):
        """Test permissions retrieval for admin configuration."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "admin"

    @patch.dict(os.environ, {}, clear=True)
    def test_permissions_missing_env_var(self, test_client):
        """Test permissions endpoint when PERMISSIONS environment variable is missing."""
        # Clear any existing PERMISSIONS
        if "PERMISSIONS" in os.environ:
            del os.environ["PERMISSIONS"]
            
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 500
        
        data = response.get_json()
        assert "error" in data
        assert data["error"] == "PERMISSIONS not set"

    def test_permissions_method_not_allowed(self, test_client):
        """Test that POST method is not allowed on permissions endpoint."""
        response = test_client.post("/flask/deployment/permissions")
        assert response.status_code == 405  # Method Not Allowed

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "LOCAL"})
    def test_deployment_mode_local(self, test_client):
        """Test deployment mode retrieval for local environment."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_mode" in data
        assert data["deployment_mode"] == "LOCAL"

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "OSPARC"})
    def test_deployment_mode_osparc(self, test_client):
        """Test deployment mode retrieval for OSPARC environment."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_mode" in data
        assert data["deployment_mode"] == "OSPARC"

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "DOCKER"})
    def test_deployment_mode_docker(self, test_client):
        """Test deployment mode retrieval for Docker environment."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_mode" in data
        assert data["deployment_mode"] == "DOCKER"

    @patch.dict(os.environ, {}, clear=True)
    def test_deployment_mode_missing_env_var(self, test_client):
        """Test deployment mode endpoint when DEPLOYMENT_MODE environment variable is missing."""
        # Clear any existing DEPLOYMENT_MODE
        if "DEPLOYMENT_MODE" in os.environ:
            del os.environ["DEPLOYMENT_MODE"]
            
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 500
        
        data = response.get_json()
        assert "error" in data
        assert data["error"] == "DEPLOYMENT_MODE not set"

    def test_deployment_mode_method_not_allowed(self, test_client):
        """Test that POST method is not allowed on mode endpoint."""
        response = test_client.post("/flask/deployment/mode")
        assert response.status_code == 405  # Method Not Allowed

    @patch.dict(os.environ, {
        "SERVICE_MODE": "production",
        "PERMISSIONS": "read-write", 
        "DEPLOYMENT_MODE": "OSPARC"
    })
    def test_all_environment_variables_set(self, test_client):
        """Test that all endpoints work when all environment variables are properly set."""
        # Test health check
        response = test_client.get("/flask/deployment/health")
        assert response.status_code == 200
        
        # Test service mode
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        data = response.get_json()
        assert data["service_mode"] == "production"
        
        # Test permissions
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        data = response.get_json()
        assert data["permissions"] == "read-write"
        
        # Test deployment mode
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        data = response.get_json()
        assert data["deployment_mode"] == "OSPARC"

    def test_invalid_endpoint(self, test_client):
        """Test that invalid deployment endpoints return 404."""
        response = test_client.get("/flask/deployment/invalid")
        assert response.status_code == 404

    @patch.dict(os.environ, {"SERVICE_MODE": ""})
    def test_service_mode_empty_string(self, test_client):
        """Test service mode endpoint with empty string value."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "service_mode" in data
        assert data["service_mode"] == ""

    @patch.dict(os.environ, {"PERMISSIONS": ""})
    def test_permissions_empty_string(self, test_client):
        """Test permissions endpoint with empty string value."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == ""

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": ""})
    def test_deployment_mode_empty_string(self, test_client):
        """Test deployment mode endpoint with empty string value."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_mode" in data
        assert data["deployment_mode"] == ""

    def test_deployment_endpoint_url_prefix(self, test_client):
        """Test that all deployment endpoints use the correct URL prefix."""
        # Test that endpoints without prefix don't work
        response = test_client.get("/health")
        assert response.status_code == 404
        
        response = test_client.get("/service-mode")
        assert response.status_code == 404
        
        response = test_client.get("/permissions")
        assert response.status_code == 404
        
        response = test_client.get("/mode")
        assert response.status_code == 404

    @patch.dict(os.environ, {"SERVICE_MODE": "special@chars!123"})
    def test_service_mode_special_characters(self, test_client):
        """Test service mode endpoint with special characters."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "service_mode" in data
        assert data["service_mode"] == "special@chars!123"

    @patch.dict(os.environ, {"PERMISSIONS": "custom-permission-level"})
    def test_permissions_custom_value(self, test_client):
        """Test permissions endpoint with custom permission value."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "custom-permission-level"

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "CUSTOM_DEPLOYMENT"})
    def test_deployment_mode_custom_value(self, test_client):
        """Test deployment mode endpoint with custom deployment value."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_mode" in data
        assert data["deployment_mode"] == "CUSTOM_DEPLOYMENT"