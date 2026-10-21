"""Benchmarks for the IN-PROCESS slices of the engine (Dakota) request path.

WHY. The 2026-10-21 Playwright trace analysis (EPIC ITISFoundation#624) measured
the two engine-heavy e2e flows spending 7.1 s (manual UQ propagation with
uncertainty) and 3.6 s (SuMo cross-validation) of /flask blocking time per test.
The Dakota-bound wall time itself is NOT measurable here: the CodSpeed job runs
``mode: simulation``, which instruments the in-process Python, while the Dakota
binary executes in a SUBPROCESS spawned by the pinned itis-sumo runner (core
``dakota_object`` ProcessPoolExecutor(1)) -- a benchmark that "times" a full
engine call under simulation measures the host's poll loop, not Dakota, so this
file does NOT fake one. What IS deterministic and in-process is everything the
route does around the engine call, and it is what a commit-level engine
regression would actually move:

- request validation (``parse_request_model`` -> pydantic) for the UQ endpoint
  payload -- the other engine payloads are covered in test_bench_serialization;
- ``dakota._jobs_to_df`` (JobVariableSelection validation -> records ->
  DataFrame), the sample-table build every engine route shares;
- ``helpers.create_run_dir``, the per-request workspace mint;
- the itis-sumo training-frame preprocessing (``DataPreprocessor.fit_transform``
  exactly as ``SumoSession.fit`` drives it);
- the package's public sample generators behind /flask/sampling/lhs and
  /flask/sampling/grid -- pure numpy/pandas in 0.1.0a10 (the V49ad comment in
  sampling.py is lock hygiene inherited from the vendored implementation);
- the post-engine UQ summary (``summarize_uncertainty_samples``) and the
  validated response build + dump the route serializes.

Deterministic by construction (fixed seeds, fixed shapes; the package
generators are seeded APIs), no network, no oSPARC, no Dakota. Scale mirrors
production defaults of the pinned stack: 40 variables, the frontend
``defaultUQSettings`` (numSamples=10000, nHistograms=50), the 3-variable cap
the grid request model enforces, and itis_sumo's 21-points-per-axis default.
"""

import numpy as np
import pytest
from itis_sumo.api import DomainSpec, generate_grid_samples, generate_lhs_samples
from itis_sumo.evaluate.funs_evaluate import summarize_uncertainty_samples
from itis_sumo.preprocess import DataPreprocessor

from mmux_flaskapi.blueprints.dakota import _jobs_to_df
from mmux_flaskapi.blueprints.dakota_models import (
    FunctionJob,
    ManualUQWithUncertaintyRequest,
    UQWithUncertaintyResponse,
)
from mmux_flaskapi.utils.helpers import create_run_dir

SEED = 20240101
N_VARS = 40
TYPICAL_JOBS = 300
LARGE_JOBS = 2000
# node defaultUQSettings (uqSettings.ts) -- the payload size a real UQ request
# carries unless the user overrode the modal.
NUM_SAMPLES = 10000
N_HISTOGRAMS = 50
POINTS = 21  # itis_sumo's points-per-axis default
GRID_VARS = [f"input_var_{i}" for i in range(3)]  # grid model caps gridVars at 3

# Same variable-name corpus as test_bench_serialization (real MMUX studies +
# filler). The GRID generator keeps sanitize-stable names on purpose: the
# pinned package sanitizes column names when writing the grid file and then
# re-selects them by ORIGINAL name, which only round-trips for names
# sanitize_varnames leaves untouched.
IRREGULAR_VARS = [
    "sigma blood",
    "TissueConduc",
    "electrode radius (mm)",
    "pulse width [us]",
    "Amplitude*Gain",
    "fiber diameter",
    "myelin thickness",
    "node length",
]
VARS = IRREGULAR_VARS + [f"input_var_{i}" for i in range(len(IRREGULAR_VARS), N_VARS)]
OUTPUT_VARS = ["-AFpeak", "activation threshold", "energy (uJ)"]
OUTPUT = OUTPUT_VARS[0]


def _function_jobs(count: int) -> list[dict]:
    rng = np.random.default_rng(SEED)
    jobs = []
    for index in range(count):
        jobs.append(
            {
                "status": "failed" if index % 9 == 0 else "completed",
                "inputs": {var: float(value) for var, value in zip(VARS, rng.random(N_VARS))},
                "outputs": {
                    var: float(value)
                    for var, value in zip(OUTPUT_VARS, rng.random(len(OUTPUT_VARS)))
                },
                "job_id": f"job-{index}",
            }
        )
    return jobs


# Completed = every 9th job fails (index 0 counts): 266 of 300, 1777 of 2000.
# Both stay above the dimension-scaled minimum max(5, N_VARS + 1) = 41.
N_COMPLETED_TYPICAL = 266
N_COMPLETED_LARGE = 1777


def _validated(jobs: list[dict]) -> list[FunctionJob]:
    return [FunctionJob.model_validate(job) for job in jobs]


# Jobs arrive at _jobs_to_df as already-validated models (the route validated
# them in parse_request_model); validation of the RAW payload is benched
# separately below, so building these once at import time costs nothing.
_TYPICAL_JOBS = _validated(_function_jobs(TYPICAL_JOBS))
_LARGE_JOBS = _validated(_function_jobs(LARGE_JOBS))


