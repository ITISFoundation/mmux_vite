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
from unittest.mock import MagicMock, Mock, patch

import pandas as pd
import pytest
from conftest import TEST_RUNS_DIR
from osparc_client.exceptions import ApiException as OsparcApiException


def _roundtrip_csv() -> str:
    return "\n".join(
        [
            "schema_version,source_job_collection_uid,source_function_uid,source_job_uid,status,input__x,input__y,output__result",
            "1,jc-1,func1,job-1,SUCCESS,1,2,3",
            "1,jc-1,func1,job-2,SUCCESS,4,5,9",
        ]
    )


class TestUploadJobCollectionCsv:
    def test_upload_csv_to_existing_function_success(
        self,
        test_client,
        patch_get_function_success,
    ):
        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json={
                "csvContent": _roundtrip_csv(),
                "targetMode": "existing",
                "targetFunctionUid": "func1",
            },
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["targetMode"] == "existing"
        assert data["targetFunctionUid"] == "func1"
        assert data["importedSamples"] == 2
        assert data["jobCollection"]["uid"].startswith("local-jc-")

    def test_upload_csv_to_new_function_success(
        self,
        test_client,
        patch_get_function_success,
    ):
        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json={
                "csvContent": _roundtrip_csv(),
                "targetMode": "new",
                "sourceFunctionUid": "func1",
                "newFunctionTitle": "Uploaded Function",
            },
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["targetMode"] == "new"
        assert data["targetFunctionUid"].startswith("local-func-")
        assert data["importedSamples"] == 2
        assert data["jobCollection"]["uid"].startswith("local-jc-")

    def test_upload_csv_incompatible_schema(
        self,
        test_client,
        patch_get_function_incompatible_schema,
    ):
        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json={
                "csvContent": _roundtrip_csv(),
                "targetMode": "existing",
                "targetFunctionUid": "func1",
            },
        )
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data

    def test_upload_new_function_visible_in_osparc_collection_endpoints(
        self,
        test_client,
        patch_get_function_success,
    ):
        upload_response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json={
                "csvContent": _roundtrip_csv(),
                "targetMode": "new",
                "sourceFunctionUid": "func1",
                "newFunctionTitle": "Uploaded Function",
            },
        )
        assert upload_response.status_code == 200
        upload_data = upload_response.get_json()
        local_function_uid = upload_data["targetFunctionUid"]

        collections_response = test_client.get(
            f"/flask/osparc/list_function_job_collections_for_functionid?functionUid={local_function_uid}"
        )
        assert collections_response.status_code == 200
        collections = collections_response.get_json()
        assert len(collections) == 1
        assert collections[0]["uid"].startswith("local-jc-")

        jobs_response = test_client.get(
            f"/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid={collections[0]['uid']}"
        )
        assert jobs_response.status_code == 200
        jobs = jobs_response.get_json()
        assert len(jobs) == 2
        assert jobs[0]["uid"].startswith("local-job-")


# Define the mocks directly in this file for simplicity
def mock_map_function_success(*args, **kwargs):
    """Successful map_function response with job information."""
    function_id = kwargs.get("function_id", "test-function-uid")
    samples = kwargs.get("request_body", [])

    return MagicMock(
        to_dict=lambda: {
            "job_id": f"job-{function_id}-12345",
            "function_id": function_id,
            "status": "submitted",
            "samples_count": len(samples),
            "created_at": "2025-10-20T17:50:00Z",
            "inputs": (samples[:3] if samples else []),  # Include first 3 samples for validation
            "result": {
                "status": "success",
                "message": f"Successfully submitted {len(samples)} samples for processing",
            },
        }
    )


def mock_map_function_invalid_function_id(*args, **kwargs):
    """Map function fails with invalid function ID."""
    raise OsparcApiException(status=404, body="404 Not Found: Function with given ID not found")


def mock_map_function_validation_error(*args, **kwargs):
    """Map function fails with validation error for samples."""
    raise OsparcApiException(
        status=422, body="422 Unprocessable Entity: Invalid sample data format"
    )


def mock_map_function_server_error(*args, **kwargs):
    """Map function fails with server error."""
    raise OsparcApiException(
        status=500,
        body="500 Internal Server Error: OSPARC service temporarily unavailable",
    )


def mock_map_function_timeout(*args, **kwargs):
    """Map function fails with timeout."""
    raise OsparcApiException(
        status=408, body="408 Request Timeout: Function mapping request timed out"
    )


