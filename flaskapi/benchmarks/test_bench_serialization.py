"""Benchmarks for the request/response boundary of the Flask API.

Every request body is camelCase->snake_case converted and validated with
pydantic, and every response is snake_case->camelCase converted before being
serialized. These payloads carry thousands of dict keys and tens of thousands
of floats, so the conversion sits on the hot path of the whole frontend.

Since the variable-name preservation contract (flaskapi/SPEC.md V13/V37,
node/SPEC.md V24/B18), oSPARC variable-name containers (`predictions`,
`correlations`, `sobol`, `sobol_second_order`, `slider_values`, `inputs`,
...) are preserved verbatim and only API field keys are converted. The
fixtures below therefore mirror the REAL production payload shapes (built as
`blueprints/dakota.py` builds them) so the benchmarks measure the conversion
path the API actually takes, including the preservation handling.

Deterministic scale (asserted in the fixtures):
- along-axes curve: 40 variables x 21 points per axis — the production default
  `points_per_variable` of `itis_sumo.api.evaluate_along_axes`, which flaskapi
  does not override.
- Sobol response over 40 variables: O(n^2) second-order pairs, ~2k dict keys.
- along-axes request: 300 jobs (typical study) and 2000 jobs (large imported
  collection), each job carrying per-variable `inputs`/`outputs` dicts.
"""

import numpy as np
import pytest
from flask import Flask, jsonify

from mmux_flaskapi.blueprints.dakota_models import (
    SumoAlongAxesRequest,
    SumoAlongAxesResponse,
    SumoCrossValidationRequest,
)
from mmux_flaskapi.utils.helpers import (
    recursive_dict_keys_camel_to_snake,
    recursive_dict_keys_snake_to_camel,
)
from mmux_flaskapi.utils.json_serializer import get_request, register_json_transformers

SEED = 20240101
N_VARS = 40
POINTS = 21  # itis_sumo.api.evaluate_along_axes default points_per_variable
TYPICAL_JOBS = 300
LARGE_JOBS = 2000

# Variable names from real MMUX studies plus snake_case filler, so the
# preservation path is exercised by names that are NOT lossless camelCase
# round-trips (spaces, `*`, mixed case).
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


def _count_keys(value: object) -> int:
    if isinstance(value, dict):
        return len(value) + sum(_count_keys(item) for item in value.values())
    if isinstance(value, list):
        return sum(_count_keys(item) for item in value)
    return 0


def _predictions() -> dict:
    # Exactly the shape blueprints/dakota.py assembles from the engine sweeps.
    rng = np.random.default_rng(SEED)
    return {
        var: {
            "x": rng.random(POINTS).tolist(),
            "y_hat": rng.random(POINTS).tolist(),
            "std_hat": rng.random(POINTS).tolist(),
        }
        for var in VARS
    }


def _sobol() -> dict:
    # Exactly the shape of the SobolIndicesResponse engine result.
    rng = np.random.default_rng(SEED)
    return {
        "sobol": {
            var: {
                "main": float(rng.random()),
                "total": float(rng.random()),
                "main_ci_low": float(rng.random()),
                "main_ci_high": float(rng.random()),
                "total_ci_low": float(rng.random()),
                "total_ci_high": float(rng.random()),
            }
            for var in VARS
        },
        "sobol_second_order": {
            var_a: {var_b: float(rng.random()) for var_b in VARS} for var_a in VARS
        },
    }


def _function_jobs(count: int, *, camel_job_id: bool) -> list[dict]:
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
                "job_id" if not camel_job_id else "jobId": f"job-{index}",
            }
        )
    return jobs


def _camel_along_axes_request(count: int) -> dict:
    # The body the frontend sends (Curves1DPlot.requestBody), pre-conversion.
    return {
        "inputs": VARS,
        "output": OUTPUT_VARS[0],
        "sliderValues": {var: 0.5 for var in VARS},
        "distribution": {var: {"distribution": "uniform", "min": 0.0, "max": 1.0} for var in VARS},
        "FunctionJobs": _function_jobs(count, camel_job_id=True),
        "inputLogScales": {var: False for var in VARS[:2]},
        "outputLogScales": {},
    }


@pytest.fixture(scope="module")
def along_axes_response() -> dict:
    response = {"predictions": _predictions()}
    # 40 variables x 3 arrays x 21 points of floats.
    floats = sum(len(array) for axis in response["predictions"].values() for array in axis.values())
    assert floats == N_VARS * 3 * POINTS
    return response


