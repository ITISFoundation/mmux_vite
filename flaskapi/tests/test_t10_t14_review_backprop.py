"""
Regression tests for T10-T14: Copilot-review backprop fixes on #467 (B1-B5).

See SPEC.md §B (B1-B5) and §V (V17-V20) for the invariants each test guards.
"""

from __future__ import annotations

import importlib
import json

import pytest

# ---------------------------------------------------------------------------
# T10 -- B1: LOCAL_STORE_DIR anchored to env/__file__, not Path.cwd(); mkdir
# deferred to first write (V17)
# ---------------------------------------------------------------------------


class TestLocalStoreDirCwdIndependence:
    def test_local_store_dir_independent_of_cwd(self, tmp_path, monkeypatch):
        """Changing cwd must not change the computed default LOCAL_STORE_DIR (B1)."""
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.delenv("LOCAL_STORE_DIR", raising=False)
        monkeypatch.chdir(tmp_path)
        try:
            reloaded = importlib.reload(store_mod)
            assert reloaded.LOCAL_STORE_DIR != tmp_path / "runs_local"
            assert tmp_path not in reloaded.LOCAL_STORE_DIR.parents
        finally:
            importlib.reload(store_mod)

    def test_local_store_dir_respects_env_override(self, tmp_path, monkeypatch):
        """LOCAL_STORE_DIR env var, when set, takes precedence over the __file__ default (B1)."""
        import mmux_flaskapi.utils.local_job_store as store_mod

        custom_dir = tmp_path / "custom_local_store"
        monkeypatch.setenv("LOCAL_STORE_DIR", str(custom_dir))
        try:
            reloaded = importlib.reload(store_mod)
            assert reloaded.LOCAL_STORE_DIR == custom_dir
        finally:
            monkeypatch.delenv("LOCAL_STORE_DIR", raising=False)
            importlib.reload(store_mod)

    def test_mkdir_deferred_to_first_write(self, tmp_path, monkeypatch):
        """The store directory must not exist until the first write (B1)."""
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_dir = tmp_path / "nested" / "runs_local"
        store_file = store_dir / "store.json"
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        assert not store_dir.exists()

        store_mod.create_local_function(
            title="t",
            description="d",
            input_vars={"x"},
            output_vars={"y"},
            source_function_uid=None,
        )

        assert store_dir.exists()
        assert store_file.exists()


# ---------------------------------------------------------------------------
# T11 -- B2: response must not emit the same datum under both snake+camel key
# (V18)
# ---------------------------------------------------------------------------


class TestJobCollectionsNoDoubleJobIdsKey:
    def test_local_collection_response_has_single_jobids_key(
        self, test_client, tmp_path, monkeypatch
    ):
        monkeypatch.setenv("DEPLOYMENT_MODE", "LOCAL")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
        )

        fn = create_local_function(
            title="F",
            description="",
            input_vars={"x"},
            output_vars={"z"},
            source_function_uid=None,
        )
        create_local_job_collection(
            function_uid=fn["uid"],
            job_rows=[{"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"}],
            title="JC",
            description="",
        )

        response = test_client.get(
            f"/flask/osparc/list_function_job_collections_for_functionid?functionUid={fn['uid']}"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        # B2: exactly one of the two keys must survive the camelCase conversion,
        # with the correct value -- never a leftover "job_ids" alongside "jobIds".
        assert "jobIds" in data[0]
        assert "job_ids" not in data[0]
        assert len(data[0]["jobIds"]) == 1


# ---------------------------------------------------------------------------
# T12 -- B3: local merges/branches must be gated on DEPLOYMENT_MODE=LOCAL;
# OSPARC mode must never surface runs_local state (V15)
# ---------------------------------------------------------------------------


class TestLocalStateGatedByDeploymentMode:
    def test_list_functions_osparc_mode_excludes_local(
        self, test_client, tmp_path, monkeypatch, patch_list_functions_success
    ):
        monkeypatch.setenv("DEPLOYMENT_MODE", "OSPARC")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import create_local_function

        create_local_function(
            title="Local Fn",
            description="",
            input_vars={"x"},
            output_vars={"y"},
            source_function_uid=None,
        )

        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 3  # only the 3 oSPARC-mocked functions, no local leak
        assert all(not f["uid"].startswith("local-func-") for f in data)

    def test_list_function_job_collections_osparc_mode_excludes_local(
        self, test_client, tmp_path, monkeypatch, patch_list_function_job_collections_success
    ):
        monkeypatch.setenv("DEPLOYMENT_MODE", "OSPARC")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
        )

        fn = create_local_function(
            title="F",
            description="",
            input_vars={"x"},
            output_vars={"z"},
            source_function_uid=None,
        )
        create_local_job_collection(
            function_uid=fn["uid"],
            job_rows=[{"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"}],
            title="JC",
            description="",
        )

        response = test_client.get("/flask/osparc/list_function_job_collections")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2  # only the 2 oSPARC-mocked collections, no local leak
        assert all(not c["uid"].startswith("local-jc-") for c in data)

    def test_list_function_job_collections_for_functionid_osparc_mode_excludes_local(
        self, test_client, tmp_path, monkeypatch, patch_list_function_job_collections_success
    ):
        monkeypatch.setenv("DEPLOYMENT_MODE", "OSPARC")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
        )

        fn = create_local_function(
            title="F",
            description="",
            input_vars={"x"},
            output_vars={"z"},
            source_function_uid=None,
        )
        create_local_job_collection(
            function_uid=fn["uid"],
            job_rows=[{"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"}],
            title="JC",
            description="",
        )

        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?functionUid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2  # only the 2 oSPARC-mocked collections, no local leak
        assert all(not c["uid"].startswith("local-jc-") for c in data)

    def test_local_function_uid_not_resolved_locally_outside_local_mode(
        self, test_client, tmp_path, monkeypatch, patch_list_function_jobs_for_functionid_404
    ):
        """A local-func-* uid must not be served from the local store when not in
        LOCAL mode; it must fall through to the (mocked) oSPARC lookup and 404."""
        monkeypatch.delenv("DEPLOYMENT_MODE", raising=False)
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
        )

        fn = create_local_function(
            title="F",
            description="",
            input_vars={"x"},
            output_vars={"z"},
            source_function_uid=None,
        )
        create_local_job_collection(
            function_uid=fn["uid"],
            job_rows=[{"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"}],
            title="JC",
            description="",
        )

        response = test_client.get(
            f"/flask/osparc/list_function_jobs_for_functionid?functionUid={fn['uid']}"
        )
        assert response.status_code == 404

    def test_local_job_uid_not_resolved_locally_outside_local_mode(
        self, test_client, tmp_path, monkeypatch, patch_get_function_job_404
    ):
        """A local-job-* uid must not be served from the local store when not in
        LOCAL mode; it must fall through to the (mocked) oSPARC lookup and 404."""
        monkeypatch.setenv("DEPLOYMENT_MODE", "OSPARC")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
        )

        fn = create_local_function(
            title="F",
            description="",
            input_vars={"x"},
            output_vars={"z"},
            source_function_uid=None,
        )
        jc = create_local_job_collection(
            function_uid=fn["uid"],
            job_rows=[{"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"}],
            title="JC",
            description="",
        )
        job_uid = jc["job_ids"][0]

        response = test_client.get(f"/flask/osparc/get_function_job?jobUid={job_uid}")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# T13 -- B4: _parse_number raises ValueError(row,col) on unparseable non-blank,