@pytest.fixture(scope="module")
def uq_request_payload() -> dict:
    # The snake_case body parse_request_model hands ManualUQWithUncertaintyRequest
    # for the default-frontend-settings UQ flow (camelCase conversion itself is
    # already benched in test_bench_serialization).
    return {
        "output": OUTPUT,
        "input_vars": VARS,
        "distributions": {var: {"distribution": "uniform", "min": 0.0, "max": 1.0} for var in VARS},
        "num_samples": NUM_SAMPLES,
        "n_histograms": N_HISTOGRAMS,
        "seed": 0,
        "function_jobs": _function_jobs(TYPICAL_JOBS),
        "input_log_scales": {var: False for var in VARS},
        "output_log_scales": {},
    }


@pytest.fixture(scope="module")
def training_samples():
    # The sample table _jobs_to_df produces and SumoSession.fit() preprocesses.
    samples = _jobs_to_df(_TYPICAL_JOBS, VARS, [OUTPUT])
    assert samples.shape == (N_COMPLETED_TYPICAL, N_VARS + 1)
    return samples


@pytest.fixture(scope="module")
def domains() -> dict[str, DomainSpec]:
    return {var: DomainSpec(minimum=0.1, maximum=10.0) for var in VARS}


@pytest.fixture(scope="module")
def uq_sample_matrix() -> np.ndarray:
    # Exactly what the engine hands summarize_uncertainty_samples after a UQ
    # run: one row per histogram realisation, one column per propagated
    # sample. Fixed array => the summary is a pure, repeatable measurement.
    matrix = np.random.default_rng(SEED).normal(
        loc=2.0, scale=0.5, size=(N_HISTOGRAMS, NUM_SAMPLES)
    )
    assert matrix.shape == (N_HISTOGRAMS, NUM_SAMPLES)
    return matrix


@pytest.fixture(scope="module")
def uq_response_data(uq_sample_matrix: np.ndarray) -> dict:
    # The engine-shaped result dict the route validates + dumps before jsonify.
    return summarize_uncertainty_samples(uq_sample_matrix)


def test_validate_uq_with_uncertainty_request(benchmark, uq_request_payload):
    """Pydantic validation of a full default-settings UQ request body."""
    request = benchmark(ManualUQWithUncertaintyRequest.model_validate, uq_request_payload)
    assert len(request.function_jobs) == TYPICAL_JOBS
    assert request.num_samples == NUM_SAMPLES
    assert len(request.distributions) == N_VARS


def test_jobs_to_df_typical_study(benchmark, training_samples):
    """Sample-table build for a typical study: selection validation + records + DataFrame."""
    frame = benchmark(_jobs_to_df, _TYPICAL_JOBS, VARS, [OUTPUT])
    assert frame.shape == training_samples.shape
    assert list(frame.columns) == [*VARS, OUTPUT]


def test_jobs_to_df_large_collection(benchmark):
    """Same build for a large imported collection (2000 jobs)."""
    frame = benchmark(_jobs_to_df, _LARGE_JOBS, VARS, [OUTPUT])
    assert frame.shape == (N_COMPLETED_LARGE, N_VARS + 1)


def test_create_run_dir(benchmark, tmp_path):
    """Per-request workspace mint (timestamp+uuid dir under <root>/runs)."""
    run_dir = benchmark(create_run_dir, tmp_path, "uq_with_uncertainty")
    assert run_dir.is_dir()
    assert run_dir.name.startswith("dakota_")


def test_preprocess_training_frame(benchmark, training_samples):
    """DataPreprocessor.fit_transform exactly as SumoSession.fit() drives it (V16 defaults)."""

    def fit_training_frame():
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(input_vars=list(VARS), output_vars=[OUTPUT])
        return preprocessor.fit_transform(training_samples)

    transformed = benchmark(fit_training_frame)
    assert transformed.shape == training_samples.shape


def test_generate_lhs_samples_uq_design(benchmark, domains):
    """UQ-scale LHS design (40 vars x 10000 rows) as /flask/sampling/lhs draws it."""
    design = benchmark(generate_lhs_samples, domains, NUM_SAMPLES, seed=SEED)
    assert design.shape == (NUM_SAMPLES, N_VARS)


def test_generate_grid_samples_max_dimension(benchmark):
    """Full-factorial grid at the model's 3-variable cap, 21 points per axis.

    workspace=None lets the generator self-clean its temp dir per call (the
    route's workspace= variant only adds WHERE the same files are written).
    """
    grid_domains = {var: DomainSpec(minimum=0.1, maximum=10.0) for var in GRID_VARS}
    points_per_variable = {var: POINTS for var in GRID_VARS}

    def make_grid():
        return generate_grid_samples(grid_domains, points_per_variable)

    grid = benchmark(make_grid)
    assert grid.shape == (POINTS ** len(GRID_VARS), len(GRID_VARS))
    assert list(grid.columns) == GRID_VARS


def test_summarize_uncertainty_samples(benchmark, uq_sample_matrix):
    """Post-engine histogram+boxplot summary over the propagated MC pool."""
    summary = benchmark(summarize_uncertainty_samples, uq_sample_matrix)
    # num_bins default: min(50, max(10, num_samples // 10)) == 50
    assert len(summary["bin_means"]) == len(summary["bin_stds"]) == 50
    assert summary["q1"] <= summary["median"] <= summary["q3"]


def test_validate_and_dump_uq_with_uncertainty_response(benchmark, uq_response_data):
    """Response-model cost of the UQ route: frozen validation + model_dump."""

    def build_and_dump():
        # Exactly the endpoint's pair: UQWithUncertaintyResponse(**result) then
        # jsonify(validated_response.model_dump()).
        return UQWithUncertaintyResponse(**uq_response_data).model_dump()

    dumped = benchmark(build_and_dump)
    assert len(dumped["bin_means"]) == len(dumped["bin_stds"]) == 50
    assert dumped["q1"] <= dumped["median"] <= dumped["q3"]
