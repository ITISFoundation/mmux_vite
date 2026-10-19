"""Benchmarks for the Function viewer's per-mount counts fetch (ITISFoundation#498).

Every ``FunctionList`` mount (initial viewer load, Refresh, the post-CSV-upload
refetch) fetches campaign/evaluation counts for EVERY function. As of this
benchmark's writing the client does it as a fan-out: one
``GET /flask/osparc/list_functions`` followed by one
``GET /flask/osparc/list_function_job_collections_for_functionid`` per function
-- 1 + N full Flask request round-trips through the api_endpoint/JSON-transform
middleware, each per-function leg additionally paying the V50tj (upstream
#382) probe + page calls of the now-paginated fetcher; the mock below
reproduces the API's pagination protocol, default page included.

``test_functionlist_counts_fetch`` measures that fetch as ONE workload, with the
request pattern itself as code under test. The #498 scalability slice replaces
the fan-out with the aggregate ``get_function_job_collection_counts`` endpoint
(1 + 1 requests).

IMPORTANT: the benchmark function's NAME is its identity in CodSpeed. The
before/after PRs must rewrite this body in place -- do not rename the test --
or CodSpeed can no longer compare the two request patterns and the measured
speedup is lost. When rewriting, keep the lightweight _Item/_Page doubles
below: hundreds of envelopes are built inside the timed workload per
iteration, and MagicMock construction alone measured ~62ms of ~83ms, so a
MagicMock side against a double side measures mocks, not the app.
"""

from copy import deepcopy
from unittest.mock import MagicMock, patch

import pytest

from mmux_flaskapi.app import create_flask_app
from mmux_flaskapi.utils import local_job_store

# Deterministic scale, mirrored by node/src/utils/functionListCounts.bench.ts:
# 25 functions (above the 20-item server default page, so the fan-out's
# pagination behaviour is part of the measured path), 4 jobs per collection.
N_FUNCTIONS = 25
JC_PER_FUNCTION = 25
JOBS_PER_JC = 4
# The oSPARC listing's server-side default page size: a request without `limit`
# returns at most this many items (max allowed is 50, see helpers._get_all_items).
SERVER_DEFAULT_PAGE = 20

# Real MMUX study variable names + snake_case filler, so the V13/V37
# variable-name-preserving response conversion runs over names that are NOT
# lossless camelCase round-trips (same shape as test_bench_serialization).
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
INPUT_VARS = IRREGULAR_VARS + [f"input_var_{i}" for i in range(len(IRREGULAR_VARS), 40)]
OUTPUT_VARS = ["-AFpeak", "activation threshold", "energy (uJ)"]


def _function_dict(index: int) -> dict:
    return {
        "uid": f"11111111-0000-4000-8000-{index:012d}",
        "name": f"Function {index:02d}",
        "description": "A demo function benchmarked for viewer-list scalability",
        "input_schema": {
            "type": "object",
            "properties": {var: {"type": "number"} for var in INPUT_VARS},
            "required": INPUT_VARS,
        },
        "output_schema": {
            "type": "object",
            "properties": {var: {"type": "number"} for var in OUTPUT_VARS},
            "required": OUTPUT_VARS,
        },
        "created_at": "2026-01-01T00:00:00+00:00",
        "user_id": 42,
    }


def _job_collection_dict(function_index: int, jc_index: int) -> dict:
    return {
        "uid": f"22222222-{function_index:02d}-{jc_index:02d}-4000-800000000000",
        "name": f"Campaign {jc_index:02d}",
        "job_ids": [
            f"33333333-{function_index:02d}-{jc_index:02d}-{job:02d}-800000000000"
            for job in range(JOBS_PER_JC)
        ],
        "created_at": "2026-01-01T00:00:00+00:00",
    }


class _Item:
    """Lightweight stand-in for an SDK model.

    `to_dict()` is the entire surface `_get_all_items` uses on an item. The
    payload is deep-copied once at construction, so every listing call hands
    out a fresh copy, exactly like the SDK models.

    Deliberately NOT a MagicMock: ~700 envelopes are constructed INSIDE the
    timed workload each iteration, and MagicMock construction alone measured
    ~56ms of this benchmark's ~83ms baseline -- test-double overhead would
    swamp the application work the CodSpeed pair exists to compare.
    """

    __slots__ = ("_dict",)

    def __init__(self, item: dict) -> None:
        self._dict = item

    def to_dict(self) -> dict:
        return self._dict


