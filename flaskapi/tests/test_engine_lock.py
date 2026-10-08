"""
V49ad: all Dakota-bound package calls are serialized on the adapter ENGINE_LOCK.

The itis-sumo runner executes inside ``working_directory(...)`` (process-wide
cwd mutation for the run's duration), so two overlapping Dakota-bound calls
corrupt each other's paths — the e2e CV auto-detect pair firing alongside the
view's own propagation run reproduced it as nested run dirs and a missing
``predictions.dat``. These tests pin the adapter-side serialization contract:

* every Dakota-bound route invokes its package call while ENGINE_LOCK is held
  (correlation joined this list when the route regained its MC-through-surrogate
  semantics — `evaluate_correlations` is engine-bound, unlike table-mode
  `compute_correlations`);
* in-memory helpers stay outside the lock (no needless serialization);
* ``_run_engine`` itself serializes concurrent callers. The overlap detector
  compares wall-clock intervals from OUTSIDE the lock — a barrier INSIDE the
  lock can never observe overlap and passes vacuously (GH-Copilot #663 audit);
  a control test proves the detector is sensitive.
"""

import threading
import time
from typing import Any

import pytest
from flask import Flask
from itis_sumo.api import SumoInputError
from pandas import DataFrame

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
            "sumo_evaluate_correlations",
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
            "/flask/dakota/compute_correlation_indices",
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
    """scipy-only helpers must NOT be dragged through the lock. Correlation
    used to live here; it left when the route regained MC-through-surrogate
    semantics (evaluate_correlations is engine-bound, V49ad)."""

    def test_lhs_generation_runs_without_lock(
        self, test_client: Flask, monkeypatch: pytest.MonkeyPatch
    ):
        locked: list[bool] = []

        def fake(*args: Any, **kwargs: Any):
            locked.append(dakota.ENGINE_LOCK.locked())
            return DataFrame({"x1": [0.1, 0.2, 0.3]})

        monkeypatch.setattr("mmux_flaskapi.blueprints.sampling.generate_lhs_samples", fake)
        # the oSPARC sampling-map leg is orthogonal to the lock question
        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.sampling._run_sampling_map",
            lambda function_uid, samples: {"jobId": "local"},
        )
        response = test_client.post(
            "/flask/sampling/lhs",
            json={
                "config": [{"variable": "x1", "start": 0.0, "end": 1.0}],
                "seed": 1,
                "n": 3,
                "funUid": "func-1",
            },
        )
        assert response.status_code == 200
        assert locked == [False]


def _overlapping_pairs(spans: list[tuple[float, float]]) -> int:
    """Count pairwise-overlapping [start, end) intervals."""
    overlaps = 0
    for i in range(len(spans)):
        for j in range(i + 1, len(spans)):
            a_start, a_end = spans[i]
            b_start, b_end = spans[j]
            if a_start < b_end and b_start < a_end:
                overlaps += 1
    return overlaps


class TestRunEngineSerializes:
    """Overlap must be detected from OUTSIDE the lock. The original test
    synchronized on a barrier *inside* the protected body: with the lock held,
    threads 2-4 queue at the entry, the barrier times out, and the assertion
    passes without ever exercising overlap (GH-Copilot #663 audit). Wall-clock
    intervals recorded per call answer the actual question — and the control
    test below proves the same detector goes RED when the lock is bypassed.
    """

    N = 4
    HOLD = 0.05

    def _spans(self, target: Any, gate: threading.Barrier | None) -> list[tuple[float, float]]:
        spans: list[tuple[float, float]] = []
        spans_lock = threading.Lock()

        def body() -> None:
            if gate is not None:
                gate.wait(timeout=5)
            start = time.monotonic()
            time.sleep(self.HOLD)  # hold long enough for overlap to be measurable
            with spans_lock:
                spans.append((start, time.monotonic()))

        threads = [threading.Thread(target=target, args=(body,)) for _ in range(self.N)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        return spans

    def test_concurrent_callers_never_overlap(self):
        # No gate: staggering is irrelevant — with HOLD long enough, ANY
        # unlocked interleaving of 4 threads over 50ms windows overlaps.
        spans = self._spans(dakota._run_engine, gate=None)
        assert len(spans) == self.N
        assert _overlapping_pairs(spans) == 0

    def test_detector_is_sensitive_without_the_lock(self):
        """Control: the SAME bodies + detector must report overlap when the
        lock is bypassed (⊥ a test that can only pass). The gate maximizes
        simultaneity here, outside any lock."""
        gate = threading.Barrier(self.N, timeout=5)
        spans = self._spans(lambda body: body(), gate=gate)
        assert len(spans) == self.N
        assert _overlapping_pairs(spans) > 0
