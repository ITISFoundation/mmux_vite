"""Benchmarks for the request/response boundary of the Flask API.

Every request is normalized to snake_case and validated with pydantic, and
every response is converted back to camelCase before being serialized. Plot and
UQ responses carry thousands of floats, so this conversion is on the hot path
of the whole frontend.
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
N_JOBS = 300
N_POINTS = 200


@pytest.fixture(scope="module")
def function_jobs() -> list[dict]:
    rng = np.random.default_rng(SEED)
    input_names = [f"inputVar{i}" for i in range(8)]
    output_names = [f"outputVar{i}" for i in range(3)]
    return [
        {
            "status": "completed",
            "inputs": {name: float(value) for name, value in zip(input_names, rng.random(8))},
            "outputs": {name: float(value) for name, value in zip(output_names, rng.random(3))},
            "jobId": f"job-{index}",
        }
        for index in range(N_JOBS)
    ]


@pytest.fixture(scope="module")
def plot_response_payload() -> dict:
    rng = np.random.default_rng(SEED)
    axes = {
        f"input_var_{i}": {
            "x": rng.random(N_POINTS).tolist(),
            "y_hat": rng.random(N_POINTS).tolist(),
            "std_hat": rng.random(N_POINTS).tolist(),
        }
        for i in range(8)
    }
    return {
        "response_variable": "activation_threshold",
        "axes_predictions": axes,
        "correlations": {f"input var {i}": {"pearson": 0.5, "spearman": 0.4} for i in range(8)},
        "sobol": {
            f"input var {i}": {"main": 0.3, "total": 0.5, "main_ci_low": 0.2} for i in range(8)
        },
        "sobol_second_order": {
            f"input var {i}": {f"input var {j}": 0.01 for j in range(8)} for i in range(8)
        },
        "training_jobs": [
            {"job_uid": f"job-{i}", "job_status": "completed"} for i in range(N_JOBS)
        ],
    }


@pytest.fixture(scope="module")
def plot_request_payload(plot_response_payload) -> dict:
    return recursive_dict_keys_snake_to_camel(plot_response_payload)


@pytest.fixture(scope="module")
def echo_client(plot_response_payload):
    """Minimal app wired with the real JSON transformers of the MMUX backend."""
    app = Flask("benchmark")
    register_json_transformers(app, convert_responses=True)

    @app.route("/echo", methods=["POST"])
    def echo():
        request_data = get_request()
        assert request_data is not None
        return jsonify(plot_response_payload), 200

    return app.test_client()


def test_recursive_snake_to_camel(benchmark, plot_response_payload):
    converted = benchmark(recursive_dict_keys_snake_to_camel, plot_response_payload)
    assert "axesPredictions" in converted


def test_recursive_camel_to_snake(benchmark, plot_request_payload):
    converted = benchmark(recursive_dict_keys_camel_to_snake, plot_request_payload)
    assert "axes_predictions" in converted


def test_validate_along_axes_request(benchmark, function_jobs):
    payload = {
        "output": "outputVar0",
        "inputs": [f"inputVar{i}" for i in range(8)],
        "function_jobs": function_jobs,
        "slider_values": {f"inputVar{i}": 0.5 for i in range(8)},
    }
    request = benchmark(SumoAlongAxesRequest.model_validate, payload)
    assert len(request.function_jobs) == N_JOBS


def test_validate_cross_validation_request(benchmark, function_jobs):
    payload = {
        "output": "outputVar0",
        "input_vars": [f"inputVar{i}" for i in range(8)],
        "function_jobs": function_jobs,
    }
    request = benchmark(SumoCrossValidationRequest.model_validate, payload)
    assert len(request.function_jobs) == N_JOBS


def test_serialize_along_axes_response(benchmark):
    rng = np.random.default_rng(SEED)
    response = SumoAlongAxesResponse(
        predictions={
            f"input_var_{i}": {
                "x": rng.random(N_POINTS).tolist(),
                "y_hat": rng.random(N_POINTS).tolist(),
                "std_hat": rng.random(N_POINTS).tolist(),
            }
            for i in range(8)
        },
    )
    dumped = benchmark(response.model_dump)
    assert len(dumped["predictions"]) == 8


def test_flask_json_round_trip(benchmark, echo_client, plot_request_payload):
    # Full middleware cost of one plot request: camelCase -> snake_case on the
    # way in, snake_case -> camelCase on the way out.
    def round_trip():
        return echo_client.post("/echo", json=plot_request_payload)

    response = benchmark(round_trip)
    assert response.status_code == 200
