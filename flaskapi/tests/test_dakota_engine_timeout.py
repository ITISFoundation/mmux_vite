"""
V51et: a hung engine call ⊥ wedge ENGINE_LOCK (B62et, issue #753).

CI run 39607253103: one Dakota subprocess (itis-sumo forks its
`ProcessPoolExecutor(1)` worker and waits with NO deadline) hung, held
ENGINE_LOCK forever, and starved every later `/flask/dakota/*` request for
the rest of the job — 5/20 e2e red while health stayed green. These tests
pin the adapter-side watchdog and the single-flight dedupe, with a MOCK
engine that blocks on an event (deterministic; ⊥ real Dakota):

* a hung engine call hits its class budget (fast MMUX_ENGINE_TIMEOUT_S,
  long MMUX_ENGINE_TIMEOUT_LONG_S for MOGA) → 500 error
  dialect naming the run dir, ENGINE_LOCK released, the NEXT request
  succeeds (queue drains — no rerun-the-CI-job recovery);
* the child-tree kill escalates SIGTERM → SIGKILL, scoped to THIS process's
  descendants (⊥ blanket-kill of unrelated Dakota — Tier-3 CI argument);
* concurrent identical calls execute the engine EXACTLY ONCE and both
  callers receive the leader's result (or its failure);
* concurrent DISTINCT calls stay serialized — V49ad semantics survive the
  timeout path (detector from test_engine_lock.py: wall-clock spans, never
  a barrier inside the lock, B37kl);
* env parsing + /health engine-queue observability.
"""

import threading
import time
from types import SimpleNamespace
from typing import Any

import pytest
from flask import Flask
from itis_sumo.api import SumoInputError

from mmux_flaskapi.blueprints import dakota
from mmux_flaskapi.blueprints.dakota_models import SumoCrossValidationRequest

pytestmark = pytest.mark.integration

CV_ROUTE = "/flask/dakota/sumo_cross_validation"


def _jobs(n: int, inputs: list[str], outputs: list[str], shift: float = 0.0) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {k: float(i + j + 1) + shift for j, k in enumerate(inputs)},
            "outputs": {k: float(i + 1) * 10 for k in outputs},
        }
        for i in range(n)
    ]


def _cv_payload(variant: float = 0.0) -> dict:
    """Schema-valid SuMoCrossValidationRequest (shape shared with test_engine_lock).

    `variant` shifts the job inputs — an ACTUAL payload difference: `seed`
    etc. are extra keys the CV model ignores, so varying them would not
    change the validated model (and thus not the dedupe key).
    """
    return {
        "inputVars": ["x1"],
        "output": "y",
        "FunctionJobs": _jobs(10, ["x1"], ["y"], shift=variant),
    }


def _cv_result(n: int = 3) -> SimpleNamespace:
    """Minimal duck-type of itis_sumo's CrossValidationResult (aligned, non-empty)."""
    return SimpleNamespace(observed=[1.0] * n, predicted=[2.0] * n, predicted_std=[0.1] * n)


@pytest.fixture
def fast_watchdog(monkeypatch: pytest.MonkeyPatch) -> None:
    """Watchdog armed at 1 s with sub-second graces (tests ⊥ wait 60+ s).

    Both classes armed: every route used here is fast-class, and pinning the
    LONG knob too means a misclassified call fails fast instead of waiting
    out the 3600 s default.
    """
    monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_S", "1")
    monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_LONG_S", "1")
    monkeypatch.setattr(dakota, "TERM_GRACE_S", 0.1)
    monkeypatch.setattr(dakota, "RECLAIM_GRACE_S", 0.3)


