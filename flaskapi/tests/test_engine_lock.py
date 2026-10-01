"""
V49ad: all Dakota-bound package calls are serialized on the adapter ENGINE_LOCK.

The itis-sumo runner executes inside ``working_directory(...)`` (process-wide
cwd mutation for the run's duration), so two overlapping Dakota-bound calls
corrupt each other's paths — the e2e CV auto-detect pair firing alongside the
view's own propagation run reproduced it as nested run dirs and a missing
``predictions.dat``. These tests pin the adapter-side serialization contract:

* every Dakota-bound route invokes its package call while ENGINE_LOCK is held;
* in-memory helpers stay outside the lock (no needless serialization);
* ``_run_engine`` itself serializes concurrent callers (never overlapping).
"""

import threading
import time
from typing import Any

import pytest
from flask import Flask
from itis_sumo.api import SumoInputError

from mmux_flaskapi.blueprints import dakota

pytestmark = pytest.mark.integration


def _jobs(n: int, inputs: list[str], outputs: list[str]) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {k: float(i + j + 1) for j, k in enumerate(inputs)},
            "outputs": {k: float(i + 1) * 10 for k in outputs},
        }
        for i in range(n)
    ]


class TestRoutesHoldEngineLock:
    """Each Dakota-bound route must cross the package boundary under ENGINE_LOCK."""

    @pytest.fixture()
    def lock_held(self, monkeypatch: pytest.MonkeyPatch) -> dict[str, bool]:
        observed: dict[str, bool] = {}

        def fake(*args: Any, **kwargs: Any):
            observed["locked"] = dakota.ENGINE_LOCK.locked()
            raise SumoInputError("stop-after-capture")

        for symbol in (
            "sumo_cross_validate",
            "sumo_evaluate_uncertainty",
            "sumo_evaluate_sobol",
            "sumo_evaluate_along_axes",
            "sumo_evaluate_grid",
            "sumo_evaluate_cv_metrics",
            "sumo_optimize",
        ):
            monkeypatch.setattr(f"mmux_flaskapi.blueprints.dakota.{symbol}", fake)
        return observed

    def _payload(self, **extra: Any) -> dict:
        return {
            "inputVars": ["x1"],
            "inputs": ["x1"],
            "output": "y",
            "numSamples": 32,
            "nHistograms": 12,
            "seed": 3,
            "gridVars": ["x1"],
            "sliderValues": {},
            "log": True,
            "distributions": {"x1": {"distribution": "uniform", "min": 1.0, "max": 99.0}},
            "outputVarSelection": {"y": "minimize"},
            "FunctionJobs": _jobs(10, ["x1"], ["y"]),
            **extra,
        }

    @pytest.mark.parametrize(
        "route",
        [
            "/flask/dakota/sumo_cross_validation",
            "/flask/dakota/manual_uq_propagation_with_uncertainty",
            "/flask/dakota/compute_sobol_indices",
            "/flask/dakota/sumo_along_axes",
            "/flask/dakota/sumo_grid_evaluation",
            "/flask/dakota/get_sumo_cv_accuracy_metrics",
            "/flask/dakota/perform_moga_optimization",
        ],
    )
    def test_route_invokes_engine_under_lock(
        self, test_client: Flask, lock_held: dict[str, bool], route: str
    ):
        response = test_client.post(route, json=self._payload())
        assert response.status_code == 400  # the deliberate capture stop
        assert lock_held.get("locked") is True, f"{route} crossed the engine unlocked"


class TestInMemoryHelpersUnlockNotRequired:
    """compute_correlations is scipy-only: it must NOT be dragged through the lock."""

    def test_correlation_runs_without_lock(
        self, test_client: Flask, monkeypatch: pytest.MonkeyPatch
    ):
        locked: list[bool] = []

        def fake(*args: Any, **kwargs: Any):
            locked.append(dakota.ENGINE_LOCK.locked())
            raise SumoInputError("stop-after-capture")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.sumo_compute_correlations", fake)
        payload = {
            "inputVars": ["x1"],
            "inputs": ["x1"],
            "output": "y",
            "numSamples": 32,
            "seed": 3,
            "distributions": {"x1": {"distribution": "uniform", "min": 1.0, "max": 99.0}},
            "FunctionJobs": _jobs(10, ["x1"], ["y"]),
        }
        response = test_client.post("/flask/dakota/compute_correlation_indices", json=payload)
        assert response.status_code == 400
        assert locked == [False]


class TestRunEngineSerializes:
    def test_concurrent_callers_never_overlap(self):
        active = 0
        overlaps = 0
        gate = threading.Barrier(4, timeout=5)

        def body() -> None:
            nonlocal active, overlaps
            gate.wait()  # maximize the chance of overlap
            with dakota.ENGINE_LOCK:
                active += 1
                if active > 1:
                    overlaps += 1
                time.sleep(0.02)
                active -= 1

        threads = [threading.Thread(target=dakota._run_engine, args=(body,)) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert overlaps == 0
