"""
Route tests for /flask/dakota/compute_correlation_indices (MC-through-surrogate).

V39 semantics were restored after the GH-Copilot audit of #661 caught the
post-migration degradation to table-mode correlations (the route silently
ignored `distributions`/`numSamples`/`seed`). The route now delegates to
`itis_sumo.api.evaluate_correlations`: the request's distributions are SAMPLED,
the job-fitted surrogate is evaluated once over that MC set, and coefficients
come back keyed by original names. These tests pin the HTTP contract around
that delegation — the DISTRIBUTION-SPEC forwarding (the ignored-fields class of
bug is exactly what a fake-call capture catches), the unchanged camelCase
response, and the 400 mapping of package input rejections.
"""

from typing import Any

import pytest
from flask import Flask
from itis_sumo.api import CorrelationResult, DistributionSpec, SumoInputError

pytestmark = pytest.mark.integration


def _jobs(n: int, inputs: list[str], output: str) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {k: float(i + j + 1) for j, k in enumerate(inputs)},
            "outputs": {output: float(i + 1) * 10},
        }
        for i in range(n)
    ]


def _result(inputs: list[str]) -> CorrelationResult:
    return CorrelationResult(
        response="y",
        coefficients={var: {"pearson": 0.9, "spearman": 0.8} for var in inputs},
        seed=3,
    )


def _payload(**extra: Any) -> dict:
    return {
        "inputVars": ["x1", "x2"],
        "output": "y",
        "distributions": {
            "x1": {"distribution": "uniform", "min": 0.0, "max": 10.0},
            "x2": {"distribution": "normal", "mean": 2.0, "std": 0.5},
        },
        "numSamples": 500,
        "FunctionJobs": _jobs(10, ["x1", "x2"], "y"),
        "seed": 3,
        **extra,
    }


def _capture(monkeypatch, captured: dict) -> None:
    def fake(*args: Any, **kwargs: Any):
        captured["args"] = args
        captured.update(kwargs)
        return _result(["x1", "x2"])

    monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.sumo_evaluate_correlations", fake)


class TestComputeCorrelationIndicesRoute:
    def test_mc_parameters_forwarded(self, test_client: Flask, monkeypatch):
        """V39: distributions/numSamples/seed are REAL inputs — each request
        distribution becomes a DistributionSpec on the engine call (the
        pre-fix route dropped all three)."""
        captured: dict = {}
        _capture(monkeypatch, captured)
        response = test_client.post("/flask/dakota/compute_correlation_indices", json=_payload())
        assert response.status_code == 200
        assert captured["distributions"] == {
            "x1": DistributionSpec(distribution="uniform", minimum=0.0, maximum=10.0),
            "x2": DistributionSpec(distribution="normal", mean=2.0, std=0.5),
        }
        assert captured["num_samples"] == 500
        assert captured["seed"] == 3
        assert captured["workspace"] is not None  # engine-bound: run dir exists

    def test_distribution_keys_outside_input_vars_dropped(self, test_client: Flask, monkeypatch):
        captured: dict = {}
        _capture(monkeypatch, captured)
        payload = _payload()
        payload["distributions"]["ghost"] = {"distribution": "uniform", "min": 0.0, "max": 1.0}
        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 200
        assert set(captured["distributions"]) == {"x1", "x2"}

    def test_fixed_response_contract(self, test_client: Flask, monkeypatch):
        """Unchanged camelCase contract: correlations.{var}.{pearson,spearman}
        keyed by ORIGINAL names (B15 lineage)."""
        _capture(monkeypatch, {})
        response = test_client.post("/flask/dakota/compute_correlation_indices", json=_payload())
        assert response.status_code == 200
        data = response.get_json()
        assert set(data) == {"correlations"}
        assert set(data["correlations"]) == {"x1", "x2"}
        assert set(data["correlations"]["x1"]) == {"pearson", "spearman"}

    def test_input_error_maps_to_400(self, test_client: Flask, monkeypatch):
        def fake(*args: Any, **kwargs: Any):
            raise SumoInputError("distributions must cover variables exactly")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.sumo_evaluate_correlations", fake)
        response = test_client.post("/flask/dakota/compute_correlation_indices", json=_payload())
        assert response.status_code == 400
        assert "cover variables exactly" in response.get_json()["error"]

    def test_moga_normal_distribution_rejected_400(self, test_client: Flask):
        """GH-Copilot #661 audit: a schema-valid normal MOGA distribution used
        to hit an assert in the route → HTTP 500. Now a clean model rejection."""
        payload = {
            "inputVars": ["x1"],
            "distributions": {"x1": {"distribution": "normal", "mean": 1.0, "std": 0.5}},
            "outputVarSelection": {"y": "minimize"},
            "FunctionJobs": _jobs(10, ["x1"], "y"),
        }
        response = test_client.post("/flask/dakota/perform_moga_optimization", json=payload)
        assert response.status_code == 400
        assert "uniform" in response.get_json()["error"]
