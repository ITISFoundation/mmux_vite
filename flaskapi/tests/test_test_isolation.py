"""§V26 / §T26 (root SPEC.md B15): backend tests never read or write repository
persistence state.

B15 recurred on 2026-10-08: a `make run-*` dev stack left collections in the
repository `flaskapi/runs_local/` store and 9 list-endpoint tests failed with
`assert 3 == 0` until the store was manually redirected. The autouse
`isolate_persistence_dirs` fixture in conftest.py is the invariant; these
tests pin it (per-run temp dirs, dirty-state scenario from B15, repo file
byte-stable across a full persistence round-trip).
"""

from pathlib import Path

import pytest

from mmux_flaskapi.blueprints import textfile
from mmux_flaskapi.utils import local_job_store as ljs

pytestmark = pytest.mark.unit

# The default (unpatched) store location: _default_store_dir anchors to
# src/mmux_flaskapi/utils/ -> parents[3] == flaskapi/ (flaskapi §B1/V17).
REPO_STORE_FILE = (
    Path(ljs.__file__).resolve().parents[3] / "runs_local" / ("uploaded_job_collections_store.json")
)


def test_v26_store_and_text_dirs_point_at_tmp(tmp_path):
    """The active persistence roots are the per-test tmp dirs, ⊥ repo defaults."""
    assert ljs.LOCAL_STORE_DIR == tmp_path / "runs_local"
    assert ljs.LOCAL_STORE_FILE.parent == tmp_path / "runs_local"
    assert textfile.FILES_STORAGE_DIR == tmp_path / "text_files"
    assert tmp_path in ljs.LOCAL_STORE_DIR.parents


def test_v26_b15_dirty_store_never_leaks_into_repo(test_client, patch_list_functions_success):
    """B15 repro: seed 27 collections (the 'expected 3 -> actual 27' scenario).

    The endpoint must see the seeded isolated store (isolation still exercises
    the real merge path, not a mocked-out store) while the repository store
    file stays byte-identical.
    """
    repo_before = REPO_STORE_FILE.read_bytes() if REPO_STORE_FILE.exists() else None

    fun = ljs.create_local_function(title="B15 repro fn", input_vars=["x"], output_vars=["y"])
    for i in range(27):
        ljs.create_local_job_collection(
            function_uid=fun["uid"],
            title=f"B15 JC {i}",
            rows=[{"inputs": {"x": 1.0}, "outputs": {"y": 2.0}}],
        )

    assert len(ljs.list_local_job_collections()) == 27

    response = test_client.get("/flask/osparc/list_functions")
    assert response.status_code == 200
    data = response.get_json()
    assert any(f["uid"] == fun["uid"] for f in data), "endpoint must read the isolated store"

    repo_after = REPO_STORE_FILE.read_bytes() if REPO_STORE_FILE.exists() else None
    assert repo_after == repo_before, "repository runs_local store must be untouched by tests"
    # And the write landed in the tmp store:
    assert ljs.LOCAL_STORE_FILE.exists()


def test_v26_text_file_write_lands_in_tmp_dir(test_client, tmp_path):
    """A real (unmocked) text-file POST writes into the tmp dir; the container
    default `/text-files` or repo paths are never touched."""
    response = test_client.post("/flask/text-file/", json={"filename": "v26.txt", "content": "hi"})
    assert response.status_code == 200
    assert (tmp_path / "text_files" / "v26.txt").read_text(encoding="utf-8") == "hi"
    assert not Path("/text-files/v26.txt").exists()
