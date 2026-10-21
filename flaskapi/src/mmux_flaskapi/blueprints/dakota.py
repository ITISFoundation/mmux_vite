from __future__ import annotations

import dataclasses
import hashlib
import json
import logging
import os
import threading
import traceback
from collections.abc import Callable
from pathlib import Path
from typing import Any, NoReturn, TypeVar

import pandas as pd
import psutil

#
from flask import Blueprint, abort, jsonify, make_response
from itis_sumo.api import (
    DistributionSpec,
    DomainSpec,
    PreprocessingSpec,
    SumoInputError,
    SumoResultError,
    VariableSpec,
)
from itis_sumo.api import cross_validate as sumo_cross_validate
from itis_sumo.api import evaluate_along_axes as sumo_evaluate_along_axes
from itis_sumo.api import evaluate_correlations as sumo_evaluate_correlations
from itis_sumo.api import evaluate_cv_metrics as sumo_evaluate_cv_metrics
from itis_sumo.api import evaluate_grid as sumo_evaluate_grid
from itis_sumo.api import evaluate_sobol as sumo_evaluate_sobol
from itis_sumo.api import evaluate_uncertainty as sumo_evaluate_uncertainty
from itis_sumo.api import optimize as sumo_optimize
from pydantic import ValidationError

#
from mmux_flaskapi.blueprints.dakota_models import (
    CorrelationIndicesRequest,
    CorrelationIndicesResponse,
    CVAccuracyMetrics,
    FunctionJob,
    JobVariableSelection,
    ManualUQWithUncertaintyRequest,
    MOGAOptimizationRequest,
    MOGAOptimizationResponse,
    SobolIndicesRequest,
    SobolIndicesResponse,
    SumoAlongAxesRequest,
    SumoAlongAxesResponse,
    SumoCrossValidationRequest,
    SumoCrossValidationResponse,
    SumoCVAccuracyMetricsRequest,
    SumoCVAccuracyMetricsResponse,
    SumoGridEvaluationRequest,
    SumoGridEvaluationResponse,
    UQWithUncertaintyResponse,
    required_completed_jobs,
)
from mmux_flaskapi.utils.api_endpoint import api_endpoint
from mmux_flaskapi.utils.helpers import create_run_dir
from mmux_flaskapi.utils.json_serializer import parse_request_model

_logger = logging.getLogger(__name__)
dakota_bp = Blueprint("dakota", __name__)

DAKOTA_RUNS_DIR = Path(
    os.environ.get("DAKOTA_RUNS_DIR", Path(__file__).resolve().parents[3] / "runs_dakota")
)
_logger.info(f"Saving runs in {DAKOTA_RUNS_DIR}")
DAKOTA_RUNS_DIR.mkdir(parents=True, exist_ok=True)
assert DAKOTA_RUNS_DIR.is_dir(), "Dakota Runs Dir does not exist!!"

# V49ad: the itis-sumo Dakota runner executes inside `working_directory(...)`,
# which mutates the PROCESS-WIDE cwd for the duration of a run. Two overlapping
# Dakota-bound calls therefore corrupt each other's paths (observed as nested
# run dirs and `predictions.dat does not exist` under concurrent CV + UQ). The
# adapter serializes all Dakota-bound package calls on this lock; in-memory
# helpers (compute_correlations, generate_lhs_samples) stay outside it.
# ⊥ assume workspace paths alone make concurrent runs safe. The upstream fix
# (cwd-independent execution, e.g. subprocess cwd=) would retire this lock.
ENGINE_LOCK = threading.Lock()

_T = TypeVar("_T")

########################################################
# Engine watchdog + single-flight (V51et, B62et, issue #753)
########################################################
# itis-sumo runs Dakota in a fresh `ProcessPoolExecutor(1)` per call and waits
# on it with NO deadline (core/dakota_object.future_exec): one hung Dakota
# child blocks the engine thread inside that wait, and today it would hold
# ENGINE_LOCK forever — every later /flask/dakota/* request starves while
# non-engine routes keep answering (observed: run 39607253103, 5/20 e2e red
# for ~7 min, only `gh run rerun` recovered). The watchdog below bounds each
# call, kills ONLY the timed-out run's child tree, and fails exactly that one
# request. A plain `concurrent.futures` timeout cannot do this (it abandons
# the blocked thread, the hung child, AND keeps the lock, B62et) — hence:
# the request thread keeps ENGINE_LOCK ownership, the engine body runs on a
# daemon thread, and on expiry we SIGTERM→SIGKILL the hung run's process tree
# (itis-sumo's wait then unwinds with BrokenProcessPool) and reclaim.

