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

# ------------------- Success Cases -------------------

class TestSumoCrossValidation:
    """Test suite for the /dakota/sumo_cross_validation endpoint."""

    ### TODO test w many more variables, ouutputs being a list;
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
    ### TODO test when passed inputVars or outputs do not coincide w any job input/output keys
    ### TODO test when no jobs are completed/successful
    ### TODO test when jobs have missing inputs/outputs keys

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
        # monkeypatch the evaluation function here as needed
        # monkeypatch("mmux_flaskapi.utils.funs_evaluate.evaluate_sumo_manual_crossvalidation", fail_eval)
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50)
        }
        response = test_client.post("/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Dakota execution failed" in data["error"]

    def test_file_io_error(self, test_client: Flask, monkeypatch):
        """File I/O errors are handled and return 500."""
        def fail_file(*args, **kwargs):
            raise IOError("Disk full")
        # monkeypatch the file writing function as needed
        # monkeypatch("mmux_flaskapi.utils.helpers.create_run_dir", fail_file)
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

    # Add more edge cases as needed