"""Deterministic oSPARC dataset for the read-only SuMo e2e suite.

One function with 4 inputs (x1, x2, x3, x4) and 4 outputs (y, y2, y3, y4),
with a single job collection holding a dense 8x6 grid of SUCCESS jobs (48
points). The inputs/outputs form smooth, non-degenerate mappings suitable for
1D/2D/3D surface plots, so Dakota's ``sumo_cross_validation`` builds valid
surrogates and returns finite MAE/RMSE. All values are hard-coded (no RNG) so
pixel snapshots and metrics are reproducible. See root SPEC.md §T9 / §V10-§V13.
"""

from __future__ import annotations

import math

FUNCTION_UID = "func-sumo-readonly-e2e"
JOB_COLLECTION_UID = "jc-sumo-readonly-e2e"

# Deterministic 4D input grid: a dense 8x6 factorial over (x1, x2) spanning
# x1 ∈ [0.5, 3.0] and x2 ∈ [0.5, 2.5] (48 points). x3, x4 cycle through
# {1.0, 1.5, 2.0} across the set so every input carries real variation (the
# surrogate stays non-degenerate for y4 = x3 + x4). All coordinates are rounded
# so pixel snapshots and metrics stay reproducible. The e2e input ranges
# (helpers.ts ``fillUniformInputRanges``) mirror these domains so the 1D/2D/3D
# plots evaluate the surrogate inside its training region.
# Outputs: y = 2*x1 + 0.3*x1² + 0.5*x2 (1D/2D plot), y2 = x1*x2,
# y3 = sin(x1) + cos(x2), y4 = x3 + x4
_NX1, _NX2 = 8, 6
_X1_MIN, _X1_MAX = 0.5, 3.0
_X2_MIN, _X2_MAX = 0.5, 2.5


def _build_inputs() -> list[tuple[float, float, float, float]]:
    """Build the dense, fully-deterministic 8x6 input grid (no RNG)."""
    points: list[tuple[float, float, float, float]] = []
    for i in range(_NX1):
        x1 = round(_X1_MIN + (_X1_MAX - _X1_MIN) * i / (_NX1 - 1), 4)
        for j in range(_NX2):
            x2 = round(_X2_MIN + (_X2_MAX - _X2_MIN) * j / (_NX2 - 1), 4)
            x3 = round(1.0 + 0.5 * ((i + j) % 3), 4)  # spans {1.0, 1.5, 2.0}
            x4 = round(1.0 + 0.5 * ((i + 2 * j) % 3), 4)  # spans {1.0, 1.5, 2.0}
            points.append((x1, x2, x3, x4))
    return points


_INPUTS = _build_inputs()


def _outputs(x1: float, x2: float, x3: float, x4: float) -> tuple[float, float, float, float]:
    """Compute 4 deterministic outputs from 4 inputs."""
    y = round(2.0 * x1 + 0.3 * x1 * x1 + 0.5 * x2, 6)
    y2 = round(x1 * x2, 6)
    y3 = round(math.sin(x1) + math.cos(x2), 6)
    y4 = round(x3 + x4, 6)
    return y, y2, y3, y4


def _std_hats(x1: float, x2: float, x3: float, x4: float) -> tuple[float, float, float, float]:
    """Deterministic per-output uncertainty (``<output>_std_hat``).

    The UQ propagation endpoint (``manual_uq_propagation_with_uncertainty``)
    requires every selected job to expose a ``<qoi>_std_hat`` output, so the UQ
    e2e flow renders a real histogram instead of the capability warning. Values
    are smooth, strictly-positive, and hard-coded (no RNG) to keep pixel
    snapshots reproducible. These live only on the job payloads, not on the
    function ``output_schema``, so they never appear in the QoI dropdown and the
    SuMo/MOGA flows are unaffected. See root SPEC.md §T9 / §V10-§V13.
    """
    s = round(0.1 + 0.05 * x1, 6)
    s2 = round(0.1 + 0.05 * x2, 6)
    s3 = round(0.1 + 0.05 * x3, 6)
    s4 = round(0.1 + 0.05 * x4, 6)
    return s, s2, s3, s4


JOBS: list[dict] = [
    {
        "uid": f"job-sumo-e2e-{i + 1:02d}",
        "function_uid": FUNCTION_UID,
        "title": f"E2E SuMo job {i + 1:02d}",
        "description": "Deterministic e2e job",
        "created_at": f"2025-01-{(i % 28) + 1:02d}T12:00:00Z",
        "inputs": {"x1": x1, "x2": x2, "x3": x3, "x4": x4},
        "outputs": {
            "y": y,
            "y2": y2,
            "y3": y3,
            "y4": y4,
            "y_std_hat": s,
            "y2_std_hat": s2,
            "y3_std_hat": s3,
            "y4_std_hat": s4,
        },
        "status": "SUCCESS",
    }
    for i, (x1, x2, x3, x4) in enumerate(_INPUTS)
    for y, y2, y3, y4 in [_outputs(x1, x2, x3, x4)]
    for s, s2, s3, s4 in [_std_hats(x1, x2, x3, x4)]
]

JOBS_BY_UID: dict[str, dict] = {job["uid"]: job for job in JOBS}

FUNCTIONS: list[dict] = [
    {
        "uid": FUNCTION_UID,
        "title": "E2E SuMo Demo Function",
        "description": "Deterministic 4-input/4-output function for the read-only SuMo e2e",
        "function_class": "PROJECT",
        "project_id": "00000000-0000-0000-0000-000000000001",
        "input_schema": {
            "schema_content": {
                "type": "object",
                "properties": {
                    "x1": {"type": "number"},
                    "x2": {"type": "number"},
                    "x3": {"type": "number"},
                    "x4": {"type": "number"},
                },
                "required": ["x1", "x2", "x3", "x4"],
            }
        },
        "output_schema": {
            "schema_content": {
                "type": "object",
                "properties": {
                    "y": {"type": "number"},
                    "y2": {"type": "number"},
                    "y3": {"type": "number"},
                    "y4": {"type": "number"},
                },
                "required": ["y", "y2", "y3", "y4"],
            }
        },
        "default_inputs": None,
    }
]

JOB_COLLECTIONS: list[dict] = [
    {
        "uid": JOB_COLLECTION_UID,
        "title": "E2E SuMo job collection",
        "description": f"Deterministic collection of {len(JOBS)} SUCCESS jobs for the read-only SuMo e2e",
        "function_uid": FUNCTION_UID,
        "job_ids": [job["uid"] for job in JOBS],
    }
]