#: Per-engine-call budget under ENGINE_LOCK, read from `MMUX_ENGINE_TIMEOUT_S`
#: per call (⊥ import-time capture: ops and tests retune without a redeploy).
#: Sized far above the slowest legitimate run (CI Tier-3 analytical suite
#: ~43 s end-to-end, a single Dakota run ~90 ms); `0` disables the watchdog
#: and reproduces the pre-#753 wait-forever semantics.
ENGINE_TIMEOUT_S_DEFAULT = 300.0

#: SIGTERM → SIGKILL escalation window for the child-tree kill (tests shrink
#: these two via monkeypatch; module globals so the watchdog reads them live).
TERM_GRACE_S = 5.0

#: After the kill, how long to let the engine thread unwind before the request
#: thread releases ENGINE_LOCK anyway. An orphan past this grace is a dead
#: thread as far as the queue cares: its process tree is killed, the next run
#: owns the lock, and the daemon thread dies with the worker process.
RECLAIM_GRACE_S = 10.0

#: Upper bound of joiners sharing one in-flight run (B34xx-class duplicate
#: bursts queue behind the leader instead of recomputing); an overflow caller
#: runs independently rather than growing the wait set unboundedly.
MAX_JOINERS_PER_RUN = 32


class EngineTimeoutError(RuntimeError):
    """Engine call exceeded MMUX_ENGINE_TIMEOUT_S; its child tree was killed.

    A RuntimeError on purpose (⊥ ValueError/SumoInputError): the dakota
    routes' 4xx branches must NOT swallow it — it falls through to the routes'
    catch-all and surfaces as the repo-standard 500 `{"error", "workflow"}`
    envelope (V48jd) naming the run directory and killed pids.
    """


def _engine_timeout_s() -> float:
    """Resolve the per-call engine budget from the environment (V51et).

    Unset/blank → ENGINE_TIMEOUT_S_DEFAULT; unparsable → default + WARNING
    (⊥ crash-looping the whole blueprint over a typo'd knob); <=0 → 0.0,
    disabling the watchdog.
    """
    raw = os.environ.get("MMUX_ENGINE_TIMEOUT_S", "").strip()
    if not raw:
        return ENGINE_TIMEOUT_S_DEFAULT
    try:
        timeout = float(raw)
    except ValueError:
        _logger.warning(
            "Ignoring MMUX_ENGINE_TIMEOUT_S=%r (not a number); using %gs",
            raw,
            ENGINE_TIMEOUT_S_DEFAULT,
        )
        return ENGINE_TIMEOUT_S_DEFAULT
    if timeout <= 0:
        return 0.0
    return timeout


def _kill_engine_child_tree(run_dir: Any) -> list[int]:
    """Kill the process tree of the timed-out engine run — and nothing else.

    Scope: the children (recursive) of THIS process. itis-sumo forks its
    `ProcessPoolExecutor(1)` worker from here and the Dakota binary is that
    worker's child, so every process visible under this pid while the lock is
    held belongs to the run that timed out — V49ad serialization rules out a
    sibling engine run in the same process. Other Dakota processes on the
    host (e.g. Tier-3 analytical tests in separate pytest workers) are NOT
    children of this process and are never touched (⊥ blanket-kill, #753).
    SIGTERM first, then SIGKILL on survivors (a child ignoring SIGTERM must
    still die — the request path returns and the lock releases either way).
    Returns every pid that was signalled.
    """
    try:
        descendants = psutil.Process(os.getpid()).children(recursive=True)
    except psutil.Error as exc:
        _logger.error(
            "engine timeout: cannot enumerate child processes (%s); run dir %s", exc, run_dir
        )
        return []

    terminated: list[psutil.Process] = []
    for proc in descendants:
        try:
            proc.terminate()
            terminated.append(proc)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    gone, alive = psutil.wait_procs(terminated, timeout=TERM_GRACE_S)
    killed = [proc.pid for proc in gone]
    for proc in alive:
        try:
            proc.kill()
            killed.append(proc.pid)
        except psutil.NoSuchProcess:
            continue
    return sorted(set(killed))


