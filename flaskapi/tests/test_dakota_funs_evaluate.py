"""Tests for mmux_flaskapi.dakota.funs_evaluate pure/parsing helpers."""

from pathlib import Path

import pandas as pd
import pytest

from mmux_flaskapi.dakota.funs_evaluate import (
    _parse_crossvalidation_outputlogs,
    create_run_dir,
    retrieve_csv_result,
)

SAMPLE_CV_LOG = """
Some preamble text.
Surrogate quality metrics (5-fold CV) for response_1:
      root_mean_squared         0.1234
      sum_abs                   1.2345
      mean_abs                  0.2345
      max_abs                   0.9999
some intervening text about build (training) points here
Surrogate quality metrics (5-fold CV) for response_2:
      root_mean_squared         0.5678
      sum_abs                   nan
      mean_abs                  0.1111
      max_abs                   0.2222
"""


def test_parse_crossvalidation_outputlogs_extracts_all_variables_and_metrics():
    result = _parse_crossvalidation_outputlogs(SAMPLE_CV_LOG, N_CROSS_VALIDATION=5)

    assert set(result.keys()) == {"response_1", "response_2"}
    assert result["response_1"]["root_mean_squared"] == "0.1234"
    assert result["response_1"]["max_abs"] == "0.9999"
    assert result["response_2"]["sum_abs"] == "nan"


def test_parse_crossvalidation_outputlogs_no_matches_returns_message():
    result = _parse_crossvalidation_outputlogs("no metrics here", N_CROSS_VALIDATION=5)
    assert result == {}


def test_parse_crossvalidation_outputlogs_empty_string():
    result = _parse_crossvalidation_outputlogs("", N_CROSS_VALIDATION=5)
    assert result == {}


def test_retrieve_csv_result_single_match(tmp_path):
    csv_file = tmp_path / "data.csv"
    df = pd.DataFrame({"x": [1, 2, 3], "y": [10, 20, 30], "out": [100, 200, 300]})
    df.to_csv(csv_file, index=False)

    result = retrieve_csv_result(str(csv_file), inputs={"x": 2, "y": 20}, outputs=["out"])
    assert result == {"out": 200}


def test_retrieve_csv_result_missing_input_column_raises(tmp_path):
    csv_file = tmp_path / "data.csv"
    pd.DataFrame({"x": [1]}).to_csv(csv_file, index=False)

    with pytest.raises(ValueError, match="not in the csv file"):
        retrieve_csv_result(str(csv_file), inputs={"missing_col": 1})


def test_retrieve_csv_result_no_match_raises(tmp_path):
    csv_file = tmp_path / "data.csv"
    pd.DataFrame({"x": [1, 2]}).to_csv(csv_file, index=False)

    with pytest.raises(AssertionError, match="No result found"):
        retrieve_csv_result(str(csv_file), inputs={"x": 999})


def test_retrieve_csv_result_multiple_matches_raises(tmp_path):
    csv_file = tmp_path / "data.csv"
    pd.DataFrame({"x": [1, 1], "out": [1, 2]}).to_csv(csv_file, index=False)

    with pytest.raises(AssertionError, match="Multiple results found"):
        retrieve_csv_result(str(csv_file), inputs={"x": 1})


def test_create_run_dir_creates_unique_directory(tmp_path):
    dir1 = create_run_dir(tmp_path, dir_name="sampling")
    dir2 = create_run_dir(tmp_path, dir_name="sampling")

    assert Path(dir1).is_dir()
    assert Path(dir2).is_dir()
    assert dir1 != dir2
    assert str(dir1).startswith(str(tmp_path / "runs"))
