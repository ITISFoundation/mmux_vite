"""Tests for local-uid routing + local-store merges in osparc.py (flaskapi/SPEC.md §T7)."""

from unittest.mock import patch

import pytest

from mmux_flaskapi.utils import local_job_store as ljs

pytestmark = pytest.mark.unit


@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    store_dir = tmp_path / "runs_local"
    monkeypatch.setattr(ljs, "LOCAL_STORE_DIR", store_dir)
    monkeypatch.setattr(ljs, "LOCAL_STORE_FILE", store_dir / "uploaded_job_collections_store.json")
    yield


@pytest.fixture
def local_function_and_collection():
    fun = ljs.create_local_function(title="Local Fn", input_vars=["x"], output_vars=["y"])
    jc = ljs.create_local_job_collection(
        function_uid=fun["uid"],
        title="Local JC",
        rows=[{"inputs": {"x": 1.0}, "outputs": {"y": 2.0}}],
    )
    return fun, jc


class TestListFunctionsLocalMerge:
    def test_local_functions_merged_outside_local_mode(
        self, test_client, patch_list_functions_success, local_function_and_collection
    ):
        """Local-store merging is universal (flaskapi/SPEC.md V15/V29): it no longer
        requires DEPLOYMENT_MODE=LOCAL."""
        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        local_fun, _ = local_function_and_collection
        assert any(f["uid"] == local_fun["uid"] for f in data)

    def test_local_functions_merged_in_local_mode(
        self, test_client, patch_list_functions_success, local_function_and_collection
    ):
        from mmux_flaskapi.utils.webserver_config import OsparcApi

        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            # Avoid a real network probe from `is_connected()`/`_test_connection()`:
            # short-circuit "is oSPARC reachable?" to reuse the already-mocked SDK.
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected",
                return_value=OsparcApi(),
            ):
                response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        local_fun, _ = local_function_and_collection
        assert any(f["uid"] == local_fun["uid"] for f in data)

    def test_local_mode_degrades_gracefully_when_osparc_unreachable(
        self, test_client, local_function_and_collection
    ):
        """Root-cause fix for the earlier 'Error fetching functions' bug: in LOCAL
        mode, an unreachable oSPARC connection must not turn into a 500 -- it
        should just fall back to local-only results."""
        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected", return_value=None
            ):
                response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        local_fun, _ = local_function_and_collection
        assert len(data) == 1
        assert data[0]["uid"] == local_fun["uid"]