def _call_engine_guarded(
    fn: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any], timeout_s: float
) -> Any:
    """One engine call with a hard deadline and a scoped child-tree kill.

    ENGINE_LOCK stays owned by the CALLING (request) thread across this
    helper — V49ad serialization keeps covering the whole run — while the
    engine body runs on a daemon thread so the request thread is free to
    enforce the deadline: on expiry it kills the hung run's child tree (which
    unblocks itis-sumo's ProcessPoolExecutor wait with BrokenProcessPool),
    grants a short reclaim grace, then releases the lock and raises
    EngineTimeoutError. Even a pathologically stuck engine thread can no
    longer wedge the queue behind it (V51et; B62et names the
    abandon-the-thread design this deliberately replaces).
    """
    run_dir = kwargs.get("workspace")
    box: dict[str, Any] = {}
    done = threading.Event()

    def _body() -> None:
        try:
            box["value"] = fn(*args, **kwargs)
        except BaseException as exc:  # re-raised verbatim on the request thread
            box["error"] = exc
        finally:
            done.set()

    threading.Thread(target=_body, name="mmux-engine-run", daemon=True).start()

    if done.wait(timeout_s):
        if "error" in box:
            raise box["error"]
        return box["value"]

    killed_pids = _kill_engine_child_tree(run_dir)
    recovered = done.wait(RECLAIM_GRACE_S)
    _logger.error(
        "Dakota engine timeout: run exceeded MMUX_ENGINE_TIMEOUT_S=%gs (run dir %s); "
        "killed pids %s; engine thread %s after the kill.",
        timeout_s,
        run_dir,
        killed_pids or "none (engine hung before/without spawning a child)",
        "recovered" if recovered else "still stuck — orphaned, its run tree is dead",
    )
    detail = "none — engine hung before spawning a child process"
    raise EngineTimeoutError(
        f"Dakota engine run exceeded MMUX_ENGINE_TIMEOUT_S={timeout_s:g}s and was "
        f"killed (run dir: {run_dir}, killed pids: {killed_pids or detail}). "
        "The engine queue was released; retry the request."
    )


class _Flight:
    """One shared in-flight engine run for single-flight dedupe (V51et)."""

    def __init__(self) -> None:
        self.done = threading.Event()
        self.value: Any = None
        self.error: BaseException | None = None
        # Observability only (engine_queue_stats); joiners mutate it without
        # a lock — a racing read may transiently miscount one waiter, no more.
        self.joiners = 0


_FLIGHT_LOCK = threading.Lock()
_FLIGHTS: dict[str, _Flight] = {}


def _dedupe_key(workflow: str | None, model: Any) -> str:
    """Stable key for one request shape: (workflow, hash of validated payload).

    Hashes the *validated* request model (its normalized JSON), so two
    clients that differ only in key order/whitespace still dedupe, and the
    engine-side `workspace=` run dir — unique per request — is deliberately
    NOT part of the key (it would make every call look distinct and
    neutralize the dedupe, #753).
    """
    payload = json.dumps(model.model_dump(mode="json"), sort_keys=True, default=str)
    return f"{workflow or ''}:{hashlib.sha256(payload.encode()).hexdigest()}"


def _await_flight(flight: _Flight) -> Any:
    """Joiner side of single-flight: wait for the leader, inherit its outcome.

    No second deadline: the leader is itself bounded by the engine watchdog
    (its own timeout + kill + reclaim graces, V51et), so the wait is bounded
    transitively; with MMUX_ENGINE_TIMEOUT_S=0 it degrades to exactly the
    pre-#753 wait-forever semantics the leader opted into.
    """
    flight.done.wait()
    flight.joiners -= 1
    if flight.error is not None:
        raise flight.error
    return flight.value


