"""
Tests for correlation/sensitivity indices (#470).

Covers the pure `compute_correlation_indices` function (synthetic correlated /
uncorrelated data) and the `/flask/dakota/compute_correlation_indices` endpoint.
"""

import numpy as np
import pandas as pd
import pytest
from flask import Flask

from mmux_flaskapi.dakota.funs_data_processing import compute_correlation_indices

# ------------------- Pure function: compute_correlation_indices -------------------


class TestComputeCorrelationIndices:
    """Unit tests for the pure correlation-computation function."""

    def test_perfectly_correlated_variable(self):
        """A linear input->output relationship yields pearson/spearman ≈ 1."""
        rng = np.random.default_rng(42)
        x1 = rng.uniform(-1, 1, size=200)
        output = 3.0 * x1 + 2.0  # perfectly linear, positive correlation

        correlations = compute_correlation_indices({"x1": x1.tolist()}, output.tolist(), ["x1"])

        assert correlations["x1"]["pearson"] == pytest.approx(1.0, abs=1e-6)
        assert correlations["x1"]["spearman"] == pytest.approx(1.0, abs=1e-6)

    def test_perfectly_anticorrelated_variable(self):
        """An inverse linear relationship yields pearson/spearman ≈ -1."""
        rng = np.random.default_rng(7)
        x1 = rng.uniform(-1, 1, size=200)
        output = -5.0 * x1 + 1.0

        correlations = compute_correlation_indices({"x1": x1.tolist()}, output.tolist(), ["x1"])

        assert correlations["x1"]["pearson"] == pytest.approx(-1.0, abs=1e-6)
        assert correlations["x1"]["spearman"] == pytest.approx(-1.0, abs=1e-6)

    def test_uncorrelated_variable_near_zero(self):
        """An input independent of the output yields correlation close to 0."""
        rng = np.random.default_rng(123)
        n = 5000
        x1 = rng.uniform(-1, 1, size=n)
        output = rng.uniform(-1, 1, size=n)  # independent of x1

        correlations = compute_correlation_indices({"x1": x1.tolist()}, output.tolist(), ["x1"])

        assert abs(correlations["x1"]["pearson"]) < 0.05
        assert abs(correlations["x1"]["spearman"]) < 0.05

    def test_multiple_input_vars_one_response_per_var(self):
        """One entry per requested input var, sensitive var stands out from noise vars."""
        rng = np.random.default_rng(1)
        n = 1000
        x_sensitive = rng.uniform(-1, 1, size=n)
        x_noise = rng.uniform(-1, 1, size=n)
        output = 10.0 * x_sensitive

        correlations = compute_correlation_indices(
            {"x_sensitive": x_sensitive.tolist(), "x_noise": x_noise.tolist()},
            output.tolist(),
            ["x_sensitive", "x_noise"],
        )

        assert set(correlations.keys()) == {"x_sensitive", "x_noise"}
        assert abs(correlations["x_sensitive"]["pearson"]) > 0.9
        assert abs(correlations["x_noise"]["pearson"]) < 0.2

    def test_accepts_dataframe_input(self):
        """DataFrame input is equivalent to a dict-of-lists input."""
        rng = np.random.default_rng(99)
        x1 = rng.uniform(-1, 1, size=100)
        output = 2.0 * x1

        df = pd.DataFrame({"x1": x1})
        correlations_df = compute_correlation_indices(df, output.tolist(), ["x1"])
        correlations_dict = compute_correlation_indices(
            {"x1": x1.tolist()}, output.tolist(), ["x1"]
        )

        assert correlations_df == correlations_dict

    def test_empty_input_vars_raises(self):
        """Empty input_vars list is rejected."""
        with pytest.raises(ValueError, match="input_vars cannot be empty"):
            compute_correlation_indices({"x1": [1.0, 2.0]}, [1.0, 2.0], [])

    def test_missing_variable_raises(self):
        """Requesting a variable absent from input_samples raises ValueError."""
        with pytest.raises(ValueError, match="not found in input samples"):
            compute_correlation_indices({"x1": [1.0, 2.0, 3.0]}, [1.0, 2.0, 3.0], ["x2"])

    def test_mismatched_lengths_raises(self):
        """Input/output sample length mismatch raises ValueError."""
        with pytest.raises(ValueError, match="Sample length mismatch"):
            compute_correlation_indices({"x1": [1.0, 2.0, 3.0]}, [1.0, 2.0], ["x1"])


# ------------------- Route: /flask/dakota/compute_correlation_indices -------------------


def _make_jobs(n: int, input_vars: list[str], output: str) -> list[dict]:
    jobs = []
    for _ in range(n):
        job = {
            "status": "completed",
            "inputs": {var: np.random.uniform(-1, 1) for var in input_vars},
            "outputs": {output: np.random.uniform(0, 10)},
        }
        jobs.append(job)
    return jobs


def _make_distributions(input_vars: list[str]) -> dict:
    return {
        var: {"distribution": "normal", "mean": 0.0, "std": 1.0, "min": -3.0, "max": 3.0}
        for var in input_vars
    }


class TestComputeCorrelationIndicesRoute:
    """Test suite for the /flask/dakota/compute_correlation_indices endpoint."""

    def test_correlation_indices_success(self, test_client: Flask):
        """Valid request returns 200 and one {pearson,spearman} entry per input var."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "correlations" in data
        assert set(data["correlations"].keys()) == set(input_vars)
        for var in input_vars:
            entry = data["correlations"][var]
            assert "pearson" in entry and isinstance(entry["pearson"], (int, float))
            assert "spearman" in entry and isinstance(entry["spearman"], (int, float))
            assert -1.0 <= entry["pearson"] <= 1.0
            assert -1.0 <= entry["spearman"] <= 1.0

    def test_correlation_indices_accepts_snake_case_payload(self, test_client: Flask):
        """Route accepts snake_case request payload (populate_by_name)."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "input_vars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "num_samples": 100,
            "seed": 1,
            "function_jobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "x1" in data["correlations"]

    def test_correlation_indices_preserves_multi_word_variable_names(self, test_client: Flask):
        """Regression (flaskapi/SPEC.md B15): a multi-word snake_case input var name
        must survive the response's snake_to_camel JSON serialization untouched -
        the frontend looks up `correlations[inputVars[i]]` by the exact var name it
        sent, so a mangled key (e.g. "sigma_blood" -> "sigmaBlood") makes the lookup
        silently miss and the plot render as all-zero bars."""
        input_vars = ["sigma_blood", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert set(data["correlations"].keys()) == set(input_vars)

    def test_missing_distribution_for_input_var(self, test_client: Flask):
        """Missing a distribution for a requested input var returns 400."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(["x1"]),  # missing x2
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_too_few_completed_jobs(self, test_client: Flask):
        """Fewer than 5 completed jobs returns 400."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(3, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 400

    def test_missing_required_field(self, test_client: Flask):
        """Missing required 'seed' field returns 400."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "seed" in data["error"]

    def test_evaluation_failure_propagates_500(self, test_client: Flask, monkeypatch):
        """If surrogate evaluation fails, the error is propagated as a 500."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Some Dakota error")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sumo", fail_eval)

        input_vars = ["x1"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Some Dakota error" in data["error"]

    def test_missing_prediction_key_raises_error(self, test_client: Flask, monkeypatch):
        """If evaluate_sumo doesn't return the expected '_hat' prediction key, returns 400."""

        def fake_eval(*args, **kwargs):
            return {}  # no "<output>_hat" key

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sumo", fake_eval)

        input_vars = ["x1"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 100,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "hat" in data["error"]
