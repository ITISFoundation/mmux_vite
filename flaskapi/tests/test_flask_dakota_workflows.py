from flask import Flask
import pytest
from typing import List
import numpy as np

###
# Example FunctionJob structure (should match actual FunctionJob model)
def make_function_job(status: str, inputs: List[str], outputs: List[str]):
    return {
        "status": status,
        "inputs": {k: np.random.rand() for k in inputs}, 
        "outputs": {k: np.random.rand() for k in outputs} 
        ## other fields such as title, description, function_uid, project_job_id can be added as needed
        ## but are not necessary for the tests
    }

def create_function_job_list(n, status="completed", inputs=None, outputs=None):
    """Create a list of n FunctionJob-like dicts for testing."""
    if inputs is None: 
        inputs = ["x1"]
    assert isinstance(inputs, list) and all(isinstance(i, str) for i in inputs)

    if outputs is None:
        outputs = ["y"]
    assert isinstance(outputs, list) and all(isinstance(o, str) for o in outputs)

    return [make_function_job(status, inputs, outputs) for _ in range(n)]

def make_incomplete_job(status: str, inputs: List[str], outputs: List[str], missing_field: str):
    """Create a FunctionJob with a missing field for testing error cases."""
    job = make_function_job(status, inputs, outputs)
    if missing_field == "inputs":
        del job["inputs"]
    elif missing_field == "outputs":
        del job["outputs"]
    elif missing_field == "status":
        del job["status"]
    elif missing_field.startswith("input_key:"):
        key_to_remove = missing_field.split(":", 1)[1]
        if key_to_remove in job["inputs"]:
            del job["inputs"][key_to_remove]
    elif missing_field.startswith("output_key:"):
        key_to_remove = missing_field.split(":", 1)[1]
        if key_to_remove in job["outputs"]:
            del job["outputs"][key_to_remove]
    return job

# ------------------- Success Cases -------------------