def engine_queue_stats() -> dict[str, Any]:
    """Engine-queue snapshot for the health route (V51et, #753 criterion 3).

    `engine_busy` = ENGINE_LOCK currently held by a run; `engine_active_runs`
    = registered in-flight leader runs; `engine_queue_depth` = joiners waiting
    to share one. Lets CI/ops SEE a wedge instead of inferring it from
    per-test timeouts.
    """
    with _FLIGHT_LOCK:
        active_runs = len(_FLIGHTS)
        waiting = sum(flight.joiners for flight in _FLIGHTS.values())
    return {
        "engine_busy": ENGINE_LOCK.locked(),
        "engine_active_runs": active_runs,
        "engine_queue_depth": waiting,
    }


def _run_engine(
    fn: Callable[..., _T],
    *args: Any,
    workflow: str | None = None,
    dedupe: Any = None,
    **kwargs: Any,
) -> _T:
    """Call an itis-sumo workflow under ENGINE_LOCK (V49ad).

    One Dakota-bound run per process at a time: the package's runner chdirs
    for the duration of a run, so overlapping calls corrupt each other.

    On top of the serialization the call gets (V51et, issue #753):
    * a hard timeout (`MMUX_ENGINE_TIMEOUT_S`, default 300 s, 0 disables)
      enforced by the watchdog in `_call_engine_guarded` — on expiry the
      hung run's child tree is killed, ENGINE_LOCK is released, and THIS
      request alone fails with EngineTimeoutError (→ 500 dialect);
    * single-flight dedupe: with a route-supplied `dedupe` model, concurrent
      calls whose (workflow, payload) hash identically share ONE execution —
      late joiners wait on the in-flight run and receive its result or its
      failure (B34xx duplicate bursts cost one run, not N).
    """
    timeout_s = _engine_timeout_s()
    key = _dedupe_key(workflow, dedupe) if dedupe is not None else None

    flight: _Flight | None = None
    joined: _Flight | None = None
    if key is not None:
        with _FLIGHT_LOCK:
            existing = _FLIGHTS.get(key)
            if existing is None:
                flight = _Flight()
                _FLIGHTS[key] = flight  # this caller is the leader
            elif existing.joiners < MAX_JOINERS_PER_RUN:
                existing.joiners += 1
                joined = existing
            # else: joiner cap hit — run independently (bounded wait set).
    if joined is not None:
        return _await_flight(joined)

    try:
        with ENGINE_LOCK:
            if timeout_s > 0:
                value = _call_engine_guarded(fn, args, kwargs, timeout_s)
            else:
                value = fn(*args, **kwargs)
    except BaseException as exc:
        if flight is not None:
            flight.error = exc
        raise
    else:
        if flight is not None:
            flight.value = value
        return value
    finally:
        if flight is not None:
            with _FLIGHT_LOCK:
                _FLIGHTS.pop(key, None)
            flight.done.set()


########################################################
# Utility Functions for Advanced Error Handling and Data Preprocessing
########################################################


def _jobs_to_df(
    jobs: list[FunctionJob], input_vars: list[str], output_vars: list[str]
) -> pd.DataFrame:
    """
    Convert list of FunctionJob objects to DataFrame.

    Args:
        jobs: List of FunctionJob objects
        input_vars: Requested input variable names
        output_vars: Requested output variable names

    Returns:
        DataFrame with the requested inputs and outputs

    Raises:
        ValueError: If a job is missing requested inputs or outputs
    """
    try:
        validated_selection = JobVariableSelection.model_validate(
            {
                "jobs": jobs,
                "input_vars": input_vars,
                "output_vars": output_vars,
                "minimum_completed_jobs": required_completed_jobs(input_vars),
            }
        )
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc

    _logger.debug("N Completed jobs: %s", len(validated_selection.completed_jobs))
    return pd.DataFrame(validated_selection.to_records())