class TestLocalUidRouting:
    def test_list_function_jobs_for_local_functionid(
        self, test_client, local_function_and_collection
    ):
        local_fun, _ = local_function_and_collection
        response = test_client.get(
            f"/flask/osparc/list_function_jobs_for_functionid?functionUid={local_fun['uid']}"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["inputs"]["x"] == 1.0

    def test_list_function_jobs_for_local_jobcollectionid(
        self, test_client, local_function_and_collection
    ):
        _, jc = local_function_and_collection
        response = test_client.get(
            f"/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid={jc['uid']}"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["outputs"]["y"] == 2.0

    def test_list_function_job_collections_for_local_functionid(
        self, test_client, local_function_and_collection
    ):
        local_fun, jc = local_function_and_collection
        response = test_client.get(
            f"/flask/osparc/list_function_job_collections_for_functionid?functionUid={local_fun['uid']}"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["uid"] == jc["uid"]

    def test_get_function_job_for_local_job_uid(self, test_client, local_function_and_collection):
        _, jc = local_function_and_collection
        job_uid = jc["jobIds"][0] if "jobIds" in jc else jc["job_ids"][0]
        response = test_client.get(f"/flask/osparc/get_function_job?jobUid={job_uid}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["uid"] == job_uid
        assert data["status"] == "SUCCESS"

    def test_get_function_job_status_for_local_job_uid(
        self, test_client, local_function_and_collection
    ):
        _, jc = local_function_and_collection
        job_uid = jc["jobIds"][0] if "jobIds" in jc else jc["job_ids"][0]
        response = test_client.get(f"/flask/osparc/get_function_job_status?jobUid={job_uid}")
        assert response.status_code == 200
        assert response.get_json()["status"] == "SUCCESS"

    def test_get_function_job_outputs_for_local_job_uid(
        self, test_client, local_function_and_collection
    ):
        _, jc = local_function_and_collection
        job_uid = jc["jobIds"][0] if "jobIds" in jc else jc["job_ids"][0]
        response = test_client.get(f"/flask/osparc/get_function_job_outputs?jobUid={job_uid}")
        assert response.status_code == 200
        assert response.get_json()["y"] == 2.0

    def test_list_jobs_merges_local_jobs(self, test_client, patch_list_function_jobs_success):
        fun = ljs.create_local_function(title="Local Fn 2", input_vars=["x"], output_vars=["y"])
        ljs.create_local_job_collection(
            function_uid=fun["uid"],
            title="Local JC 2",
            rows=[{"inputs": {"x": 1.0}, "outputs": {"y": 2.0}}],
        )
        response = test_client.get("/flask/osparc/list_jobs")
        assert response.status_code == 200
        data = response.get_json()
        assert any(ljs.is_local_job_uid(j["uid"]) for j in data)
        assert any(not ljs.is_local_job_uid(j["uid"]) for j in data)

    def test_real_functionid_jobs_merge_local_regardless_of_deployment_mode(
        self, test_client, patch_list_function_jobs_for_functionid_success
    ):
        """A CSV imported in 'existing' mode attaches local jobs to a real function
        uid; those now always surface, regardless of DEPLOYMENT_MODE (flaskapi/SPEC.md
        V15/V29 -- supersedes the old B3 DEPLOYMENT_MODE gate)."""
        real_function_uid = "real-func-1"
        local_jc = ljs.create_local_job_collection(
            function_uid=real_function_uid,
            title="Attached JC",
            rows=[{"inputs": {"a": 1.0}, "outputs": {"b": 2.0}}],
        )
        n_local_jobs = len(local_jc.get("jobIds") or local_jc.get("job_ids"))

        response = test_client.get(
            f"/flask/osparc/list_function_jobs_for_functionid?functionUid={real_function_uid}"
        )
        assert response.status_code == 200
        data_outside_local_mode = response.get_json()

        from mmux_flaskapi.utils.webserver_config import OsparcApi

        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            # Avoid a real network probe from `is_connected()`/`_test_connection()`:
            # short-circuit "is oSPARC reachable?" to reuse the already-mocked SDK.
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected",
                return_value=OsparcApi(),
            ):
                response = test_client.get(
                    f"/flask/osparc/list_function_jobs_for_functionid?functionUid={real_function_uid}"
                )
        assert response.status_code == 200
        data_in_local_mode = response.get_json()

        assert len(data_outside_local_mode) == len(data_in_local_mode)
        assert n_local_jobs == 1
        assert sum(1 for j in data_in_local_mode if j.get("functionClass") == "LOCAL") == 1


class TestLocalModeGracefulDegradationForFunctionIdEndpoints:
    """V29 (B16): a real (non-local) function uid must degrade gracefully -- not
    500 -- when DEPLOYMENT_MODE=LOCAL and oSPARC is unreachable, same as the
    already-fixed list_functions/list_function_job_collections endpoints."""

    def test_list_function_jobs_for_functionid_degrades_gracefully(self, test_client):
        real_function_uid = "real-func-1"
        local_jc = ljs.create_local_job_collection(
            function_uid=real_function_uid,
            title="Attached JC",
            rows=[{"inputs": {"a": 1.0}, "outputs": {"b": 2.0}}],
        )
        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected", return_value=None
            ):
                response = test_client.get(
                    "/flask/osparc/list_function_jobs_for_functionid"
                    f"?functionUid={real_function_uid}"
                )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == len(local_jc.get("jobIds") or local_jc.get("job_ids"))

    def test_list_function_job_collections_for_functionid_degrades_gracefully(self, test_client):
        real_function_uid = "real-func-1"
        ljs.create_local_job_collection(
            function_uid=real_function_uid,
            title="Attached JC",
            rows=[{"inputs": {"a": 1.0}, "outputs": {"b": 2.0}}],
        )
        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected", return_value=None
            ):
                response = test_client.get(
                    "/flask/osparc/list_function_job_collections_for_functionid"
                    f"?functionUid={real_function_uid}"
                )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 1
