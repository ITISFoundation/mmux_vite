"""
Tests for sampling endpoints.

This module tests sampling functionality including:
- Endpoint existence and routing
- Basic error handling  
- Method validation
- OSPARC API integration with mocked responses
- Comprehensive success and failure scenarios
"""

import json
import pytest
from unittest.mock import patch, Mock, MagicMock
from osparc_client.exceptions import ApiException as OsparcApiException


# Define the mocks directly in this file for simplicity
def mock_map_function_success(*args, **kwargs):
    """Successful map_function response with job information."""
    function_id = kwargs.get('function_id', 'test-function-uid')
    samples = kwargs.get('request_body', [])
    
    return MagicMock(
        to_dict=lambda: {
            "job_id": f"job-{function_id}-12345",
            "function_id": function_id,
            "status": "submitted",
            "samples_count": len(samples),
            "created_at": "2025-10-20T17:50:00Z",
            "inputs": samples[:3] if samples else [],  # Include first 3 samples for validation
            "result": {
                "status": "success",
                "message": f"Successfully submitted {len(samples)} samples for processing"
            }
        }
    )


def mock_map_function_invalid_function_id(*args, **kwargs):
    """Map function fails with invalid function ID."""
    raise OsparcApiException(
        status=404, 
        body="404 Not Found: Function with given ID not found"
    )


def mock_map_function_validation_error(*args, **kwargs):
    """Map function fails with validation error for samples."""
    raise OsparcApiException(
        status=422,
        body="422 Unprocessable Entity: Invalid sample data format"
    )


def mock_map_function_server_error(*args, **kwargs):
    """Map function fails with server error."""
    raise OsparcApiException(
        status=500,
        body="500 Internal Server Error: OSPARC service temporarily unavailable"
    )


def mock_map_function_timeout(*args, **kwargs):
    """Map function fails with timeout."""
    raise OsparcApiException(
        status=408,
        body="408 Request Timeout: Function mapping request timed out"
    )