def handle_workflow_error(e: Exception, workflow_name: str, status_code: int = 500) -> NoReturn:
    """
    Standardized error handling for Dakota workflows.

    Args:
        e: The exception
        workflow_name: Name of the workflow for logging
        status_code: HTTP status code to return
    """
    traceback_str = traceback.format_exc()
    _logger.error(f"Error in {workflow_name}: {e}")
    _logger.debug(f"Traceback:\n{traceback_str}")

    response_payload = {
        "error": str(e),
        "workflow": workflow_name,
    }

    abort(make_response(jsonify(response_payload), status_code))


def _preprocessing_for_log_scales(
    input_log_scales: dict[str, bool],
    output_log_scales: dict[str, bool],
) -> PreprocessingSpec | None:
    """Fold the request's per-variable log flags into a itis-sumo spec (V16).

    Flagged columns become ``VariableSpec(scale="log")`` overrides; the package
    then owns everything downstream — log-space fit, log-uniform UQ draws,
    log-uniform Sobol boxes, log search domains, delta-method std inverses
    (its V44ls/V21pf). Returns None when nothing is flagged, keeping the
    package's auto-derived defaults on the untouched columns.
    """
    log_scales = {**input_log_scales, **output_log_scales}
    overrides = {var: VariableSpec(scale="log") for var, flag in log_scales.items() if flag}
    return PreprocessingSpec(overrides=overrides) if overrides else None


########################################################
# Flask Endpoints
########################################################


@dakota_bp.route("/sumo_cross_validation", methods=["POST"])
@api_endpoint
def flask_sumo_cross_validation():
    """
    Perform SUMO cross-validation to assess surrogate model accuracy.

    Delegates to itis_sumo.api.cross_validate, which owns preprocessing, Dakota
    configuration, and inverse transforms end-to-end (SPEC V16qf). Returns
    cross-validation predictions with uncertainty estimates in original
    variable names.
    """
    _logger.debug("Starting flask function: flask_sumo_cross_validation")
    _logger.debug("Cwd: " + str(Path.cwd()))
    validated_request = parse_request_model(SumoCrossValidationRequest)

    # At this point, all validation is complete and we have a validated request object
    try:
        jobs: list[FunctionJob] = validated_request.function_jobs
        input_vars: list[str] = validated_request.input_vars
        output_var: str = validated_request.output

        # Create run directory (kept for debugging; itis-sumo persists its
        # working files here instead of a self-cleaning temp dir).
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "cross_validation")

        samples = _jobs_to_df(jobs, input_vars, [output_var])

        result = _run_engine(
            sumo_cross_validate,
            samples,
            input_vars,
            output_var,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="sumo_cross_validation",
            dedupe=validated_request,
        )

        # Fixed-field contract (FE sumoValidation.ts destructures
        # {observed, predicted}): the response is NOT keyed by the QoI name;
        # the model's validators reject empty/misaligned arrays.
        if result.predicted_std is None:
            raise ValueError("Cross-validation did not return prediction standard deviations")
        validated_response = SumoCrossValidationResponse(
            observed=result.observed,
            predicted=result.predicted,
            predicted_std=result.predicted_std,
        )

        _logger.debug("Cross-validation completed successfully!")
        return jsonify(validated_response.model_dump())
    except ValidationError as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 422)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_sumo_cross_validation", 500)


