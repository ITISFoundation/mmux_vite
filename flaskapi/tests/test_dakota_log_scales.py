"""
V16 (log-scale passthrough): the FE's per-variable log flags reach itis-sumo.

The FE (jgo/fullstack-logscale consumer migration) sends
``inputLogScales``/``outputLogScales`` per dakota request; the routes fold
them into a single ``PreprocessingSpec(overrides={col: VariableSpec("log")})``
and hand it to the package, which owns log-space fit/sampling/search end to
end. These tests pin the adapter side of that contract:

* flags merge into ``preprocessing`` on EVERY delegating endpoint;
* an unscaled request forwards ``preprocessing=None`` (defaults stay
  auto-derived);
* ``output_log_scales[qoi]=True`` with a non-positive completed-job output
  is a clean client rejection (log undefined), never an engine crash.
"""

from typing import Any

import pytest
from flask import Flask
from itis_sumo.api import PreprocessingSpec, SumoInputError, VariableSpec

from mmux_flaskapi.blueprints.dakota import _preprocessing_for_log_scales

pytestmark = pytest.mark.integration


def _jobs(
    n: int, inputs: list[str], outputs: list[str], offset: float = 1.0, base: float = 1.0
) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {k: float(i + j + 1) for j, k in enumerate(inputs)},
            "outputs": {k: float(i + base) * offset for k in outputs},
        }
        for i in range(n)
    ]


class TestPreprocessingHelper:
    def test_flags_merge_into_log_overrides(self):
        spec = _preprocessing_for_log_scales({"x1": True, "x2": False}, {"y": True})
        assert isinstance(spec, PreprocessingSpec)
        assert spec.overrides == {"x1": VariableSpec(scale="log"), "y": VariableSpec(scale="log")}

    def test_nothing_flagged_stays_on_auto_defaults(self):
        assert _preprocessing_for_log_scales({}, {}) is None
        assert _preprocessing_for_log_scales({"x1": False}, {"y": False}) is None


class TestOutputPositivityGuard:
    """Model-level: log-fit output requires strictly positive observations."""

    def _payload(self, **extra: Any) -> dict:
        return {
            "inputVars": ["x1"],
            "inputs": ["x1"],
            "output": "y",
            "FunctionJobs": _jobs(10, ["x1"], ["y"], base=-1.0),  # y values include 0/neg
            **extra,
        }

    @pytest.mark.parametrize(
        "route",
        [
            "/flask/dakota/sumo_cross_validation",
            "/flask/dakota/sumo_along_axes",
            "/flask/dakota/sumo_grid_evaluation",
        ],
    )
    def test_non_positive_output_rejected(self, test_client: Flask, route: str):
        payload = self._payload(
            gridVars=["x1"], sliderValues={"x1": 1.0}, outputLogScales={"y": True}
        )
        response = test_client.post(route, json=payload)
        assert response.status_code in {400, 422}
        assert "log is undefined" in response.get_json()["error"]

    def test_positive_output_log_flag_accepted(self, test_client: Flask, monkeypatch):
        captured: dict[str, Any] = {}

        def fake(*args: Any, **kwargs: Any):
            captured.update(kwargs)
            raise SumoInputError("stop-after-capture")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.sumo_cross_validate", fake)
        jobs = _jobs(10, ["x1"], ["y"], offset=10.0)  # outputs 10..100, all > 0
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": jobs,
            "outputLogScales": {"y": True},
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400  # the deliberate capture stop
        assert captured["preprocessing"] == PreprocessingSpec(
            overrides={"y": VariableSpec(scale="log")}
        )


class TestPassthroughPerRoute:
    """Every delegating endpoint folds the flags into the package call."""

    LOGGED = {"inputLogScales": {"x1": True}, "outputLogScales": {"y": True}}
    EXPECTED = PreprocessingSpec(
        overrides={"x1": VariableSpec(scale="log"), "y": VariableSpec(scale="log")}
    )

    @pytest.fixture()
    def capture(self, monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
        captured: dict[str, Any] = {}

        def fake(*args: Any, **kwargs: Any):
            captured.update(kwargs)
            raise SumoInputError("stop-after-capture")

        for symbol in (
            "sumo_cross_validate",
            "sumo_evaluate_uncertainty",
            "sumo_evaluate_sobol",
            "sumo_evaluate_along_axes",
            "sumo_evaluate_grid",
            "sumo_evaluate_correlations",
            "sumo_optimize",
        ):
            monkeypatch.setattr(f"mmux_flaskapi.blueprints.dakota.{symbol}", fake)
        return captured

    def _payload(self, **extra: Any) -> dict:
        jobs = _jobs(10, ["x1"], ["y"], offset=10.0)
        return {
            "inputVars": ["x1"],
            "inputs": ["x1"],
            "output": "y",
            "numSamples": 32,
            "nHistograms": 12,
            "seed": 3,
            "gridVars": ["x1"],
            "sliderValues": {},
            "distributions": {"x1": {"distribution": "uniform", "min": 1.0, "max": 99.0}},
            "outputVarSelection": {"y": "minimize"},
            "FunctionJobs": jobs,
            **self.LOGGED,
            **extra,
        }

    @pytest.mark.parametrize(
        ("route", "keys"),
        [
            ("/flask/dakota/sumo_cross_validation", {"preprocessing"}),
            (
                "/flask/dakota/manual_uq_propagation_with_uncertainty",
                {"preprocessing"},
            ),
            ("/flask/dakota/compute_sobol_indices", {"preprocessing", "domains"}),
            ("/flask/dakota/sumo_along_axes", {"preprocessing"}),
            ("/flask/dakota/sumo_grid_evaluation", {"preprocessing"}),
            ("/flask/dakota/compute_correlation_indices", {"preprocessing", "distributions"}),
            ("/flask/dakota/perform_moga_optimization", {"preprocessing", "domains"}),
        ],
    )
    def test_route_forwards_log_overrides(
        self, test_client: Flask, capture: dict[str, Any], route: str, keys: set
    ):
        response = test_client.post(route, json=self._payload())
        assert response.status_code == 400  # the deliberate capture stop
        assert keys <= set(capture), route
        assert capture["preprocessing"] == self.EXPECTED

    def test_unscaled_request_forwards_none(self, test_client: Flask, capture: dict[str, Any]):
        payload = self._payload()
        payload.pop("inputLogScales")
        payload.pop("outputLogScales")
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 400
        assert capture["preprocessing"] is None

    def test_cv_metrics_legacy_log_field_maps_to_output_scale(
        self, test_client: Flask, monkeypatch
    ):
        captured: dict[str, Any] = {}

        def fake(*args: Any, **kwargs: Any):
            captured.update(kwargs)
            raise SumoInputError("stop-after-capture")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.sumo_evaluate_cv_metrics", fake)
        payload = {
            "inputs": ["x1"],
            "output": "y",
            "log": True,
            "FunctionJobs": _jobs(10, ["x1"], ["y"], offset=10.0),
        }
        response = test_client.post("/flask/dakota/get_sumo_cv_accuracy_metrics", json=payload)
        assert response.status_code == 400
        assert captured["preprocessing"] == PreprocessingSpec(
            overrides={"y": VariableSpec(scale="log")}
        )