class TestEngineTimeout:
    """Acceptance criterion 1 + regression test 1: hang → timeout envelope → drain."""

    def test_hung_engine_times_out_next_request_succeeds(
        self, test_client: Flask, monkeypatch: pytest.MonkeyPatch, fast_watchdog: None
    ):
        unblock = threading.Event()

        def hung_engine(*args: Any, **kwargs: Any):
            # Simulates the stuck Dakota subprocess: never returns on its own
            # (capped at 10 s so the orphaned daemon thread can never outlive
            # the test session).
            unblock.wait(10)
            return _cv_result()

        monkeypatch.setattr(dakota, "sumo_cross_validate", hung_engine)
        try:
            started = time.monotonic()
            response = test_client.post(CV_ROUTE, json=_cv_payload())
            elapsed = time.monotonic() - started
        finally:
            unblock.set()

        assert response.status_code == 500
        body = response.get_json()
        # Repo error dialect (V48jd + handle_workflow_error) with the run dir.
        assert body["workflow"] == "flask_sumo_cross_validation"
        assert "MMUX_ENGINE_TIMEOUT_S=1" in body["error"]
        assert "cross_validation" in body["error"]  # names the run directory

        # Fail-fast: bounded by timeout+graces, ⊥ the old wait-for-CI-timeout.
        assert elapsed < 5.0

        # The wedge is over: the lock is free and the queue drains.
        assert not dakota.ENGINE_LOCK.locked()
        assert dakota.engine_queue_stats()["engine_active_runs"] == 0

        monkeypatch.setattr(dakota, "sumo_cross_validate", lambda *a, **k: _cv_result())
        follow_up = test_client.post(CV_ROUTE, json=_cv_payload(variant=1.0))
        assert follow_up.status_code == 200
        assert follow_up.get_json()["predicted"] == [2.0, 2.0, 2.0]

    def test_kill_escalates_sigterm_to_sigkill_scoped_to_child_tree(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        """_kill_engine_child_tree must TERM everything, SIGKILL the survivors,
        and touch ONLY descendants of THIS process (issue #753: ⊥
        blanket-kill — Tier-3 analytical runs are other processes)."""
        signaled: list[str] = []

        class _FakeProc:
            def __init__(self, pid: int, stubborn: bool):
                self.pid = pid
                self.stubborn = stubborn

            def terminate(self) -> None:
                signaled.append(f"term:{self.pid}")

            def kill(self) -> None:
                assert self.stubborn, "SIGKILL ⊥ for a child that already died"
                signaled.append(f"kill:{self.pid}")

        quick = _FakeProc(101, stubborn=False)
        stubborn = _FakeProc(102, stubborn=True)
        wait_calls: list[float] = []

        monkeypatch.setattr(
            dakota.psutil,
            "Process",
            lambda pid: SimpleNamespace(children=lambda recursive=True: [quick, stubborn]),
        )

        def fake_wait_procs(procs, timeout):
            wait_calls.append(timeout)
            return [quick], [stubborn]

        monkeypatch.setattr(dakota.psutil, "wait_procs", fake_wait_procs)
        monkeypatch.setattr(dakota, "TERM_GRACE_S", 0.5)

        killed = dakota._kill_engine_child_tree("some/run/dir")

        assert signaled == ["term:101", "term:102", "kill:102"]
        assert killed == [101, 102]
        assert wait_calls == [0.5]  # escalation ran under the TERM grace


class TestSingleFlight:
    """Acceptance criterion 2 + regression test 2: identical burst → ONE run."""

    @staticmethod
    def _post_payload(app: Flask, payload: dict) -> tuple[int, dict]:
        response = app.test_client().post(CV_ROUTE, json=payload)
        return response.status_code, response.get_json()

    @staticmethod
    def _wait_for_joiners(timeout: float = 5.0) -> None:
        """Block until a joiner has registered on the leader flight (deterministic
        handshake: ⊥ racing the release of a held engine against thread starts)."""
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            with dakota._FLIGHT_LOCK:
                waiting = sum(f.joiners for f in dakota._FLIGHTS.values())
            if waiting:
                return
            time.sleep(0.02)
        raise AssertionError("joiner never registered on the in-flight run")

    def test_identical_concurrent_calls_execute_engine_once(
        self, test_app: Flask, monkeypatch: pytest.MonkeyPatch
    ):
        calls: list[int] = []
        inside_engine = threading.Event()
        hold = threading.Event()

        def slow_engine(*args: Any, **kwargs: Any):
            calls.append(1)
            inside_engine.set()
            hold.wait(10)  # hold until the late joiner demonstrably arrived
            return _cv_result()

        monkeypatch.setattr(dakota, "sumo_cross_validate", slow_engine)

        results: dict[str, tuple[int, dict]] = {}
        leader = threading.Thread(
            target=lambda: results.update(leader=self._post_payload(test_app, _cv_payload()))
        )
        leader.start()
        assert inside_engine.wait(5), "leader never entered the engine"

        joiner = threading.Thread(
            target=lambda: results.update(joiner=self._post_payload(test_app, _cv_payload()))
        )
        joiner.start()
        self._wait_for_joiners()
        hold.set()
        leader.join(15)
        joiner.join(15)

        assert len(calls) == 1, f"engine ran {len(calls)}× — duplicate recomputed"
        assert results["leader"] == results["joiner"]
        assert results["joiner"][0] == 200
        assert results["joiner"][1]["observed"] == [1.0, 1.0, 1.0]

    def test_joiners_share_the_leader_failure(
        self, test_app: Flask, monkeypatch: pytest.MonkeyPatch
    ):
        calls: list[int] = []
        inside_engine = threading.Event()
        hold = threading.Event()

        def failing_engine(*args: Any, **kwargs: Any):
            calls.append(1)
            inside_engine.set()
            hold.wait(10)
            raise SumoInputError("engine says no")

        monkeypatch.setattr(dakota, "sumo_cross_validate", failing_engine)

        results: dict[str, tuple[int, dict]] = {}
        leader = threading.Thread(
            target=lambda: results.update(leader=self._post_payload(test_app, _cv_payload()))
        )
        leader.start()
        assert inside_engine.wait(5)
        joiner = threading.Thread(
            target=lambda: results.update(joiner=self._post_payload(test_app, _cv_payload()))
        )
        joiner.start()
        self._wait_for_joiners()
        hold.set()
        leader.join(15)
        joiner.join(15)

        assert len(calls) == 1
        # The leader's SumoInputError maps 400 for BOTH callers (shared failure).
        assert results["leader"][0] == 400
        assert results["joiner"][0] == 400
        assert "engine says no" in results["joiner"][1]["error"]

    def test_distinct_calls_are_not_deduped(self, test_app: Flask, monkeypatch: pytest.MonkeyPatch):
        lock = threading.Lock()
        calls: list[dict] = []

        def counting_engine(*args: Any, **kwargs: Any):
            with lock:
                calls.append(kwargs)
            time.sleep(0.05)
            return _cv_result()

        monkeypatch.setattr(dakota, "sumo_cross_validate", counting_engine)

        threads = [
            threading.Thread(
                target=lambda v=v: self._post_payload(test_app, _cv_payload(variant=v)),
            )
            for v in (0.0, 1.0)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join(15)

        assert len(calls) == 2, "distinct payloads must each execute"


class TestSerializationSurvivesWatchdog:
    """Regression test 3: V49ad stays TRUE with the timeout path armed.

    Concurrent DISTINCT calls (no dedupe sharing) must still run one-at-a-time
    under ENGINE_LOCK. Spans are recorded from inside the engine body but
    compared OUTSIDE any lock (B37kl detector lesson); default env ⇒
    MMUX_ENGINE_TIMEOUT_S=60, i.e. the watchdog/thread path is live.
    """

    N = 4
    HOLD = 0.05

    def test_concurrent_distinct_calls_never_overlap(self):
        spans: list[tuple[float, float]] = []
        spans_lock = threading.Lock()

        def timed_body(*args: Any, **kwargs: Any):
            start = time.monotonic()
            time.sleep(self.HOLD)
            with spans_lock:
                spans.append((start, time.monotonic()))
            return "value"

        def caller(i: int) -> None:
            dakota._run_engine(timed_body, f"arg-{i}")

        threads = [threading.Thread(target=caller, args=(i,)) for i in range(self.N)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(15)

        assert len(spans) == self.N
        overlaps = sum(
            1
            for i in range(self.N)
            for j in range(i + 1, self.N)
            if spans[i][0] < spans[j][1] and spans[j][0] < spans[i][1]
        )
        assert overlaps == 0, "V49ad overlap through the watchdog path"


class TestWatchdogKnobs:
    """Env knob + disabled path + observability (criteria 1 default, 3)."""

    def test_timeout_env_parsing(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("MMUX_ENGINE_TIMEOUT_S", raising=False)
        monkeypatch.delenv("MMUX_ENGINE_TIMEOUT_LONG_S", raising=False)
        assert dakota._engine_timeout_s() == 60.0  # fast default above slowest Tier-3 run
        assert dakota._engine_timeout_s(long_class=True) == 3600.0  # MOGA class
        for knob, long_class in (
            ("MMUX_ENGINE_TIMEOUT_S", False),
            ("MMUX_ENGINE_TIMEOUT_LONG_S", True),
        ):
            default = 60.0 if not long_class else 3600.0
            monkeypatch.setenv(knob, "0")
            assert dakota._engine_timeout_s(long_class) == 0.0  # 0 disables per class
            monkeypatch.setenv(knob, "-2")
            assert dakota._engine_timeout_s(long_class) == 0.0
            monkeypatch.setenv(knob, "7.5")
            assert dakota._engine_timeout_s(long_class) == 7.5
            monkeypatch.setenv(knob, "not-a-number")
            assert dakota._engine_timeout_s(long_class) == default  # typo ⊥ crash-loop
            for junk in ("nan", "NaN", "inf", "-inf", "Infinity"):
                monkeypatch.setenv(knob, junk)
                # float() accepts these; both classes silently kill the
                # watchdog (nan defeats `>0`, inf waits unboundedly).
                assert dakota._engine_timeout_s(long_class) == default
            monkeypatch.delenv(knob)
        # The knobs are independent: retuning one class ⊥ move the other.
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_S", "5")
        assert dakota._engine_timeout_s() == 5.0
        assert dakota._engine_timeout_s(long_class=True) == 3600.0

    def test_moga_workflow_selects_long_class(self, monkeypatch: pytest.MonkeyPatch):
        # Fast class DISABLED: only a correct long-class pick times out here.
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_S", "0")
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_LONG_S", "1")
        monkeypatch.setattr(dakota, "TERM_GRACE_S", 0.1)
        monkeypatch.setattr(dakota, "RECLAIM_GRACE_S", 0.2)
        with pytest.raises(
            dakota.EngineTimeoutError, match="exceeded MMUX_ENGINE_TIMEOUT_LONG_S=1s"
        ):
            dakota._run_engine(
                lambda *_, **__: time.sleep(5),
                workflow="perform_moga_optimization",
                workspace="unused-run-dir",
            )

    def test_plotting_workflow_keeps_fast_class(self, monkeypatch: pytest.MonkeyPatch):
        # Long class DISABLED: a misclassified plotting call would sleep the
        # full 4 s and RETURN instead of raising — pytest.raises fails fast
        # either way (⊥ hang if the class table inverts).
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_S", "1")
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_LONG_S", "0")
        monkeypatch.setattr(dakota, "TERM_GRACE_S", 0.1)
        monkeypatch.setattr(dakota, "RECLAIM_GRACE_S", 0.2)
        with pytest.raises(dakota.EngineTimeoutError, match="exceeded MMUX_ENGINE_TIMEOUT_S=1s"):
            dakota._run_engine(
                lambda *_, **__: time.sleep(4),
                workflow="sumo_along_axes",
                workspace="unused-run-dir",
            )

    def test_timeout_zero_runs_engine_inline_and_serves(
        self, test_client: Flask, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("MMUX_ENGINE_TIMEOUT_S", "0")
        calls: list[int] = []
        monkeypatch.setattr(
            dakota,
            "sumo_cross_validate",
            lambda *a, **k: (calls.append(1), _cv_result())[1],
        )
        response = test_client.post(CV_ROUTE, json=_cv_payload())
        assert response.status_code == 200
        assert calls == [1]

    def test_health_exposes_engine_queue_state(self, test_client: Flask):
        response = test_client.get("/flask/deployment/health")
        assert response.status_code == 200
        body = response.get_json()
        assert body["status"] == "healthy"
        # Idle in-suite: the queue must be visibly empty, not absent. Keys are
        # camelCase on the wire — the shared after_request serializer rewrites
        # engine_queue_stats()'s snake_case names like every other response.
        assert body["engineBusy"] is False
        assert body["engineActiveRuns"] == 0
        assert body["engineQueueDepth"] == 0
        # Effective class budgets are visible too (V51et): which knob owns a
        # future timeout envelope is a read, not a guess from a 500 message.
        assert body["engineTimeoutFastS"] == dakota.ENGINE_TIMEOUT_FAST_S_DEFAULT
        assert body["engineTimeoutLongS"] == dakota.ENGINE_TIMEOUT_LONG_S_DEFAULT


class TestDedupeKey:
    def test_key_is_stable_and_content_addressed(self):
        # Direct snake_case validation (the HTTP route camel-normalizes first).
        def model(variant: float) -> SumoCrossValidationRequest:
            return SumoCrossValidationRequest.model_validate(
                {
                    "output": "y",
                    "input_vars": ["x1"],
                    "function_jobs": _jobs(10, ["x1"], ["y"], shift=variant),
                }
            )

        model_a, model_b, model_c = model(0.0), model(0.0), model(1.0)
        assert dakota._dedupe_key("sumo_cross_validation", model_a) == dakota._dedupe_key(
            "sumo_cross_validation", model_b
        )
        assert dakota._dedupe_key("sumo_cross_validation", model_a) != dakota._dedupe_key(
            "sumo_cross_validation", model_c
        )
        # The workflow tag separates same-payload calls to different engines.
        assert dakota._dedupe_key("other_workflow", model_a) != dakota._dedupe_key(
            "sumo_cross_validation", model_a
        )