@dakota_bp.route("/manual_uq_propagation_with_uncertainty", methods=["POST"])
@api_endpoint
def flask_manual_uq_propagation_with_uncertainty():
    """
    Perform manual UQ propagation with uncertainty quantification.

    Delegates to itis_sumo.api.evaluate_uncertainty, which owns sampling,
    surrogate evaluation, and the histogram/boxplot summary end-to-end in the
    response's original units (SPEC V16qf).
    """
    _logger.debug("Starting flask function: flask_manual_uq_propagation_with_uncertainty")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(ManualUQWithUncertaintyRequest)

    try:
        _logger.debug(
            f"Request validation successful. Processing {len(validated_request.function_jobs)} jobs"
        )

        # Extract validated parameters
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        num_samples = validated_request.num_samples
        jobs = validated_request.function_jobs
        n_histograms = validated_request.n_histograms
        seed = validated_request.seed

        # Create run directory (kept for debugging; itis-sumo persists its
        # working files here instead of a self-cleaning temp dir).
        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "uq_with_uncertainty")

        samples = _jobs_to_df(jobs, input_vars, [output_response])

        distribution_specs = {
            var: DistributionSpec(
                distribution=dist.distribution,
                mean=dist.mean,
                std=dist.std,
                minimum=dist.min,
                maximum=dist.max,
            )
            for var, dist in distributions.items()
        }

        result = _run_engine(
            sumo_evaluate_uncertainty,
            samples,
            input_vars,
            output_response,
            distributions=distribution_specs,
            num_samples=num_samples,
            n_histograms=n_histograms,
            seed=seed,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="manual_uq_propagation_with_uncertainty",
            dedupe=validated_request,
        )

        response_data = {
            "bins_start": result.bins_start,
            "bins_end": result.bins_end,
            "bin_means": result.bin_means,
            "bin_stds": result.bin_stds,
            "q1": result.q1,
            "median": result.median,
            "q3": result.q3,
            "whisker_min": result.whisker_min,
            "whisker_max": result.whisker_max,
            "outliers": result.outliers,
            "mean": result.mean,
            "std": result.std,
            "min": result.minimum,
            "max": result.maximum,
        }

        # Validate response using Pydantic
        validated_response = UQWithUncertaintyResponse(**response_data)
        _logger.debug("UQ with uncertainty analysis completed successfully")

        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_manual_uq_propagation_with_uncertainty", 500)


@dakota_bp.route("/compute_correlation_indices", methods=["POST"])
@api_endpoint
def flask_compute_correlation_indices():
    """
    Compute per-input <-> output Pearson and Spearman correlation coefficients (#470).

    V39 semantics (restored after the GH-Copilot #661-audit caught the silent
    table-mode degradation): every requested input distribution is SAMPLED
    (`distributions`/`numSamples`/`seed` are real inputs, ⊥ ignored), the
    job-fitted surrogate is evaluated ONCE over that MC set, and each variable's
    samples are correlated against those predictions (original units, original
    names) — the same MC sample set the UQ histogram propagates. Delegates to
    itis_sumo.api.evaluate_correlations, which is Dakota-bound and thus runs
    under ENGINE_LOCK (V49ad); `compute_correlations` (table mode) stays
    package-side for caller-owned tables and is no longer routed here.
    """
    _logger.debug("Starting flask function: flask_compute_correlation_indices")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(CorrelationIndicesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        jobs = validated_request.function_jobs

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "correlation_indices")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        # The request model guarantees exact coverage of input_vars; the filter
        # just drops the tolerated extra keys (mirrors the Sobol route).
        distribution_specs = {
            var: DistributionSpec(
                distribution=dist.distribution,
                mean=dist.mean,
                std=dist.std,
                minimum=dist.min,
                maximum=dist.max,
            )
            for var, dist in validated_request.distributions.items()
            if var in input_vars
        }

        result = _run_engine(
            sumo_evaluate_correlations,
            samples,
            input_vars,
            output_response,
            distributions=distribution_specs,
            num_samples=validated_request.num_samples,
            seed=validated_request.seed,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="compute_correlation_indices",
            dedupe=validated_request,
        )

        response_data = {"correlations": result.coefficients}
        validated_response = CorrelationIndicesResponse.model_validate(response_data)

        _logger.debug("Correlation indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_compute_correlation_indices", 500)


