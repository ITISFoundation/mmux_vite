"""
Tests for POST /flask/sampling/upload_job_collection_csv (flaskapi/SPEC.md §T6).
"""

from unittest.mock import patch

import pytest

from mmux_flaskapi.utils import local_job_store as ljs

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    store_dir = tmp_path / "runs_local"
    monkeypatch.setattr(ljs, "LOCAL_STORE_DIR", store_dir)
    monkeypatch.setattr(ljs, "LOCAL_STORE_FILE", store_dir / "uploaded_job_collections_store.json")
    yield


VALID_CSV = (
    "# source_function_uid,orig-func-1\n"
    "# source_job_collection_uid,orig-jc-1\n"
    '# source_job_collection_title,"My Samples"\n'
    "source_job_uid,status,input__x,output__y\n"
    "job-1,SUCCESS,1.0,2.0\n"
    "job-2,SUCCESS,3.0,4.0\n"
)


class TestUploadJobCollectionCsvNewMode:
    def test_new_mode_creates_local_function_and_job_collection(self, test_client):
        payload = {
            "csvContent": VALID_CSV,
            "targetMode": "new",
            "newFunctionTitle": "Imported Fn",
        }
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["importedSamples"] == 2
        assert data["targetFunctionUid"].startswith("local-func-")
        new_fun = ljs.get_local_function(data["targetFunctionUid"])
        assert new_fun["title"] == "Imported Fn"

    def test_new_mode_defaults_title_from_preamble(self, test_client):
        payload = {"csvContent": VALID_CSV, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        new_fun = ljs.get_local_function(data["targetFunctionUid"])
        assert new_fun["title"] == "My Samples"


class TestUploadJobCollectionCsvExistingMode:
    def test_existing_mode_requires_target_function_uid(self, test_client):
        payload = {"csvContent": VALID_CSV, "targetMode": "existing"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 400

    def test_existing_mode_attaches_to_local_function(self, test_client):
        local_fun = ljs.create_local_function(
            title="Existing Fn", input_vars=["x"], output_vars=["y"]
        )
        payload = {
            "csvContent": VALID_CSV,
            "targetMode": "existing",
            "targetFunctionUid": local_fun["uid"],
        }
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["targetFunctionUid"] == local_fun["uid"]
        assert data["importedSamples"] == 2
        jobs = ljs.list_local_jobs_for_collection(data["jobCollection"]["uid"])
        assert len(jobs) == 2

    def test_existing_mode_rejects_schema_mismatch(self, test_client):
        local_fun = ljs.create_local_function(
            title="Existing Fn", input_vars=["a"], output_vars=["b"]
        )
        payload = {
            "csvContent": VALID_CSV,
            "targetMode": "existing",
            "targetFunctionUid": local_fun["uid"],
        }
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422
        assert "schema" in response.get_json()["error"].lower()

    def test_existing_mode_rejects_unknown_function_uid(self, test_client):
        payload = {
            "csvContent": VALID_CSV,
            "targetMode": "existing",
            "targetFunctionUid": "local-func-doesnotexist",
        }
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422

    def test_existing_mode_real_function_uid_degrades_gracefully_when_unreachable(
        self, test_client
    ):
        """V29 (B16): a real (non-local) target_function_uid must produce a
        controlled 422, not a 500, when DEPLOYMENT_MODE=LOCAL and oSPARC is
        unreachable (_function_schema_vars fix)."""
        payload = {
            "csvContent": VALID_CSV,
            "targetMode": "existing",
            "targetFunctionUid": "real-func-1",
        }
        with patch.dict("os.environ", {"DEPLOYMENT_MODE": "LOCAL"}):
            with patch(
                "mmux_flaskapi.blueprints.osparc.get_osparc_api_if_connected", return_value=None
            ):
                response = test_client.post(
                    "/flask/sampling/upload_job_collection_csv", json=payload
                )
        assert response.status_code == 422


class TestUploadJobCollectionCsvValidation:
    def test_missing_input_output_columns_rejected(self, test_client):
        csv_content = "source_job_uid,status\njob-1,SUCCESS\n"
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422

    def test_no_data_rows_rejected(self, test_client):
        csv_content = "source_job_uid,status,input__x,output__y\n"
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422

    def test_unparseable_cell_rejected_with_row_context(self, test_client):
        csv_content = "source_job_uid,status,input__x,output__y\njob-1,SUCCESS,not-a-number,2.0\n"
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422
        error = response.get_json()["error"]
        assert "row 2" in error

    def test_blank_cell_skipped_not_coerced_to_zero(self, test_client):
        csv_content = "source_job_uid,status,input__x,output__y\njob-1,SUCCESS,,2.0\n"
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        job_collection_uid = data["jobCollection"]["uid"]
        jobs = ljs.list_local_jobs_for_collection(job_collection_uid)
        assert "x" not in jobs[0]["inputs"]

    def test_missing_required_fields(self, test_client):
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json={})
        assert response.status_code == 400

    def test_wrong_column_count_row_rejected_with_row_context(self, test_client):
        """V30 (B18): a data row with fewer/more cells than the header must be
        rejected (422 w/ row context), not silently truncated/misaligned by
        `dict(zip(header, cells))`."""
        csv_content = (
            "source_job_uid,status,input__x,output__y\n"
            "job-1,SUCCESS,1.0\n"  # missing the output__y cell
        )
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422
        error = response.get_json()["error"]
        assert "Row 2" in error

    def test_extra_column_row_rejected_with_row_context(self, test_client):
        csv_content = (
            "source_job_uid,status,input__x,output__y\n"
            "job-1,SUCCESS,1.0,2.0,extra\n"  # one extra cell
        )
        payload = {"csvContent": csv_content, "targetMode": "new"}
        response = test_client.post("/flask/sampling/upload_job_collection_csv", json=payload)
        assert response.status_code == 422
        error = response.get_json()["error"]
        assert "Row 2" in error
