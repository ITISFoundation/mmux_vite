"""
Tests for T6 (CSV import/export), T7 (local_job_store), and T9 (log-scale backend).
"""

from __future__ import annotations

import math
from typing import Any

import pytest

from mmux_flaskapi.blueprints.osparc import _job_collection_jobs_to_csv
from mmux_flaskapi.blueprints.sampling import (
    _parse_number,
    _parse_uploaded_job_collection_csv,
    _split_csv_preamble_and_table,
)

# ---------------------------------------------------------------------------
# T6 — CSV helpers
# ---------------------------------------------------------------------------


class TestSplitCsvPreambleAndTable:
    def test_empty_content_returns_empty_metadata_and_empty_table(self):
        metadata, table = _split_csv_preamble_and_table("")
        assert metadata == {}
        assert table == ""

    def test_preamble_lines_parsed_to_metadata(self):
        content = "# schema_version,2\n# source_job_collection_uid,abc-123\na,b\n1,2\n"
        metadata, table = _split_csv_preamble_and_table(content)
        assert metadata["schema_version"] == "2"
        assert metadata["source_job_collection_uid"] == "abc-123"
        assert "a,b" in table

    def test_table_preserved_without_preamble(self):
        content = "a,b\n1,2\n3,4\n"
        metadata, table = _split_csv_preamble_and_table(content)
        assert metadata == {}
        assert "1,2" in table

    def test_preamble_value_with_comma_preserved(self):
        content = "# key,value,with,commas\n"
        metadata, _table = _split_csv_preamble_and_table(content)
        assert metadata["key"] == "value,with,commas"


class TestParseNumber:
    def test_integer_string(self):
        assert _parse_number("42") == 42.0

    def test_float_string(self):
        assert abs(_parse_number("3.14") - 3.14) < 1e-9

    def test_empty_returns_nan(self):
        """B4: truly-blank cells are a missing-data sentinel (NaN), not 0.0."""
        assert math.isnan(_parse_number(""))

    def test_whitespace_returns_nan(self):
        assert math.isnan(_parse_number("   "))

    def test_unparseable_raises_value_error(self):
        """B4: an unparseable non-blank cell must raise, not silently become 0.0."""
        with pytest.raises(ValueError, match="NaN_string"):
            _parse_number("NaN_string")

    def test_unparseable_raises_with_row_col_context(self):
        with pytest.raises(ValueError, match="row 3.*column 'input__x'"):
            _parse_number("abc", row=3, col="input__x")


class TestParseUploadedJobCollectionCsv:
    _CSV = (
        "# schema_version,2\n"
        "# source_job_collection_uid,jc-001\n"
        "# source_job_collection_title,My Collection\n"
        "# source_function_uid,func-001\n"
        "source_job_uid,status,input__x,input__y,output__z\n"
        "job-1,completed,1.0,2.0,3.0\n"
        "job-2,completed,4.0,5.0,6.0\n"
    )

    def test_parses_inputs_and_outputs(self):
        result = _parse_uploaded_job_collection_csv(self._CSV)
        assert result["input_vars"] == {"x", "y"}
        assert result["output_vars"] == {"z"}

    def test_parses_job_rows(self):
        result = _parse_uploaded_job_collection_csv(self._CSV)
        assert len(result["job_rows"]) == 2
        assert result["job_rows"][0]["inputs"]["x"] == 1.0
        assert result["job_rows"][0]["outputs"]["z"] == 3.0

    def test_parses_metadata(self):
        result = _parse_uploaded_job_collection_csv(self._CSV)
        assert result["source_job_collection_uid"] == "jc-001"
        assert result["source_job_collection_title"] == "My Collection"
        assert result["source_function_uid"] == "func-001"

    def test_missing_input_columns_raises(self):
        bad_csv = "source_job_uid,status,output__z\njob-1,completed,3.0\n"
        with pytest.raises(ValueError, match="input__"):
            _parse_uploaded_job_collection_csv(bad_csv)

    def test_missing_output_columns_raises(self):
        bad_csv = "source_job_uid,status,input__x\njob-1,completed,1.0\n"
        with pytest.raises(ValueError, match="output__"):
            _parse_uploaded_job_collection_csv(bad_csv)

    def test_empty_rows_raises(self):
        bad_csv = "source_job_uid,status,input__x,output__z\n"
        with pytest.raises(ValueError, match="no data rows"):
            _parse_uploaded_job_collection_csv(bad_csv)