@dakota_bp.route("/compute_sobol_indices", methods=["POST"])
@api_endpoint
def flask_compute_sobol_indices():
    """
    Compute per-input first-order (main effect), total-order, and second-order
    (pairwise interaction) Sobol' indices (#470) plus the M1/M2/R order-mass
    partition.

    Delegates to itis_sumo.api.evaluate_sobol (SPEC V16qf). The request speaks
    DOMAIN vocabulary end-to-end (V26dd, bounds-editor shape): explicit per-
    variable ``domains`` boxes + ``fixed`` pins (a9 — pinned factors leave the
    sweep; this replaced the old distributions shape where `constant` 422'd).
    Variables absent from both maps fall back to the package's auto-inferred
    observed-bounds box. Response always includes ``sobolSecondOrder`` and
    ``sobolOrderContributions`` (null exactly when the sample output variance
    is zero).
    """
    _logger.debug("Starting flask function: flask_compute_sobol_indices")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SobolIndicesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.input_vars
        # NOTE (V36): Sobol' sample count is fixed inside itis_sumo.api; the
        # request carries no num_samples field anymore.
        jobs = validated_request.function_jobs
        seed = validated_request.seed

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "sobol_indices")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        domains = {
            var: DomainSpec(minimum=bounds.minimum, maximum=bounds.maximum)
            for var, bounds in validated_request.domains.items()
        }

        result = _run_engine(
            sumo_evaluate_sobol,
            samples,
            input_vars,
            output_response,
            domains=domains,
            fixed=validated_request.fixed,
            seed=seed,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="compute_sobol_indices",
            dedupe=validated_request,
        )

        response_data = {
            "sobol": result.indices,
            "sobol_second_order": result.second_order,
            "sobol_order_contributions": (
                dataclasses.asdict(result.order_contributions)
                if result.order_contributions is not None
                else None
            ),
        }
        validated_response = SobolIndicesResponse.model_validate(response_data)

        _logger.debug("Sobol' indices computation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_compute_sobol_indices", 500)


@dakota_bp.route("/sumo_along_axes", methods=["POST"])
@api_endpoint
def flask_evaluate_sumo_along_axes():
    """
    SuMo model evaluation along each input axis with optional fixed values.

    Delegates to itis_sumo.api.evaluate_along_axes, which fits a surrogate on the
    completed-job samples and sweeps each input variable while holding the others
    at their optional slider values. Unit/name mapping is handled internally, so
    the result is already expressed in original variable names and units.
    """
    _logger.debug("Starting flask function: flask_evaluate_sumo_along_axes")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoAlongAxesRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.inputs
        jobs = validated_request.function_jobs
        slider_values = validated_request.slider_values

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "along_axes")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        result = _run_engine(
            sumo_evaluate_along_axes,
            samples,
            input_vars,
            output_response,
            at=slider_values,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="sumo_along_axes",
            dedupe=validated_request,
        )

        predictions = {
            var: {
                "x": sweep.x,
                "y_hat": sweep.predicted,
                "std_hat": sweep.predicted_std,
            }
            for var, sweep in result.sweeps.items()
        }
        response_data = {"predictions": predictions}
        validated_response = SumoAlongAxesResponse.model_validate(response_data)

        _logger.debug("SUMO along axes evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_evaluate_sumo_along_axes", 500)


## This method could probably be generic for N-D (thus not needing the 1D version above)
@dakota_bp.route("/sumo_grid_evaluation", methods=["POST"])
@api_endpoint
def flask_sumo_grid_evaluation():
    """
    SUMO model evaluation on a grid with optional fixed values for non-grid variables.

    Delegates to itis_sumo.api.evaluate_grid, which fits a surrogate on the
    completed-job samples and sweeps the requested grid variables while holding
    the others at their optional slider values. Unit/name mapping is handled
    internally, so grid_data is already keyed by original variable names.
    """
    _logger.debug("Starting flask function: flask_sumo_grid_evaluation")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoGridEvaluationRequest)

    try:
        output_response = validated_request.output
        grid_vars = validated_request.grid_vars
        input_vars = validated_request.input_vars
        jobs = validated_request.function_jobs
        slider_values = validated_request.slider_values

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "grid_evaluation")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        result = _run_engine(
            sumo_evaluate_grid,
            samples,
            input_vars,
            output_response,
            grid_variables=grid_vars,
            at=slider_values,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="sumo_grid_evaluation",
            dedupe=validated_request,
        )

        response_data = {"grid_data": result.data}
        validated_response = SumoGridEvaluationResponse.model_validate(response_data)

        _logger.debug("SUMO grid evaluation completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_sumo_grid_evaluation", 500)


