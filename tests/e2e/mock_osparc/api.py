"""In-backend oSPARC test-double for the read-only SuMo e2e suite.

`MockOsparcApi` duck-types the slice of `OsparcApi` that `blueprints/osparc.py`
calls. It is injected as `app.osparc_api` by `create_flask_app()` when
`MMUX_E2E_MOCK_OSPARC` is set, so the backend never reaches real oSPARC. See root
SPEC.md §T9 / §V11.

The duck-typed surface (derived from `blueprints/osparc.py`):
  get_functions_api().list_functions(limit, offset)            -> _Page
  get_functions_api().list_function_jobs_for_functionid(uid)   -> _Page
  get_job_api().list_function_jobs(limit, offset)              -> _Page
  get_job_api().function_job_status(uid)                       -> obj.status
  get_job_api().get_function_job(uid)                          -> obj.to_dict()
  get_job_api().function_job_outputs(uid)                      -> dict
  get_job_collection_api().list_function_job_collections(...)  -> _Page
  get_job_collection_api().get_function_job_collection(uid)    -> obj.job_ids

`_Page` mirrors the paginated SDK response consumed by `helpers._get_all_items`
(`.total` plus `.items`, each item exposing `.to_dict()`).
"""

from __future__ import annotations

from types import SimpleNamespace

from . import data


class _Item:
    """Wraps a plain dict to expose the SDK's `.to_dict()` accessor."""

    def __init__(self, payload: dict):
        self._payload = payload

    def to_dict(self) -> dict:
        # Return a copy so downstream mutation (status/outputs injection) is isolated.
        return dict(self._payload)


class _Page:
    """Mirror of the paginated SDK response (`.items`, `.total`)."""

    def __init__(self, items: list[dict], limit: int | None = None, offset: int = 0):
        self.total = len(items)
        window = items[offset : offset + limit] if limit is not None else items[offset:]
        self.items = [_Item(p) for p in window]


class _FunctionsApi:
    def list_functions(self, limit: int | None = None, offset: int = 0, **_kw) -> _Page:
        return _Page(data.FUNCTIONS, limit=limit, offset=offset)

    def list_function_jobs_for_functionid(
        self, function_uid: str, limit: int | None = None, offset: int = 0, **_kw
    ) -> _Page:
        jobs = [j for j in data.JOBS if j["function_uid"] == function_uid]
        return _Page(jobs, limit=limit, offset=offset)


class _JobApi:
    def list_function_jobs(self, limit: int | None = None, offset: int = 0, **_kw) -> _Page:
        return _Page(data.JOBS, limit=limit, offset=offset)

    def function_job_status(self, job_uid: str, **_kw) -> SimpleNamespace:
        job = data.JOBS_BY_UID[job_uid]
        return SimpleNamespace(status=job["status"])

    def get_function_job(self, job_uid: str, **_kw) -> _Item:
        job = data.JOBS_BY_UID[job_uid]
        # status/outputs are re-attached by the blueprint; expose base fields here.
        payload = {k: v for k, v in job.items() if k not in ("status", "outputs")}
        return _Item(payload)

    def function_job_outputs(self, job_uid: str, **_kw) -> dict:
        return dict(data.JOBS_BY_UID[job_uid]["outputs"])


class _JobCollectionApi:
    def list_function_job_collections(
        self,
        limit: int | None = None,
        offset: int = 0,
        has_function_id: str | None = None,
        **_kw,
    ) -> _Page:
        collections = data.JOB_COLLECTIONS
        if has_function_id is not None:
            collections = [c for c in collections if c["function_uid"] == has_function_id]
        return _Page(collections, limit=limit, offset=offset)

    def get_function_job_collection(self, collection_uid: str, **_kw) -> SimpleNamespace:
        collection = next(c for c in data.JOB_COLLECTIONS if c["uid"] == collection_uid)
        return SimpleNamespace(job_ids=list(collection["job_ids"]))


class MockOsparcApi:
    """Deterministic in-process stand-in for `OsparcApi` (read-only SuMo e2e)."""

    def __init__(self):
        self._functions_api = _FunctionsApi()
        self._job_api = _JobApi()
        self._job_collection_api = _JobCollectionApi()

    def get_functions_api(self) -> _FunctionsApi:
        return self._functions_api

    def get_job_api(self) -> _JobApi:
        return self._job_api

    def get_job_collection_api(self) -> _JobCollectionApi:
        return self._job_collection_api

    def is_connected(self) -> bool:
        return True


def build_mock_osparc_api() -> MockOsparcApi:
    return MockOsparcApi()