class TestSamplingEndpoints:
    """Test class for sampling endpoints."""

    def test_flask_lhs_missing_required_fields(self, test_client):
        """Test that LHS endpoint properly handles missing required fields"""
        response = test_client.post('/sampling/lhs', json={})
        # Expecting 400 since required fields are missing and will cause validation errors
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_flask_grid_sampling_missing_required_fields(self, test_client):
        """Test grid sampling endpoint with missing required fields."""
        payload = {}
        
        response = test_client.post("/sampling/grid", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_flask_test_job_missing_required_fields(self, test_client):
        """Test test_job endpoint with missing required fields."""
        payload = {}
        
        response = test_client.post("/sampling/test_job", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_flask_clone_job_missing_required_fields(self, test_client):
        """Test clone_job endpoint with missing required fields."""
        payload = {}
        
        response = test_client.post("/sampling/clone_job", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_sampling_methods_not_allowed(self, test_client):
        """Test that unsupported HTTP methods return 405."""
        # Test GET on POST endpoints (actual endpoint names)
        response = test_client.get("/sampling/lhs")
        assert response.status_code == 405
        
        response = test_client.get("/sampling/grid")
        assert response.status_code == 405
        
        response = test_client.get("/sampling/test_job")
        assert response.status_code == 405
        
        response = test_client.get("/sampling/clone_job")
        assert response.status_code == 405
        
        # Test PUT/DELETE/PATCH methods
        response = test_client.put("/sampling/lhs", json={})
        assert response.status_code == 405
        
        response = test_client.delete("/sampling/grid")
        assert response.status_code == 405
        
        response = test_client.patch("/sampling/test_job", json={})
        assert response.status_code == 405

    def test_invalid_json_requests(self, test_client):
        """Test handling of invalid JSON in requests."""
        # Test invalid JSON data for LHS endpoint
        response = test_client.post("/sampling/lhs", 
                                  data="invalid json", 
                                  content_type='application/json')
        # Expecting 400 since invalid JSON will cause validation errors 
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        
        response = test_client.post("/sampling/grid", 
                                  data="invalid json",
                                  content_type='application/json')
        assert response.status_code == 400

    def test_endpoint_url_prefixes(self, test_client):
        """Test that sampling endpoints use the correct URL prefix."""
        # Test that endpoints without prefix don't work
        response = test_client.post("/lhs", json={})
        assert response.status_code == 404
        
        response = test_client.post("/grid", json={})
        assert response.status_code == 404
        
        response = test_client.post("/test_job", json={})
        assert response.status_code == 404
        
        response = test_client.post("/clone_job", json={})
        assert response.status_code == 404

    def test_correct_sampling_endpoints_exist(self, test_client):
        """Test that the expected sampling endpoints exist."""
        # These should not return 404 (they should return 500 due to missing data)
        response = test_client.post("/sampling/lhs", json={})
        assert response.status_code != 404
        
        response = test_client.post("/sampling/grid", json={})
        assert response.status_code != 404
        
        response = test_client.post("/sampling/test_job", json={})
        assert response.status_code != 404
        
        response = test_client.post("/sampling/clone_job", json={})
        assert response.status_code != 404

    def test_content_type_handling(self, test_client):
        """Test that endpoints handle different content types correctly."""
        payload = {}
        
        # Test with explicit JSON content type
        response = test_client.post("/sampling/lhs", 
                                  data=json.dumps(payload),
                                  content_type='application/json')
        # Should not fail due to content type issues
        assert response.status_code == 400  # Fails due to missing required fields, not content type

    def test_lhs_with_incomplete_config(self, test_client):
        """Test LHS with incomplete but present config field."""
        payload = {
            "config": [],  # Empty config
            "seed": 42,
            "N": 10
        }
        
        response = test_client.post("/sampling/lhs", json=payload)
        # Should return 400 for validation error (missing funUid and empty config)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_grid_with_incomplete_config(self, test_client):
        """Test grid sampling with incomplete but present config field."""
        payload = {
            "config": []  # Empty config, missing funUid
        }
        
        response = test_client.post("/sampling/grid", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_test_job_with_incomplete_config(self, test_client):
        """Test test_job with incomplete but present config field."""
        payload = {
            "config": []  # Empty config, missing funUid
        }
        
        response = test_client.post("/sampling/test_job", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data

    def test_clone_job_with_incomplete_fields(self, test_client):
        """Test clone_job with some but not all required fields."""
        payload = {
            "functionName": "test_function"  # Missing projectJobId and projectInputs
        }
        
        response = test_client.post("/sampling/clone_job", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data


class TestLHSSamplingWithMocks:
    """Test LHS sampling with mocked OSPARC API responses."""

    def test_lhs_sampling_success(self, test_client):
        """Test successful LHS sampling with mocked OSPARC API."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0},
                {"variable": "x2", "start": -5.0, "end": 5.0}
            ],
            "seed": 42,
            "N": 5,
            "funUid": "test-function-123"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_success):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    # Mock parent IDs
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    # Mock functions API
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_success)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/lhs", json=payload)
                    
                    assert response.status_code == 200
                    data = response.get_json()
                    
                    # Verify the response structure
                    assert "jobId" in data
                    assert "functionId" in data
                    assert "status" in data
                    assert "samplesCount" in data
                    assert data["functionId"] == "test-function-123"
                    assert data["samplesCount"] == 5
                    
                    # Verify the function was called with correct parameters
                    mock_api.map_function.assert_called_once()
                    call_args = mock_api.map_function.call_args
                    assert call_args[1]["function_id"] == "test-function-123"
                    assert len(call_args[1]["request_body"]) == 5  # 5 samples generated
                    
                    # Verify samples contain expected variables
                    samples = call_args[1]["request_body"]
                    for sample in samples:
                        assert "x1" in sample
                        assert "x2" in sample
                        assert 0.0 <= sample["x1"] <= 10.0
                        assert -5.0 <= sample["x2"] <= 5.0

    def test_lhs_sampling_invalid_function_id(self, test_client):
        """Test LHS sampling with invalid function ID."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0}
            ],
            "seed": 42,
            "N": 3,
            "funUid": "invalid-function-id"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_invalid_function_id):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_invalid_function_id)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/lhs", json=payload)
                    
                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Function with given ID not found" in data["error"]

    def test_lhs_sampling_validation_error(self, test_client):
        """Test LHS sampling with OSPARC validation error."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0}
            ],
            "seed": 42,
            "N": 3,
            "funUid": "test-function-123"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_validation_error):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_validation_error)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/lhs", json=payload)
                    
                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Invalid sample data format" in data["error"]

    def test_lhs_sampling_server_error(self, test_client):
        """Test LHS sampling with OSPARC server error."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0}
            ],
            "seed": 42,
            "N": 3,
            "funUid": "test-function-123"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_server_error):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_server_error)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/lhs", json=payload)
                    
                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "OSPARC service temporarily unavailable" in data["error"]