class TestJobCollectionJobsToCsv:
    def _make_jobs(self) -> list[dict[str, Any]]:
        return [
            {
                "uid": "job-1",
                "status": "completed",
                "inputs": {"x": 1.0, "y": 2.0},
                "outputs": {"z": 3.0},
                "function_uid": "func-001",
            },
            {
                "uid": "job-2",
                "status": "completed",
                "inputs": {"x": 4.0, "y": 5.0},
                "outputs": {"z": 6.0},
                "function_uid": "func-001",
            },
        ]

    def test_csv_contains_preamble(self):
        csv_text = _job_collection_jobs_to_csv("jc-001", "Test Collection", self._make_jobs())
        assert "# schema_version,2" in csv_text
        assert "# source_job_collection_uid,jc-001" in csv_text
        assert "# source_job_collection_title,Test Collection" in csv_text

    def test_csv_contains_header_and_rows(self):
        csv_text = _job_collection_jobs_to_csv("jc-001", "Test", self._make_jobs())
        assert "input__x" in csv_text
        assert "output__z" in csv_text
        assert "1.0" in csv_text

    def test_roundtrip_parse(self):
        jobs = self._make_jobs()
        csv_text = _job_collection_jobs_to_csv("jc-001", "Test", jobs)
        parsed = _parse_uploaded_job_collection_csv(csv_text)
        assert parsed["input_vars"] == {"x", "y"}
        assert parsed["output_vars"] == {"z"}
        assert len(parsed["job_rows"]) == 2
        assert parsed["job_rows"][0]["inputs"]["x"] == 1.0


# ---------------------------------------------------------------------------
# T6 — Flask upload endpoint
# ---------------------------------------------------------------------------

_UPLOAD_CSV = (
    "# schema_version,2\n"
    "# source_job_collection_uid,jc-src\n"
    "# source_job_collection_title,Source Collection\n"
    "source_job_uid,status,input__a,output__b\n"
    "j1,completed,10.0,20.0\n"
    "j2,completed,30.0,40.0\n"
)