class TestSamplingEndpoints:
    """Test class for sampling endpoints."""

    def test_flask_lhs_missing_required_fields(self, test_client):
        """Test that LHS endpoint properly handles missing required fields"""
        response = test_client.post("flask/sampling/lhs", json={})
        # Expecting 400 since required fields are missing and will cause validation errors
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_flask_grid_sampling_missing_required_fields(self, test_client):
        """Test grid sampling endpoint with missing required fields."""
        payload = {}

        response = test_client.post("/flask/sampling/grid", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_flask_test_job_missing_required_fields(self, test_client):
        """Test test_job endpoint with missing required fields."""
        payload = {}

        response = test_client.post("/flask/sampling/test_job", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_flask_clone_job_missing_required_fields(self, test_client):
        """Test clone_job endpoint with missing required fields."""
        payload = {}

        response = test_client.post("/flask/sampling/clone_job", json=payload)
        # With Pydantic validation, this should return 400 for validation errors
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_sampling_methods_not_allowed(self, test_client):
        """Test that unsupported HTTP methods return 405."""
        # Test GET on POST endpoints (actual endpoint names)
        response = test_client.get("/flask/sampling/lhs")
        assert response.status_code == 405

        response = test_client.get("/flask/sampling/grid")
        assert response.status_code == 405

        response = test_client.get("/flask/sampling/test_job")
        assert response.status_code == 405

        response = test_client.get("/flask/sampling/clone_job")
        assert response.status_code == 405

        # Test PUT/DELETE/PATCH methods
        response = test_client.put("/flask/sampling/lhs", json={})
        assert response.status_code == 405

        response = test_client.delete("/flask/sampling/grid")
        assert response.status_code == 405

        response = test_client.patch("/flask/sampling/test_job", json={})
        assert response.status_code == 405

    def test_invalid_json_requests(self, test_client):
        """Test handling of invalid JSON in requests."""
        # Test invalid JSON data for LHS endpoint
        response = test_client.post(
            "/flask/sampling/lhs", data="invalid json", content_type="application/json"
        )
        # Expecting 400 since invalid JSON will cause validation errors
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

        response = test_client.post(
            "/flask/sampling/grid", data="invalid json", content_type="application/json"
        )
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
        response = test_client.post("/flask/sampling/lhs", json={})
        assert response.status_code != 404

        response = test_client.post("/flask/sampling/grid", json={})
        assert response.status_code != 404

        response = test_client.post("/flask/sampling/test_job", json={})
        assert response.status_code != 404

        response = test_client.post("/flask/sampling/clone_job", json={})
        assert response.status_code != 404

    def test_content_type_handling(self, test_client):
        """Test that endpoints handle different content types correctly."""
        payload = {}

        # Test with explicit JSON content type
        response = test_client.post(
            "/flask/sampling/lhs",
            data=json.dumps(payload),
            content_type="application/json",
        )
        # Should not fail due to content type issues
        assert response.status_code == 400  # Fails due to missing required fields, not content type

    def test_lhs_with_incomplete_config(self, test_client):
        """Test LHS with incomplete but present config field."""
        payload = {"config": [], "seed": 42, "N": 10}  # Empty config

        response = test_client.post("/flask/sampling/lhs", json=payload)
        # Should return 400 for validation error (missing funUid and empty config)
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_lhs_accepts_snake_case_fun_uid(self, test_client):
        payload = {"config": [], "seed": 42, "N": 10, "fun_uid": "test-func"}

        response = test_client.post("/flask/sampling/lhs", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "funuid" not in data["error"].lower()

    def test_grid_with_incomplete_config(self, test_client):
        """Test grid sampling with incomplete but present config field."""
        payload = {"config": []}  # Empty config, missing funUid

        response = test_client.post("/flask/sampling/grid", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_test_job_with_incomplete_config(self, test_client):
        """Test test_job with incomplete but present config field."""
        payload = {"config": []}  # Empty config, missing funUid

        response = test_client.post("/flask/sampling/test_job", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data

    def test_clone_job_with_incomplete_fields(self, test_client):
        """Test clone_job with some but not all required fields."""
        payload = {
            "functionName": "test_function"  # Missing projectJobId and projectInputs
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)
        # Should return 400 for validation error
        assert response.status_code == 400

        data = response.get_json()
        assert "error" in data


class TestSamplingValidationEndpoints:
    """Test class for comprehensive validation of sampling endpoints with invalid payloads."""

    def test_lhs_sampling_missing_required_fields(self, test_client):
        """Test LHS sampling with various missing required fields."""
        test_cases = [
            # Missing config
            {
                "payload": {"seed": 42, "N": 100, "funUid": "test-func"},
                "expected_error": "config",
            },
            # Missing seed
            {
                "payload": {
                    "config": [{"variable": "x", "start": 0, "end": 1}],
                    "N": 100,
                    "funUid": "test-func",
                },
                "expected_error": "seed",
            },
            # Missing N
            {
                "payload": {
                    "config": [{"variable": "x", "start": 0, "end": 1}],
                    "seed": 42,
                    "funUid": "test-func",
                },
                "expected_error": "n",  # Pydantic shows field 'N' as lowercase 'n' in error message
            },
            # Missing funUid
            {
                "payload": {
                    "config": [{"variable": "x", "start": 0, "end": 1}],
                    "seed": 42,
                    "N": 100,
                },
                "expected_error": "fun_uid",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/sampling/lhs", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_lhs_sampling_invalid_field_types(self, test_client):
        """Test LHS sampling with invalid field types."""
        test_cases = [
            # Invalid config type
            {"config": "not_a_list", "seed": 42, "N": 100, "funUid": "test-func"},
            # Invalid seed type
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": "not_an_int",
                "N": 100,
                "funUid": "test-func",
            },
            # Invalid N type
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": 42,
                "N": "not_an_int",
                "funUid": "test-func",
            },
            # Invalid funUid type
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": 42,
                "N": 100,
                "funUid": 123,
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/sampling/lhs", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_lhs_sampling_invalid_config_validation(self, test_client):
        """Test LHS sampling with invalid config validation."""
        test_cases = [
            # Empty config
            {"config": [], "seed": 42, "N": 100, "funUid": "test-func"},
            # Config with end <= start
            {
                "config": [{"variable": "x", "start": 10, "end": 5}],
                "seed": 42,
                "N": 100,
                "funUid": "test-func",
            },
            # Config with end == start
            {
                "config": [{"variable": "x", "start": 5, "end": 5}],
                "seed": 42,
                "N": 100,
                "funUid": "test-func",
            },
            # Negative seed
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": -1,
                "N": 100,
                "funUid": "test-func",
            },
            # Zero or negative N
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": 42,
                "N": 0,
                "funUid": "test-func",
            },
            # Empty funUid
            {
                "config": [{"variable": "x", "start": 0, "end": 1}],
                "seed": 42,
                "N": 100,
                "funUid": "",
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/sampling/lhs", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_grid_sampling_missing_required_fields(self, test_client):
        """Test Grid sampling with various missing required fields."""
        test_cases = [
            # Missing config
            {"payload": {"funUid": "test-func"}, "expected_error": "config"},
            # Missing funUid
            {
                "payload": {"config": [{"variable": "x", "start": 0, "end": 1, "steps": 5}]},
                "expected_error": "fun_uid",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/sampling/grid", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_grid_sampling_invalid_config_validation(self, test_client):
        """Test Grid sampling with invalid config validation."""
        test_cases = [
            # Empty config
            {"config": [], "funUid": "test-func"},
            # Config with end <= start
            {
                "config": [{"variable": "x", "start": 10, "end": 5, "steps": 5}],
                "funUid": "test-func",
            },
            # Config with zero steps
            {
                "config": [{"variable": "x", "start": 0, "end": 1, "steps": 0}],
                "funUid": "test-func",
            },
            # Config with negative steps
            {
                "config": [{"variable": "x", "start": 0, "end": 1, "steps": -5}],
                "funUid": "test-func",
            },
            # Empty funUid
            {
                "config": [{"variable": "x", "start": 0, "end": 1, "steps": 5}],
                "funUid": "",
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/sampling/grid", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_test_job_missing_required_fields(self, test_client):
        """Test test_job with various missing required fields."""
        test_cases = [
            # Missing config
            {"payload": {"funUid": "test-func"}, "expected_error": "config"},
            # Missing funUid
            {
                "payload": {"config": [{"variable": "x", "value": 0.5}]},
                "expected_error": "fun_uid",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/sampling/test_job", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_test_job_invalid_config_validation(self, test_client):
        """Test test_job with invalid config validation."""
        test_cases = [
            # Empty config
            {"config": [], "funUid": "test-func"},
            # Empty funUid
            {"config": [{"variable": "x", "value": 0.5}], "funUid": ""},
            # Invalid config structure - missing variable
            {"config": [{"value": 0.5}], "funUid": "test-func"},
            # Invalid config structure - missing value
            {"config": [{"variable": "x"}], "funUid": "test-func"},
        ]

        for payload in test_cases:
            response = test_client.post("/flask/sampling/test_job", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_clone_job_missing_required_fields(self, test_client):
        """Test clone_job with various missing required fields."""
        test_cases = [
            # Missing projectJobId
            {
                "payload": {"functionName": "test-func", "projectInputs": {}},
                "expected_error": "project_job_id",
            },
            # Missing functionName
            {
                "payload": {"projectJobId": "job-123", "projectInputs": {}},
                "expected_error": "function_name",
            },
            # Missing projectInputs
            {
                "payload": {"projectJobId": "job-123", "functionName": "test-func"},
                "expected_error": "project_inputs",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/sampling/clone_job", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_clone_job_invalid_field_validation(self, test_client):
        """Test clone_job with invalid field validation."""
        test_cases = [
            # Empty projectJobId
            {"projectJobId": "", "functionName": "test-func", "projectInputs": {}},
            # Empty functionName
            {"projectJobId": "job-123", "functionName": "", "projectInputs": {}},
            # Invalid projectInputs type
            {
                "projectJobId": "job-123",
                "functionName": "test-func",
                "projectInputs": "not_a_dict",
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/sampling/clone_job", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_clone_job_accepts_snake_case_payload_fields(self, test_client):
        payload = {
            "project_job_id": "",
            "function_name": "test_function",
            "project_inputs": {},
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "field required" not in data["error"].lower()

    def test_validation_error_response_format(self, test_client):
        """Test that validation errors return proper error response format."""
        # Test with completely invalid JSON structure
        response = test_client.post("/flask/sampling/lhs", json={"invalid": "structure"})
        assert response.status_code == 400
        data = response.get_json()

        # Ensure error response follows expected format
        assert "error" in data
        assert isinstance(data["error"], str)

        # Test with invalid data types
        response = test_client.post(
            "/flask/sampling/grid",
            json={"config": "not_a_list", "funUid": 123},  # Should be string
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_mixed_validation_errors(self, test_client):
        """Test payloads with multiple validation errors simultaneously."""
        test_cases = [
            # LHS with multiple errors
            {
                "endpoint": "/flask/sampling/lhs",
                "payload": {
                    "config": [],  # Empty config
                    "seed": -1,  # Negative seed
                    "N": 0,  # Zero N
                    "funUid": "",  # Empty funUid
                },
            },
            # Grid with multiple errors
            {
                "endpoint": "/flask/sampling/grid",
                "payload": {
                    "config": [
                        {"variable": "x", "start": 10, "end": 5, "steps": -1}
                    ],  # Multiple config errors
                    "funUid": "",  # Empty funUid
                },
            },
            # Test job with multiple errors
            {
                "endpoint": "/flask/sampling/test_job",
                "payload": {"config": [], "funUid": ""},  # Empty config  # Empty funUid
            },
        ]

        for case in test_cases:
            response = test_client.post(case["endpoint"], json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            # Should contain detailed validation error information
            assert len(data["error"]) > 0


class TestLHSSamplingWithMocks:
    """Test LHS sampling with mocked OSPARC API responses."""

    def test_lhs_sampling_success(self, test_client):
        """Test successful LHS sampling with mocked OSPARC API."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0},
                {"variable": "x2", "start": -5.0, "end": 5.0},
            ],
            "seed": 42,
            "N": 5,
            "funUid": "test-function-123",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_success,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    # Mock parent IDs
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    # Mock functions API
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_success)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

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
            "config": [{"variable": "x1", "start": 0.0, "end": 10.0}],
            "seed": 42,
            "N": 3,
            "funUid": "invalid-function-id",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_invalid_function_id,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_invalid_function_id)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Function with given ID not found" in data["error"]

    def test_lhs_sampling_validation_error(self, test_client):
        """Test LHS sampling with OSPARC validation error."""
        payload = {
            "config": [{"variable": "x1", "start": 0.0, "end": 10.0}],
            "seed": 42,
            "N": 3,
            "funUid": "test-function-123",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_validation_error,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_validation_error)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Invalid sample data format" in data["error"]

    def test_lhs_sampling_server_error(self, test_client):
        """Test LHS sampling with OSPARC server error."""
        payload = {
            "config": [{"variable": "x1", "start": 0.0, "end": 10.0}],
            "seed": 42,
            "N": 3,
            "funUid": "test-function-123",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_server_error,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_server_error)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "OSPARC service temporarily unavailable" in data["error"]


class TestGridSamplingWithMocks:
    """Test grid sampling with mocked OSPARC API responses."""

    @pytest.fixture
    def mock_grid_dependencies(self):
        """Mock the grid sampling dependencies."""
        with patch("mmux_python.funs_evaluate.create_grid_samples") as mock_create_grid:
            with patch("mmux_python.funs_data_processing.load_data") as mock_load_data:
                with patch("mmux_flaskapi.utils.helpers.create_run_dir") as mock_create_run_dir:
                    # Mock create_grid_samples to return a file path
                    run_dir = TEST_RUNS_DIR / "test_run"
                    mock_create_run_dir.return_value = run_dir
                    mock_create_grid.return_value = run_dir / "grid_samples.csv"

                    # Mock load_data to return sample data
                    sample_df = pd.DataFrame({"x1": [1.0, 2.0, 3.0], "x2": [10.0, 20.0, 30.0]})
                    mock_load_data.return_value = sample_df

                    yield {
                        "create_grid": mock_create_grid,
                        "load_data": mock_load_data,
                        "create_run_dir": mock_create_run_dir,
                    }

    def test_grid_sampling_success(self, test_client, mock_grid_dependencies):
        """Test successful grid sampling with mocked OSPARC API."""
        payload = {
            "config": [
                {"variable": "x1", "start": 0.0, "end": 10.0, "steps": 3},
                {"variable": "x2", "start": 5.0, "end": 15.0, "steps": 2},
            ],
            "funUid": "grid-function-789",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_success,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_success)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/grid", json=payload)

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
            "config": [{"variable": "x1", "start": 0.0, "end": 10.0, "steps": 2}],
            "funUid": "invalid-grid-function",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_invalid_function_id,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_invalid_function_id)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/grid", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Function with given ID not found" in data["error"]

    def test_grid_sampling_timeout(self, test_client, mock_grid_dependencies):
        """Test grid sampling with OSPARC timeout."""
        payload = {
            "config": [{"variable": "x1", "start": 0.0, "end": 10.0, "steps": 2}],
            "funUid": "timeout-function",
        }

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_map_function_timeout,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "parent-node-123"
                    mock_parent_ids.return_value.parent_project_id = "parent-project-456"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_map_function_timeout)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/grid", json=payload)

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
                {
                    "variable": "temperature",
                    "start": 273.15,
                    "end": 373.15,
                },  # Kelvin range
                {"variable": "pressure", "start": 1.0, "end": 10.0},  # Bar range
                {"variable": "flow_rate", "start": 0.1, "end": 5.0},  # L/min range
            ],
            "seed": 12345,
            "N": 20,  # Generate 20 samples
            "funUid": "thermal-simulation-v2.1.0",
        }

        def mock_realistic_map_function(*args, **kwargs):
            """Realistic OSPARC response with actual job information."""
            function_id = kwargs.get("function_id")
            samples = kwargs.get("request_body", [])

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
                        "job_collection_id": f"jc-thermal-{len(samples)}-samples",
                    },
                }
            )

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_realistic_map_function,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    # Set up parent information
                    mock_parent_ids.return_value.parent_node_id = "thermal-node-abc123"
                    mock_parent_ids.return_value.parent_project_id = "thermal-project-def456"

                    # Set up mock API
                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_realistic_map_function)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

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
                {"variable": "outlet_pressure", "start": 0.8, "end": 1.2, "steps": 3},
            ],
            "funUid": "fluid-dynamics-cfd-v3.0",
        }

        def mock_engineering_map_function(*args, **kwargs):
            """Engineering-focused OSPARC response."""
            function_id = kwargs.get("function_id")
            samples = kwargs.get("request_body", [])

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
                        "expected_outputs": [
                            "velocity_field",
                            "pressure_distribution",
                            "turbulence_intensity",
                        ],
                    },
                }
            )

        with patch("mmux_python.funs_evaluate.create_grid_samples") as mock_create_grid:
            with patch("mmux_python.funs_data_processing.load_data") as mock_load_data:
                with patch("mmux_flaskapi.utils.helpers.create_run_dir") as mock_create_run_dir:
                    with patch(
                        "osparc_client.api.functions_api.FunctionsApi.map_function",
                        side_effect=mock_engineering_map_function,
                    ):
                        with patch(
                            "mmux_flaskapi.blueprints.sampling._get_parent_ids"
                        ) as mock_parent_ids:
                            with patch(
                                "mmux_flaskapi.blueprints.sampling._get_functions_api"
                            ) as mock_get_api:
                                # Set up grid dependencies mocks
                                run_dir = TEST_RUNS_DIR / "test_run"
                                mock_create_run_dir.return_value = run_dir
                                mock_create_grid.return_value = run_dir / "grid_samples.csv"
                                sample_df = pd.DataFrame(
                                    {
                                        "inlet_velocity": [1.0, 2.5, 4.0],
                                        "outlet_pressure": [0.8, 1.0, 1.2],
                                    }
                                )
                                mock_load_data.return_value = sample_df
                                mock_parent_ids.return_value.parent_node_id = "cfd-node-xyz789"
                                mock_parent_ids.return_value.parent_project_id = (
                                    "cfd-project-uvw012"
                                )

                                mock_api = Mock()
                                mock_api.map_function = Mock(
                                    side_effect=mock_engineering_map_function
                                )
                                mock_get_api.return_value = mock_api

                                response = test_client.post("/flask/sampling/grid", json=payload)

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


class TestCloneJobWithMocks:
    """Test clone_job endpoint with mocked OSPARC API responses."""

    def test_clone_job_success(self, test_client):
        """Test successful job cloning with mocked OSPARC API."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5, "param2": 20.0, "param3": 5.5},
        }

        # Mock successful study cloning response
        mock_cloned_study = Mock()
        mock_cloned_study.to_dict.return_value = {
            "study_id": "cloned-study-uuid-67890",
            "title": "Job TestFunction",
            "description": "Clone of job *test-study-uuid-12345* from function *TestFunction*.\n\n#### Inputs:\n\n- *param1*: 10.5\n- *param2*: 20\n- *param3*: 5.5",
            "status": "created",
            "created_at": "2025-10-21T10:30:00Z",
            "updated_at": "2025-10-21T10:30:00Z",
            "owner": "test_user",
            "project_id": "cloned-study-uuid-67890",
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.return_value = mock_cloned_study
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 200
            data = response.get_json()

            # Verify response structure
            assert "studyId" in data
            assert data["studyId"] == "cloned-study-uuid-67890"
            assert data["title"] == "Job TestFunction"
            assert data["status"] == "created"
            assert "Clone of job *test-study-uuid-12345*" in data["description"]
            assert "*param1*: 10.5" in data["description"]
            assert "*param2*: 20" in data["description"]
            assert "*param3*: 5.5" in data["description"]

            # Verify API was called correctly
            mock_studies_api.clone_study.assert_called_once()
            call_args = mock_studies_api.clone_study.call_args

            # Check positional arguments
            assert call_args[0][0] == "test-study-uuid-12345"  # project_job_id

            # Check keyword arguments
            assert call_args[1]["hidden"] is False

            # Check study data
            study_data = call_args[1]["body_clone_study_v0_studies_study_id_clone_post"]
            assert study_data.title == "Job TestFunction"
            assert (
                "Clone of job *test-study-uuid-12345* from function *TestFunction*"
                in study_data.description
            )
            assert "#### Inputs:" in study_data.description

    def test_clone_job_validation_error_missing_project_job_id(self, test_client):
        """Test clone_job with missing projectJobId field."""
        payload = {"functionName": "TestFunction", "projectInputs": {"param1": 10.5}}

        response = test_client.post("/flask/sampling/clone_job", json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]
        assert (
            "projectJobId" in data["error"]
            or "field required" in data["error"]
            or "Field required" in data["error"]
        )

    def test_clone_job_validation_error_missing_function_name(self, test_client):
        """Test clone_job with missing functionName field."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "projectInputs": {"param1": 10.5},
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]
        assert (
            "functionName" in data["error"]
            or "field required" in data["error"]
            or "Field required" in data["error"]
        )

    def test_clone_job_validation_error_missing_project_inputs(self, test_client):
        """Test clone_job with missing projectInputs field."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "TestFunction",
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]
        assert (
            "projectInputs" in data["error"]
            or "field required" in data["error"]
            or "Field required" in data["error"]
        )

    def test_clone_job_validation_error_empty_project_job_id(self, test_client):
        """Test clone_job with empty projectJobId field."""
        payload = {
            "projectJobId": "",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5},
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_clone_job_validation_error_empty_function_name(self, test_client):
        """Test clone_job with empty functionName field."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "",
            "projectInputs": {"param1": 10.5},
        }

        response = test_client.post("/flask/sampling/clone_job", json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_clone_job_invalid_json_format(self, test_client):
        """Test clone_job with invalid JSON format."""
        response = test_client.post(
            "/flask/sampling/clone_job",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_clone_job_osparc_api_error(self, test_client):
        """Test clone_job when OSPARC API raises an exception."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5},
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.side_effect = Exception("OSPARC API connection failed")
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "Error while cloning job" in data["error"]
            assert "OSPARC API connection failed" in data["error"]

    def test_clone_job_osparc_study_not_found(self, test_client):
        """Test clone_job when the study to clone is not found."""
        payload = {
            "projectJobId": "non-existent-study-uuid",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5},
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.side_effect = OsparcApiException(
                status=404, body="Study not found"
            )
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "Error while cloning job" in data["error"]

    def test_clone_job_complex_inputs_formatting(self, test_client):
        """Test clone_job with complex input parameters and proper formatting."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "ComplexSimulation",
            "projectInputs": {
                "velocity": 15.75,
                "pressure": 101325.0,
                "temperature": 298.15,
                "viscosity": 0.001002,
                "density": 1000.0,
            },
        }

        mock_cloned_study = Mock()
        mock_cloned_study.to_dict.return_value = {
            "study_id": "cloned-complex-study-uuid",
            "title": "Job ComplexSimulation",
            "description": "Complex simulation clone with formatted inputs",
            "status": "created",
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.return_value = mock_cloned_study
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 200
            data = response.get_json()
            assert data["studyId"] == "cloned-complex-study-uuid"

            # Verify the study data formatting
            call_args = mock_studies_api.clone_study.call_args
            study_data = call_args[1]["body_clone_study_v0_studies_study_id_clone_post"]

            # Check that large numbers are properly formatted
            description = study_data.description
            assert (
                "*pressure*: 1.013e+05" in description
                or "*pressure*: 101325" in description
                or "*pressure*: 1.013e+5" in description
            )
            assert (
                "*temperature*: 298.1" in description
                or "*temperature*: 298.15" in description
                or "*temperature*: 298.2" in description
            )
            assert "*viscosity*: 0.001002" in description
            assert "*density*: 1000" in description

    def test_clone_job_edge_case_very_small_numbers(self, test_client):
        """Test clone_job with very small numbers in inputs."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "MicroSimulation",
            "projectInputs": {"epsilon": 1e-12, "delta": 5.5e-8, "tolerance": 0.0001},
        }

        mock_cloned_study = Mock()
        mock_cloned_study.to_dict.return_value = {
            "study_id": "cloned-micro-study-uuid",
            "title": "Job MicroSimulation",
            "status": "created",
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.return_value = mock_cloned_study
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 200

            # Verify scientific notation formatting for very small numbers
            call_args = mock_studies_api.clone_study.call_args
            study_data = call_args[1]["body_clone_study_v0_studies_study_id_clone_post"]
            description = study_data.description

            # Scientific notation should be used for very small numbers
            assert "*epsilon*: 1e-12" in description or "*epsilon*: 1e-12" in description
            assert "*delta*: 5.5e-08" in description or "*delta*: 5.5e-8" in description

    def test_clone_job_method_not_allowed(self, test_client):
        """Test clone_job endpoint with unsupported HTTP methods."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5},
        }

        # Test GET method
        response = test_client.get("/flask/sampling/clone_job")
        assert response.status_code == 405

        # Test PUT method
        response = test_client.put("/flask/sampling/clone_job", json=payload)
        assert response.status_code == 405

        # Test DELETE method
        response = test_client.delete("/flask/sampling/clone_job")
        assert response.status_code == 405

        # Test PATCH method
        response = test_client.patch("/flask/sampling/clone_job", json=payload)
        assert response.status_code == 405

    def test_clone_job_empty_project_inputs(self, test_client):
        """Test clone_job with empty projectInputs dictionary."""
        payload = {
            "projectJobId": "test-study-uuid-12345",
            "functionName": "TestFunction",
            "projectInputs": {},
        }

        mock_cloned_study = Mock()
        mock_cloned_study.to_dict.return_value = {
            "study_id": "cloned-empty-inputs-study",
            "title": "Job TestFunction",
            "description": "Clone with no inputs",
            "status": "created",
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            mock_studies_api.clone_study.return_value = mock_cloned_study
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 200

            # Check that empty inputs are handled gracefully
            call_args = mock_studies_api.clone_study.call_args
            study_data = call_args[1]["body_clone_study_v0_studies_study_id_clone_post"]
            description = study_data.description

            # Should contain the inputs section but be minimal
            assert "#### Inputs:" in description
            assert "Clone of job *test-study-uuid-12345*" in description


class TestSamplingUtilityFunctions:
    """Test the utility functions in sampling.py module."""

    def test_get_parent_ids_local_mode(self):
        """Test _get_parent_ids with LOCAL deployment mode."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            mock_deployment_mode.return_value = "LOCAL"

            from mmux_flaskapi.blueprints.sampling import _get_parent_ids

            parent_info = _get_parent_ids()

            assert parent_info.parent_node_id == "null"
            assert parent_info.parent_project_id == "null"

    def test_get_parent_ids_osparc_mode_success(self):
        """Test _get_parent_ids with OSPARC deployment mode and valid environment variables."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            with patch.dict(
                "os.environ",
                {
                    "OSPARC_NODE_ID": "test-node-12345",
                    "OSPARC_STUDY_ID": "test-study-67890",
                },
            ):
                mock_deployment_mode.return_value = "OSPARC"

                from mmux_flaskapi.blueprints.sampling import _get_parent_ids

                parent_info = _get_parent_ids()

                assert parent_info.parent_node_id == "test-node-12345"
                assert parent_info.parent_project_id == "test-study-67890"

    def test_get_parent_ids_osparc_mode_missing_node_id(self):
        """Test _get_parent_ids with OSPARC mode but missing OSPARC_NODE_ID."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            with patch.dict("os.environ", {"OSPARC_STUDY_ID": "test-study-67890"}, clear=True):
                mock_deployment_mode.return_value = "OSPARC"

                from mmux_flaskapi.blueprints.sampling import _get_parent_ids

                with pytest.raises(
                    ValueError,
                    match="OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set",
                ):
                    _get_parent_ids()

    def test_get_parent_ids_osparc_mode_missing_study_id(self):
        """Test _get_parent_ids with OSPARC mode but missing OSPARC_STUDY_ID."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            with patch.dict("os.environ", {"OSPARC_NODE_ID": "test-node-12345"}, clear=True):
                mock_deployment_mode.return_value = "OSPARC"

                from mmux_flaskapi.blueprints.sampling import _get_parent_ids

                with pytest.raises(
                    ValueError,
                    match="OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set",
                ):
                    _get_parent_ids()

    def test_get_parent_ids_osparc_mode_empty_environment_vars(self):
        """Test _get_parent_ids with OSPARC mode but empty environment variables."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            with patch.dict("os.environ", {"OSPARC_NODE_ID": "", "OSPARC_STUDY_ID": ""}):
                mock_deployment_mode.return_value = "OSPARC"

                from mmux_flaskapi.blueprints.sampling import _get_parent_ids

                with pytest.raises(
                    ValueError,
                    match="OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set",
                ):
                    _get_parent_ids()

    def test_get_parent_ids_unknown_deployment_mode(self):
        """Test _get_parent_ids with unknown deployment mode."""
        with patch(
            "mmux_flaskapi.blueprints.deployment.get_deployment_mode_value"
        ) as mock_deployment_mode:
            mock_deployment_mode.return_value = "UNKNOWN_MODE"

            from mmux_flaskapi.blueprints.sampling import _get_parent_ids

            with pytest.raises(
                ValueError,
                match="DEPLOYMENT_MODE env variable could not be recognized \\(UNKNOWN_MODE\\)",
            ):
                _get_parent_ids()

    def test_get_functions_api_success(self):
        """Test _get_functions_api returns valid functions API."""
        mock_osparc_api = Mock()
        mock_functions_api = Mock()
        mock_osparc_api.get_functions_api.return_value = mock_functions_api

        with patch("mmux_flaskapi.blueprints.sampling.get_osparc_api") as mock_get_osparc:
            mock_get_osparc.return_value = mock_osparc_api

            from mmux_flaskapi.blueprints.sampling import _get_functions_api

            result = _get_functions_api()

            assert result == mock_functions_api
            mock_osparc_api.get_functions_api.assert_called_once()

    def test_get_functions_api_none_result(self):
        """Test _get_functions_api when get_functions_api returns None."""
        mock_osparc_api = Mock()
        mock_osparc_api.get_functions_api.return_value = None

        with patch("mmux_flaskapi.blueprints.sampling.get_osparc_api") as mock_get_osparc:
            mock_get_osparc.return_value = mock_osparc_api

            from mmux_flaskapi.blueprints.sampling import _get_functions_api

            with pytest.raises(AssertionError, match="functions_api is None"):
                _get_functions_api()

    def test_get_studies_api_success(self):
        """Test _get_studies_api returns valid studies API."""
        mock_osparc_api = Mock()
        mock_studies_api = Mock()
        mock_osparc_api.get_studies_api.return_value = mock_studies_api

        with patch("mmux_flaskapi.blueprints.sampling.get_osparc_api") as mock_get_osparc:
            mock_get_osparc.return_value = mock_osparc_api

            from mmux_flaskapi.blueprints.sampling import _get_studies_api

            result = _get_studies_api()

            assert result == mock_studies_api
            mock_osparc_api.get_studies_api.assert_called_once()

    def test_get_studies_api_none_result(self):
        """Test _get_studies_api when get_studies_api returns None."""
        mock_osparc_api = Mock()
        mock_osparc_api.get_studies_api.return_value = None

        with patch("mmux_flaskapi.blueprints.sampling.get_osparc_api") as mock_get_osparc:
            mock_get_osparc.return_value = mock_osparc_api

            from mmux_flaskapi.blueprints.sampling import _get_studies_api

            with pytest.raises(AssertionError, match="studies_api is None"):
                _get_studies_api()


class TestJobWithMocks:
    """Test the test_job endpoint with comprehensive mocking."""

    def test_test_job_success(self, test_client):
        """Test successful test_job execution."""
        payload = {
            "funUid": "test-function-uid-12345",
            "config": [
                {"variable": "input1", "value": 10.5},
                {"variable": "input2", "value": "test_string"},
            ],
        }

        # Mock the APIs and responses
        mock_functions_api = Mock()
        mock_validation_result = {
            "status": "valid",
            "inputs": {"input1": 10.5, "input2": "test_string"},
        }
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result

        mock_run_response = Mock()
        mock_job_instance = Mock()
        mock_job_instance.uid = "job-uid-67890"
        mock_run_response.actual_instance = mock_job_instance
        mock_functions_api.run_function.return_value = mock_run_response

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node-123"
        mock_parent_info.parent_project_id = "test-project-456"

        mock_job_details = {
            "uid": "job-uid-67890",
            "status": "running",
            "function_id": "test-function-uid-12345",
            "inputs": {"input1": 10.5, "input2": "test_string"},
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                with patch(
                    "mmux_flaskapi.blueprints.sampling._get_function_job_from_uid"
                ) as mock_get_job:
                    mock_get_functions.return_value = mock_functions_api
                    mock_get_parent.return_value = mock_parent_info
                    mock_get_job.return_value = mock_job_details

                    response = test_client.post("/flask/sampling/test_job", json=payload)

                    assert response.status_code == 200
                    response_data = response.get_json()

                    assert response_data["uid"] == "job-uid-67890"
                    assert response_data["status"] == "running"
                    assert response_data["functionId"] == "test-function-uid-12345"

                    # Verify API calls
                    mock_functions_api.validate_function_inputs.assert_called_once_with(
                        "test-function-uid-12345",
                        {"input1": 10.5, "input2": "test_string"},
                    )
                    mock_functions_api.run_function.assert_called_once_with(
                        "test-function-uid-12345",
                        body={"input1": 10.5, "input2": "test_string"},
                        x_simcore_parent_node_id="test-node-123",
                        x_simcore_parent_project_uuid="test-project-456",
                    )

    def test_test_job_validation_error_missing_funuid(self, test_client):
        """Test test_job with missing funUid field."""
        payload = {"config": [{"variable": "input1", "value": 10.5}]}

        response = test_client.post("/flask/sampling/test_job", json=payload)

        assert response.status_code == 400
        response_data = response.get_json()
        assert "error" in response_data
        assert "invalid request data" in response_data["error"].lower()

    def test_test_job_validation_error_missing_config(self, test_client):
        """Test test_job with missing config field."""
        payload = {"funUid": "test-function-uid-12345"}

        response = test_client.post("/flask/sampling/test_job", json=payload)

        assert response.status_code == 400
        response_data = response.get_json()
        assert "error" in response_data
        assert "invalid request data" in response_data["error"].lower()

    def test_test_job_validation_error_empty_config(self, test_client):
        """Test test_job with empty config array."""
        payload = {"funUid": "test-function-uid-12345", "config": []}

        response = test_client.post("/flask/sampling/test_job", json=payload)

        assert response.status_code == 400
        response_data = response.get_json()
        assert "error" in response_data

    def test_test_job_api_validation_failure(self, test_client):
        """Test test_job when OSPARC API validation fails."""
        payload = {
            "funUid": "invalid-function-uid",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        mock_functions_api.validate_function_inputs.side_effect = OsparcApiException(
            status=422, body="Invalid function inputs"
        )

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            mock_get_functions.return_value = mock_functions_api

            response = test_client.post("/flask/sampling/test_job", json=payload)

            assert response.status_code == 500
            response_data = response.get_json()
            assert "error" in response_data
            assert "Error while testing job" in response_data["error"]

    def test_test_job_run_function_failure(self, test_client):
        """Test test_job when run_function fails."""
        payload = {
            "funUid": "test-function-uid-12345",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        mock_validation_result = {"status": "valid"}
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result
        mock_functions_api.run_function.side_effect = OsparcApiException(
            status=500, body="Internal server error"
        )

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node-123"
        mock_parent_info.parent_project_id = "test-project-456"

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                mock_get_functions.return_value = mock_functions_api
                mock_get_parent.return_value = mock_parent_info

                response = test_client.post("/flask/sampling/test_job", json=payload)

                assert response.status_code == 500
                response_data = response.get_json()
                assert "error" in response_data
                assert "Error while testing job" in response_data["error"]

    def test_test_job_missing_actual_instance(self, test_client):
        """Test test_job when run_function response lacks actual_instance."""
        payload = {
            "funUid": "test-function-uid-12345",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        mock_validation_result = {"status": "valid"}
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result

        # Mock response without actual_instance
        mock_run_response = Mock()
        mock_run_response.actual_instance = None
        mock_functions_api.run_function.return_value = mock_run_response

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node-123"
        mock_parent_info.parent_project_id = "test-project-456"

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                mock_get_functions.return_value = mock_functions_api
                mock_get_parent.return_value = mock_parent_info

                response = test_client.post("/flask/sampling/test_job", json=payload)

                assert response.status_code == 400
                response_data = response.get_json()
                assert "error" in response_data
                assert "Job creation failed" in response_data["error"]

    def test_test_job_no_actual_instance_attribute(self, test_client):
        """Test test_job when run_function response has no actual_instance attribute."""
        payload = {
            "funUid": "test-function-uid-12345",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        mock_validation_result = {"status": "valid"}
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result

        # Mock response without actual_instance attribute
        mock_run_response = Mock(spec=[])  # Empty spec means no attributes
        mock_functions_api.run_function.return_value = mock_run_response

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node-123"
        mock_parent_info.parent_project_id = "test-project-456"

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                mock_get_functions.return_value = mock_functions_api
                mock_get_parent.return_value = mock_parent_info

                response = test_client.post("/flask/sampling/test_job", json=payload)

                assert response.status_code == 400
                response_data = response.get_json()
                assert "error" in response_data
                assert "Job creation failed" in response_data["error"]

    def test_test_job_invalid_json_format(self, test_client):
        """Test test_job with malformed JSON."""
        response = test_client.post(
            "/flask/sampling/test_job",
            data="invalid json data",
            content_type="application/json",
        )

        assert response.status_code == 400  # Changed from 500 to 400 to match actual behavior
        response_data = response.get_json()
        assert "error" in response_data
        assert "invalid request data" in response_data["error"].lower()

    def test_test_job_complex_config_types(self, test_client):
        """Test test_job with complex configuration data types."""
        payload = {
            "funUid": "test-function-uid-12345",
            "config": [
                {"variable": "integer_param", "value": 42},
                {"variable": "float_param", "value": 3.14159},
                {"variable": "string_param", "value": "hello world"},
                {"variable": "boolean_param", "value": True},
                {"variable": "array_param", "value": [1, 2, 3]},
                {"variable": "object_param", "value": {"nested": "value"}},
            ],
        }

        mock_functions_api = Mock()
        mock_validation_result = {"status": "valid"}
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result

        mock_run_response = Mock()
        mock_job_instance = Mock()
        mock_job_instance.uid = "job-complex-12345"
        mock_run_response.actual_instance = mock_job_instance
        mock_functions_api.run_function.return_value = mock_run_response

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node-123"
        mock_parent_info.parent_project_id = "test-project-456"

        mock_job_details = {
            "uid": "job-complex-12345",
            "status": "submitted",
            "function_id": "test-function-uid-12345",
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                with patch(
                    "mmux_flaskapi.blueprints.sampling._get_function_job_from_uid"
                ) as mock_get_job:
                    mock_get_functions.return_value = mock_functions_api
                    mock_get_parent.return_value = mock_parent_info
                    mock_get_job.return_value = mock_job_details

                    response = test_client.post("/flask/sampling/test_job", json=payload)

                    assert response.status_code == 200
                    response_data = response.get_json()
                    assert response_data["uid"] == "job-complex-12345"

                    # Verify that complex data types are passed correctly
                    expected_sample = {
                        "integer_param": 42,
                        "float_param": 3.14159,
                        "string_param": "hello world",
                        "boolean_param": True,
                        "array_param": [1, 2, 3],
                        "object_param": {"nested": "value"},
                    }

                    mock_functions_api.validate_function_inputs.assert_called_once_with(
                        "test-function-uid-12345", expected_sample
                    )
                    mock_functions_api.run_function.assert_called_once_with(
                        "test-function-uid-12345",
                        body=expected_sample,
                        x_simcore_parent_node_id="test-node-123",
                        x_simcore_parent_project_uuid="test-project-456",
                    )


class TestSamplingErrorHandlingMissingCoverage:
    """Test class to cover the specific error handling branches that are missing coverage."""

    def test_lhs_sampling_json_decode_error(self, test_client):
        """Test LHS sampling with malformed JSON that causes decode error."""
        # Send malformed JSON that will cause json.loads to fail
        response = test_client.post(
            "/flask/sampling/lhs",
            data="{'invalid': json}",  # Invalid JSON syntax
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_lhs_sampling_assertion_error_empty_samples(self, test_client):
        """Test LHS sampling when empty samples would trigger assertion error."""
        payload = {
            "config": [{"variable": "x", "start": 0, "end": 1}],
            "seed": 42,
            "N": 0,  # This should cause no samples to be generated
            "funUid": "test-function",
        }

        response = test_client.post("/flask/sampling/lhs", json=payload)
        # Should get validation error for N=0 before reaching assertion
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_grid_sampling_json_decode_error(self, test_client):
        """Test Grid sampling with malformed JSON that causes decode error."""
        # Send malformed JSON that will cause json.loads to fail
        response = test_client.post(
            "/flask/sampling/grid",
            data="{'config': [invalid json}",  # Invalid JSON syntax
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_grid_sampling_import_error(self, test_client):
        """Test Grid sampling when import fails."""
        payload = {
            "config": [{"variable": "x", "start": 0, "end": 1, "steps": 2}],
            "funUid": "test-function",
        }

        # Mock import error for create_grid_samples
        with patch("mmux_python.funs_evaluate.create_grid_samples") as mock_create_grid:
            mock_create_grid.side_effect = ImportError("Cannot import create_grid_samples")

            response = test_client.post("/flask/sampling/grid", json=payload)

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "Error while creating Grid Sampling" in data["error"]
            assert "Cannot import create_grid_samples" in data["error"]

    def test_test_job_json_decode_error(self, test_client):
        """Test test_job with malformed JSON that causes decode error."""
        # Send malformed JSON that will cause json.loads to fail
        response = test_client.post(
            "/flask/sampling/test_job",
            data="{'funUid': 'test', 'config': [malformed}",  # Invalid JSON syntax
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_test_job_get_function_job_from_uid_error(self, test_client):
        """Test test_job when _get_function_job_from_uid fails."""
        payload = {
            "funUid": "test-function-uid",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        mock_validation_result = {"status": "valid"}
        mock_functions_api.validate_function_inputs.return_value = mock_validation_result

        mock_run_response = Mock()
        mock_job_instance = Mock()
        mock_job_instance.uid = "job-uid-12345"
        mock_run_response.actual_instance = mock_job_instance
        mock_functions_api.run_function.return_value = mock_run_response

        mock_parent_info = Mock()
        mock_parent_info.parent_node_id = "test-node"
        mock_parent_info.parent_project_id = "test-project"

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_get_parent:
                with patch(
                    "mmux_flaskapi.blueprints.sampling._get_function_job_from_uid"
                ) as mock_get_job:
                    mock_get_functions.return_value = mock_functions_api
                    mock_get_parent.return_value = mock_parent_info

                    # Make _get_function_job_from_uid raise an exception
                    mock_get_job.side_effect = Exception("Failed to get job details")

                    response = test_client.post("/flask/sampling/test_job", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Error while testing job" in data["error"]
                    assert "Failed to get job details" in data["error"]

    def test_clone_job_json_decode_error(self, test_client):
        """Test clone_job with malformed JSON that causes decode error."""
        # Send malformed JSON that will cause json.loads to fail
        response = test_client.post(
            "/flask/sampling/clone_job",
            data="{'projectJobId': 'test', invalid json}",  # Invalid JSON syntax
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Invalid request data" in data["error"]

    def test_clone_job_studies_api_generic_exception(self, test_client):
        """Test clone_job when studies API raises a generic (non-OsparcApiException) exception."""
        payload = {
            "projectJobId": "test-study-uuid",
            "functionName": "TestFunction",
            "projectInputs": {"param1": 10.5},
        }

        with patch("mmux_flaskapi.blueprints.sampling._get_studies_api") as mock_get_api:
            mock_studies_api = Mock()
            # Raise a generic exception (not OsparcApiException)
            mock_studies_api.clone_study.side_effect = RuntimeError("Unexpected database error")
            mock_get_api.return_value = mock_studies_api

            response = test_client.post("/flask/sampling/clone_job", json=payload)

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "Error while cloning job" in data["error"]
            assert "Unexpected database error" in data["error"]

    def test_lhs_sampling_osparc_api_generic_exception(self, test_client):
        """Test LHS sampling when OSPARC API raises a generic (non-OsparcApiException) exception."""
        payload = {
            "config": [{"variable": "x", "start": 0, "end": 1}],
            "seed": 42,
            "N": 3,
            "funUid": "test-function",
        }

        # Mock a generic exception (not OsparcApiException) in map_function
        def mock_generic_exception(*args, **kwargs):
            raise ConnectionError("Network connection failed")

        with patch(
            "osparc_client.api.functions_api.FunctionsApi.map_function",
            side_effect=mock_generic_exception,
        ):
            with patch("mmux_flaskapi.blueprints.sampling._get_parent_ids") as mock_parent_ids:
                with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_api:
                    mock_parent_ids.return_value.parent_node_id = "test-node"
                    mock_parent_ids.return_value.parent_project_id = "test-project"

                    mock_api = Mock()
                    mock_api.map_function = Mock(side_effect=mock_generic_exception)
                    mock_get_api.return_value = mock_api

                    response = test_client.post("/flask/sampling/lhs", json=payload)

                    assert response.status_code == 500
                    data = response.get_json()
                    assert "error" in data
                    assert "Error while performing LHS sampling" in data["error"]
                    assert "Network connection failed" in data["error"]

    def test_grid_sampling_osparc_api_generic_exception(self, test_client):
        """Test Grid sampling when OSPARC API raises a generic exception."""
        payload = {
            "config": [{"variable": "x", "start": 0, "end": 1, "steps": 2}],
            "funUid": "test-function",
        }

        # Mock grid dependencies
        with patch("mmux_python.funs_evaluate.create_grid_samples") as mock_create_grid:
            with patch("mmux_python.funs_data_processing.load_data") as mock_load_data:
                with patch("mmux_flaskapi.utils.helpers.create_run_dir") as mock_create_run_dir:
                    run_dir = TEST_RUNS_DIR / "test_run"
                    mock_create_run_dir.return_value = run_dir
                    mock_create_grid.return_value = run_dir / "grid_samples.csv"
                    sample_df = pd.DataFrame({"x": [0.0, 1.0]})
                    mock_load_data.return_value = sample_df

                    # Mock a generic exception in map_function
                    def mock_generic_exception(*args, **kwargs):
                        raise TimeoutError("Request timed out")

                    with patch(
                        "osparc_client.api.functions_api.FunctionsApi.map_function",
                        side_effect=mock_generic_exception,
                    ):
                        with patch(
                            "mmux_flaskapi.blueprints.sampling._get_parent_ids"
                        ) as mock_parent_ids:
                            with patch(
                                "mmux_flaskapi.blueprints.sampling._get_functions_api"
                            ) as mock_get_api:
                                mock_parent_ids.return_value.parent_node_id = "test-node"
                                mock_parent_ids.return_value.parent_project_id = "test-project"

                                mock_api = Mock()
                                mock_api.map_function = Mock(side_effect=mock_generic_exception)
                                mock_get_api.return_value = mock_api

                                response = test_client.post("/flask/sampling/grid", json=payload)

                                assert response.status_code == 500
                                data = response.get_json()
                                assert "error" in data
                                assert "Error while creating Grid Sampling" in data["error"]
                                assert "Request timed out" in data["error"]

    def test_test_job_osparc_api_generic_exception(self, test_client):
        """Test test_job when OSPARC API raises a generic exception."""
        payload = {
            "funUid": "test-function-uid",
            "config": [{"variable": "input1", "value": 10.5}],
        }

        mock_functions_api = Mock()
        # Make validate_function_inputs raise a generic exception
        mock_functions_api.validate_function_inputs.side_effect = KeyError("API key missing")

        with patch("mmux_flaskapi.blueprints.sampling._get_functions_api") as mock_get_functions:
            mock_get_functions.return_value = mock_functions_api

            response = test_client.post("/flask/sampling/test_job", json=payload)

            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "Error while testing job" in data["error"]
            assert "API key missing" in data["error"]
