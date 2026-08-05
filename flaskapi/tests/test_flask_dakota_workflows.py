from pathlib import Path

import numpy as np
import pytest
from flask import Flask


###
# Example FunctionJob structure (should match actual FunctionJob model)
def make_function_job(status: str, inputs: list[str], outputs: list[str]):
    return {
        "status": status,
        "inputs": {k: np.random.rand() for k in inputs},
        "outputs": {k: np.random.rand() for k in outputs},
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


def make_incomplete_job(status: str, inputs: list[str], outputs: list[str], missing_field: str):
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
    """Test suite for the /flask/dakota/sumo_cross_validation endpoint."""

    # and w weirdly named variables (inc those that might go to same name after sanitization)
    def test_sumo_cross_validation_success(self, test_client: Flask):
        """Valid request returns 200 and expected result structure."""
        INPUTVARS = ["x1"]
        OUTPUT = "y"
        payload = {
            "inputVars": INPUTVARS,
            "output": OUTPUT,
            "FunctionJobs": create_function_job_list(50, inputs=INPUTVARS, outputs=[OUTPUT]),
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        # V42: response nested under cv_results; variable names preserved.
        cv = data["cvResults"]
        assert OUTPUT in cv
        assert f"{OUTPUT}_hat" in cv
        assert f"{OUTPUT}_std_hat" in cv
        assert isinstance(cv[OUTPUT], list)
        assert isinstance(cv[f"{OUTPUT}_hat"], list)
        assert isinstance(cv[f"{OUTPUT}_std_hat"], list)
        for v in cv[OUTPUT]:
            assert isinstance(v, (int, float))
        for v in cv[f"{OUTPUT}_hat"]:
            assert isinstance(v, (int, float))
        for v in cv[f"{OUTPUT}_std_hat"]:
            assert isinstance(v, (int, float))

    def test_sumo_cross_validation_preserves_prediction_suffixes_for_original_output_name(
        self, test_client: Flask, monkeypatch
    ):
        """Mapped Dakota keys should come back under the original output name with preserved suffixes."""

        def fake_eval(*args, **kwargs):
            return {
                "y1": [1.0, 2.0, 3.0],
                "y1_hat": [1.1, 2.1, 3.1],
                "y1_std_hat": [0.1, 0.2, 0.3],
            }

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation",
            fake_eval,
        )

        payload = {
            "inputVars": ["x_force"],
            "output": "drag_force",
            "FunctionJobs": create_function_job_list(
                50,
                inputs=["x_force"],
                outputs=["drag_force"],
            ),
        }

        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        # V42: cv_results is in _DEFAULT_PRESERVE_NESTED_KEYS, so both
        # variable names and suffixes survive the global camelCase serializer.
        assert data == {
            "cvResults": {
                "drag_force": [1.0, 2.0, 3.0],
                "drag_force_hat": [1.1, 2.1, 3.1],
                "drag_force_std_hat": [0.1, 0.2, 0.3],
            }
        }

    def test_sumo_cross_validation_accepts_snake_case_payload(self, test_client: Flask):
        payload = {
            "input_vars": ["x1"],
            "output": "y",
            "function_jobs": create_function_job_list(3, inputs=["x1"], outputs=["y"]),
        }

        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "field required" not in data["error"].lower()


class TestSumoCrossValidationRealData:
    """Real production-shaped dataset regression (§T33 / B23 / V41).

    `material_sweep_first50_Osparc.csv` (50 oSPARC jobs, 11 inputs, 7 outputs) is
    the exact data that made `/sumo_cross_validation` 500 with `{"error":"'y1'"}`
    for `output=delta_T_nerve` in production. These tests lock in V41's graceful
    degradation (200 + `warnings`, never an opaque KeyError 500).
    """

    CSV_PATH = (
        Path(__file__).resolve().parents[2]
        / "tests"
        / "e2e"
        / "fixtures"
        / "material_sweep_first50_Osparc.csv"
    )

    @staticmethod
    def _load_real_jobs(output: str):
        import csv as _csv

        with open(TestSumoCrossValidationRealData.CSV_PATH, newline="") as fh:
            reader = _csv.reader(fh)
            header = next(reader)
            in_cols = [c for c in header if c.startswith("input__")]
            out_cols = [c for c in header if c.startswith("output__")]
            inputs = [c[len("input__") :] for c in in_cols]
            outputs = [c[len("output__") :] for c in out_cols]
            jobs = []
            for row in reader:
                if not any(cell.strip() for cell in row):
                    continue
                inp = {inputs[i]: float(row[header.index(in_cols[i])]) for i in range(len(in_cols))}
                out = {
                    outputs[i]: float(row[header.index(out_cols[i])]) for i in range(len(out_cols))
                }
                jobs.append({"status": "completed", "inputs": inp, "outputs": out})
        return inputs, jobs

    def test_real_data_delta_T_nerve_does_not_500(self, test_client: Flask):
        """The real dataset must not 500 on the B23-exposing QoI."""
        inputs, jobs = self._load_real_jobs("delta_T_nerve")
        payload = {
            "inputVars": inputs,
            "output": "delta_T_nerve",
            "FunctionJobs": jobs,
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        # Pre-V41 this was a 500 `{"error":"'y1'"}`; V41 must return 200.
        assert response.status_code == 200, response.get_json()
        data = response.get_json()
        # V42: response nested under cv_results; variable names preserved.
        cv = data["cvResults"]
        assert "delta_T_nerve" in cv
        assert "delta_T_nerve_hat" in cv
        assert "delta_T_nerve_std_hat" in cv
        # If Dakota omitted the output column, V41 attaches a `warnings` entry.
        if "warnings" in cv:
            assert any("delta_T_nerve" in str(w) or "y1" in str(w) for w in cv["warnings"])

    def test_missing_output_column_returns_200_with_warnings(self, test_client: Flask, monkeypatch):
        """Deterministic proof of V41: force predictions.dat to omit the output column."""
        import mmux_flaskapi.dakota.funs_evaluate as fe

        inputs, jobs = self._load_real_jobs("delta_T_nerve")
        output_mapped = "y1"  # single output → mapped name

        orig_load = fe.load_data

        def fake_load(path, *args, **kwargs):
            df = orig_load(path, *args, **kwargs)
            if "predictions.dat" in str(path) and output_mapped in getattr(df, "columns", []):
                return df.drop(columns=[output_mapped])
            return df

        monkeypatch.setattr(fe, "load_data", fake_load)

        payload = {
            "inputVars": inputs,
            "output": "delta_T_nerve",
            "FunctionJobs": jobs,
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200, response.get_json()
        data = response.get_json()
        cv = data["cvResults"]
        assert "warnings" in cv and cv["warnings"], data
        assert any("predictions.dat" in str(w) and "y1" in str(w) for w in cv["warnings"])

    def test_dakota_fold_abort_returns_200_with_warnings(self, test_client: Flask, monkeypatch):
        """V43: a Dakota fold run that aborts (never writes predictions.dat) must be
        skipped + continued, NOT a 500. Force every fold's run to write nothing."""
        import mmux_flaskapi.dakota.funs_evaluate as fe

        inputs, jobs = self._load_real_jobs("delta_T_nerve")

        class FakeDakotaObject:
            def run(self, conf, run_dir):  # simulate Dakota abort: no predictions.dat
                return None

        monkeypatch.setattr(fe, "DakotaObject", FakeDakotaObject)

        payload = {
            "inputVars": inputs,
            "output": "delta_T_nerve",
            "FunctionJobs": jobs,
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200, response.get_json()
        data = response.get_json()
        cv = data["cvResults"]
        assert "warnings" in cv and cv["warnings"], data
        assert any(
            "did not produce" in str(w) or "Dakota run raised" in str(w) for w in cv["warnings"]
        )


class TestSnakeCaseDakotaRequestCompatibility:
    def test_perform_moga_optimization_accepts_snake_case_payload(self, test_client: Flask):
        payload = {
            "input_vars": ["x1"],
            "distributions": {"x1": {"distribution": "uniform", "min": 0.0, "max": 1.0}},
            "output_var_selection": {"y": "minimize"},
            "function_jobs": create_function_job_list(3, inputs=["x1"], outputs=["y"]),
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "field required" not in data["error"].lower()

    # ------------------- Failure Cases -------------------

    def test_mismatched_input_variables(self, test_client: Flask):
        """Test when passed inputVars do not coincide with any job input keys."""
        # Create jobs with input keys that don't match the requested inputVars
        payload = {
            "inputVars": ["x1", "x2"],  # Request these variables
            "output": "y",
            "FunctionJobs": create_function_job_list(
                50, inputs=["a", "b"], outputs=["y"]
            ),  # Jobs have different input keys
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention that inputVars don't match available job inputs
        assert any(
            keyword in data["error"].lower() for keyword in ["input", "variable", "match", "found"]
        )

    def test_mismatched_output_variable(self, test_client: Flask):
        """Test when passed output does not coincide with any job output keys."""
        # Create jobs with output keys that don't match the requested output
        payload = {
            "inputVars": ["x1"],
            "output": "y",  # Request this output
            "FunctionJobs": create_function_job_list(
                50, inputs=["x1"], outputs=["z"]
            ),  # Jobs have different output key
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
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

        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention insufficient completed/successful jobs
        assert any(
            keyword in data["error"].lower() for keyword in ["completed", "successful", "samples"]
        )

    def test_jobs_missing_input_keys(self, test_client: Flask):
        """Test when jobs have missing input keys."""
        # Create jobs where some are missing required input keys
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [
            make_incomplete_job("completed", ["x1"], ["y"], "input_key:x1") for _ in range(25)
        ]

        all_jobs = complete_jobs + incomplete_jobs
        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing input keys or insufficient valid data
        assert any(
            keyword in data["error"].lower() for keyword in ["input", "missing", "key", "data"]
        )

    def test_jobs_missing_output_keys(self, test_client: Flask):
        """Test when jobs have missing output keys."""
        # Create jobs where some are missing required output keys
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [
            make_incomplete_job("completed", ["x1"], ["y"], "output_key:y") for _ in range(25)
        ]

        all_jobs = complete_jobs + incomplete_jobs
        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing output keys or insufficient valid data
        assert any(
            keyword in data["error"].lower() for keyword in ["output", "missing", "key", "data"]
        )

    def test_jobs_missing_inputs_structure(self, test_client: Flask):
        """Test when jobs are missing the entire 'inputs' structure."""
        # Create jobs where some are missing the entire inputs dict
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [
            make_incomplete_job("completed", ["x1"], ["y"], "inputs") for _ in range(25)
        ]

        all_jobs = complete_jobs + incomplete_jobs
        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing inputs structure
        assert any(
            keyword in data["error"].lower() for keyword in ["input", "missing", "structure"]
        )

    def test_jobs_missing_outputs_structure(self, test_client: Flask):
        """Test when jobs are missing the entire 'outputs' structure."""
        # Create jobs where some are missing the entire outputs dict
        complete_jobs = create_function_job_list(25, inputs=["x1"], outputs=["y"])
        incomplete_jobs = [
            make_incomplete_job("completed", ["x1"], ["y"], "outputs") for _ in range(25)
        ]

        all_jobs = complete_jobs + incomplete_jobs
        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Should mention missing outputs structure
        assert any(
            keyword in data["error"].lower() for keyword in ["output", "missing", "structure"]
        )

    @pytest.mark.parametrize(
        ("missing_field", "expected_error"),
        [("output", "output"), ("inputVars", "input_vars"), ("FunctionJobs", "function_jobs")],
    )
    def test_missing_required_field(self, test_client: Flask, missing_field, expected_error):
        """Missing required field returns 400 with error message."""
        payload = {"output": "y", "inputVars": ["x1"], "FunctionJobs": create_function_job_list(50)}
        del payload[missing_field]
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert expected_error in data["error"]

    def test_inputvars_empty(self, test_client: Flask):
        """inputVars must have at least one element."""
        payload = {"output": "y", "inputVars": [], "FunctionJobs": create_function_job_list(50)}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "input_vars" in data["error"]

    def test_functionjobs_too_few(self, test_client: Flask):
        """FunctionJobs with less than 5 jobs returns 400."""
        payload = {"output": "y", "inputVars": ["x1"], "FunctionJobs": create_function_job_list(3)}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "function_jobs" in data["error"] or "samples" in data["error"]

    def test_invalid_output_type(self, test_client: Flask):
        """output must be a string."""
        payload = {
            "output": ["y1", "y2"],
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50),
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "output" in data["error"]

    def test_invalid_inputvars_type(self, test_client: Flask):
        """inputVars must be a list of strings."""
        payload = {
            "output": "y",
            "inputVars": "x1",  # Should be a list
            "FunctionJobs": create_function_job_list(50),
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "input_vars" in data["error"]

    def test_invalid_functionjobs_type(self, test_client: Flask):
        """FunctionJobs must be a list."""
        payload = {"output": "y", "inputVars": ["x1"], "FunctionJobs": "not_a_list"}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "function_jobs" in data["error"]

    def test_evaluate_failure_propagation(self, test_client: Flask, monkeypatch):
        """If evaluation fails, error is propagated with Dakota message."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Some Dakota error")

        # monkeypatch the evaluation function in the dakota blueprint module where it's used
        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation", fail_eval
        )
        payload = {"output": "y", "inputVars": ["x1"], "FunctionJobs": create_function_job_list(50)}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Some Dakota error" in data["error"]

    def test_file_io_error(self, test_client: Flask, monkeypatch):
        """File I/O errors are handled and return 500."""

        def fail_file(*args, **kwargs):
            raise OSError("Disk full")

        # monkeypatch the file writing function in the dakota blueprint module where it's used
        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.create_run_dir", fail_file)
        payload = {"output": "y", "inputVars": ["x1"], "FunctionJobs": create_function_job_list(50)}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "Disk full" in data["error"]
        assert "traceback" not in data

    def test_evaluation_error_does_not_leak_traceback(self, test_client: Flask, monkeypatch):
        """Unexpected runtime errors should not include a traceback by default."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Exploded during evaluation")

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation",
            fail_eval,
        )
        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50),
        }

        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert data["error"] == "Exploded during evaluation"
        assert data["workflow"] == "flask_sumo_cross_validation"
        assert "traceback" not in data

    def test_evaluation_error_does_not_leak_traceback_when_config_enabled(
        self, test_client: Flask, monkeypatch
    ):
        """Tracebacks should stay server-side even if verbose error config is enabled."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Exploded during evaluation")

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation",
            fail_eval,
        )
        test_client.application.config["MMUX_INCLUDE_TRACEBACKS"] = True

        payload = {
            "output": "y",
            "inputVars": ["x1"],
            "FunctionJobs": create_function_job_list(50),
        }

        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert data["error"] == "Exploded during evaluation"
        assert data["workflow"] == "flask_sumo_cross_validation"
        assert "traceback" not in data

    def test_partial_input_variable_mismatch(self, test_client: Flask):
        """Test when some but not all inputVars match job input keys."""
        payload = {
            "inputVars": ["x1", "x2", "nonexistent"],  # Mix of existing and non-existing
            "output": "y",
            "FunctionJobs": create_function_job_list(50, inputs=["x1", "x2"], outputs=["y"]),
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert any(
            keyword in data["error"].lower() for keyword in ["input", "variable", "nonexistent"]
        )

    def test_mixed_job_statuses_insufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but insufficient completed jobs."""
        # Create a mix where only 3 are completed (below minimum threshold)
        completed_jobs = create_function_job_list(3, status="completed")
        failed_jobs = create_function_job_list(25, status="failed")
        pending_jobs = create_function_job_list(22, status="pending")
        all_jobs = completed_jobs + failed_jobs + pending_jobs

        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert any(
            keyword in data["error"].lower() for keyword in ["completed", "samples", "insufficient"]
        )

    def test_empty_job_inputs_outputs(self, test_client: Flask):
        """Test jobs with empty inputs or outputs dictionaries."""
        # Create jobs with empty inputs/outputs
        jobs_with_empty_inputs = []
        for _ in range(25):
            job = {
                "status": "completed",
                "inputs": {},  # Empty inputs
                "outputs": {"y": np.random.rand()},
            }
            jobs_with_empty_inputs.append(job)

        normal_jobs = create_function_job_list(25)
        all_jobs = jobs_with_empty_inputs + normal_jobs

        payload = {"inputVars": ["x1"], "output": "y", "FunctionJobs": all_jobs}
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_success_with_extra_variables(self, test_client: Flask):
        """Test that the endpoint succeeds when jobs have extra variables not requested."""
        # Jobs have more variables than requested - this should work
        payload = {
            "inputVars": ["x1"],  # Only request x1
            "output": "y",
            "FunctionJobs": create_function_job_list(
                50, inputs=["x1", "x2", "x3"], outputs=["y", "z"]
            ),  # Jobs have extra
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        cv = data["cvResults"]
        assert "y" in cv
        assert isinstance(cv["y"], list)

    # Add more edge cases as needed


class TestSumoAlongAxes:
    """Test suite for the /dakota/sumo_along_axes endpoint."""

    def create_sumo_jobs(self, n: int, input_vars: list[str], output: str) -> list[dict]:
        """Create function jobs for SUMO along axes testing."""
        jobs = []
        for _ in range(n):
            job = {
                "status": "completed",
                "inputs": {var: float(np.random.uniform(-2, 2)) for var in input_vars},
                "outputs": {output: float(np.random.uniform(0, 10))},
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
            "FunctionJobs": self.create_sumo_jobs(20, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            assert "yHat" in axis_data and isinstance(axis_data["yHat"], list)
            assert len(axis_data["x"]) > 0
            assert len(axis_data["yHat"]) > 0
            assert len(axis_data["x"]) == len(axis_data["yHat"])

            # Values should be numeric
            for val in axis_data["x"] + axis_data["yHat"]:
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
            "FunctionJobs": self.create_sumo_jobs(30, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "predictions" in data

        predictions = data["predictions"]
        # Should have predictions for all input variables
        for var in input_vars:
            assert var in predictions
            assert "x" in predictions[var] and "yHat" in predictions[var]

    def test_sumo_along_axes_single_input(self, test_client: Flask):
        """Test with single input variable."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(15, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert "predictions" in data
        assert "x1" in data["predictions"]
        assert "x" in data["predictions"]["x1"] and "yHat" in data["predictions"]["x1"]

    def test_sumo_along_axes_many_inputs(self, test_client: Flask):
        """Test with many input variables."""
        input_vars = ["x1", "x2", "x3", "x4", "x5"]
        output = "y"

        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": self.create_sumo_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            "FunctionJobs": self.create_sumo_jobs(10, ["x1"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_output_name(self, test_client: Flask):
        """Test with empty output variable name."""
        payload = {
            "inputs": ["x1"],
            "output": "",  # Empty
            "FunctionJobs": self.create_sumo_jobs(10, ["x1"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test with insufficient completed jobs (< 5)."""
        input_vars = ["x1"]
        output = "y"

        # Only 3 completed jobs
        completed_jobs = self.create_sumo_jobs(3, input_vars, output)
        failed_jobs = [
            {
                "status": "failed",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"error": "simulation_failed"},
            }
            for _ in range(10)
        ]

        payload = {
            "inputs": input_vars,
            "output": output,
            "FunctionJobs": completed_jobs + failed_jobs,
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            "FunctionJobs": self.create_sumo_jobs(20, ["x1"], "y"),  # Missing x2
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
                "outputs": {"z": float(np.random.uniform(0, 10))},  # Different output name
            }
            jobs.append(job)

        payload = {
            "inputs": input_vars,
            "output": "y",  # Request 'y' but jobs have 'z'
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            "FunctionJobs": self.create_sumo_jobs(20, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            "FunctionJobs": self.create_sumo_jobs(20, ["x1", "x2"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
                    "x4": float(np.random.uniform(-1, 1)),  # Extra input
                },
                "outputs": {
                    "y": float(np.random.uniform(0, 10)),
                    "z": float(np.random.uniform(-5, 5)),  # Extra output
                },
            }
            jobs.append(job)

        payload = {
            "inputs": input_vars,  # Only request x1, x2
            "output": output,  # Only request y
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "predictions" in data
        assert len(data["predictions"]) == 2  # Only x1, x2 should be in response
        assert "x1" in data["predictions"] and "x2" in data["predictions"]

    @pytest.mark.skip(reason="TODO Check real outputs values when not finished, and implement")
    def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but sufficient completed jobs."""
        input_vars = ["x1", "x2"]
        output = "y"

        # Mix of statuses but enough completed
        completed_jobs = self.create_sumo_jobs(15, input_vars, output)
        failed_jobs = [
            {
                "status": "failed",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"error": "simulation_failed"},
            }
            for _ in range(10)
        ]
        pending_jobs = [
            {
                "status": "pending",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"status": "queued"},
            }
            for _ in range(5)
        ]

        all_jobs = completed_jobs + failed_jobs + pending_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
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
            "FunctionJobs": self.create_sumo_jobs(5, input_vars, output),  # Minimum jobs
        }

        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "predictions" in data
        assert "x1" in data["predictions"]
        assert "x" in data["predictions"]["x1"] and "yHat" in data["predictions"]["x1"]


class TestSumoGridEvaluation:
    """Test suite for the /dakota/sumo_grid_evaluation endpoint."""

    def create_grid_jobs(self, n: int, input_vars: list[str], output: str) -> list[dict]:
        """Create function jobs for SUMO grid evaluation testing."""
        jobs = []
        for _ in range(n):
            job = {
                "status": "completed",
                "inputs": {var: float(np.random.uniform(-2, 2)) for var in input_vars},
                "outputs": {output: float(np.random.uniform(0, 10))},
            }
            jobs.append(job)
        return jobs

    # ------------------- Success Cases -------------------

    def test_grid_evaluation_success_1d(self, test_client: Flask):
        """Valid 1D grid evaluation returns 200 and expected structure."""
        input_vars = ["x1", "x2"]
        grid_vars = ["x1"]  # 1D grid
        output = "y"

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "FunctionJobs": self.create_grid_jobs(20, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "gridData" in data

        grid_data = data["gridData"]
        assert isinstance(grid_data, dict)

        # Should have grid variables and predictions
        for var in grid_vars:
            assert var in grid_data
            assert isinstance(grid_data[var], list)
            assert len(grid_data[var]) > 0

        # Should have prediction values
        assert "yHat" in grid_data or output in grid_data
        if "yHat" in grid_data:
            assert isinstance(grid_data["yHat"], list)
            assert len(grid_data["yHat"]) > 0

    def test_grid_evaluation_success_2d(self, test_client: Flask):
        """Valid 2D grid evaluation returns 200 and expected structure."""
        input_vars = ["x1", "x2", "x3"]
        grid_vars = ["x1", "x2"]  # 2D grid
        output = "y"

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "FunctionJobs": self.create_grid_jobs(25, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "gridData" in data

        grid_data = data["gridData"]
        # Should have both grid variables
        for var in grid_vars:
            assert var in grid_data
            assert isinstance(grid_data[var], list)

    def test_grid_evaluation_success_3d(self, test_client: Flask):
        """Valid 3D grid evaluation returns 200 and expected structure."""
        input_vars = ["x1", "x2", "x3", "x4"]
        grid_vars = ["x1", "x2", "x3"]  # 3D grid (maximum)
        output = "y"

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "FunctionJobs": self.create_grid_jobs(30, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "gridData" in data

        grid_data = data["gridData"]
        # Should have all three grid variables
        for var in grid_vars:
            assert var in grid_data

    def test_grid_evaluation_with_slider_values(self, test_client: Flask):
        """Test grid evaluation with custom slider values."""
        input_vars = ["x1", "x2", "x3"]
        grid_vars = ["x1"]
        output = "y"
        slider_values = {"x1": np.nan, "x2": 0.5, "x3": -1.0}

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "sliderValues": slider_values,
            "FunctionJobs": self.create_grid_jobs(20, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "gridData" in data

    def test_grid_evaluation_minimal_valid_configuration(self, test_client: Flask):
        """Test minimal valid configuration (5 jobs, 1 grid var)."""
        input_vars = ["x1"]
        grid_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "FunctionJobs": self.create_grid_jobs(5, input_vars, output),  # Minimum jobs
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert "gridData" in data
        assert "x1" in data["gridData"]

    # ------------------- Validation Error Cases -------------------

    def test_empty_grid_vars_list(self, test_client: Flask):
        """Test with empty gridVars list."""
        payload = {
            "inputVars": ["x1"],
            "gridVars": [],  # Empty
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(10, ["x1"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_too_many_grid_vars(self, test_client: Flask):
        """Test with more than 3 grid variables."""
        input_vars = ["x1", "x2", "x3", "x4"]
        payload = {
            "inputVars": input_vars,
            "gridVars": ["x1", "x2", "x3", "x4"],  # 4 vars, max is 3
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(10, input_vars, "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_grid_vars_not_in_input_vars(self, test_client: Flask):
        """Test when grid variables are not in input variables."""
        payload = {
            "inputVars": ["x1", "x2"],
            "gridVars": ["x1", "x3"],  # x3 not in inputVars
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(20, ["x1", "x2"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about grid variables
        if "details" in data:
            details_str = " ".join(data["details"])
            assert "x3" in details_str
        else:
            assert "x3" in data["error"]

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test with insufficient completed jobs (< 5)."""
        input_vars = ["x1", "x2"]
        grid_vars = ["x1"]
        output = "y"

        # Only 3 completed jobs
        completed_jobs = self.create_grid_jobs(3, input_vars, output)
        failed_jobs = [
            {
                "status": "failed",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"error": "simulation_failed"},
            }
            for _ in range(10)
        ]

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "FunctionJobs": completed_jobs + failed_jobs,
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for specific error message about insufficient jobs
        if "details" in data:
            details_str = " ".join(data["details"])
            assert "5" in details_str
        else:
            assert "5" in data["error"]

    def test_missing_input_variables_in_jobs(self, test_client: Flask):
        """Test when jobs don't have all required input variables."""
        # Request x1, x2 but jobs only have x1
        payload = {
            "inputVars": ["x1", "x2"],
            "gridVars": ["x1"],
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(20, ["x1"], "y"),  # Missing x2
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
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
        grid_vars = ["x1"]

        # Create jobs with different output name
        jobs = []
        for _ in range(20):
            job = {
                "status": "completed",
                "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
                "outputs": {"z": float(np.random.uniform(0, 10))},  # Different output name
            }
            jobs.append(job)

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": "y",  # Request 'y' but jobs have 'z'
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
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
        grid_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "sliderValues": {"x1": 0.5, "x3": 1.0},  # x3 not in inputVars
            "FunctionJobs": self.create_grid_jobs(20, input_vars, output),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
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
            "inputVars": ["x1", "", "x2"],  # Empty string in the middle
            "gridVars": ["x1"],
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(20, ["x1", "x2"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_grid_variable_names(self, test_client: Flask):
        """Test with empty strings in grid variable names."""
        payload = {
            "inputVars": ["x1", "x2"],
            "gridVars": ["x1", ""],  # Empty string
            "output": "y",
            "FunctionJobs": self.create_grid_jobs(20, ["x1", "x2"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_missing_function_jobs(self, test_client: Flask):
        """Test with missing FunctionJobs field."""
        payload = {
            "inputVars": ["x1"],
            "gridVars": ["x1"],
            "output": "y",
            # Missing FunctionJobs
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_output_name(self, test_client: Flask):
        """Test with empty output variable name."""
        payload = {
            "inputVars": ["x1"],
            "gridVars": ["x1"],
            "output": "",  # Empty
            "FunctionJobs": self.create_grid_jobs(10, ["x1"], "y"),
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    # ------------------- Edge Cases -------------------

    def test_jobs_with_extra_variables(self, test_client: Flask):
        """Test that endpoint works when jobs have extra variables not requested."""
        input_vars = ["x1", "x2"]
        grid_vars = ["x1"]
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
                    "x4": float(np.random.uniform(-1, 1)),  # Extra input
                },
                "outputs": {
                    "y": float(np.random.uniform(0, 10)),
                    "z": float(np.random.uniform(-5, 5)),  # Extra output
                },
            }
            jobs.append(job)

        payload = {
            "inputVars": input_vars,  # Only request x1, x2
            "gridVars": grid_vars,  # Only grid x1
            "output": output,  # Only request y
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "gridData" in data

    # def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
    #     """Test with mixed job statuses but sufficient completed jobs."""
    #     input_vars = ["x1", "x2"]
    #     grid_vars = ["x1"]
    #     output = "y"

    #     # Mix of statuses but enough completed
    #     completed_jobs = self.create_grid_jobs(15, input_vars, output)
    #     failed_jobs = [{
    #         "status": "failed",
    #         "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
    #         "outputs": {"error": "simulation_failed"}
    #     } for _ in range(10)]
    #     pending_jobs = [{
    #         "status": "pending",
    #         "inputs": {var: float(np.random.uniform(-1, 1)) for var in input_vars},
    #         "outputs": {"status": "queued"}
    #     } for _ in range(5)]

    #     all_jobs = completed_jobs + failed_jobs + pending_jobs

    #     payload = {
    #         "inputVars": input_vars,
    #         "gridVars": grid_vars,
    #         "output": output,
    #         "FunctionJobs": all_jobs
    #     }

    #     response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
    #     assert response.status_code == 200
    #     data = response.get_json()
    #     assert isinstance(data, dict)
    #     assert "grid_data" in data


class TestManualUQWithUncertainty:
    """Test suite for the /dakota/manual_uq_propagation_with_uncertainty endpoint."""

    def create_uq_uncertainty_jobs(
        self, n: int, input_vars: list[str], output: str, include_uncertainty: bool = True
    ) -> list[dict]:
        """Create function jobs with both predicted output and uncertainty estimation."""
        jobs = []
        for _ in range(n):
            job = {
                "status": "completed",
                "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
                "outputs": {output: np.random.uniform(0, 10)},
            }

            if include_uncertainty:
                # Add uncertainty prediction (std_hat)
                job["outputs"][f"{output}_std_hat"] = np.random.uniform(0.1, 2.0)

            jobs.append(job)
        return jobs

    def create_distribution_dict(self, input_vars: list[str]) -> dict:
        """Create distributions dictionary for given input variables."""
        return {
            var: {"distribution": "normal", "mean": 0.0, "std": 1.0, "min": -3.0, "max": 3.0}
            for var in input_vars
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)

        # Check histogram statistics
        assert "binsStart" in data and isinstance(data["binsStart"], (int, float))
        assert "binsEnd" in data and isinstance(data["binsEnd"], (int, float))
        assert "binMeans" in data and isinstance(data["binMeans"], list)
        assert "binStds" in data and isinstance(data["binStds"], list)
        assert len(data["binMeans"]) == len(data["binStds"])

        # Check box plot statistics
        assert "q1" in data and isinstance(data["q1"], (int, float))
        assert "median" in data and isinstance(data["median"], (int, float))
        assert "q3" in data and isinstance(data["q3"], (int, float))
        assert "whiskerMin" in data and isinstance(data["whiskerMin"], (int, float))
        assert "whiskerMax" in data and isinstance(data["whiskerMax"], (int, float))
        assert "outliers" in data and isinstance(data["outliers"], list)

        # Check overall statistics
        assert "mean" in data and isinstance(data["mean"], (int, float))
        assert "std" in data and isinstance(data["std"], (int, float))
        assert "min" in data and isinstance(data["min"], (int, float))
        assert "max" in data and isinstance(data["max"], (int, float))

        # Check extended percentile statistics (T24/T32/node T34, UQ Stats modal)
        assert "p1" in data and isinstance(data["p1"], (int, float))
        assert "p5" in data and isinstance(data["p5"], (int, float))
        assert "p95" in data and isinstance(data["p95"], (int, float))
        assert "p99" in data and isinstance(data["p99"], (int, float))

        # Validate statistical ordering
        assert data["q1"] <= data["median"] <= data["q3"]
        assert data["whiskerMin"] <= data["whiskerMax"]
        assert data["min"] <= data["max"]
        assert data["std"] >= 0
        assert (
            data["p1"]
            <= data["p5"]
            <= data["q1"]
            <= data["median"]
            <= data["q3"]
            <= data["p95"]
            <= data["p99"]
        )

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
            "FunctionJobs": self.create_uq_uncertainty_jobs(100, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["binMeans"]) > 0
        assert len(data["binStds"]) > 0

    def test_uq_uncertainty_noise_scaled_by_sqrt2_not_naive_erfinv(
        self, test_client: Flask, monkeypatch
    ):
        """B16 regression: the noise term `r` used to inject `std_hat` into each UQ histogram
        realization must be `sqrt(2)*erfinv(uniform(-1,1))` (~N(0,1)), not bare `erfinv(...)`
        (std 1/sqrt(2)~=0.707 -- since Phi(x) = (1+erf(x/sqrt(2)))/2, the sqrt(2) factor is
        required for a correct standard-normal transform). This endpoint never enables output
        normalization (setup_preprocessor_for_workflow called without normalization args), so
        DataPreprocessor's transform/inverse_transform is the identity here. With a constant
        `yhat`=0 and `std_hat` and a single evaluation sample per histogram realization, the
        reported total `std` (aggregated over n_histograms realizations) must equal std_hat (up
        to MC noise), not std_hat/sqrt(2) as the un-scaled bug would report."""
        input_vars = ["x1"]
        output = "y"
        std_hat_value = 2.0

        def fake_evaluate_sumo(*args, **kwargs):
            return {"y1_hat": [0.0], "y1_std_hat": [std_hat_value]}

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sumo", fake_evaluate_sumo)

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 1000,
            "nHistograms": 1,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(
                50, input_vars, output, include_uncertainty=True
            ),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200
        data = response.get_json()

        reported_std = data["std"]
        naive_std = std_hat_value / np.sqrt(2)

        # With the sqrt(2) fix, reported std should be close to std_hat_value (2.0);
        # without it, it would be close to std_hat_value/sqrt(2) (~1.414).
        assert abs(reported_std - std_hat_value) / std_hat_value < 0.1
        assert abs(reported_std - naive_std) / naive_std > 0.1

    # ------------------- Validation Error Cases -------------------

    def test_uq_uncertainty_succeeds_without_preexisting_std_hat_in_job_outputs(
        self, test_client: Flask
    ):
        """V32/B12: real job outputs (from real simulations/CSV upload) never carry a
        pre-existing `{output}_std_hat` key — that quantity is computed by the surrogate
        model (`evaluate_sumo`), not present in the raw training data. The endpoint must
        succeed with such realistic jobs, not reject them for "missing" a key that is
        never supposed to be there in the first place."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(
                50, input_vars, output, include_uncertainty=False
            ),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        assert "binMeans" in data and len(data["binMeans"]) > 0
        assert "binStds" in data and len(data["binStds"]) > 0

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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "numSamples": 5,  # Less than nHistograms
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
        failed_jobs = [
            {
                "status": "failed",
                "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
                "outputs": {"error": "simulation_failed"},  # Some output to satisfy validation
            }
            for _ in range(10)
        ]

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": completed_jobs + failed_jobs,
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, ["x1"], "y"),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, "y"),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(50, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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
            "FunctionJobs": self.create_uq_uncertainty_jobs(5, input_vars, output),  # Minimum jobs
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        assert len(data["binMeans"]) > 0

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
            "FunctionJobs": self.create_uq_uncertainty_jobs(30, input_vars, output),
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
        assert response.status_code == 200
        data = response.get_json()
        assert all(key in data for key in ["binsStart", "binsEnd", "median", "mean"])

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
                    "extra_output2": np.random.uniform(0, 1),
                },
            }
            jobs.append(job)

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": self.create_distribution_dict(input_vars),
            "numSamples": 100,
            "nHistograms": 10,
            "seed": 42,
            "FunctionJobs": jobs,
        }

        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
        )
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

    #     response = test_client.post("/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload)
    #     assert response.status_code == 200
    #     data = response.get_json()
    #     assert isinstance(data, dict)


# ------------------- SUMO CV Accuracy Metrics Tests -------------------


class TestSumoCVAccuracyMetrics:
    """Test suite for the SUMO cross-validation accuracy metrics endpoint."""

    def create_cv_accuracy_jobs(
        self, n: int, input_vars: list[str], output_var: str, status: str = "completed"
    ):
        """Create a list of n FunctionJob-like dicts for CV accuracy testing."""
        return create_function_job_list(n, status=status, inputs=input_vars, outputs=[output_var])

    def test_successful_single_input_single_output(self, test_client: Flask):
        """Test successful CV accuracy metrics calculation with single input and single output."""
        input_vars = ["x1"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(10, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        # Validate response structure
        assert "metrics" in data
        assert isinstance(data["metrics"], dict)

        # Check that we have metrics for the output variable
        assert output in data["metrics"]

        # The metrics can be either a dict of accuracy metrics or a string (error message)
        output_metrics = data["metrics"][output]
        if isinstance(output_metrics, dict):
            # Check for expected metric keys
            expected_metrics = ["rootMeanSquared", "sumAbs", "meanAbs", "maxAbs"]
            for metric in expected_metrics:
                if metric in output_metrics:
                    # Metric values can be float or string ('nan')
                    assert isinstance(output_metrics[metric], (float, str))
        else:
            # String response (e.g., "No surrogate quality metrics found.")
            assert isinstance(output_metrics, str)

    def test_successful_multiple_inputs_single_output(self, test_client: Flask):
        """Test successful CV accuracy metrics with multiple inputs."""
        input_vars = ["x1", "x2", "x3"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(15, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        assert "metrics" in data
        assert output in data["metrics"]

    def test_successful_minimum_required_jobs(self, test_client: Flask):
        """Test with exactly the minimum number of required jobs (5)."""
        input_vars = ["x1"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(5, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        assert "metrics" in data
        assert output in data["metrics"]

    def test_response_includes_paired_ttest_and_convergence(self, test_client: Flask, monkeypatch):
        """Response now includes tTest (bias significance, V26) and convergence series (V27)."""
        input_vars = ["x1"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(10, input_vars, output)

        def fake_manual_cv(run_dir, subset_file, in_vars, out_response, N_CROSS_VALIDATION=5):
            import pandas as pd

            df = pd.read_csv(subset_file, sep=" ")
            actual = df[out_response].astype(float).tolist()
            # slight per-sample jitter keeps residual variance non-zero (⊥ scipy nan-statistic)
            predicted = [v + 0.05 + i * 0.001 for i, v in enumerate(actual)]
            return {
                out_response: actual,
                out_response + "_hat": predicted,
                out_response + "_std_hat": [0.0] * len(actual),
            }

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation", fake_manual_cv
        )
        monkeypatch.setattr(
            "mmux_flaskapi.dakota.funs_evaluate.evaluate_sumo_manual_crossvalidation",
            fake_manual_cv,
        )

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}
        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        assert "metrics" in data
        assert output in data["metrics"]
        assert isinstance(data["metrics"][output], dict)
        assert data["metrics"][output]["rootMeanSquared"] == pytest.approx(0.05, abs=0.01)

        assert "tTest" in data
        assert set(data["tTest"].keys()) == {"statistic", "pValue"}
        assert isinstance(data["tTest"]["statistic"], (int, float))
        assert isinstance(data["tTest"]["pValue"], (int, float))
        assert 0.0 <= data["tTest"]["pValue"] <= 1.0

        assert "convergence" in data
        assert isinstance(data["convergence"], list)
        assert len(data["convergence"]) >= 1
        n_samples_seen = [point["nSamples"] for point in data["convergence"]]
        for point in data["convergence"]:
            assert set(point.keys()) == {"nSamples", "metric"}
            assert point["nSamples"] >= 5
            assert point["metric"] == pytest.approx(0.05, abs=0.02)
        assert n_samples_seen == sorted(n_samples_seen)
        assert n_samples_seen[-1] == 10

    def test_significant_bias_detected_low_pvalue(self, test_client: Flask, monkeypatch):
        """A strong systematic offset between actual/predicted -> low p-value (V26 banner)."""
        input_vars = ["x1"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(10, input_vars, output)

        def fake_manual_cv(run_dir, subset_file, in_vars, out_response, N_CROSS_VALIDATION=5):
            import pandas as pd

            df = pd.read_csv(subset_file, sep=" ")
            actual = df[out_response].astype(float).tolist()
            predicted = [v + 10.0 + i * 0.01 for i, v in enumerate(actual)]  # strong bias
            return {
                out_response: actual,
                out_response + "_hat": predicted,
                out_response + "_std_hat": [0.0] * len(actual),
            }

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.evaluate_sumo_manual_crossvalidation", fake_manual_cv
        )
        monkeypatch.setattr(
            "mmux_flaskapi.dakota.funs_evaluate.evaluate_sumo_manual_crossvalidation",
            fake_manual_cv,
        )

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}
        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["tTest"]["pValue"] < 0.05

    def test_insufficient_jobs_for_dimensionality_returns_clean_400(self, test_client: Flask):
        """B17 regression: for high-dimensional inputs, the flat floor of 5 completed jobs is
        not enough to build a Dakota GP surrogate (Dakota requires strictly more training points
        than input variables, else it aborts with MODEL_ERROR/exit-250). 11 inputs with only 11
        completed jobs must be rejected with a clean 400 (not a Dakota crash); 12 completed jobs
        must succeed."""
        input_vars = [f"x{i}" for i in range(11)]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(11, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        error_text = str(data.get("details", data.get("error", "")))
        assert "12" in error_text
        assert "Dakota aborted" not in error_text

        jobs_ok = self.create_cv_accuracy_jobs(12, input_vars, output)
        payload_ok = {"inputs": input_vars, "output": output, "FunctionJobs": jobs_ok}
        response_ok = test_client.post(
            "/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload_ok
        )
        assert response_ok.status_code == 200

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test validation failure when there are insufficient completed jobs."""
        input_vars = ["x1"]
        output = "y"
        # Only 4 completed jobs - should fail validation
        jobs = self.create_cv_accuracy_jobs(4, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for the detailed error message that includes "5 completed jobs required"
        if "details" in data:
            # Look in detailed error messages
            assert any("5 items after validation" in detail for detail in data["details"])
        else:
            # Look in main error message
            assert "5" in data["error"] or "insufficient" in data["error"].lower()

    def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but sufficient completed jobs."""
        input_vars = ["x1"]
        output = "y"

        # Mix of statuses but enough completed
        completed_jobs = self.create_cv_accuracy_jobs(8, input_vars, output, "completed")
        failed_jobs = self.create_cv_accuracy_jobs(3, input_vars, output, "failed")
        pending_jobs = self.create_cv_accuracy_jobs(2, input_vars, output, "pending")

        all_jobs = completed_jobs + failed_jobs + pending_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "metrics" in data
        assert output in data["metrics"]

    def test_jobs_missing_required_input_variable(self, test_client: Flask):
        """Test validation failure when jobs are missing required input variables."""
        input_vars = ["x1", "x2"]
        output = "y"

        # Create jobs that are missing the x2 input variable
        complete_jobs = self.create_cv_accuracy_jobs(3, input_vars, output)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, [output], "input_key:x2") for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for detailed error message structure
        if "details" in data:
            # Look in detailed error messages for missing input variable error
            assert any("missing required input variables" in detail for detail in data["details"])
        else:
            # Look in main error message
            assert "missing" in data["error"].lower() and "input" in data["error"].lower()

    def test_jobs_missing_required_output_variable(self, test_client: Flask):
        """Test validation failure when jobs are missing the required output variable."""
        input_vars = ["x1"]
        output = "y"

        # Create jobs that are missing the output variable
        complete_jobs = self.create_cv_accuracy_jobs(3, input_vars, output)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, [output], "output_key:y") for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for detailed error message structure - outputs are empty so different error
        if "details" in data:
            # Look in detailed error messages for output-related error
            assert any("output" in detail.lower() for detail in data["details"])
        else:
            # Look in main error message
            assert "output" in data["error"].lower() or "empty" in data["error"].lower()

    def test_jobs_missing_inputs_structure(self, test_client: Flask):
        """Test validation failure when jobs are missing the entire 'inputs' structure."""
        input_vars = ["x1"]
        output = "y"

        # Create jobs where some are missing the entire inputs dict
        complete_jobs = self.create_cv_accuracy_jobs(3, input_vars, output)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, [output], "inputs") for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_jobs_missing_outputs_structure(self, test_client: Flask):
        """Test validation failure when jobs are missing the entire 'outputs' structure."""
        input_vars = ["x1"]
        output = "y"

        # Create jobs where some are missing the entire outputs dict
        complete_jobs = self.create_cv_accuracy_jobs(3, input_vars, output)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, [output], "outputs") for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    @pytest.mark.parametrize("missing_field", ["inputs", "output", "FunctionJobs"])
    def test_missing_required_fields(self, test_client: Flask, missing_field: str):
        """Test validation failure when required fields are missing from the request."""
        input_vars = ["x1"]
        output = "y"
        jobs = self.create_cv_accuracy_jobs(10, input_vars, output)

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": jobs}

        # Remove the specified field
        del payload[missing_field]

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    @pytest.mark.parametrize("invalid_inputs", [[], [""], [" "], ["x1", ""]])
    def test_invalid_input_variables(self, test_client: Flask, invalid_inputs: list[str]):
        """Test validation failure with invalid input variable names."""
        output = "y"
        jobs = self.create_cv_accuracy_jobs(10, ["x1"], output)  # Create valid jobs regardless

        payload = {"inputs": invalid_inputs, "output": output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    @pytest.mark.parametrize("invalid_output", ["", " ", None])
    def test_invalid_output_variable(self, test_client: Flask, invalid_output):
        """Test validation failure with invalid output variable names."""
        input_vars = ["x1"]
        jobs = self.create_cv_accuracy_jobs(10, input_vars, "y")  # Create valid jobs

        payload = {"inputs": input_vars, "output": invalid_output, "FunctionJobs": jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_function_jobs_list(self, test_client: Flask):
        """Test validation failure with empty FunctionJobs list."""
        input_vars = ["x1"]
        output = "y"

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": []}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_invalid_json_request(self, test_client: Flask):
        """Test handling of invalid JSON in the request."""
        response = test_client.post(
            "/flask/dakota/get_sumo_cv_accuracy_metrics",
            data="invalid json",
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_jobs_with_invalid_status(self, test_client: Flask):
        """Test validation with jobs that have empty or invalid status."""
        input_vars = ["x1"]
        output = "y"

        # Create jobs with invalid status
        valid_jobs = self.create_cv_accuracy_jobs(3, input_vars, output)
        invalid_jobs = [make_incomplete_job("", input_vars, [output], "status") for _ in range(3)]

        all_jobs = valid_jobs + invalid_jobs

        payload = {"inputs": input_vars, "output": output, "FunctionJobs": all_jobs}

        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


# ------------------- MOGA Optimization Tests -------------------


class TestMOGAOptimization:
    """Test suite for the MOGA (Multi-Objective Genetic Algorithm) optimization endpoint."""

    def create_moga_jobs(
        self, n: int, input_vars: list[str], output_vars: list[str], status: str = "completed"
    ):
        """Create a list of n FunctionJob-like dicts for MOGA testing."""
        return create_function_job_list(n, status=status, inputs=input_vars, outputs=output_vars)

    def create_distribution_dict(self, input_vars: list[str]):
        """Create distribution dictionary for input variables."""
        return {var: {"distribution": "uniform", "min": -1.0, "max": 1.0} for var in input_vars}

    def create_output_selection(self, output_vars: list[str]):
        """Create output variable selection for MOGA."""
        selections = ["minimize", "maximize"]
        return {var: selections[i % len(selections)] for i, var in enumerate(output_vars)}

    def test_moga_restores_original_names_and_maximize_direction(
        self, test_client: Flask, monkeypatch
    ):
        """Mapped optimizer outputs should be returned in original variable names and original sign."""
        input_vars = ["temperature"]
        output_vars = ["loss", "activation"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        captured_call = {}

        def fake_perform_moga_optimization(
            run_dir,
            processed_training_file,
            mapped_input_vars,
            mapped_distributions,
            mapped_output_vars,
            moga_kwargs,
        ):
            captured_call["mapped_input_vars"] = mapped_input_vars
            captured_call["mapped_distributions"] = mapped_distributions
            captured_call["mapped_output_vars"] = mapped_output_vars
            captured_call["moga_kwargs"] = moga_kwargs
            return {
                mapped_input_vars[0]: [0.25, 0.75],
                mapped_output_vars[0]: [-2.0, -1.5],
                mapped_output_vars[1]: [-2.0, -1.5],
            }

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.perform_moga_optimization",
            fake_perform_moga_optimization,
        )

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": {
                "loss": "minimize",
                "activation": "maximize",
            },
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)

        assert response.status_code == 200
        data = response.get_json()
        results = data["optimizationResults"]

        assert captured_call["mapped_input_vars"] == ["x1"]
        assert set(captured_call["mapped_output_vars"]) == {"y1", "y2"}
        assert set(captured_call["mapped_distributions"].keys()) == {"x1"}

        assert set(results.keys()) == {"temperature", "loss", "activation"}
        assert results["temperature"] == [0.25, 0.75]
        assert results["loss"] == [-2.0, -1.5]
        assert results["activation"] == [2.0, 1.5]

    def test_moga_preserves_irregular_case_variable_name_end_to_end(
        self, test_client: Flask, monkeypatch
    ):
        """Regression test for the write-path case-mangling bug (node/SPEC.md T13/T19):
        a variable name that does NOT round-trip losslessly through camelCase<->snake_case
        (e.g. "TissueConduc") must survive as-is through `distributions` and
        `FunctionJobs[].inputs` (both `to_snake_case_request`-parsed) all the way to the
        DataPreprocessor's x1..xn mapping and back into the final response - not get
        silently lowercased to "tissue_conduc" along the way.
        """
        input_var = "TissueConduc"
        output_vars = ["loss"]
        jobs = self.create_moga_jobs(10, [input_var], output_vars)

        def fake_perform_moga_optimization(
            run_dir,
            processed_training_file,
            mapped_input_vars,
            mapped_distributions,
            mapped_output_vars,
            moga_kwargs,
        ):
            return {
                mapped_input_vars[0]: [0.25, 0.75],
                mapped_output_vars[0]: [-2.0, -1.5],
            }

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.perform_moga_optimization",
            fake_perform_moga_optimization,
        )

        payload = {
            "inputVars": [input_var],
            "distributions": self.create_distribution_dict([input_var]),
            "outputVarSelection": {"loss": "minimize"},
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)

        assert response.status_code == 200
        results = response.get_json()["optimizationResults"]
        assert input_var in results, (
            f"Expected original variable name {input_var!r} preserved in response keys "
            f"{list(results.keys())!r} - got case-mangled instead"
        )

    def test_successful_basic_moga_optimization(self, test_client: Flask):
        """Test successful MOGA optimization with basic configuration."""
        input_vars = ["x1", "x2"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        # Validate response structure
        assert "optimizationResults" in data
        assert isinstance(data["optimizationResults"], dict)

        # Check that we have results for all variables (inputs + outputs)
        expected_vars = set(input_vars + output_vars)
        actual_vars = set(data["optimizationResults"].keys())
        assert expected_vars.issubset(actual_vars)

        # Check that all main variable result arrays have the same length (Pareto front)
        # Note: non_dominated_indices may have a different length as it's metadata
        variable_results = {
            k: v
            for k, v in data["optimizationResults"].items()
            if not k.startswith("non_dominated")
        }
        result_lengths = [len(values) for values in variable_results.values()]
        assert len(set(result_lengths)) == 1, (
            "All main variable result arrays should have the same length"
        )

        # Check that we have at least one Pareto point
        assert result_lengths[0] > 0, "Should have at least one Pareto point"

    def test_successful_three_objectives(self, test_client: Flask):
        """Test MOGA optimization with three objective functions."""
        input_vars = ["x1", "x2"]
        output_vars = ["y1", "y2", "y3"]
        jobs = self.create_moga_jobs(15, input_vars, output_vars)

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        assert "optimizationResults" in data
        # Should have results for all variables
        expected_vars = set(input_vars + output_vars)
        actual_vars = set(data["optimizationResults"].keys())
        assert expected_vars.issubset(actual_vars)

    def test_successful_minimum_required_jobs(self, test_client: Flask):
        """Test MOGA optimization with exactly the minimum number of required jobs (5)."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(5, input_vars, output_vars)

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "optimizationResults" in data

    @pytest.mark.skip(reason="TODO Check real outputs values when not finished, and implement")
    def test_insufficient_objectives_single_output(self, test_client: Flask):
        """Test validation failure when only one objective is specified."""
        input_vars = ["x1"]
        output_vars = ["y1"]  # Only one objective - should fail
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for detailed error message structure from Pydantic validation
        if "details" in data:
            assert any("at least 2" in detail.lower() for detail in data["details"])
        else:
            assert "at least 2" in data["error"].lower() or "objective" in data["error"].lower()

    def test_insufficient_completed_jobs(self, test_client: Flask):
        """Test validation failure when there are insufficient completed jobs."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(4, input_vars, output_vars)  # Only 4 jobs - should fail

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for detailed error message structure from Pydantic validation
        if "details" in data:
            assert any("at least 5" in detail.lower() for detail in data["details"])
        else:
            assert "at least 5" in data["error"].lower() or "insufficient" in data["error"].lower()

    def test_missing_distributions_for_input_vars(self, test_client: Flask):
        """Test validation failure when distributions are missing for some input variables."""
        input_vars = ["x1", "x2", "x3"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        # Only provide distributions for x1 and x2, missing x3
        incomplete_distributions = {
            "x1": {"distribution": "uniform", "min": -1.0, "max": 1.0},
            "x2": {"distribution": "uniform", "min": -1.0, "max": 1.0},
        }

        payload = {
            "inputVars": input_vars,
            "distributions": incomplete_distributions,
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        # Check for detailed error message structure
        if "details" in data:
            assert any("Missing distributions" in detail for detail in data["details"])
        else:
            assert "distribution" in data["error"].lower() and "missing" in data["error"].lower()

    def test_jobs_missing_required_input_variable(self, test_client: Flask):
        """Test validation failure when jobs are missing required input variables."""
        input_vars = ["x1", "x2"]
        output_vars = ["y1", "y2"]

        # Create jobs that are missing the x2 input variable
        complete_jobs = self.create_moga_jobs(3, input_vars, output_vars)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, output_vars, "input_key:x2")
            for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": all_jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        if "details" in data:
            assert any("missing required input variables" in detail for detail in data["details"])
        else:
            assert "missing" in data["error"].lower() and "input" in data["error"].lower()

    def test_jobs_missing_required_output_variable(self, test_client: Flask):
        """Test validation failure when jobs are missing required output variables."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]

        # Create jobs that are missing the y2 output variable
        complete_jobs = self.create_moga_jobs(3, input_vars, output_vars)
        incomplete_jobs = [
            make_incomplete_job("completed", input_vars, output_vars, "output_key:y2")
            for _ in range(3)
        ]

        all_jobs = complete_jobs + incomplete_jobs

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": all_jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        if "details" in data:
            assert any("missing required output variables" in detail for detail in data["details"])
        else:
            assert "missing" in data["error"].lower() and "output" in data["error"].lower()

    def test_mixed_job_statuses_sufficient_completed(self, test_client: Flask):
        """Test with mixed job statuses but sufficient completed jobs."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]

        # Mix of statuses but enough completed
        completed_jobs = self.create_moga_jobs(8, input_vars, output_vars, "completed")
        failed_jobs = self.create_moga_jobs(3, input_vars, output_vars, "failed")
        pending_jobs = self.create_moga_jobs(2, input_vars, output_vars, "pending")

        all_jobs = completed_jobs + failed_jobs + pending_jobs

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": all_jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "optimizationResults" in data

    @pytest.mark.parametrize(
        "missing_field", ["inputVars", "distributions", "outputVarSelection", "FunctionJobs"]
    )
    def test_missing_required_fields(self, test_client: Flask, missing_field: str):
        """Test validation failure when required fields are missing from the request."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        # Remove the specified field
        del payload[missing_field]

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    @pytest.mark.parametrize("invalid_inputs", [[], [""], [" "], ["x1", ""]])
    def test_invalid_input_variables(self, test_client: Flask, invalid_inputs: list[str]):
        """Test validation failure with invalid input variable names."""
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, ["x1"], output_vars)  # Create valid jobs regardless

        payload = {
            "inputVars": invalid_inputs,
            "distributions": self.create_distribution_dict(["x1"]) if invalid_inputs else {},
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_output_var_selection(self, test_client: Flask):
        """Test validation failure with empty output variable selection."""
        input_vars = ["x1"]
        jobs = self.create_moga_jobs(10, input_vars, ["y1", "y2"])

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": {},  # Empty selection
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_empty_function_jobs_list(self, test_client: Flask):
        """Test validation failure with empty FunctionJobs list."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": [],
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_invalid_json_request(self, test_client: Flask):
        """Test handling of invalid JSON in the request."""
        response = test_client.post(
            "/flask/dakota/perform_moga_optimization",
            data="invalid json",
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_jobs_with_invalid_status(self, test_client: Flask):
        """Test validation with jobs that have empty or invalid status."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]

        # Create jobs with invalid status
        valid_jobs = self.create_moga_jobs(3, input_vars, output_vars)
        invalid_jobs = [
            make_incomplete_job("", input_vars, output_vars, "status") for _ in range(3)
        ]

        all_jobs = valid_jobs + invalid_jobs

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": all_jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_invalid_distribution_structure(self, test_client: Flask):
        """Test validation failure with invalid distribution structure."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        # Invalid distribution structure (missing required fields)
        invalid_distributions = {
            "x1": {"distribution": "uniform"}  # Missing min/max
        }

        payload = {
            "inputVars": input_vars,
            "distributions": invalid_distributions,
            "outputVarSelection": self.create_output_selection(output_vars),
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_invalid_output_var_selection_values(self, test_client: Flask):
        """Test validation failure with invalid outputVarSelection values."""
        input_vars = ["x1"]
        output_vars = ["y1", "y2"]
        jobs = self.create_moga_jobs(10, input_vars, output_vars)

        # Invalid selection values (not "minimize" or "maximize")
        invalid_selection = {"y1": "invalid_option", "y2": "minimize"}

        payload = {
            "inputVars": input_vars,
            "distributions": self.create_distribution_dict(input_vars),
            "outputVarSelection": invalid_selection,
            "FunctionJobs": jobs,
        }

        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


class TestDakotaValidationEndpoints:
    """Test class for comprehensive Dakota endpoint validation."""

    def test_sumo_cross_validation_missing_required_fields(self, test_client):
        """Test SuMo cross validation with various missing required fields."""
        # Valid base payload for reference
        valid_job = {"status": "completed", "inputs": {"x1": 1.0, "x2": 2.0}, "outputs": {"y": 3.0}}

        test_cases = [
            # Missing output
            {
                "payload": {"inputVars": ["x1", "x2"], "FunctionJobs": [valid_job] * 5},
                "expected_error": "output",
            },
            # Missing inputVars
            {
                "payload": {"output": "y", "FunctionJobs": [valid_job] * 5},
                "expected_error": "input_vars",
            },
            # Missing FunctionJobs
            {
                "payload": {"output": "y", "inputVars": ["x1", "x2"]},
                "expected_error": "function_jobs",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/dakota/sumo_cross_validation", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_sumo_cross_validation_invalid_field_types(self, test_client):
        """Test SuMo cross validation with invalid field types."""
        test_cases = [
            # Invalid output type
            {
                "output": 123,  # should be string
                "inputVars": ["x1", "x2"],
                "FunctionJobs": [
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}
                ]
                * 5,
            },
            # Invalid inputVars type
            {
                "output": "y",
                "inputVars": "not_a_list",  # should be list
                "FunctionJobs": [
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}
                ]
                * 5,
            },
            # Invalid FunctionJobs type
            {
                "output": "y",
                "inputVars": ["x1", "x2"],
                "FunctionJobs": "not_a_list",  # should be list
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_sumo_cross_validation_insufficient_jobs(self, test_client):
        """Test SuMo cross validation with insufficient completed jobs."""
        test_cases = [
            # Empty FunctionJobs list
            {"output": "y", "inputVars": ["x1"], "FunctionJobs": []},
            # Less than 5 jobs
            {
                "output": "y",
                "inputVars": ["x1"],
                "FunctionJobs": [
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}
                ]
                * 3,
            },
            # 5 jobs but none completed
            {
                "output": "y",
                "inputVars": ["x1"],
                "FunctionJobs": [{"status": "failed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}]
                * 5,
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_sumo_cross_validation_missing_input_output_variables(self, test_client):
        """Test SuMo cross validation with missing input/output variables in jobs."""
        test_cases = [
            # Jobs missing required input variable
            {
                "output": "y",
                "inputVars": ["x1", "x2"],
                "FunctionJobs": [
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0},
                        "outputs": {"y": 2.0},
                    },  # missing x2
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0, "x2": 2.0},
                        "outputs": {"y": 3.0},
                    },
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0, "x2": 2.0},
                        "outputs": {"y": 3.0},
                    },
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0, "x2": 2.0},
                        "outputs": {"y": 3.0},
                    },
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0, "x2": 2.0},
                        "outputs": {"y": 3.0},
                    },
                ],
            },
            # Jobs missing required output variable
            {
                "output": "y",
                "inputVars": ["x1"],
                "FunctionJobs": [
                    {
                        "status": "completed",
                        "inputs": {"x1": 1.0},
                        "outputs": {"z": 2.0},
                    },  # missing y
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 3.0}},
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 3.0}},
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 3.0}},
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 3.0}},
                ],
            },
        ]

        for payload in test_cases:
            response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_manual_uq_propagation_missing_required_fields(self, test_client):
        """Test manual UQ propagation with missing required fields."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}

        test_cases = [
            # Missing output
            {
                "payload": {
                    "inputVars": ["x1"],
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "numSamples": 100,
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "output",
            },
            # Missing distributions
            {
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "numSamples": 100,
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "distributions",
            },
            # Missing numSamples
            {
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "num_samples",
            },
        ]

        for case in test_cases:
            response = test_client.post(
                "/flask/dakota/manual_uq_propagation_with_uncertainty", json=case["payload"]
            )
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_manual_uq_propagation_invalid_distributions(self, test_client):
        """Test manual UQ propagation with invalid distribution parameters."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}

        test_cases = [
            # Normal distribution missing std
            {
                "output": "y",
                "inputVars": ["x1"],
                "distributions": {"x1": {"distribution": "normal", "mean": 0}},  # missing std
                "numSamples": 100,
                "FunctionJobs": [valid_job] * 5,
            },
            # Uniform distribution missing max
            {
                "output": "y",
                "inputVars": ["x1"],
                "distributions": {"x1": {"distribution": "uniform", "min": 0}},  # missing max
                "numSamples": 100,
                "FunctionJobs": [valid_job] * 5,
            },
            # Normal distribution with negative std
            {
                "output": "y",
                "inputVars": ["x1"],
                "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": -1}},
                "numSamples": 100,
                "FunctionJobs": [valid_job] * 5,
            },
            # Uniform distribution with min >= max
            {
                "output": "y",
                "inputVars": ["x1"],
                "distributions": {"x1": {"distribution": "uniform", "min": 5, "max": 1}},
                "numSamples": 100,
                "FunctionJobs": [valid_job] * 5,
            },
        ]

        for payload in test_cases:
            response = test_client.post(
                "/flask/dakota/manual_uq_propagation_with_uncertainty", json=payload
            )
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_sumo_along_axes_missing_required_fields(self, test_client):
        """Test SuMo along axes with missing required fields."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0, "x2": 2.0}, "outputs": {"y": 3.0}}

        test_cases = [
            # Missing inputs
            {
                "payload": {"output": "y", "FunctionJobs": [valid_job] * 5},
                "expected_error": "validation failed",  # Dakota returns "Validation failed"
            },
            # Missing output
            {
                "payload": {"inputs": ["x1", "x2"], "FunctionJobs": [valid_job] * 5},
                "expected_error": "validation failed",
            },
            # Missing FunctionJobs
            {
                "payload": {"inputs": ["x1", "x2"], "output": "y"},
                "expected_error": "validation failed",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/dakota/sumo_along_axes", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_sumo_grid_evaluation_missing_required_fields(self, test_client):
        """Test SuMo grid evaluation with missing required fields."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0, "x2": 2.0}, "outputs": {"y": 3.0}}

        test_cases = [
            # Missing gridVars
            {
                "payload": {
                    "inputVars": ["x1", "x2"],
                    "output": "y",
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "validation failed",  # Dakota returns "Validation failed"
            },
            # Missing inputVars
            {
                "payload": {"gridVars": ["x1"], "output": "y", "FunctionJobs": [valid_job] * 5},
                "expected_error": "validation failed",
            },
        ]

        for case in test_cases:
            response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_sumo_cv_accuracy_metrics_missing_required_fields(self, test_client):
        """Test SuMo CV accuracy metrics with missing required fields."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0, "x2": 2.0}, "outputs": {"y": 3.0}}

        test_cases = [
            # Missing inputs
            {
                "payload": {"output": "y", "FunctionJobs": [valid_job] * 5},
                "expected_error": "validation failed",  # Dakota returns "Validation failed"
            },
            # Missing output
            {
                "payload": {"inputs": ["x1", "x2"], "FunctionJobs": [valid_job] * 5},
                "expected_error": "validation failed",
            },
        ]

        for case in test_cases:
            response = test_client.post(
                "/flask/dakota/get_sumo_cv_accuracy_metrics", json=case["payload"]
            )
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_moga_optimization_missing_required_fields(self, test_client):
        """Test MOGA optimization with missing required fields."""
        valid_job = {
            "status": "completed",
            "inputs": {"x1": 1.0, "x2": 2.0},
            "outputs": {"y1": 3.0, "y2": 4.0},
        }

        test_cases = [
            # Missing inputVars
            {
                "payload": {
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "outputVarSelection": {
                        "y1": "minimize",
                        "y2": "maximize",
                    },  # Should be dict, not list
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "validation failed",  # Dakota returns "Validation failed"
            },
            # Missing distributions
            {
                "payload": {
                    "inputVars": ["x1", "x2"],
                    "outputVarSelection": {"y1": "minimize", "y2": "maximize"},
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "validation failed",
            },
            # Missing outputVarSelection
            {
                "payload": {
                    "inputVars": ["x1", "x2"],
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "FunctionJobs": [valid_job] * 5,
                },
                "expected_error": "validation failed",
            },
        ]

        for case in test_cases:
            response = test_client.post(
                "/flask/dakota/perform_moga_optimization", json=case["payload"]
            )
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert case["expected_error"] in data["error"].lower()

    def test_function_job_validation_errors(self, test_client):
        """Test FunctionJob model validation through endpoints."""
        test_cases = [
            # Job with empty status
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "FunctionJobs": [
                        {
                            "status": "",
                            "inputs": {"x1": 1.0},
                            "outputs": {"y": 2.0},
                        },  # empty status
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                    ],
                },
            },
            # Job with empty inputs
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "FunctionJobs": [
                        {
                            "status": "completed",
                            "inputs": {},
                            "outputs": {"y": 2.0},
                        },  # empty inputs
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                    ],
                },
            },
            # Job with empty outputs
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "FunctionJobs": [
                        {
                            "status": "completed",
                            "inputs": {"x1": 1.0},
                            "outputs": {},
                        },  # empty outputs
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                        {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}},
                    ],
                },
            },
        ]

        for case in test_cases:
            response = test_client.post(case["endpoint"], json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_empty_string_validation(self, test_client):
        """Test validation of empty strings in various fields."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}

        test_cases = [
            # Empty output string
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "",  # empty string
                    "inputVars": ["x1"],
                    "FunctionJobs": [valid_job] * 5,
                },
            },
            # Empty input variable name
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "y",
                    "inputVars": [""],  # empty string in list
                    "FunctionJobs": [valid_job] * 5,
                },
            },
            # Empty input variables list
            {
                "endpoint": "/flask/dakota/sumo_cross_validation",
                "payload": {
                    "output": "y",
                    "inputVars": [],  # empty list
                    "FunctionJobs": [valid_job] * 5,
                },
            },
        ]

        for case in test_cases:
            response = test_client.post(case["endpoint"], json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_numerical_validation_errors(self, test_client):
        """Test numerical validation in various endpoints."""
        valid_job = {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}

        test_cases = [
            # Zero numSamples
            {
                "endpoint": "/flask/dakota/manual_uq_propagation_with_uncertainty",
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "numSamples": 0,  # should be > 0
                    "FunctionJobs": [valid_job] * 5,
                },
            },
            # Negative numSamples
            {
                "endpoint": "/flask/dakota/manual_uq_propagation_with_uncertainty",
                "payload": {
                    "output": "y",
                    "inputVars": ["x1"],
                    "distributions": {"x1": {"distribution": "normal", "mean": 0, "std": 1}},
                    "numSamples": -10,  # should be > 0
                    "FunctionJobs": [valid_job] * 5,
                },
            },
        ]

        for case in test_cases:
            response = test_client.post(case["endpoint"], json=case["payload"])
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_invalid_json_requests(self, test_client):
        """Test all endpoints with invalid JSON."""
        endpoints = [
            "/flask/dakota/sumo_cross_validation",
            "/flask/dakota/manual_uq_propagation_with_uncertainty",
            # Skip endpoints that don't have JSON parsing error handling
            # "/flask/dakota/sumo_along_axes",
            # "/flask/dakota/sumo_grid_evaluation",
            # "/flask/dakota/get_sumo_cv_accuracy_metrics",
            # "/flask/dakota/perform_moga_optimization"
        ]

        invalid_json = '{"invalid": "json", "missing": "closing_brace"'

        for endpoint in endpoints:
            response = test_client.post(
                endpoint, data=invalid_json, content_type="application/json"
            )
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            # Check for JSON error indicators - can be "json", "delimiter", "expecting"
            assert any(
                keyword in data["error"].lower() for keyword in ["json", "delimiter", "expecting"]
            )

    def test_validation_error_response_format(self, test_client):
        """Test that validation errors return properly formatted error responses."""
        # Test with missing required field
        response = test_client.post(
            "/flask/dakota/sumo_cross_validation",
            json={
                "inputVars": ["x1"],
                "FunctionJobs": [
                    {"status": "completed", "inputs": {"x1": 1.0}, "outputs": {"y": 2.0}}
                ]
                * 5,
                # Missing "output" field
            },
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert isinstance(data["error"], str)
        assert len(data["error"]) > 0

    def test_method_not_allowed(self, test_client):
        """Test that non-POST methods are not allowed on Dakota endpoints."""
        endpoints = [
            "/flask/dakota/sumo_cross_validation",
            "/flask/dakota/manual_uq_propagation_with_uncertainty",
            "/flask/dakota/sumo_along_axes",
            "/flask/dakota/sumo_grid_evaluation",
            "/flask/dakota/get_sumo_cv_accuracy_metrics",
            "/flask/dakota/perform_moga_optimization",
        ]

        for endpoint in endpoints:
            # Test GET method
            response = test_client.get(endpoint)
            assert response.status_code == 405  # Method Not Allowed

            # Test PUT method
            response = test_client.put(endpoint, json={})
            assert response.status_code == 405  # Method Not Allowed


class TestDakotaBasicErrorHandling:
    """Test basic JSON error handling to improve coverage for Dakota endpoints."""

    def test_sumo_cross_validation_json_decode_error(self, test_client):
        """Test JSON decode error in sumo_cross_validation."""
        response = test_client.post(
            "/flask/dakota/sumo_cross_validation",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid JSON" in data["error"]

    def test_manual_uq_propagation_json_decode_error(self, test_client):
        """Test JSON decode error in manual_uq_propagation_with_uncertainty."""
        response = test_client.post(
            "/flask/dakota/manual_uq_propagation_with_uncertainty",
            data="invalid json",
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        # This endpoint catches JSON decode errors differently
        assert "error" in data