class TestFlaskUploadJobCollectionCsv:
    """Integration tests for POST /flask/sampling/upload_job_collection_csv."""

    def test_upload_new_mode_creates_collection(self, test_client, tmp_path, monkeypatch):
        # Redirect the store file to a temp dir so tests don't pollute the real store
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_file = tmp_path / "test_store.json"
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        payload = {
            "csvContent": _UPLOAD_CSV,
            "targetMode": "new",
            "newFunctionTitle": "Test Function",
        }
        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json=payload,
        )
        assert response.status_code == 200, response.get_data(as_text=True)
        # The after_request hook converts response keys to camelCase
        data = response.get_json()
        assert data["importedSamples"] == 2
        assert data["targetFunctionUid"].startswith("local-func-")
        assert data["jobCollection"]["uid"].startswith("local-jc-")

    def test_upload_missing_csv_content_returns_400(self, test_client, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")

        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json={"targetMode": "new"},
        )
        assert response.status_code == 400

    def test_upload_invalid_csv_returns_400(self, test_client, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")

        payload = {
            "csvContent": "no_input_cols,no_output_cols\n1,2\n",
            "targetMode": "new",
        }
        response = test_client.post(
            "/flask/sampling/upload_job_collection_csv",
            json=payload,
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# T6 — Flask download CSV endpoint
# ---------------------------------------------------------------------------


class TestFlaskDownloadJobCollectionCsv:
    def test_download_local_collection(self, test_client, tmp_path, monkeypatch):
        monkeypatch.setenv("DEPLOYMENT_MODE", "LOCAL")
        import mmux_flaskapi.utils.local_job_store as store_mod

        store_file = tmp_path / "store.json"
        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", store_file)

        # Seed the store
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
            title="My JC",
            description="",
        )

        response = test_client.get(
            f"/flask/osparc/download_job_collection_csv?JobCollectionUid={jc['uid']}"
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers["Content-Type"]
        csv_text = response.get_data(as_text=True)
        assert "input__x" in csv_text
        assert "output__z" in csv_text

    def test_download_missing_param_returns_400(self, test_client):
        response = test_client.get("/flask/osparc/download_job_collection_csv")
        assert response.status_code == 400

    def test_download_unknown_local_uid_returns_404(self, test_client, tmp_path, monkeypatch):
        monkeypatch.setenv("DEPLOYMENT_MODE", "LOCAL")
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        response = test_client.get(
            "/flask/osparc/download_job_collection_csv?JobCollectionUid=local-jc-doesnotexist"
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# T7 — local_job_store unit tests
# ---------------------------------------------------------------------------


class TestLocalJobStore:
    def test_uid_prefix_detectors(self):
        from mmux_flaskapi.utils.local_job_store import (
            is_local_function_uid,
            is_local_job_collection_uid,
            is_local_job_uid,
        )

        assert is_local_function_uid("local-func-abc")
        assert not is_local_function_uid("osparc-func-abc")
        assert is_local_job_collection_uid("local-jc-abc")
        assert not is_local_job_collection_uid("jc-abc")
        assert is_local_job_uid("local-job-abc")
        assert not is_local_job_uid("job-abc")

    def test_create_and_list_local_function(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import create_local_function, list_local_functions

        fn = create_local_function(
            title="My Func",
            description="desc",
            input_vars={"x", "y"},
            output_vars={"z"},
            source_function_uid=None,
        )
        assert fn["uid"].startswith("local-func-")
        fns = list_local_functions()
        assert any(f["uid"] == fn["uid"] for f in fns)

    def test_create_and_list_local_job_collection(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
            get_local_job_collection,
            list_local_job_collections,
            list_local_jobs_for_collection,
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
            job_rows=[
                {"inputs": {"x": 1.0}, "outputs": {"z": 2.0}, "status": "completed"},
                {"inputs": {"x": 3.0}, "outputs": {"z": 4.0}, "status": "completed"},
            ],
            title="JC",
            description="",
        )
        assert jc["uid"].startswith("local-jc-")
        assert len(jc["job_ids"]) == 2

        collections = list_local_job_collections(fn["uid"])
        assert any(c["uid"] == jc["uid"] for c in collections)

        fetched = get_local_job_collection(jc["uid"])
        assert fetched is not None
        assert fetched["uid"] == jc["uid"]

        jobs = list_local_jobs_for_collection(jc["uid"])
        assert len(jobs) == 2
        assert all(j["uid"].startswith("local-job-") for j in jobs)

    def test_get_local_job(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import (
            create_local_function,
            create_local_job_collection,
            get_local_job,
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
        job = get_local_job(job_uid)
        assert job is not None
        assert job["uid"] == job_uid
        assert job["inputs"]["x"] == 1.0

    def test_get_local_job_none_on_missing(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import get_local_job

        assert get_local_job("local-job-doesnotexist") is None

    def test_list_local_functions_empty_store(self, tmp_path, monkeypatch):
        import mmux_flaskapi.utils.local_job_store as store_mod

        monkeypatch.setattr(store_mod, "LOCAL_STORE_FILE", tmp_path / "store.json")
        from mmux_flaskapi.utils.local_job_store import list_local_functions

        assert list_local_functions() == []


# ---------------------------------------------------------------------------
# T9 — DataPreprocessor log-scale unit tests
# ---------------------------------------------------------------------------


class TestDataPreprocessorLogScale:
    def _make_preprocessor(self, input_log=None, output_log=None):
        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        if input_log:
            dp.setup_log_scaling(input_log_scales=input_log)
        if output_log:
            dp.setup_log_scaling(output_log_scales=output_log)
        return dp

    def test_log_transform_forward(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(input_log_scales=["x"])
        data = pd.DataFrame({"x": [10.0, 100.0, 1000.0], "y": [1.0, 2.0, 3.0]})
        dp.fit(data)
        transformed = dp.transform(data)
        # x1 should be log10 of original
        assert abs(transformed["x1"].iloc[0] - 1.0) < 1e-9
        assert abs(transformed["x1"].iloc[1] - 2.0) < 1e-9
        assert abs(transformed["x1"].iloc[2] - 3.0) < 1e-9

    def test_log_transform_inverse(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(input_log_scales=["x"])
        data = pd.DataFrame({"x": [10.0, 100.0], "y": [1.0, 2.0]})
        dp.fit(data)
        transformed = dp.transform(data)
        inversed = dp.inverse_transform({"x1": list(transformed["x1"])})
        assert abs(inversed["x"][0] - 10.0) < 1e-6
        assert abs(inversed["x"][1] - 100.0) < 1e-6

    def test_non_positive_raises_on_fit(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(input_log_scales=["x"])
        data = pd.DataFrame({"x": [0.0, 1.0], "y": [1.0, 2.0]})
        with pytest.raises(ValueError, match="non-positive"):
            dp.fit(data)

    def test_non_positive_raises_on_transform(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(input_log_scales=["x"])
        data_fit = pd.DataFrame({"x": [1.0, 2.0], "y": [1.0, 2.0]})
        dp.fit(data_fit)
        data_bad = pd.DataFrame({"x": [-1.0, 2.0], "y": [1.0, 2.0]})
        with pytest.raises(ValueError, match="non-positive"):
            dp.transform(data_bad)

    def test_output_log_transform(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(output_log_scales=["y"])
        data = pd.DataFrame({"x": [1.0, 2.0], "y": [10.0, 1000.0]})
        dp.fit(data)
        transformed = dp.transform(data)
        assert abs(transformed["y1"].iloc[0] - 1.0) < 1e-9
        assert abs(transformed["y1"].iloc[1] - 3.0) < 1e-9

    def test_output_log_inverse(self):
        import pandas as pd

        from mmux_flaskapi.data_preprocessor import DataPreprocessor

        dp = DataPreprocessor()
        dp.setup_variables(input_vars=["x"], output_vars=["y"])
        dp.setup_log_scaling(output_log_scales=["y"])
        data = pd.DataFrame({"x": [1.0, 2.0], "y": [10.0, 1000.0]})
        dp.fit(data)
        inversed = dp.inverse_transform({"y1": [1.0, 3.0]})
        assert abs(inversed["y"][0] - 10.0) < 1e-6
        assert abs(inversed["y"][1] - 1000.0) < 1e-6


# ---------------------------------------------------------------------------
# T9 — DistributionParams log_scale validation
# ---------------------------------------------------------------------------


class TestDistributionParamsLogScale:
    def test_uniform_log_scale_accepted(self):
        from mmux_flaskapi.blueprints.dakota_models import DistributionParams

        d = DistributionParams(distribution="uniform", min=1.0, max=100.0, log_scale=True)
        assert d.log_scale is True

    def test_uniform_log_scale_alias_accepted(self):
        from mmux_flaskapi.blueprints.dakota_models import DistributionParams

        d = DistributionParams.model_validate(
            {"distribution": "uniform", "min": 1.0, "max": 100.0, "logScale": True}
        )
        assert d.log_scale is True

    def test_uniform_log_scale_non_positive_min_raises(self):
        from pydantic import ValidationError

        from mmux_flaskapi.blueprints.dakota_models import DistributionParams

        with pytest.raises(ValidationError, match="min > 0"):
            DistributionParams(distribution="uniform", min=0.0, max=100.0, log_scale=True)

    def test_normal_log_scale_raises(self):
        from pydantic import ValidationError

        from mmux_flaskapi.blueprints.dakota_models import DistributionParams

        with pytest.raises(ValidationError, match="log_scale is only supported"):
            DistributionParams(distribution="normal", mean=1.0, std=0.5, log_scale=True)

    def test_default_log_scale_is_false(self):
        from mmux_flaskapi.blueprints.dakota_models import DistributionParams

        d = DistributionParams(distribution="uniform", min=1.0, max=10.0)
        assert d.log_scale is False


# ---------------------------------------------------------------------------
# T9 — SumoCrossValidationRequest accepts input_log_scales
# ---------------------------------------------------------------------------


class TestSumoCrossValidationRequestLogScales:
    def _make_job(self, x_val: float, y_val: float) -> dict:
        return {"status": "completed", "inputs": {"x": x_val}, "outputs": {"y": y_val}}

    def _make_jobs(self, n: int = 6) -> list[dict]:
        return [self._make_job(float(i + 1), float(i + 1) * 2) for i in range(n)]

    def test_input_log_scales_accepted(self):
        from mmux_flaskapi.blueprints.dakota_models import SumoCrossValidationRequest

        req = SumoCrossValidationRequest.model_validate(
            {
                "output": "y",
                "input_vars": ["x"],
                "function_jobs": self._make_jobs(),
                "input_log_scales": {"x": True},
            }
        )
        assert req.input_log_scales == {"x": True}

    def test_no_log_scales_defaults_to_none(self):
        from mmux_flaskapi.blueprints.dakota_models import SumoCrossValidationRequest

        req = SumoCrossValidationRequest.model_validate(
            {
                "output": "y",
                "input_vars": ["x"],
                "function_jobs": self._make_jobs(),
            }
        )
        assert req.input_log_scales is None
        assert req.output_log_scales is None


# ---------------------------------------------------------------------------
# T9 — _log_scales_to_var_list helper
# ---------------------------------------------------------------------------


class TestLogScalesToVarList:
    def test_none_input_returns_none(self):
        from mmux_flaskapi.blueprints.dakota import _log_scales_to_var_list

        assert _log_scales_to_var_list(None) is None

    def test_filters_true_flags(self):
        from mmux_flaskapi.blueprints.dakota import _log_scales_to_var_list

        result = _log_scales_to_var_list({"x": True, "y": False, "z": True})
        assert set(result) == {"x", "z"}

    def test_restrict_to_limits_output(self):
        from mmux_flaskapi.blueprints.dakota import _log_scales_to_var_list

        result = _log_scales_to_var_list({"x": True, "y": True, "z": True}, restrict_to=["x", "z"])
        assert set(result) == {"x", "z"}

    def test_empty_mapping_returns_empty_list(self):
        from mmux_flaskapi.blueprints.dakota import _log_scales_to_var_list

        assert _log_scales_to_var_list({}) == []


class TestApplyLog10ToUniformBounds:
    def test_log10_transforms_uniform_bounds(self):
        import math

        from mmux_flaskapi.blueprints.dakota import _apply_log10_to_uniform_bounds

        dists = {"x": {"distribution": "uniform", "min": 10.0, "max": 1000.0}}
        result = _apply_log10_to_uniform_bounds(dists, ["x"])
        assert abs(result["x"]["min"] - math.log10(10.0)) < 1e-9
        assert abs(result["x"]["max"] - math.log10(1000.0)) < 1e-9

    def test_non_log_scaled_var_unchanged(self):
        from mmux_flaskapi.blueprints.dakota import _apply_log10_to_uniform_bounds

        dists = {"x": {"distribution": "uniform", "min": 1.0, "max": 10.0}}
        result = _apply_log10_to_uniform_bounds(dists, [])
        assert result["x"]["min"] == 1.0
        assert result["x"]["max"] == 10.0

    def test_non_positive_bounds_raise(self):
        from mmux_flaskapi.blueprints.dakota import _apply_log10_to_uniform_bounds

        dists = {"x": {"distribution": "uniform", "min": 0.0, "max": 100.0}}
        with pytest.raises(ValueError, match="must be positive"):
            _apply_log10_to_uniform_bounds(dists, ["x"])
