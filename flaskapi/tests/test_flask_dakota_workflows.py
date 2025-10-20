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


class TestSumoAlongAxes:
    """Test suite for the /dakota/sumo_along_axes endpoint."""

    def create_sumo_jobs(self, n: int, input_vars: List[str], output: str) -> List[dict]:
        """Create function jobs for SUMO along axes testing."""
        jobs = []
        for _ in range(n):
            job = {
                "status": "completed",
                "inputs": {var: float(np.random.uniform(-2, 2)) for var in input_vars},
                "outputs": {output: float(np.random.uniform(0, 10))}
            }
            jobs.append(job)
        return jobs

    # ------------------- Success Cases -------------------

    def test_sumo_along_axes_success_basic(self, test_client: Flask):
        """Valid request returns 200 and expected structure."""
        input_vars = ["x1", "x2"]
        output = "y"
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(20, input_vars, output)
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert isinstance(data, dict)
        assert "predictions" in data
        
        predictions = data["predictions"]
        assert isinstance(predictions, dict)
        
        # Check that we have predictions for each input variable
        for var in input_vars:
            assert var in predictions
            assert isinstance(predictions[var], dict)
            
            # Check structure of each axis prediction
            axis_data = predictions[var]
            assert "x" in axis_data and isinstance(axis_data["x"], list)
            assert "y_hat" in axis_data and isinstance(axis_data["y_hat"], list)
            assert len(axis_data["x"]) > 0
            assert len(axis_data["y_hat"]) > 0
            assert len(axis_data["x"]) == len(axis_data["y_hat"])
            
            # Values should be numeric
            for val in axis_data["x"] + axis_data["y_hat"]:
                assert isinstance(val, (int, float))

    def test_sumo_along_axes_with_slider_values(self, test_client: Flask):
        """Test SUMO along axes with custom slider values."""
        input_vars = ["x1", "x2", "x3"]
        output = "y"
        slider_values = {"x1": 0.5, "x2": -1.0, "x3": 2.0}
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "sliderValues": slider_values,
            "FunctionJobs": self.create_sumo_jobs(30, input_vars, output)
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert isinstance(data, dict)
        assert "predictions" in data
        
        predictions = data["predictions"]
        # Should have predictions for all input variables
        for var in input_vars:
            assert var in predictions
            assert "x" in predictions[var] and "y_hat" in predictions[var]

    def test_sumo_along_axes_single_input(self, test_client: Flask):
        """Test with single input variable."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(15, input_vars, output)
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "predictions" in data
        assert "x1" in data["predictions"]
        assert "x" in data["predictions"]["x1"] and "y_hat" in data["predictions"]["x1"]

    def test_sumo_along_axes_many_inputs(self, test_client: Flask):
        """Test with many input variables."""
        input_vars = ["x1", "x2", "x3", "x4", "x5"]
        output = "y"
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        # Should have predictions for all 5 input variables
        assert "predictions" in data
        assert len(data["predictions"]) == 5
        for var in input_vars:
            assert var in data["predictions"]

    # ------------------- Validation Error Cases -------------------

    def test_empty_inputs_list(self, test_client: Flask):
        """Test with empty inputs list."""
        payload = {
            "inputs": [],  # Empty
            "output": "y",
            "FunctionJobs": self.create_sumo_jobs(10, ["x1"], "y")
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_output_name(self, test_client: Flask):
        """Test with empty output variable name."""
        payload = {
            "inputs": ["x1"],
            "output": "",  # Empty
            "FunctionJobs": self.create_sumo_jobs(10, ["x1"], "y")
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test with insufficient completed jobs (< 5)."""
        input_vars = ["x1"]
        output = "y"
        
        # Only 3 completed jobs
        completed_jobs = self.create_sumo_jobs(3, input_vars, output)
        failed_jobs = [{
            "status": "failed",
            "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
            "outputs": {"error": "simulation_failed"}
        } for _ in range(10)]
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": completed_jobs + failed_jobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about insufficient jobs
        if "details" in data:
            # Check in details if present
            details_str = " ".join(data["details"])
            assert "5" in details_str
        else:
            # Check in main error field
            assert "5" in data["error"]

    def test_missing_input_variables_in_jobs(self, test_client: Flask):
        """Test when jobs don't have all required input variables."""
        # Request x1, x2 but jobs only have x1
        payload = {
            "inputs": ["x1", "x2"],
            "output": "y",
            "FunctionJobs": self.create_sumo_jobs(20, ["x1"], "y")  # Missing x2
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about missing input variable
        if "details" in data:
            details_str = " ".join(data["details"])
            assert "x2" in details_str
        else:
            assert "x2" in data["error"]

    def test_missing_output_variable_in_jobs(self, test_client: Flask):
        """Test when jobs don't have the required output variable."""
        input_vars = ["x1", "x2"]
        
        # Create jobs with different output name
        jobs = []
        for _ in range(20):
            job = {
                "status": "completed",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"z": float(np.random.uniform(0, 10))}  # Different output name
            }
            jobs.append(job)
        
        payload = {
            "inputs": input_vars,
            "output": "y",  # Request 'y' but jobs have 'z'
            "FunctionJobs": jobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about missing output variable
        if "details" in data:
            details_str = " ".join(data["details"])
            assert "y" in details_str
        else:
            assert "y" in data["error"]

    def test_invalid_slider_values(self, test_client: Flask):
        """Test with slider values for non-existent input variables."""
        input_vars = ["x1", "x2"]
        output = "y"
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "sliderValues": {"x1": 0.5, "x3": 1.0},  # x3 not in inputs
            "FunctionJobs": self.create_sumo_jobs(20, input_vars, output)
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about invalid slider values
        if "details" in data:
            details_str = " ".join(data["details"])
            assert "x3" in details_str
        else:
            assert "x3" in data["error"]

    def test_empty_input_variable_names(self, test_client: Flask):
        """Test with empty strings in input variable names."""
        payload = {
            "inputs": ["x1", "", "x2"],  # Empty string in the middle
            "output": "y",
            "FunctionJobs": self.create_sumo_jobs(20, ["x1", "x2"], "y")
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_missing_function_jobs(self, test_client: Flask):
        """Test with missing FunctionJobs field."""
        payload = {
            "inputs": ["x1"],
            "output": "y",
            # Missing FunctionJobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    # ------------------- Edge Cases -------------------

    def test_jobs_with_extra_variables(self, test_client: Flask):
        """Test that endpoint works when jobs have extra variables not requested."""
        input_vars = ["x1", "x2"]
        output = "y"
        
        # Create jobs with extra input and output variables
        jobs = []
        for _ in range(20):
            job = {
                "status": "completed",
                "inputs": {
                    "x1": float(np.random.uniform(-1, 1)),
                    "x2": float(np.random.uniform(-1, 1)),
                    "x3": float(np.random.uniform(-1, 1)),  # Extra input
                    "x4": float(np.random.uniform(-1, 1))   # Extra input
                },
                "outputs": {
                    "y": float(np.random.uniform(0, 10)),
                    "z": float(np.random.uniform(-5, 5))    # Extra output
                }
            }
            jobs.append(job)
        
        payload = {
            "inputs": input_vars,  # Only request x1, x2
            "output": output,      # Only request y
            "FunctionJobs": jobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "predictions" in data
        assert len(data["predictions"]) == 2  # Only x1, x2 should be in response
        assert "x1" in data["predictions"] and "x2" in data["predictions"]

    def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but sufficient completed jobs."""
        input_vars = ["x1", "x2"]
        output = "y"
        
        # Mix of statuses but enough completed
        completed_jobs = self.create_sumo_jobs(15, input_vars, output)
        failed_jobs = [{
            "status": "failed",
            "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
            "outputs": {"error": "simulation_failed"}
        } for _ in range(10)]
        pending_jobs = [{
            "status": "pending",
            "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
            "outputs": {"status": "queued"}
        } for _ in range(5)]
        
        all_jobs = completed_jobs + failed_jobs + pending_jobs
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": all_jobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)

    def test_minimal_valid_configuration(self, test_client: Flask):
        """Test minimal valid configuration (boundary conditions)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(5, input_vars, output)  # Minimum jobs
        }
        
        response = test_client.post("/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "predictions" in data
        assert "x1" in data["predictions"]
        assert "x" in data["predictions"]["x1"] and "y_hat" in data["predictions"]["x1"]


class TestManualUQWithUncertainty:
    """Test suite for the /dakota/manual_uq_propagation_with_uncertainty endpoint."""

    def create_uq_uncertainty_jobs(self, n: int, input_vars: List[str], output: str, include_uncertainty: bool = True) -> List[dict]:
        """Create function jobs with both predicted output and uncertainty estimation."""
        jobs = []
        for _ in range(n):
            job = {
                "status": "completed",
                "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
                "outputs": {output: np.random.uniform(0, 10)}
            }
            
            if include_uncertainty:
                # Add uncertainty prediction (std_hat)
                job["outputs"][f"{output}_std_hat"] = np.random.uniform(0.1, 2.0)
            
            jobs.append(job)
        return jobs

    def create_distribution_dict(self, input_vars: List[str]) -> dict:
        """Create distributions dictionary for given input variables."""
        return {
            var: {
                "distribution": "normal",
                "mean": 0.0,
                "std": 1.0,
                "min": -3.0,
                "max": 3.0
            } for var in input_vars
        }

    # ------------------- Success Cases -------------------

    def test_uq_uncertainty_success_basic(self, test_client: Flask):
        """Valid request returns 200 and expected statistical structure."""
        input_vars = ["x1", "x2"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert isinstance(data, dict)
        
        # Check histogram statistics
        assert "bins_start" in data and isinstance(data["bins_start"], (int, float))
        assert "bins_end" in data and isinstance(data["bins_end"], (int, float))
        assert "bin_means" in data and isinstance(data["bin_means"], list)
        assert "bin_stds" in data and isinstance(data["bin_stds"], list)
        assert len(data["bin_means"]) == len(data["bin_stds"])
        
        # Check box plot statistics
        assert "q1" in data and isinstance(data["q1"], (int, float))
        assert "median" in data and isinstance(data["median"], (int, float))
        assert "q3" in data and isinstance(data["q3"], (int, float))
        assert "whisker_min" in data and isinstance(data["whisker_min"], (int, float))
        assert "whisker_max" in data and isinstance(data["whisker_max"], (int, float))
        assert "outliers" in data and isinstance(data["outliers"], list)
        
        # Check overall statistics
        assert "mean" in data and isinstance(data["mean"], (int, float))
        assert "std" in data and isinstance(data["std"], (int, float))
        assert "min" in data and isinstance(data["min"], (int, float))
        assert "max" in data and isinstance(data["max"], (int, float))
        
        # Validate statistical ordering
        assert data["q1"] <= data["median"] <= data["q3"]
        assert data["whisker_min"] <= data["whisker_max"]
        assert data["min"] <= data["max"]
        assert data["std"] >= 0

    def test_uq_uncertainty_large_histograms(self, test_client: Flask):
        """Test with larger number of histograms for uncertainty estimation."""
        input_vars = ["x1", "x2", "x3"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 500,
            "nHistograms": 50,
            "seed": 999,
            "FunctionJobs": self.create_uq_uncertainty_jobs(100, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["bin_means"]) > 0
        assert len(data["bin_stds"]) > 0

    # ------------------- Validation Error Cases -------------------

    def test_missing_uncertainty_output(self, test_client: Flask):
        """Test when jobs don't have required uncertainty output (_std_hat)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output, include_uncertainty=False)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "std_hat" in data["error"]

    def test_invalid_n_histograms_zero(self, test_client: Flask):
        """Test with zero histograms (invalid)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 0,  # Invalid
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_invalid_n_histograms_too_large(self, test_client: Flask):
        """Test with too many histograms (performance constraint)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 1001,  # Too large
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "1000" in data["error"]

    def test_num_samples_less_than_histograms(self, test_client: Flask):
        """Test when numSamples < nHistograms (should fail)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 5,    # Less than nHistograms
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "samples" in data["error"].lower() and "histograms" in data["error"].lower()

    def test_missing_distributions_for_input_vars(self, test_client: Flask):
        """Test when distributions are missing for some input variables."""
        input_vars = ["x1", "x2", "x3"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(["x1", "x2"]),  # Missing x3
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "x3" in data["error"]

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test with insufficient completed jobs (< 5)."""
        input_vars = ["x1"]
        output = "y"
        
        # Only 3 completed jobs
        completed_jobs = self.create_uq_uncertainty_jobs(3, input_vars, output)
        failed_jobs = [{
            "status": "failed",
            "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
            "outputs": {"error": "simulation_failed"}  # Some output to satisfy validation
        } for _ in range(10)]
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": completed_jobs + failed_jobs
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "5" in data["error"]

    def test_empty_input_vars(self, test_client: Flask):
        """Test with empty input variables list."""
        payload = {
            "inputVars": [],  # Empty
            "output": "y",
            "distributions": {},
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, ["x1"], "y")
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_output_name(self, test_client: Flask):
        """Test with empty output variable name."""
        input_vars = ["x1"]
        
        payload = {
            "inputVars": input_vars,
            "output": "",  # Empty
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, "y")
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_negative_num_samples(self, test_client: Flask):
        """Test with negative number of samples."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": -10,  # Invalid
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    # ------------------- Edge Cases -------------------

    def test_minimal_valid_configuration(self, test_client: Flask):
        """Test minimal valid configuration (boundary conditions)."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 10,  # Minimum reasonable
            "nHistograms": 1,  # Minimum
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(5, input_vars, output)  # Minimum jobs
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        assert len(data["bin_means"]) > 0

    def test_single_input_variable(self, test_client: Flask):
        """Test with single input variable."""
        input_vars = ["x1"]
        output = "y"
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(30, input_vars, output)
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert all(key in data for key in ["bins_start", "bins_end", "median", "mean"])

    def test_jobs_with_extra_outputs(self, test_client: Flask):
        """Test that endpoint works when jobs have extra outputs not requested."""
        input_vars = ["x1"]
        output = "y"
        
        # Create jobs with extra outputs
        jobs = []
        for _ in range(20):
            job = {
                "status": "completed",
                "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
                "outputs": {
                    output: np.random.uniform(0, 10),
                    f"{output}_std_hat": np.random.uniform(0.1, 2.0),
                    "extra_output1": np.random.uniform(-5, 5),
                    "extra_output2": np.random.uniform(0, 1)
                }
            }
            jobs.append(job)
        
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": jobs
        }
        
        response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)

    ## TODO check the actual format of Failed / Pending jobs in their outputs & fix the model & test accordingly
    # def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
    #     """Test with mixed job statuses but sufficient completed jobs."""
    #     input_vars = ["x1"]
    #     output = "y"
        
    #     # Mix of statuses but enough completed
    #     completed_jobs = self.create_uq_uncertainty_jobs(15, input_vars, output)
    #     # Failed jobs should have at least some minimal outputs to pass validation
    #     failed_jobs = [{
    #         "status": "failed",
    #         "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
    #         "outputs": {}
    #     } for _ in range(10)]
    #     pending_jobs = [{
    #         "status": "pending",
    #         "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
    #         "outputs": {"status": "queued"}  # Some output to satisfy validation
    #     } for _ in range(5)]
        
    #     all_jobs = completed_jobs + failed_jobs + pending_jobs
        
    #     payload = {
    #         "inputVars": input_vars,
    #         "output": output,
    #         "distributions": self.create_distribution_dict(input_vars),
    #         "numSamples": 100,
    #         "nHistograms": 10,
    #         "seed": 42,
    #         "FunctionJobs": all_jobs
    #     }
        
    #     response = test_client.post("/dakota/manual_uq_propagation_with_uncertainty", json=payload)
    #     assert response.status_code == 200
    #     data = response.get_json()
    #     assert isinstance(data, dict)