"""
Local, file-backed store for functions/job-collections/jobs created without a live
oSPARC connection (DEPLOYMENT_MODE=LOCAL) or uploaded via CSV import.

Ported from `DO-NOT-MERGE-feature/local-functions` (flaskapi/SPEC.md §T7), with the
following fixes baked in from the start (see flaskapi/SPEC.md §B1/§V17, §B5/§V20):
- Store directory is anchored to `LOCAL_STORE_DIR` env var or this file's location
  (never `Path.cwd()`), and is only created lazily on first write with
  `parents=True` -- not unconditionally at import time.
- A corrupt/unreadable store file is backed up (not silently discarded) before
  resetting to an empty store, and only `(OSError, json.JSONDecodeError)` are
  treated as "corrupt store", not a bare `except Exception`.
"""

import datetime as dt
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any

_logger = logging.getLogger(__name__)

LOCAL_FUNCTION_PREFIX = "local-func-"
LOCAL_JOB_COLLECTION_PREFIX = "local-jc-"
LOCAL_JOB_PREFIX = "local-job-"
UTC_TZ = getattr(dt, "timezone").utc


def _default_store_dir() -> Path:
    env_dir = os.environ.get("LOCAL_STORE_DIR")
    if env_dir:
        return Path(env_dir)
    # Anchor to this file's location (flaskapi/runs_local), not the process cwd.
    return Path(__file__).resolve().parents[3] / "runs_local"


LOCAL_STORE_DIR = _default_store_dir()
LOCAL_STORE_FILE = LOCAL_STORE_DIR / "uploaded_job_collections_store.json"


def _empty_store() -> dict[str, list]:
    return {"functions": [], "job_collections": [], "jobs": []}


def _backup_corrupt_store(reason: str) -> None:
    if not LOCAL_STORE_FILE.exists():
        return
    timestamp = dt.datetime.now(UTC_TZ).strftime("%Y%m%dT%H%M%S%f")
    backup_path = LOCAL_STORE_FILE.with_suffix(f".corrupt-{timestamp}.json.bak")
    try:
        LOCAL_STORE_FILE.rename(backup_path)
        _logger.error(
            "Local job store at %s is corrupt (%s); backed up to %s and resetting to empty store.",
            LOCAL_STORE_FILE,
            reason,
            backup_path,
        )
    except OSError as exc:
        _logger.error(
            "Local job store at %s is corrupt (%s); failed to back it up: %s",
            LOCAL_STORE_FILE,
            reason,
            exc,
        )


def _load_store() -> dict[str, list]:
    if not LOCAL_STORE_FILE.exists():
        return _empty_store()
    try:
        with LOCAL_STORE_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        _backup_corrupt_store(str(exc))
        return _empty_store()
    for key in ("functions", "job_collections", "jobs"):
        data.setdefault(key, [])
    return data


def _save_store(store: dict[str, list]) -> None:
    """Write the store to a sibling temp file, then atomically replace the target.

    Writing directly to `LOCAL_STORE_FILE` risks leaving a partially-written (and
    later "corrupt") file if the process is interrupted mid-write or multiple
    workers write concurrently; `os.replace` is atomic on both POSIX and Windows
    (flaskapi/SPEC.md V31, B18 fix).
    """
    LOCAL_STORE_DIR.mkdir(parents=True, exist_ok=True)
    tmp_file = LOCAL_STORE_FILE.with_name(f"{LOCAL_STORE_FILE.name}.tmp-{uuid.uuid4().hex[:8]}")
    try:
        with tmp_file.open("w", encoding="utf-8") as f:
            json.dump(store, f, indent=2)
        os.replace(tmp_file, LOCAL_STORE_FILE)
    except BaseException:
        tmp_file.unlink(missing_ok=True)
        raise


def is_local_function_uid(uid: str | None) -> bool:
    return bool(uid) and uid.startswith(LOCAL_FUNCTION_PREFIX)


