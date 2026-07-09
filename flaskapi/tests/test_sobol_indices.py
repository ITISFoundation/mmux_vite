"""
Tests for Sobol' sensitivity indices (#470).

Covers the pure `parse_sobol_indices_output` regex parser (against a realistic
captured Dakota `variance_based_decomp` stdout snippet) and the
`/flask/dakota/compute_sobol_indices` endpoint.
"""

import numpy as np
import pytest
from flask import Flask

from mmux_flaskapi.dakota.funs_evaluate import parse_sobol_indices_output

# Real Dakota stdout snippet captured from a live `sample_type lhs` +
# `variance_based_decomp` run against a surrogate model (Dakota 6.20+, #470).
REAL_DAKOTA_SOBOL_STDOUT_SNIPPET = """
<<<<< Function evaluation summary (INTERFACE): 100 total (100 new, 0 duplicate)
<<<<< Best parameters          =
                      1.0711133669e+00 x1
                      5.2638150750e-01 x2
                      8.0479536335e-01 x3
<<<<< Best objective function  =
                      5.1794538318e-02
<<<<< Best evaluation ID: 20

Global sensitivity indices for each response function:
y Sobol' indices:
                                  Main             Total
                      8.3982631145e-02  7.3695740747e-01 x1
                      2.6503163317e-01  2.3779101303e-01 x2
                      1.9299600903e-01  2.0105809727e-01 x3

<<<<< Iterator random_sampling completed.
<<<<< Environment execution completed.
"""

# Snippet with small-N Monte Carlo noise producing negative main-effect estimates,
# also captured from a live run (surrogate + variance_based_decomp).
REAL_DAKOTA_SOBOL_STDOUT_SNIPPET_NEGATIVE = """
Global sensitivity indices for each response function:
y Sobol' indices:
                                  Main             Total
                      1.2709708306e+00  1.0834803986e+00 x1
                     -8.9507032675e-03  1.1583617917e-02 x2
                     -4.0785181539e-03  9.4132349628e-05 x3

<<<<< Iterator random_sampling completed.
"""


# ------------------- Pure function: parse_sobol_indices_output -------------------


class TestParseSobolIndicesOutput:
    """Unit tests for the pure Dakota stdout parser."""

    def test_parses_real_dakota_stdout_snippet(self):
        """Extracts main/total per variable from a realistic captured stdout snippet."""
        result = parse_sobol_indices_output(REAL_DAKOTA_SOBOL_STDOUT_SNIPPET, ["x1", "x2", "x3"])

        assert result["x1"]["main"] == pytest.approx(8.3982631145e-02)
        assert result["x1"]["total"] == pytest.approx(7.3695740747e-01)
        assert result["x2"]["main"] == pytest.approx(2.6503163317e-01)
        assert result["x2"]["total"] == pytest.approx(2.3779101303e-01)
        assert result["x3"]["main"] == pytest.approx(1.9299600903e-01)
        assert result["x3"]["total"] == pytest.approx(2.0105809727e-01)

    def test_parses_negative_index_values(self):
        """Small-N Monte Carlo noise can produce small negative indices; must parse fine."""
        result = parse_sobol_indices_output(
            REAL_DAKOTA_SOBOL_STDOUT_SNIPPET_NEGATIVE, ["x1", "x2", "x3"]
        )

        assert result["x2"]["main"] == pytest.approx(-8.9507032675e-03)
        assert result["x3"]["total"] == pytest.approx(9.4132349628e-05)

    def test_subset_of_input_vars(self):
        """Only the requested input_vars are returned, even if more appear in the log."""
        result = parse_sobol_indices_output(REAL_DAKOTA_SOBOL_STDOUT_SNIPPET, ["x2"])

        assert set(result.keys()) == {"x2"}

    def test_empty_input_vars_raises(self):
        """Empty input_vars list is rejected."""
        with pytest.raises(ValueError, match="input_vars cannot be empty"):
            parse_sobol_indices_output(REAL_DAKOTA_SOBOL_STDOUT_SNIPPET, [])

    def test_missing_section_raises(self):
        """Log output without a 'Global sensitivity indices' section raises ValueError."""
        with pytest.raises(ValueError, match="Could not find 'Global sensitivity indices'"):
            parse_sobol_indices_output("some unrelated dakota output", ["x1"])

    def test_missing_variable_in_output_raises(self):
        """Requesting a variable absent from the parsed table raises ValueError."""
        with pytest.raises(ValueError, match="Could not find Sobol' indices"):
            parse_sobol_indices_output(REAL_DAKOTA_SOBOL_STDOUT_SNIPPET, ["x1", "x_missing"])


