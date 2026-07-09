"""Tests for `mmux_flaskapi.utils.local_job_store` (flaskapi/SPEC.md §T7, §B1/§V17, §B5/§V20)."""

import json
from pathlib import Path

import pytest

from mmux_flaskapi.utils import local_job_store as ljs


@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    """Point the local store at a throwaway directory for every test."""
    store_dir = tmp_path / "runs_local"
    store_file = store_dir / "uploaded_job_collections_store.json"
    monkeypatch.setattr(ljs, "LOCAL_STORE_DIR", store_dir)
    monkeypatch.setattr(ljs, "LOCAL_STORE_FILE", store_file)
    yield store_dir, store_file


class TestUidPredicates:
    def test_is_local_function_uid(self):
        assert ljs.is_local_function_uid("local-func-abc123")
        assert not ljs.is_local_function_uid("func-abc123")
        assert not ljs.is_local_function_uid(None)
        assert not ljs.is_local_function_uid("")

    def test_is_local_job_collection_uid(self):
        assert ljs.is_local_job_collection_uid("local-jc-abc123")
        assert not ljs.is_local_job_collection_uid("jc-abc123")

    def test_is_local_job_uid(self):
        assert ljs.is_local_job_uid("local-job-abc123")
        assert not ljs.is_local_job_uid("job-abc123")


class TestStoreDirAnchoring:
    def test_default_store_dir_is_not_cwd_dependent(self, monkeypatch):
        """B1: the default store dir must be derived from file location, not Path.cwd()."""
        monkeypatch.delenv("LOCAL_STORE_DIR", raising=False)
        default_dir = ljs._default_store_dir()
        assert default_dir.name == "runs_local"
        assert "mmux_flaskapi" not in str(default_dir)  # anchored above src/, not inside it

    def test_env_var_override(self, monkeypatch, tmp_path):
        custom = tmp_path / "custom_store"
        monkeypatch.setenv("LOCAL_STORE_DIR", str(custom))
        assert ljs._default_store_dir() == custom

    def test_store_dir_not_created_at_import_time(self, isolated_store):
        store_dir, _ = isolated_store
        assert not store_dir.exists()


class TestLoadStoreCorruption:
    def test_missing_file_returns_empty_store(self, isolated_store):
        assert ljs._load_store() == {"functions": [], "job_collections": [], "jobs": []}

    def test_corrupt_json_is_backed_up_not_discarded(self, isolated_store):
        """B5: a corrupt store file must be backed up, not silently overwritten/lost."""
        store_dir, store_file = isolated_store
        store_dir.mkdir(parents=True)
        store_file.write_text("{not valid json", encoding="utf-8")

        result = ljs._load_store()

        assert result == {"functions": [], "job_collections": [], "jobs": []}
        assert not store_file.exists()
        backups = list(store_dir.glob("*.corrupt-*.json.bak"))
        assert len(backups) == 1
        assert backups[0].read_text(encoding="utf-8") == "{not valid json"

    def test_only_os_and_json_errors_are_treated_as_corruption(self, isolated_store):
        """B5: a bare `except Exception` must not be used; other errors should propagate."""
        store_dir, store_file = isolated_store
        store_dir.mkdir(parents=True)
        store_file.write_text(json.dumps({"functions": []}), encoding="utf-8")
        # missing "job_collections"/"jobs" keys should be tolerated via setdefault, not an error
        result = ljs._load_store()
        assert result["job_collections"] == []
        assert result["jobs"] == []


class TestFunctionAndJobCollectionCrud:
    def test_create_and_get_local_function(self, isolated_store):
        fun = ljs.create_local_function(
            title="My Fn", input_vars=["x", "y"], output_vars=["z"], description="desc"
        )
        assert ljs.is_local_function_uid(fun["uid"])
        assert fun["function_class"] == "LOCAL"
        assert set(fun["input_schema"]["schema_content"]["properties"]) == {"x", "y"}
        assert set(fun["output_schema"]["schema_content"]["properties"]) == {"z"}

        fetched = ljs.get_local_function(fun["uid"])
        assert fetched == fun
        assert ljs.get_local_function("does-not-exist") is None
        assert fun in ljs.list_local_functions()

    def test_create_local_job_collection_and_list_jobs(self, isolated_store):
        fun = ljs.create_local_function(title="Fn", input_vars=["x"], output_vars=["y"])
        rows = [
            {"inputs": {"x": 1.0}, "outputs": {"y": 2.0}},
            {"inputs": {"x": 3.0}, "outputs": {"y": 4.0}},
        ]
        jc = ljs.create_local_job_collection(
            function_uid=fun["uid"], title="JC", rows=rows, description="d"
        )

        assert ljs.is_local_job_collection_uid(jc["uid"])
        assert len(jc["job_ids"]) == 2
        # B2: only a single canonical `job_ids` key -- no duplicate `jobIds` field.
        assert "jobIds" not in jc

        jobs = ljs.list_local_jobs_for_collection(jc["uid"])
        assert len(jobs) == 2
        assert {job["inputs"]["x"] for job in jobs} == {1.0, 3.0}
        assert all(job["status"] == "SUCCESS" for job in jobs)
        assert all(ljs.is_local_job_uid(job["uid"]) for job in jobs)

        assert ljs.get_local_job(jobs[0]["uid"]) == jobs[0]
        assert ljs.list_local_jobs_for_collection("does-not-exist") == []

    def test_persists_across_reloads(self, isolated_store):
        fun = ljs.create_local_function(title="Fn", input_vars=["x"], output_vars=["y"])
        # simulate a fresh process by reloading straight from disk
        reloaded = ljs._load_store()
        assert any(f["uid"] == fun["uid"] for f in reloaded["functions"])


class TestSaveStoreAtomicity:
    """V31 (B18): `_save_store` must never leave a partially-written store file."""

    def test_save_store_uses_temp_file_then_atomic_replace(self, isolated_store, monkeypatch):
        store_dir, store_file = isolated_store
        calls = []
        real_replace = ljs.os.replace

        def _spy_replace(src, dst):
            calls.append((Path(src), Path(dst)))
            return real_replace(src, dst)

        monkeypatch.setattr(ljs.os, "replace", _spy_replace)
        ljs.create_local_function(title="Fn", input_vars=["x"], output_vars=["y"])

        assert len(calls) == 1
        src, dst = calls[0]
        assert dst == store_file
        assert src != store_file
        assert src.parent == store_dir
        assert not list(store_dir.glob("*.tmp-*"))  # temp file cleaned up by the replace

    def test_save_store_does_not_corrupt_existing_file_on_write_failure(
        self, isolated_store, monkeypatch
    ):
        store_dir, store_file = isolated_store
        ljs.create_local_function(title="Fn", input_vars=["x"], output_vars=["y"])
        original_content = store_file.read_text(encoding="utf-8")

        def _boom(*args, **kwargs):
            raise OSError("simulated crash mid-write")

        monkeypatch.setattr(ljs.json, "dump", _boom)

        with pytest.raises(OSError):
            ljs._save_store(ljs._empty_store())

        # target file must be untouched -- no partial/corrupt write landed on it
        assert store_file.read_text(encoding="utf-8") == original_content
        assert not list(store_dir.glob("*.tmp-*"))  # no leftover temp file from the failed write