class TestGridSamplingWithMocks:
    """Test grid sampling with mocked OSPARC API responses."""

    @pytest.fixture
    def mock_grid_dependencies(self):
        """Mock the grid sampling dependencies."""
        with patch("flaskapi.mmux_python.utils.funs_evaluate.create_grid_samples") as mock_create_grid:
            with patch("flaskapi.mmux_python.utils.funs_data_processing.load_data") as mock_load_data:
                with patch("mmux_flaskapi.utils.helpers.create_run_dir") as mock_create_run_dir:
                    # Mock create_grid_samples to return a file path
                    mock_create_grid.return_value = "/tmp/grid_samples.csv"
                    
                    # Mock load_data to return sample data
                    import pandas as pd
                    sample_df = pd.DataFrame({
                        'x1': [1.0, 2.0, 3.0],
                        'x2': [10.0, 20.0, 30.0]
                    })
                    mock_load_data.return_value = sample_df
                    
                    # Mock create_run_dir
                    from pathlib import Path
                    mock_create_run_dir.return_value = Path("/tmp/test_run")
                    
                    yield {
                        'create_grid': mock_create_grid,
                        'load_data': mock_load_data,
                        'create_run_dir': mock_create_run_dir
                    }

    def test_grid_sampling_success(self, test_client, mock_grid_dependencies):
        """Test successful grid sampling with mocked OSPARC API."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0, "steps": 3},
                {"variable": "x2", "start": 5.0, "end": 15.0, "steps": 2}
            ],
            "funUid": "grid-function-789"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_success):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_success)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/grid", json=payload)
                    
                    assert response.status_code == 200
                    data = response.get_json()
                    
                    # Verify the response structure
                    assert "jobId" in data
                    assert "functionId" in data
                    assert "status" in data
                    assert data["functionId"] == "grid-function-789"
                    
                    # Verify the function was called
                    mock_api.map_function.assert_called_once()
                    call_args = mock_api.map_function.call_args
                    assert call_args[1]["function_id"] == "grid-function-789"
                    
                    # Verify samples were generated from mocked data
                    samples = call_args[1]["request_body"]
                    assert len(samples) == 3  # From mocked DataFrame
                    for sample in samples:
                        assert "x1" in sample
                        assert "x2" in sample

    def test_grid_sampling_invalid_function_id(self, test_client, mock_grid_dependencies):
        """Test grid sampling with invalid function ID."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0, "steps": 2}
            ],
            "funUid": "invalid-grid-function"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_invalid_function_id):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_invalid_function_id)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/grid", json=payload)
                    
                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Function with given ID not found" in data["error"]

    def test_grid_sampling_timeout(self, test_client, mock_grid_dependencies):
        """Test grid sampling with OSPARC timeout."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0, "steps": 2}
            ],
            "funUid": "timeout-function"
        }
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_map_function_timeout):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"
                    
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_timeout)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/grid", json=payload)
                    
                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Function mapping request timed out" in data["error"]


class TestSamplingIntegrationWithOsparcAPI:
    """Integration tests that simulate the full sampling pipeline with realistic OSPARC responses."""

    def test_lhs_sampling_full_pipeline(self, test_client):
        """Test complete LHS sampling pipeline with realistic data."""
        # Realistic payload for LHS sampling
        payload = {
            "config": [
                {"variable": "temperature", "start": 273.15, "end": 373.15},  # Kelvin range
                {"variable": "pressure", "start": 1.0, "end": 10.0},          # Bar range  
                {"variable": "flow_rate", "start": 0.1, "end": 5.0}           # L/min range
            ],
            "seed": 12345,
            "N": 20,  # Generate 20 samples
            "funUid": "thermal-simulation-v2.1.0"
        }
        
        def mock_realistic_map_function(*args, **kwargs):
            """Realistic OSPARC response with actual job information."""
            function_id = kwargs.get('function_id')
            samples = kwargs.get('request_body', [])
            
            return MagicMock(
                to_dict=lambda: {
                    "job_id": f"sim-job-{function_id}-20251020-175500",
                    "function_id": function_id,
                    "status": "submitted",
                    "samples_count": len(samples),
                    "created_at": "2025-10-20T17:55:00Z",
                    "estimated_duration": "00:15:30",
                    "priority": "normal",
                    "inputs": samples[:2],  # Show first 2 samples
                    "result": {
                        "status": "success",
                        "message": f"Thermal simulation submitted with {len(samples)} parameter sets",
                        "job_collection_id": f"jc-thermal-{len(samples)}-samples"
                    }
                }
            )
        
        with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_realistic_map_function):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    # Set up parent information
                    mock_parent_ids.return_value.parent_node_id = "thermal-node-abc123"
                    mock_parent_ids.return_value.parent_project_id = "thermal-project-def456"
                    
                    # Set up mock API
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_realistic_map_function)
                    mock_get_api.return_value = mock_api
                    
                    response = test_client.post("/sampling/lhs", json=payload)
                    
                    # Verify successful submission
                    assert response.status_code == 200
                    data = response.get_json()
                    
                    # Check response structure
                    assert "jobId" in data
                    assert "functionId" in data
                    assert "status" in data
                    assert "samplesCount" in data
                    assert "createdAt" in data
                    
                    # Verify data content
                    assert data["functionId"] == "thermal-simulation-v2.1.0"
                    assert data["samplesCount"] == 20
                    assert data["status"] == "submitted"
                    assert "thermal" in data["jobId"]
                    
                    # Verify the API was called correctly
                    mock_api.map_function.assert_called_once()
                    call_kwargs = mock_api.map_function.call_args[1]
                    
                    assert call_kwargs["function_id"] == "thermal-simulation-v2.1.0"
                    assert call_kwargs["x_simcore_parent_node_id"] == "thermal-node-abc123"
                    assert call_kwargs["x_simcore_parent_project_uuid"] == "thermal-project-def456"
                    
                    # Verify generated samples
                    samples = call_kwargs["request_body"]
                    assert len(samples) == 20
                    
                    # Check sample structure and ranges
                    for sample in samples:
                        assert "temperature" in sample
                        assert "pressure" in sample
                        assert "flow_rate" in sample  # Original variable name
                        
                        # Verify ranges
                        assert 273.15 <= sample["temperature"] <= 373.15
                        assert 1.0 <= sample["pressure"] <= 10.0
                        assert 0.1 <= sample["flow_rate"] <= 5.0

    def test_grid_sampling_engineering_use_case(self, test_client):
        """Test grid sampling with engineering parameters."""
        payload = {
            "config": [
                {"variable": "inlet_velocity", "start": 1.0, "end": 5.0, "steps": 5},
                {"variable": "outlet_pressure", "start": 0.8, "end": 1.2, "steps": 3}
            ],
            "funUid": "fluid-dynamics-cfd-v3.0"
        }
        
        def mock_engineering_map_function(*args, **kwargs):
            """Engineering-focused OSPARC response."""
            function_id = kwargs.get('function_id')
            samples = kwargs.get('request_body', [])
            
            return MagicMock(
                to_dict=lambda: {
                    "job_id": f"cfd-{function_id}-grid-analysis",
                    "function_id": function_id,
                    "status": "submitted",
                    "samples_count": len(samples),
                    "mesh_quality": "high",
                    "solver_settings": "steady_state_rans",
                    "result": {
                        "status": "success",
                        "message": f"CFD grid analysis started with {len(samples)} operating points",
                        "expected_outputs": ["velocity_field", "pressure_distribution", "turbulence_intensity"]
                    }
                }
            )
        
        with patch("flaskapi.mmux_python.utils.funs_evaluate.create_grid_samples") as mock_create_grid:
            with patch("flaskapi.mmux_python.utils.funs_data_processing.load_data") as mock_load_data:
                with patch("mmux_flaskapi.utils.helpers.create_run_dir") as mock_create_run_dir:
                    with patch("osparc_client.api.functions_api.FunctionsApi.map_function", side_effect=mock_engineering_map_function):
                        with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                            with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                                # Set up grid dependencies mocks
                                mock_create_grid.return_value = "/tmp/grid_samples.csv"
                                import pandas as pd
                                sample_df = pd.DataFrame({
                                    'inlet_velocity': [1.0, 2.5, 4.0],
                                    'outlet_pressure': [0.8, 1.0, 1.2]
                                })
                                mock_load_data.return_value = sample_df
                                from pathlib import Path
                                mock_create_run_dir.return_value = Path("/tmp/test_run")
                                mock_parent_ids.return_value.parent_node_id = "cfd-node-xyz789"
                                mock_parent_ids.return_value.parent_project_id = "cfd-project-uvw012"
                                
                                mock_api = Mock()
                                mock_api.map_function = Mock(side_effect=mock_engineering_map_function)
                                mock_get_api.return_value = mock_api
                                
                                response = test_client.post("/sampling/grid", json=payload)
                                
                                assert response.status_code == 200
                                data = response.get_json()
                                
                                # Verify engineering-specific response
                                assert "cfd" in data["jobId"]
                                assert data["functionId"] == "fluid-dynamics-cfd-v3.0"
                                assert "meshQuality" in data
                                assert "solverSettings" in data
                                
                                # Verify samples were processed
                                call_kwargs = mock_api.map_function.call_args[1]
                                samples = call_kwargs["request_body"]
                                assert len(samples) == 3  # From mocked DataFrame
                                
                                for sample in samples:
                                    assert "inlet_velocity" in sample  # From mock grid dependencies
                                    assert "outlet_pressure" in sample