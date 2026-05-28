"""
Local job store — JSON-backed offline store for synthetic functions, collections, and jobs.

Used when ``DEPLOYMENT_MODE=LOCAL`` to serve uploaded / synthetic data without a
live oSPARC connection (V15).
"""

import json
import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from mmux_flaskapi.utils.helpers import sanitize_varnames

_logger = logging.getLogger(__name__)

LOCAL_STORE_DIR = Path.cwd().parent.parent.parent / "runs_local"
LOCAL_STORE_DIR.mkdir(exist_ok=True)
LOCAL_STORE_FILE = LOCAL_STORE_DIR / "uploaded_job_collections_store.json"


def _empty_store() -> dict[str, Any]:
    return {
        "functions": [],
        "job_collections": [],
        "jobs": [],
    }


def _load_store() -> dict[str, Any]:
    if not LOCAL_STORE_FILE.exists():
        return _empty_store()
    try:
        return json.loads(LOCAL_STORE_FILE.read_text(encoding="utf-8"))
    except Exception as err:
        _logger.error("Could not read local job store: %s", err)
        return _empty_store()


def _save_store(store: dict[str, Any]) -> None:
    LOCAL_STORE_FILE.write_text(json.dumps(store, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# UID-prefix detectors (V15)
# ---------------------------------------------------------------------------


def is_local_function_uid(function_uid: str) -> bool:
    """Return True if *function_uid* identifies a locally-stored function."""
    return function_uid.startswith("local-func-")


def is_local_job_collection_uid(jc_uid: str) -> bool:
    """Return True if *jc_uid* identifies a locally-stored job collection."""
    return jc_uid.startswith("local-jc-")


def is_local_job_uid(job_uid: str) -> bool:
    """Return True if *job_uid* identifies a locally-stored job."""
    return job_uid.startswith("local-job-")


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------


def list_local_functions() -> list[dict[str, Any]]:
    """Return all locally-stored functions."""
    return _load_store()["functions"]


def get_local_function(function_uid: str) -> dict[str, Any] | None:
    """Return the local function with the given uid, or None."""
    return next(
        (fun for fun in _load_store()["functions"] if fun.get("uid") == function_uid),
        None,
    )


def list_local_job_collections(function_uid: str | None = None) -> list[dict[str, Any]]:
    """Return all local job collections, optionally filtered by function uid."""
    collections = _load_store()["job_collections"]
    if function_uid is None:
        return collections
    return [jc for jc in collections if jc.get("function_uid") == function_uid]


def get_local_job_collection(jc_uid: str) -> dict[str, Any] | None:
    """Return the local job collection with the given uid, or None."""
    return next(
        (jc for jc in _load_store()["job_collections"] if jc.get("uid") == jc_uid),
        None,
    )


def get_local_job(job_uid: str) -> dict[str, Any] | None:
    """Return the local job with the given uid, or None."""
    return next(
        (job for job in _load_store()["jobs"] if job.get("uid") == job_uid),
        None,
    )


def list_local_jobs_for_collection(jc_uid: str) -> list[dict[str, Any]]:
    """Return all local jobs belonging to the given job collection."""
    jc = get_local_job_collection(jc_uid)
    if jc is None:
        return []
    job_ids = set(jc.get("job_ids", []))
    return [job for job in _load_store()["jobs"] if job.get("uid") in job_ids]


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------


def _schema_from_vars(vars_set: set[str]) -> dict[str, Any]:
    return {
        "schema_content": {
            "type": "object",
            "properties": {sanitize_varnames(var): {"type": "number"} for var in sorted(vars_set)},
            "required": sorted(sanitize_varnames(var) for var in vars_set),
        }
    }


def create_local_function(
    *,
    title: str,
    description: str,
    input_vars: set[str],
    output_vars: set[str],
    source_function_uid: str | None,
) -> dict[str, Any]:
    """
    Create and persist a synthetic local function.

    Parameters
    ----------
    title:
        Human-readable title.
    description:
        Short description.
    input_vars:
        Set of input variable names.
    output_vars:
        Set of output variable names.
    source_function_uid:
        Optional uid of the oSPARC function this was uploaded from.

    Returns
    -------
    dict
        The newly created function record.
    """
    store = _load_store()
    now = datetime.now(tz=UTC).isoformat()
    uid = f"local-func-{uuid.uuid4().hex[:12]}"

    function_data: dict[str, Any] = {
        "uid": uid,
        "title": title,
        "description": description,
        "function_class": "LOCAL",
        "input_schema": _schema_from_vars(input_vars),
        "output_schema": _schema_from_vars(output_vars),
        "source_function_uid": source_function_uid,
        "created_at": now,
    }

    store["functions"].append(function_data)
    _save_store(store)
    return function_data


def create_local_job_collection(
    *,
    function_uid: str,
    job_rows: list[dict[str, Any]],
    title: str,
    description: str,
) -> dict[str, Any]:
    """
    Create and persist a local job collection with its jobs.

    Parameters
    ----------
    function_uid:
        Uid of the (local or oSPARC) function this collection belongs to.
    job_rows:
        List of dicts with keys ``inputs``, ``outputs``, ``status``, and
        optionally ``source_job_uid``.
    title:
        Human-readable title for the collection.
    description:
        Short description.

    Returns
    -------
    dict
        The newly created job-collection record.
    """
    store = _load_store()
    now = datetime.now(tz=UTC).isoformat()
    collection_uid = f"local-jc-{uuid.uuid4().hex[:12]}"

    job_ids: list[str] = []
    for row in job_rows:
        job_uid = f"local-job-{uuid.uuid4().hex[:12]}"
        job_ids.append(job_uid)
        store["jobs"].append(
            {
                "uid": job_uid,
                "function_uid": function_uid,
                "status": row["status"],
                "inputs": row["inputs"],
                "outputs": row["outputs"],
                "created_at": now,
                "source_job_uid": row.get("source_job_uid"),
            }
        )

    collection_data: dict[str, Any] = {
        "uid": collection_uid,
        "function_uid": function_uid,
        "title": title,
        "description": description,
        "job_ids": job_ids,
        "created_at": now,
    }
    store["job_collections"].append(collection_data)
    _save_store(store)
    return collection_data