# blank -> NaN sentinel (V19)
# ---------------------------------------------------------------------------


class TestParseUploadedCsvRejectsBadCells:
    def test_unparseable_cell_raises_with_row_and_column(self):
        from mmux_flaskapi.blueprints.sampling import _parse_uploaded_job_collection_csv

        bad_csv = (
            "source_job_uid,status,input__x,output__z\n"
            "job-1,completed,1.0,2.0\n"
            "job-2,completed,abc,4.0\n"
        )
        with pytest.raises(ValueError, match="abc"):
            _parse_uploaded_job_collection_csv(bad_csv)

    def test_swapped_columns_raise_instead_of_silently_zeroing(self):
        """A row where input/output values are swapped with non-numeric text must
        raise rather than silently feed a 0.0 into Dakota (B4)."""
        from mmux_flaskapi.blueprints.sampling import _parse_uploaded_job_collection_csv

        bad_csv = (
            "source_job_uid,status,input__x,output__z\n"
            "job-1,completed,not_a_number,also_not_a_number\n"
        )
        with pytest.raises(ValueError):
            _parse_uploaded_job_collection_csv(bad_csv)

    def test_blank_cell_becomes_nan_not_zero(self):
        import math

        from mmux_flaskapi.blueprints.sampling import _parse_uploaded_job_collection_csv

        csv_with_blank = "source_job_uid,status,input__x,output__z\njob-1,completed,,4.0\n"
        result = _parse_uploaded_job_collection_csv(csv_with_blank)
        assert math.isnan(result["job_rows"][0]["inputs"]["x"])


# ---------------------------------------------------------------------------
# T14 -- B5: _load_store catches only (OSError, json.JSONDecodeError), backs up
# the corrupt file instead of silently resetting the store (V20)
# ---------------------------------------------------------------------------


class TestLoadStoreCorruptFileHandling:
    def test_corrupt_json_is_backed_up_not_wiped(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_file = tmp_path / "store.json"
        store_file.write_text("{not valid json!!!", encoding="utf-8")
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        result = store_mod._load_store()

        assert result == store_mod._empty_store()
        # the corrupt original must survive under a backup path, not be overwritten in place
        assert not store_file.exists()
        backups = list(tmp_path.glob("store.json.corrupt-*.bak"))
        assert len(backups) == 1
        assert backups[0].read_text(encoding="utf-8") == "{not valid json!!!"

    def test_valid_store_not_treated_as_corrupt(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_file = tmp_path / "store.json"
        store_file.write_text(json.dumps(store_mod._empty_store()), encoding="utf-8")
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        result = store_mod._load_store()

        assert result == store_mod._empty_store()
        assert store_file.exists()
        assert list(tmp_path.glob("*.bak")) == []

    def test_other_errors_are_not_swallowed(self, tmp_path, monkeypatch):
        """Only (OSError, json.JSONDecodeError) are caught -- anything else propagates (B5)."""
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_file = tmp_path / "store.json"
        store_file.write_text("{}", encoding="utf-8")
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        def _boom(*args, **kwargs):
            raise RuntimeError("unexpected failure")

        monkeypatch.setattr(store_mod.json, "loads", _boom)

        with pytest.raises(RuntimeError, match="unexpected failure"):
            store_mod._load_store()
