"""Deterministic oSPARC dataset for the read-only SuMo e2e suite.

One function (single input ``x1`` -> single output ``y``) with a single job
collection holding 6 SUCCESS jobs. The inputs/outputs form a smooth, non-degenerate
1-D mapping so Dakota's ``sumo_cross_validation`` builds a valid surrogate and
returns finite MAE/RMSE. All values are hard-coded (no RNG) so pixel snapshots and
metrics are reproducible. See root SPEC.md §T9 / §V10-§V13.
"""

from __future__ import annotations

FUNCTION_UID = "func-sumo-readonly-e2e"
JOB_COLLECTION_UID = "jc-sumo-readonly-e2e"

# Smooth deterministic mapping  y = 2*x1 + 0.3*x1^2  evaluated on 6 distinct points.
_X1 = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]


def _y(x: float) -> float:
    return round(2.0 * x + 0.3 * x * x, 6)


JOBS: list[dict] = [
    {
        "uid": f"job-sumo-e2e-{i + 1}",
        "function_uid": FUNCTION_UID,
        "title": f"E2E SuMo job {i + 1}",
        "description": "Deterministic e2e job",
        "created_at": f"2025-01-0{i + 1}T12:00:00Z",
        "inputs": {"x1": x1},
        "outputs": {"y": _y(x1)},
        "status": "SUCCESS",
    }
    for i, x1 in enumerate(_X1)
]

JOBS_BY_UID: dict[str, dict] = {job["uid"]: job for job in JOBS}

FUNCTIONS: list[dict] = [
    {
        "uid": FUNCTION_UID,
        "title": "E2E SuMo Demo Function",
        "description": "Deterministic 1-input/1-output function for the read-only SuMo e2e",
        "function_class": "PROJECT",
        "project_id": "00000000-0000-0000-0000-000000000001",
        "input_schema": {
            "schema_content": {
                "type": "object",
                "properties": {"x1": {"type": "number"}},
                "required": ["x1"],
            }
        },
        "output_schema": {
            "schema_content": {
                "type": "object",
                "properties": {"y": {"type": "number"}},
                "required": ["y"],
            }
        },
        "default_inputs": None,
    }
]

JOB_COLLECTIONS: list[dict] = [
    {
        "uid": JOB_COLLECTION_UID,
        "title": "E2E SuMo job collection",
        "description": "Deterministic collection of 6 SUCCESS jobs for the read-only SuMo e2e",
        "function_uid": FUNCTION_UID,
        "job_ids": [job["uid"] for job in JOBS],
    }
]