def is_local_job_collection_uid(uid: str | None) -> bool:
    return bool(uid) and uid.startswith(LOCAL_JOB_COLLECTION_PREFIX)


def is_local_job_uid(uid: str | None) -> bool:
    return bool(uid) and uid.startswith(LOCAL_JOB_PREFIX)


def _schema_from_vars(var_names: list[str]) -> dict[str, Any]:
    """Build a minimal JSON-schema-shaped function input/output schema from variable names."""
    properties = {name: {"type": "number"} for name in var_names}
    return {
        "schema_content": {"type": "object", "properties": properties, "required": var_names},
        "schema_class": "application/schema+json",
    }


def list_local_functions() -> list[dict[str, Any]]:
    return list(_load_store()["functions"])


def get_local_function(function_uid: str) -> dict[str, Any] | None:
    for fun in _load_store()["functions"]:
        if fun["uid"] == function_uid:
            return fun
    return None


def list_local_job_collections() -> list[dict[str, Any]]:
    return list(_load_store()["job_collections"])


def list_local_jobs() -> list[dict[str, Any]]:
    return list(_load_store()["jobs"])


def get_local_job_collection(job_collection_uid: str) -> dict[str, Any] | None:
    for jc in _load_store()["job_collections"]:
        if jc["uid"] == job_collection_uid:
            return jc
    return None


def get_local_job(job_uid: str) -> dict[str, Any] | None:
    for job in _load_store()["jobs"]:
        if job["uid"] == job_uid:
            return job
    return None


def list_local_jobs_for_collection(job_collection_uid: str) -> list[dict[str, Any]]:
    jc = get_local_job_collection(job_collection_uid)
    if jc is None:
        return []
    store = _load_store()
    jobs_by_uid = {job["uid"]: job for job in store["jobs"]}
    return [jobs_by_uid[uid] for uid in jc["job_ids"] if uid in jobs_by_uid]


def list_local_job_collections_for_function(function_uid: str) -> list[dict[str, Any]]:
    return [jc for jc in _load_store()["job_collections"] if jc.get("function_uid") == function_uid]


def list_local_jobs_for_function(function_uid: str) -> list[dict[str, Any]]:
    return [job for job in _load_store()["jobs"] if job.get("function_uid") == function_uid]


def create_local_function(
    title: str,
    input_vars: list[str],
    output_vars: list[str],
    description: str = "",
) -> dict[str, Any]:
    function_data = {
        "uid": f"{LOCAL_FUNCTION_PREFIX}{uuid.uuid4().hex[:12]}",
        "title": title,
        "description": description,
        "function_class": "LOCAL",
        "input_schema": _schema_from_vars(input_vars),
        "output_schema": _schema_from_vars(output_vars),
        "default_inputs": None,
    }
    store = _load_store()
    store["functions"].append(function_data)
    _save_store(store)
    return function_data


def create_local_job_collection(
    function_uid: str,
    title: str,
    rows: list[dict[str, dict[str, Any]]],
    description: str = "",
) -> dict[str, Any]:
    """
    rows: list of {"inputs": {...}, "outputs": {...}} dicts, one per imported job.
    """
    store = _load_store()

    job_ids: list[str] = []
    jobs: list[dict[str, Any]] = []
    for row in rows:
        job_uid = f"{LOCAL_JOB_PREFIX}{uuid.uuid4().hex[:12]}"
        job = {
            "uid": job_uid,
            "function_uid": function_uid,
            "inputs": row["inputs"],
            "outputs": row["outputs"],
            "status": "SUCCESS",
            "function_class": "LOCAL",
        }
        jobs.append(job)
        job_ids.append(job_uid)

    job_collection = {
        "uid": f"{LOCAL_JOB_COLLECTION_PREFIX}{uuid.uuid4().hex[:12]}",
        "title": title,
        "description": description,
        "function_uid": function_uid,
        "job_ids": job_ids,
    }

    store["jobs"].extend(jobs)
    store["job_collections"].append(job_collection)
    _save_store(store)
    return job_collection
