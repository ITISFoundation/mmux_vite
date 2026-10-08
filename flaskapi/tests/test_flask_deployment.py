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
from unittest.mock import patch

import pytest

pytestmark = pytest.mark.unit


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

    @patch.dict(os.environ, {"SERVICE_MODE": "SUMO"})
    def test_service_mode_sumo(self, test_client):
        """Test service mode retrieval for the SUMO mode (§V4 legal value)."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200

        data = response.get_json()
        assert "serviceMode" in data
        assert data["serviceMode"] == "SUMO"

    @pytest.mark.parametrize("mode", ["UQ", "SUMO", "MOGA"])
    def test_service_mode_all_legal_modes_200(self, test_client, mode):
        """§V4: every SERVICE_MODE ∈ {UQ,SUMO,MOGA} is served."""
        with patch.dict(os.environ, {"SERVICE_MODE": mode}):
            response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        assert response.get_json()["serviceMode"] == mode

    @pytest.mark.parametrize("mode", ["development", "testing", "production", "sumo", ""])
    def test_service_mode_out_of_range_errors(self, test_client, mode):
        """§V4 (fork issue #80): values outside {UQ,SUMO,MOGA} ! 200 — the
        pre-guard code checked presence only, so `SERVICE_MODE=development`
        silently passed (these tests used to assert that loose behavior)."""
        with patch.dict(os.environ, {"SERVICE_MODE": mode}):
            response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 500
        data = response.get_json()
        assert "SERVICE_MODE" in data["error"]

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

    @patch.dict(os.environ, {"PERMISSIONS": "WRITE"})
    def test_permissions_success(self, test_client):
        """Test successful permissions retrieval (§V4 legal value)."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200

        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "WRITE"

    @patch.dict(os.environ, {"PERMISSIONS": "READ-ONLY"})
    def test_permissions_read_only(self, test_client):
        """Test permissions retrieval for the READ-ONLY configuration."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200

        data = response.get_json()
        assert "permissions" in data
        assert data["permissions"] == "READ-ONLY"

    @pytest.mark.parametrize("permission", ["admin", "read-write", "read-only", ""])
    def test_permissions_out_of_range_errors(self, test_client, permission):
        """§V4: values outside {READ-ONLY,WRITE} → error (incl. the lowercase
        near-miss), not a silent 200."""
        with patch.dict(os.environ, {"PERMISSIONS": permission}):
            response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 500
        assert "PERMISSIONS" in response.get_json()["error"]

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
        assert "deploymentMode" in data
        assert data["deploymentMode"] == "LOCAL"

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "OSPARC"})
    def test_deployment_mode_osparc(self, test_client):
        """Test deployment mode retrieval for OSPARC environment."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200

        data = response.get_json()
        assert "deploymentMode" in data
        assert data["deploymentMode"] == "OSPARC"

    @pytest.mark.parametrize("mode", ["DOCKER", "local", "KUBERNETES", ""])
    def test_deployment_mode_out_of_range_errors(self, test_client, mode):
        """§V4: values outside {LOCAL,OSPARC} → error. `DOCKER` used to be
        asserted as a valid 200 here; it is ∈ neither deployment channel."""
        with patch.dict(os.environ, {"DEPLOYMENT_MODE": mode}):
            response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 500
        assert "DEPLOYMENT_MODE" in response.get_json()["error"]

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

    @patch.dict(
        os.environ,
        {"SERVICE_MODE": "MOGA", "PERMISSIONS": "WRITE", "DEPLOYMENT_MODE": "OSPARC"},
    )
    def test_all_environment_variables_set(self, test_client):
        """Test that all endpoints work when all environment variables are properly set."""
        # Test health check
        response = test_client.get("/flask/deployment/health")
        assert response.status_code == 200

        # Test service mode
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 200
        data = response.get_json()
        assert data["serviceMode"] == "MOGA"

        # Test permissions
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 200
        data = response.get_json()
        assert data["permissions"] == "WRITE"

        # Test deployment mode
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 200
        data = response.get_json()
        assert data["deploymentMode"] == "OSPARC"

    def test_invalid_endpoint(self, test_client):
        """Test that invalid deployment endpoints return 404."""
        response = test_client.get("/flask/deployment/invalid")
        assert response.status_code == 404

    @patch.dict(os.environ, {"SERVICE_MODE": ""})
    def test_service_mode_empty_string(self, test_client):
        """§V4: empty SERVICE_MODE is out of range → error, ⊥ a 200 carrying ""
        (pre-guard presence-only behavior; see fork issue #80)."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 500

        data = response.get_json()
        assert "SERVICE_MODE" in data["error"]

    @patch.dict(os.environ, {"PERMISSIONS": ""})
    def test_permissions_empty_string(self, test_client):
        """§V4: empty PERMISSIONS → error (pre-guard behavior was 200)."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 500

        data = response.get_json()
        assert "PERMISSIONS" in data["error"]

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": ""})
    def test_deployment_mode_empty_string(self, test_client):
        """§V4: empty DEPLOYMENT_MODE → error (pre-guard behavior was 200)."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 500

        data = response.get_json()
        assert "DEPLOYMENT_MODE" in data["error"]

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
        """§V4: garbage SERVICE_MODE → error, ⊥ echoed back with 200."""
        response = test_client.get("/flask/deployment/service-mode")
        assert response.status_code == 500

        data = response.get_json()
        assert "SERVICE_MODE" in data["error"]

    @patch.dict(os.environ, {"PERMISSIONS": "custom-permission-level"})
    def test_permissions_custom_value(self, test_client):
        """§V4: invented PERMISSIONS value → error, ⊥ accepted."""
        response = test_client.get("/flask/deployment/permissions")
        assert response.status_code == 500

        data = response.get_json()
        assert "PERMISSIONS" in data["error"]

    @patch.dict(os.environ, {"DEPLOYMENT_MODE": "CUSTOM_DEPLOYMENT"})
    def test_deployment_mode_custom_value(self, test_client):
        """§V4: invented DEPLOYMENT_MODE value → error, ⊥ accepted."""
        response = test_client.get("/flask/deployment/mode")
        assert response.status_code == 500

        data = response.get_json()
        assert "DEPLOYMENT_MODE" in data["error"]
