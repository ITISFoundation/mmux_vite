"""Deterministic oSPARC dataset for the read-only SuMo e2e suite.

One function with 4 inputs (x1, x2, x3, x4) and 4 outputs (y, y2, y3, y4),
with a single job collection holding ~20 SUCCESS jobs. The inputs/outputs form
smooth, non-degenerate mappings suitable for 1D/2D/3D surface plots, so Dakota's
``sumo_cross_validation`` builds valid surrogates and returns finite MAE/RMSE.
All values are hard-coded (no RNG) so pixel snapshots and metrics are reproducible.
See root SPEC.md §T9 / §V10-§V13.
"""

from __future__ import annotations

import math

FUNCTION_UID = "func-sumo-readonly-e2e"
JOB_COLLECTION_UID = "jc-sumo-readonly-e2e"

# Deterministic 4D input grid: 5x4 structured sample points from [0.5-2.5] × [0.5-2.0]
# Outputs: y = 2*x1 + 0.3*x1² + 0.5*x2 (1D/2D plot), y2 = x1*x2, 
# y3 = sin(x1) + cos(x2), y4 = x3 + x4
_INPUTS = [
    (0.5, 0.5, 1.0, 1.0),
    (0.5, 1.2, 1.0, 1.5),
    (0.5, 2.0, 1.0, 2.0),
    (1.0, 0.5, 1.5, 1.0),
    (1.0, 1.2, 1.5, 1.5),
    (1.0, 2.0, 1.5, 2.0),
    (1.5, 0.5, 2.0, 1.0),
    (1.5, 1.2, 2.0, 1.5),
    (1.5, 2.0, 2.0, 2.0),
    (2.0, 0.5, 1.2, 1.0),
    (2.0, 1.2, 1.2, 1.5),
    (2.0, 2.0, 1.2, 2.0),
    (2.5, 0.5, 1.8, 1.0),
    (2.5, 1.2, 1.8, 1.5),
    (2.5, 2.0, 1.8, 2.0),
]


def _outputs(x1: float, x2: float, x3: float, x4: float) -> tuple[float, float, float, float]:
    """Compute 4 deterministic outputs from 4 inputs."""
    y = round(2.0 * x1 + 0.3 * x1 * x1 + 0.5 * x2, 6)
    y2 = round(x1 * x2, 6)
    y3 = round(math.sin(x1) + math.cos(x2), 6)
    y4 = round(x3 + x4, 6)
    return y, y2, y3, y4


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
        },
        "status": "SUCCESS",
    }
    for i, (x1, x2, x3, x4) in enumerate(_INPUTS)
    for y, y2, y3, y4 in [_outputs(x1, x2, x3, x4)]
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
        "description": "Deterministic collection of 15 SUCCESS jobs for the read-only SuMo e2e",
        "function_uid": FUNCTION_UID,
        "job_ids": [job["uid"] for job in JOBS],
    }
]