# ------------------- Route: /flask/dakota/compute_sobol_indices -------------------


def _make_jobs(n: int, input_vars: list[str], output: str) -> list[dict]:
    jobs = []
    rng = np.random.default_rng(0)
    for _ in range(n):
        job = {
            "status": "completed",
            "inputs": {var: float(rng.uniform(-1, 1)) for var in input_vars},
            "outputs": {output: float(rng.uniform(0, 10))},
        }
        jobs.append(job)
    return jobs


def _make_distributions(input_vars: list[str]) -> dict:
    return {
        var: {"distribution": "normal", "mean": 0.0, "std": 1.0, "min": -3.0, "max": 3.0}
        for var in input_vars
    }


class TestComputeSobolIndicesRoute:
    """Test suite for the /flask/dakota/compute_sobol_indices endpoint."""

    def test_sobol_indices_success(self, test_client: Flask):
        """Valid request returns 200 and one {main,total} entry per input var."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "sobol" in data
        assert set(data["sobol"].keys()) == set(input_vars)
        for var in input_vars:
            entry = data["sobol"][var]
            assert "main" in entry and isinstance(entry["main"], (int, float))
            assert "total" in entry and isinstance(entry["total"], (int, float))

    def test_sobol_indices_preserves_multi_word_variable_names(self, test_client: Flask):
        """Regression (flaskapi/SPEC.md B15): a multi-word snake_case input var name
        must survive the response's snake_to_camel JSON serialization untouched -
        the frontend looks up `sobol[inputVars[i]]` by the exact var name it sent,
        so a mangled key (e.g. "sigma_blood" -> "sigmaBlood") makes the lookup
        silently miss and the plot render as all-zero bars."""
        input_vars = ["sigma_blood", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert set(data["sobol"].keys()) == set(input_vars)

    def test_missing_distribution_for_input_var(self, test_client: Flask):
        """Missing a distribution for a requested input var returns 400."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(["x1"]),  # missing x2
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
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
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(3, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400

    def test_missing_required_field(self, test_client: Flask):
        """Missing required 'seed' field returns 400."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "seed" in data["error"]

    def test_seed_zero_rejected_with_clear_400(self, test_client: Flask):
        """Regression (flaskapi/SPEC.md B17): `seed` is written verbatim into a Dakota
        NIDR input file's `sampling` block for `variance_based_decomp`, and Dakota's
        own NIDR parser rejects `seed = 0` ("seed must be > 0"), aborting with an
        opaque top-level "Dakota aborted: Unknown error 254" 500. `seed=0` must be
        rejected up front with a clear 400 instead of reaching Dakota at all."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 0,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "seed" in data["error"].lower()

    def test_evaluation_failure_propagates_500(self, test_client: Flask, monkeypatch):
        """If Sobol' evaluation fails, the error is propagated as a 500."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Some Dakota error")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sobol_indices", fail_eval)

        input_vars = ["x1"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Some Dakota error" in data["error"]

    def test_normal_distribution_without_min_max_derives_bounds_from_mean_std(
        self, test_client: Flask
    ):
        """A normal distribution without min/max still works via mean +/- 3*std bounds."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": {"x1": {"distribution": "normal", "mean": 0.0, "std": 1.0}},
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "x1" in data["sobol"]