@pytest.fixture(scope="module")
def sobol_response() -> dict:
    response = _sobol()
    assert _count_keys(response) > N_VARS * N_VARS  # O(n^2) second-order pairs
    return response


@pytest.fixture(scope="module")
def camel_typical_request() -> dict:
    request = _camel_along_axes_request(TYPICAL_JOBS)
    assert _count_keys(request) > 4_000
    return request


@pytest.fixture(scope="module")
def camel_large_request() -> dict:
    request = _camel_along_axes_request(LARGE_JOBS)
    assert _count_keys(request) > 25_000
    return request


@pytest.fixture(scope="module")
def function_jobs() -> list[dict]:
    # Post-conversion (snake_case) jobs, as pydantic sees them.
    return _function_jobs(TYPICAL_JOBS, camel_job_id=False)


@pytest.fixture(scope="module")
def echo_client(along_axes_response: dict):
    """Minimal app wired with the real JSON transformers of the MMUX backend."""
    app = Flask("benchmark")
    register_json_transformers(app, convert_responses=True)

    @app.route("/echo", methods=["POST"])
    def echo():
        request_data = get_request()
        assert request_data is not None
        assert len(request_data["function_jobs"]) == TYPICAL_JOBS
        assert request_data["slider_values"]["TissueConduc"] == 0.5
        return jsonify(along_axes_response), 200

    return app.test_client()


def test_camel_to_snake_typical_request(benchmark, camel_typical_request):
    converted = benchmark(recursive_dict_keys_camel_to_snake, camel_typical_request)
    assert "job_id" in converted["function_jobs"][0]
    # Variable names inside preserved containers must survive verbatim.
    assert converted["slider_values"]["TissueConduc"] == 0.5
    assert converted["function_jobs"][0]["inputs"]["Amplitude*Gain"]


def test_camel_to_snake_large_request(benchmark, camel_large_request):
    converted = benchmark(recursive_dict_keys_camel_to_snake, camel_large_request)
    assert len(converted["function_jobs"]) == LARGE_JOBS


def test_snake_to_camel_along_axes_response(benchmark, along_axes_response):
    converted = benchmark(recursive_dict_keys_snake_to_camel, along_axes_response)
    predictions = converted["predictions"]
    # V13/V37: variable names preserved, API field names converted.
    assert "sigma blood" in predictions
    assert "input_var_8" in predictions
    axis = predictions["sigma blood"]
    assert {"x", "yHat", "stdHat"} == set(axis.keys())


def test_snake_to_camel_sobol_response(benchmark, sobol_response):
    converted = benchmark(recursive_dict_keys_snake_to_camel, sobol_response)
    # `sobol` is field-level preserved: var names kept, field names converted.
    assert "mainCiLow" in converted["sobol"]["TissueConduc"]
    assert "TissueConduc" in converted["sobol"]
    # `sobol_second_order` is preserved on BOTH variable-name levels (its own
    # key is an API field name and converts to `sobolSecondOrder`).
    assert isinstance(converted["sobolSecondOrder"]["sigma blood"]["Amplitude*Gain"], float)


def test_validate_along_axes_request(benchmark, function_jobs):
    payload = {
        "output": OUTPUT_VARS[0],
        "inputs": VARS,
        "function_jobs": function_jobs,
        "slider_values": {var: 0.5 for var in VARS},
    }
    request = benchmark(SumoAlongAxesRequest.model_validate, payload)
    assert len(request.function_jobs) == TYPICAL_JOBS


def test_validate_cross_validation_request(benchmark, function_jobs):
    payload = {
        "output": OUTPUT_VARS[0],
        "input_vars": VARS,
        "function_jobs": function_jobs,
    }
    request = benchmark(SumoCrossValidationRequest.model_validate, payload)
    assert len(request.function_jobs) == TYPICAL_JOBS


def test_serialize_along_axes_response(benchmark):
    response = SumoAlongAxesResponse(predictions=_predictions())
    dumped = benchmark(response.model_dump)
    assert len(dumped["predictions"]) == N_VARS


def test_flask_json_round_trip(benchmark, echo_client, camel_typical_request):
    # Full middleware cost of one plot request: camelCase -> snake_case on the
    # way in, the production response shape snake_case -> camelCase on the way
    # out (with the V13/V37 variable-name preservation path active).
    def round_trip():
        return echo_client.post("/echo", json=camel_typical_request)

    response = benchmark(round_trip)
    assert response.status_code == 200
    body = response.get_json()
    assert "sigma blood" in body["predictions"]
    assert "yHat" in body["predictions"]["sigma blood"]