class TestSumoCrossValidation:
    """Test suite for the /dakota/sumo_cross_validation endpoint."""

    # and w weirdly named variables (inc those that might go to same name after sanitization)
    def test_sumo_cross_validation_success(self, test_client: Flask):
        """Valid request returns 200 and expected result structure."""
        INPUTVARS = ["x1"]
        OUTPUT = "y"
        payload = {
            "inputVars": INPUTVARS,
            "output": OUTPUT,
            "FunctionJobs": create_function_job_list(50, inputs=INPUTVARS, outputs=[OUTPUT])
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        # Should contain the output key and lists of numbers
        assert OUTPUT in data
        assert isinstance(data[OUTPUT], list)
        for v in data[OUTPUT]:
            assert isinstance(v, (int, float))

    # ------------------- Failure Cases -------------------

    def test_mismatched_input_variables(self, test_client: Flask):
        """Test when passed inputVars do not coincide with any job input keys."""
        # Create jobs with input keys that don't match the requested inputVars
        payload = {
            "inputVars": ["x1", "x2"],  # Request these variables
            "output": "y",
            "FunctionJobs": create_function_job_list(50, inputs=["a", "b"], outputs=["y"])  # Jobs have different input keys
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention that inputVars don't match available job inputs
        assert any(keyword in data["error"].lower() for keyword in ["input", "variable", "match", "found"])

    def test_mismatched_output_variable(self, test_client: Flask):
        """Test when passed output does not coincide with any job output keys."""
        # Create jobs with output keys that don't match the requested output
        payload = {
            "inputVars": ["x1"],
            "output": "y",  # Request this output
            "FunctionJobs": create_function_job_list(50, inputs=["x1"], outputs=["z"])  # Jobs have different output key
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention that output doesn't match available job outputs
        assert any(keyword in data["error"].lower() for keyword in ["output", "match", "found"])

    def test_no_completed_jobs(self, test_client: Flask):
        """Test when no jobs are completed/successful."""
        # Create jobs with different non-completed statuses
        failed_jobs = create_function_job_list(25, status="failed")
        pending_jobs = create_function_job_list(25, status="pending")
        all_jobs = failed_jobs + pending_jobs
        
        payload = {
            "inputVars": ["x1"],
            "output": "y", 
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention insufficient completed/successful jobs
        assert any(keyword in data["error"].lower() for keyword in ["completed", "successful", "samples"])

    def test_jobs_missing_input_keys(self, test_client: Flask):
        """Test when jobs have missing input keys."""
        # Create jobs where some are missing required input keys
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [make_incomplete_job("completed", ["x1"], ["y"], "input_key:x1") for _ in range(25)]
        
        all_jobs = complete_jobs + incomplete_jobs
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing input keys or insufficient valid data
        assert any(keyword in data["error"].lower() for keyword in ["input", "missing", "key", "data"])

    def test_jobs_missing_output_keys(self, test_client: Flask):
        """Test when jobs have missing output keys."""
        # Create jobs where some are missing required output keys
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [make_incomplete_job("completed", ["x1"], ["y"], "output_key:y") for _ in range(25)]
        
        all_jobs = complete_jobs + incomplete_jobs
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing output keys or insufficient valid data
        assert any(keyword in data["error"].lower() for keyword in ["output", "missing", "key", "data"])

    def test_jobs_missing_inputs_structure(self, test_client: Flask):
        """Test when jobs are missing the entire 'inputs' structure."""
        # Create jobs where some are missing the entire inputs dict
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [make_incomplete_job("completed", ["x1"], ["y"], "inputs") for _ in range(25)]
        
        all_jobs = complete_jobs + incomplete_jobs
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing inputs structure
        assert any(keyword in data["error"].lower() for keyword in ["input", "missing", "structure"])

    def test_jobs_missing_outputs_structure(self, test_client: Flask):
        """Test when jobs are missing the entire 'outputs' structure."""
        # Create jobs where some are missing the entire outputs dict
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [make_incomplete_job("completed", ["x1"], ["y"], "outputs") for _ in range(25)]
        
        all_jobs = complete_jobs + incomplete_jobs
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing outputs structure
        assert any(keyword in data["error"].lower() for keyword in ["output", "missing", "structure"])

    @pytest.mark.parametrize("missing_field", ["output", "inputVars", "FunctionJobs"])
    def test_missing_required_field(self, test_client: Flask, missing_field):
        """Missing required field returns 400 with error message."""
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50)
        }
        del payload[missing_field]
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert missing_field in data["error"]

    def test_inputvars_empty(self, test_client: Flask):
        """inputVars must have at least one element."""
        payload = {
            "output": "y",
            "inputVars": [],
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "inputVars" in data["error"]

    def test_functionjobs_too_few(self, test_client: Flask):
        """FunctionJobs with less than 5 jobs returns 400."""
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(3)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "FunctionJobs" in data["error"] or "samples" in data["error"]

    def test_invalid_output_type(self, test_client: Flask):
        """output must be a string."""
        payload = {
            "output": ["y1", "y2"],
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "output" in data["error"]

    def test_invalid_inputvars_type(self, test_client: Flask):
        """inputVars must be a list of strings."""
        payload = {
            "output": "y",
            "inputVars": "x1",  # Should be a list
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "inputVars" in data["error"]

    def test_invalid_functionjobs_type(self, test_client: Flask):
        """FunctionJobs must be a list."""
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": "not_a_list"
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "FunctionJobs" in data["error"]

    def test_evaluate_failure_propagation(self, test_client: Flask, monkeypatch):
        """If evaluation fails, error is propagated with Dakota message."""
        def fail_eval(*args, **kwargs):
            raise RuntimeError("Some Dakota error")
        # monkeypatch the evaluation function in the dakota blueprint module where it's used
        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation", fail_eval)
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Some Dakota error" in data["error"]

    def test_file_io_error(self, test_client: Flask, monkeypatch):
        """File I/O errors are handled and return 500."""
        def fail_file(*args, **kwargs):
            raise IOError("Disk full")
        # monkeypatch the file writing function in the dakota blueprint module where it's used
        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.create_run_dir", fail_file)
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "Disk full" in data["error"]

    def test_partial_input_variable_mismatch(self, test_client: Flask):
        """Test when some but not all inputVars match job input keys."""
        payload = {
            "inputVars": ["x1", "x2", "nonexistent"],  # Mix of existing and non-existing
            "output": "y",
            "FunctionJobs": create_function_job_list(50, inputs=["x1", "x2"], outputs=["y"])
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert any(keyword in data["error"].lower() for keyword in ["input", "variable", "nonexistent"])

    def test_mixed_job_statuses_insufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but insufficient completed jobs."""
        # Create a mix where only 3 are completed (below minimum threshold)
        completed_jobs = create_function_job_list(3, status="completed")
        failed_jobs = create_function_job_list(25, status="failed")
        pending_jobs = create_function_job_list(22, status="pending")
        all_jobs = completed_jobs + failed_jobs + pending_jobs
        
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert any(keyword in data["error"].lower() for keyword in ["completed", "samples", "insufficient"])

    def test_empty_job_inputs_outputs(self, test_client: Flask):
        """Test jobs with empty inputs or outputs dictionaries."""
        # Create jobs with empty inputs/outputs
        jobs_with_empty_inputs = []
        for _ in range(25):
            job = {
                "status": "completed",
                "inputs": {},  # Empty inputs
                "outputs": {"y": np.random.rand()}
            }
            jobs_with_empty_inputs.append(job)
        
        normal_jobs = create_function_job_list(25)
        all_jobs = jobs_with_empty_inputs + normal_jobs
        
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": all_jobs
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_success_with_extra_variables(self, test_client: Flask):
        """Test that the endpoint succeeds when jobs have extra variables not requested."""
        # Jobs have more variables than requested - this should work
        payload = {
            "inputVars": ["x1"],  # Only request x1
            "output": "y",
            "FunctionJobs": create_function_job_list(50, inputs=["x1", "x2", "x3"], outputs=["y", "z"])  # Jobs have extra
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "y" in data
        assert isinstance(data["y"], list)

    # Add more edge cases as needed