@dakota_bp.route("/get_sumo_cv_accuracy_metrics", methods=["POST"])
@api_endpoint
def flask_get_sumo_cv_accuracy_metrics():
    """
    Get SUMO cross-validation accuracy metrics for model evaluation.

    Delegates to itis_sumo.api.evaluate_cv_metrics, which fits a surrogate on the
    completed-job samples and cross-validates it against the requested output. If
    the run finishes without producing predictions, the response falls back to a
    "No surrogate quality metrics found." string for that output, matching prior
    behavior.
    """
    _logger.debug("Starting flask function: flask_get_sumo_cv_accuracy_metrics")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(SumoCVAccuracyMetricsRequest)

    try:
        output_response = validated_request.output
        input_vars = validated_request.inputs
        jobs = validated_request.function_jobs

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "cv_accuracy_metrics")
        samples = _jobs_to_df(jobs, input_vars, [output_response])

        try:
            result = _run_engine(
                sumo_evaluate_cv_metrics,
                samples,
                input_vars,
                output_response,
                preprocessing=_preprocessing_for_log_scales(
                    {},
                    {output_response: True} if validated_request.log else {},
                ),
                workspace=run_dir,
                workflow="get_sumo_cv_accuracy_metrics",
                dedupe=validated_request,
            )
            response_metrics = {
                output_response: CVAccuracyMetrics(
                    root_mean_squared=result.root_mean_squared,
                    sum_abs=result.sum_abs,
                    mean_abs=result.mean_abs,
                    max_abs=result.max_abs,
                )
            }
        except SumoResultError:
            response_metrics = {output_response: "No surrogate quality metrics found."}

        response_data = {"metrics": response_metrics}
        validated_response = SumoCVAccuracyMetricsResponse.model_validate(response_data)

        _logger.debug("SUMO CV accuracy metrics completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_get_sumo_cv_accuracy_metrics", 500)


@dakota_bp.route("/perform_moga_optimization", methods=["POST"])
@api_endpoint
def flask_perform_moga_optimization():
    """
    Perform Multi-Objective Genetic Algorithm (MOGA) optimization.

    Delegates to itis_sumo.api.optimize, which fits one surrogate per objective
    over the requested input domains and finds the Pareto-optimal trade-off
    front. Unit/name mapping and maximize-direction sign handling are done
    internally, so optimization_results is already expressed in original
    variable names and original sign.
    """
    _logger.debug("Starting flask function: flask_perform_moga_optimization")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(MOGAOptimizationRequest)

    try:
        input_vars = validated_request.input_vars
        distributions = validated_request.distributions
        output_var_selection = validated_request.output_var_selection
        jobs = validated_request.function_jobs
        output_vars = list(output_var_selection.keys())

        run_dir = create_run_dir(DAKOTA_RUNS_DIR, "moga")
        samples = _jobs_to_df(jobs, input_vars, output_vars)

        domains: dict[str, DomainSpec] = {}
        for var, dist in distributions.items():
            if var not in input_vars:
                continue
            # Unreachable after MOGAOptimizationRequest's uniform-only guard;
            # a ValueError (→400) instead of an assert keeps the 500-class dead
            # even if the model guard is ever relaxed (GH-Copilot #661 audit).
            if dist.min is None or dist.max is None:
                raise ValueError(
                    f"MOGA requires a uniform distribution with min/max for variable '{var}'"
                )
            domains[var] = DomainSpec(minimum=dist.min, maximum=dist.max)

        result = _run_engine(
            sumo_optimize,
            samples,
            input_vars,
            output_var_selection,
            domains=domains,
            preprocessing=_preprocessing_for_log_scales(
                validated_request.input_log_scales, validated_request.output_log_scales
            ),
            workspace=run_dir,
            workflow="perform_moga_optimization",
            dedupe=validated_request,
        )

        response_data = {"optimization_results": result.data}
        validated_response = MOGAOptimizationResponse.model_validate(response_data)

        _logger.debug("MOGA optimization completed successfully")
        return jsonify(validated_response.model_dump())

    except ValidationError as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 400)
    except (ValueError, SumoInputError) as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 400)
    except Exception as e:
        handle_workflow_error(e, "flask_perform_moga_optimization", 500)