class _Page:
    """Lightweight stand-in for an SDK page envelope (`.items` + `.total` only)."""

    __slots__ = ("items", "total")

    def __init__(self, items: list[dict], total: int) -> None:
        self.items = [_Item(deepcopy(item)) for item in items]
        self.total = total


def _page(items: list[dict], kwargs: dict, total: int) -> _Page:
    """Paginate like the real API, applying the server default page when omitted."""
    limit = kwargs.get("limit") or SERVER_DEFAULT_PAGE
    offset = kwargs.get("offset") or 0
    return _Page(items[offset : offset + limit], total)


# Payloads are built once at import time; the mocks below only slice them.
_FUNCTION_ITEMS = [_function_dict(i) for i in range(N_FUNCTIONS)]
_JC_ITEMS_BY_FUNCTION = {
    f"11111111-0000-4000-8000-{i:012d}": [
        _job_collection_dict(i, jc) for jc in range(JC_PER_FUNCTION)
    ]
    for i in range(N_FUNCTIONS)
}


def _list_functions_paged(*_args, **kwargs):
    return _page(_FUNCTION_ITEMS, kwargs, N_FUNCTIONS)


def _list_job_collections_paged(*_args, **kwargs):
    items = _JC_ITEMS_BY_FUNCTION[kwargs["has_function_id"]]
    return _page(items, kwargs, JC_PER_FUNCTION)


@pytest.fixture
def counts_client(tmp_path, monkeypatch):
    """Real app + blueprint over a fully mocked, fully deterministic oSPARC.

    Mirrors tests/conftest.py's autouse fixtures that this suite deliberately
    does not import (B15 store isolation, oSPARC credentials, reachability
    probe) -- scoped to this module's tests only.
    """
    store_dir = tmp_path / "runs_local"
    monkeypatch.setenv("OSPARC_API_BASE_URL", "https://bench.example.io")
    monkeypatch.setenv("OSPARC_API_KEY", "bench_key")
    monkeypatch.setenv("OSPARC_API_SECRET", "bench_secret")
    monkeypatch.setenv("LOCAL_STORE_DIR", str(store_dir))
    monkeypatch.setattr(local_job_store, "LOCAL_STORE_DIR", store_dir)
    monkeypatch.setattr(
        local_job_store, "LOCAL_STORE_FILE", store_dir / "uploaded_job_collections_store.json"
    )

    with (
        # V15/V29 reachability probe on the first request (then cached).
        patch(
            "osparc_client.api.users_api.UsersApi.get_my_profile",
            return_value=MagicMock(model_dump_json=lambda **kwargs: "{}"),
        ),
        patch(
            "osparc_client.api.functions_api.FunctionsApi.list_functions",
            side_effect=_list_functions_paged,
        ),
        patch(
            "osparc_client.api.function_job_collections_api.FunctionJobCollectionsApi.list_function_job_collections",
            side_effect=_list_job_collections_paged,
        ),
    ):
        yield create_flask_app().test_client()


def test_functionlist_counts_fetch(benchmark, counts_client):
    """Whole client workload of populating the counts column for all functions.

    Baseline (fan-out): 1 list_functions + 25 per-function requests. The
    per-function fetcher is V50tj-paginated (upstream #382), so each request
    pays the _get_all_items probe + page round-trips on the way to the full
    25-collection count -- this is the honest pattern the aggregate endpoint
    must beat, middleware cost included.
    """

    def fetch_all_counts():
        functions = counts_client.get("/flask/osparc/list_functions").get_json()
        per_function = [
            counts_client.get(
                f"/flask/osparc/list_function_job_collections_for_functionid?functionUid={function['uid']}"
            ).get_json()
            for function in functions
        ]
        return [
            (len(job_collections), sum(len(jc["jobIds"]) for jc in job_collections))
            for job_collections in per_function
        ]

    counts = benchmark(fetch_all_counts)
    assert len(counts) == N_FUNCTIONS
    # Paginated (V50tj): full 25 collections x 4 jobs each, not the 20-item page.
    assert counts == [(JC_PER_FUNCTION, JC_PER_FUNCTION * JOBS_PER_JC)] * N_FUNCTIONS
