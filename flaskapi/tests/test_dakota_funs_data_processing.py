"""Tests for mmux_flaskapi.dakota.funs_data_processing pure helper functions."""

import numpy as np
import pandas as pd
import pytest

from mmux_flaskapi.dakota.funs_data_processing import (
    _filter_data,
    _parse_data,
    create_manual_uq_samples,
    get_bounds_uniform_distribution,
    get_bounds_uniform_distributions,
    get_non_dominated_indices,
    get_results,
    get_variable_names,
    is_dominated,
    load_data,
    sanitize_varnames,
)

# --- sanitize_varnames -------------------------------------------------------


def test_sanitize_varnames_string():
    assert sanitize_varnames("my var name") == "my_var_name"
    assert sanitize_varnames("weird!chars@here") == "weird_chars_here"


def test_sanitize_varnames_list():
    assert sanitize_varnames(["a b", "c-d", "e f g"]) == ["a_b", "c-d", "e_f_g"]


def test_sanitize_varnames_preserves_hyphen():
    """Regression test: the sanitize regex character class `[^0-9a-zA-Z_*-+/]`
    used to place "-" between "*" and "+", forming an unintended char-range
    (matching "*" and "+" only) instead of a literal hyphen, silently replacing
    real hyphens with underscores (e.g. breaks the default `-AFpeak` output key
    used by `get_results`)."""
    assert sanitize_varnames("-AFpeak") == "-AFpeak"
    assert sanitize_varnames("a-b-c") == "a-b-c"


def test_sanitize_varnames_dict():
    result = sanitize_varnames({"a b": 1, "c d": 2})
    assert result == {"a_b": 1, "c_d": 2}


def test_sanitize_varnames_nested_dict():
    result = sanitize_varnames({"outer key": {"inner key": 1}})
    assert result == {"outer_key": {"inner_key": 1}}


def test_sanitize_varnames_dataframe():
    df = pd.DataFrame({"col a": [1], "col b": [2]})
    result = sanitize_varnames(df)
    assert list(result.columns) == ["col_a", "col_b"]
    # original untouched
    assert list(df.columns) == ["col a", "col b"]


def test_sanitize_varnames_unsupported_type_raises():
    with pytest.raises(TypeError, match="Unsupported input type"):
        sanitize_varnames(12345)


# --- get_bounds_uniform_distribution(s) --------------------------------------


def test_get_bounds_uniform_distribution_valid():
    dist = {"distribution": "uniform", "min": 0.0, "max": 10.0}
    assert get_bounds_uniform_distribution("x", dist) == (0.0, 10.0)


def test_get_bounds_uniform_distribution_non_uniform_raises():
    dist = {"distribution": "normal", "mean": 0.0, "std": 1.0}
    with pytest.raises(ValueError, match="Non-uniform distribution"):
        get_bounds_uniform_distribution("x", dist)


def test_get_bounds_uniform_distribution_missing_bounds_raises():
    dist = {"distribution": "uniform", "min": 0.0}
    with pytest.raises(ValueError, match="Bounds for variable"):
        get_bounds_uniform_distribution("x", dist)


def test_get_bounds_uniform_distribution_invalid_bounds_raises():
    dist = {"distribution": "uniform", "min": 10.0, "max": 0.0}
    with pytest.raises(ValueError, match="Invalid bounds"):
        get_bounds_uniform_distribution("x", dist)


def test_get_bounds_uniform_distributions_multiple_vars():
    distributions = {
        "x": {"distribution": "uniform", "min": 0.0, "max": 1.0},
        "y": {"distribution": "uniform", "min": -5.0, "max": 5.0},
    }
    lower, upper = get_bounds_uniform_distributions(["x", "y"], distributions)
    assert lower == [0.0, -5.0]
    assert upper == [1.0, 5.0]


def test_get_bounds_uniform_distributions_missing_var_raises():
    with pytest.raises(ValueError, match="is not defined"):
        get_bounds_uniform_distributions(["missing"], {})


# --- is_dominated / get_non_dominated_indices --------------------------------


def test_is_dominated_true_when_another_point_dominates():
    point = np.array([1.0, 1.0])
    others = np.array([[2.0, 2.0], [0.0, 0.0]])
    assert is_dominated(point, others) is True


def test_is_dominated_false_when_no_point_dominates():
    point = np.array([0.0, 0.0])
    others = np.array([[1.0, -1.0], [-1.0, 1.0]])
    assert is_dominated(point, others) is False


def test_get_non_dominated_indices_minimization():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [3, 2, 1]})
    # point 1 (a=2,b=2) is dominated by neither in a min/min sense trade-off (Pareto front)
    indices = get_non_dominated_indices(df, ["a", "b"])
    assert set(indices) == {0, 1, 2}


def test_get_non_dominated_indices_with_optimization_modes():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [1, 2, 3]})
    # minimize a, maximize b -> point 2 (a=3,b=3) is best on b but worst on a;
    # point 0 (a=1,b=1) is best on a but worst on b -> both on the Pareto front,
    # point 1 (a=2,b=2) is dominated by neither too since a min/b max create a trade-off
    indices = get_non_dominated_indices(df, ["a", "b"], optimization_modes=["min", "max"])
    assert set(indices) == {0, 1, 2}


def test_get_non_dominated_indices_invalid_mode_raises():
    df = pd.DataFrame({"a": [1, 2]})
    with pytest.raises(ValueError, match="not recognized"):
        get_non_dominated_indices(df, ["a"], optimization_modes=["bogus"])


def test_get_non_dominated_indices_mismatched_modes_length_raises():
    df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
    with pytest.raises(ValueError, match="must match"):
        get_non_dominated_indices(df, ["a", "b"], optimization_modes=["min"])


# --- create_manual_uq_samples -------------------------------------------------


def test_create_manual_uq_samples_normal():
    samples = create_manual_uq_samples(
        ["x"], {"x": {"distribution": "normal", "mean": 0.0, "std": 1.0}}, num_samples=5, seed=1
    )
    assert len(samples["x"]) == 5


def test_create_manual_uq_samples_uniform():
    samples = create_manual_uq_samples(
        ["x"], {"x": {"distribution": "uniform", "min": 0.0, "max": 1.0}}, num_samples=5, seed=1
    )
    assert len(samples["x"]) == 5
    assert all(0.0 <= v <= 1.0 for v in samples["x"])


def test_create_manual_uq_samples_constant():
    samples = create_manual_uq_samples(
        ["x"], {"x": {"distribution": "constant", "value": 42}}, num_samples=3, seed=1
    )
    assert samples["x"] == [42.0, 42.0, 42.0]


def test_create_manual_uq_samples_unsupported_distribution_raises():
    with pytest.raises(ValueError, match="Unsupported distribution type"):
        create_manual_uq_samples(["x"], {"x": {"distribution": "lognormal"}}, num_samples=3, seed=1)


def test_create_manual_uq_samples_missing_distribution_raises():
    with pytest.raises(ValueError, match="not defined"):
        create_manual_uq_samples(["missing"], {}, num_samples=3, seed=1)


@pytest.mark.parametrize(
    "distribution",
    [
        {"distribution": "uniform", "min": 0.0, "max": 10.0, "log_scale": True},
        {"distribution": "uniform", "min": -10.0, "max": -1.0, "log_scale": True},
        {"distribution": "uniform", "min": 10.0, "max": 1.0, "log_scale": True},
    ],
)
def test_create_manual_uq_samples_rejects_invalid_log_uniform_bounds(distribution):
    with pytest.raises(ValueError, match="Log-scale uniform bounds|Uniform distribution bounds"):
        create_manual_uq_samples(["x"], {"x": distribution}, num_samples=3, seed=1)


@pytest.mark.parametrize("distribution", ["normal", "constant", "log-normal"])
def test_create_manual_uq_samples_rejects_log_scale_on_non_uniform(distribution):
    parameters = {
        "normal": {"mean": 0.0, "std": 1.0},
        "constant": {"value": 1.0},
        "log-normal": {"log_mean": 0.0, "log_std": 1.0},
    }[distribution]
    with pytest.raises(ValueError, match="only supported for uniform"):
        create_manual_uq_samples(
            ["x"],
            {"x": {"distribution": distribution, "log_scale": True, **parameters}},
            num_samples=3,
            seed=1,
        )


def test_create_manual_uq_samples_rejects_invalid_distribution_parameters():
    with pytest.raises(ValueError, match="Normal distribution parameters"):
        create_manual_uq_samples(
            ["x"], {"x": {"distribution": "normal", "mean": 0.0, "std": 0.0}}, num_samples=3, seed=1
        )


class TestCreateManualUqSamplesSeedReproducibility:
    """B12/V27: `seed` must actually control reproducibility of generated samples."""

    def test_same_seed_produces_identical_samples_normal(self):
        distributions = {"x1": {"distribution": "normal", "mean": 0.0, "std": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=123)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=123)
        assert samples_a["x1"] == samples_b["x1"]

    def test_same_seed_produces_identical_samples_uniform(self):
        distributions = {"x1": {"distribution": "uniform", "min": -1.0, "max": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=7)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=7)
        assert samples_a["x1"] == samples_b["x1"]

    def test_different_seeds_produce_different_samples(self):
        distributions = {"x1": {"distribution": "normal", "mean": 0.0, "std": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=1)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=2)
        assert samples_a["x1"] != samples_b["x1"]

    def test_same_seed_produces_identical_samples_mixed_distributions(self):
        """T17 (PR #487 review): a single seeded call spanning both distribution
        types must reproduce identically, not just each type in isolation."""
        distributions = {
            "x1": {"distribution": "normal", "mean": 0.0, "std": 1.0},
            "x2": {"distribution": "uniform", "min": -1.0, "max": 1.0},
        }
        samples_a = create_manual_uq_samples(["x1", "x2"], distributions, num_samples=50, seed=42)
        samples_b = create_manual_uq_samples(["x1", "x2"], distributions, num_samples=50, seed=42)
        assert samples_a["x1"] == samples_b["x1"]
        assert samples_a["x2"] == samples_b["x2"]


class TestCreateManualUqSamplesLogScaleUniform:
    def test_log_scale_samples_are_uniform_in_log10_space(self):
        distributions = {
            "x1": {"distribution": "uniform", "min": 1.0, "max": 1000.0, "log_scale": True}
        }
        values = np.array(
            create_manual_uq_samples(["x1"], distributions, num_samples=5000, seed=1)["x1"]
        )

        assert np.all((values >= 1.0) & (values <= 1000.0))
        assert np.mean(values < 10.0) > 0.2
        assert np.mean(values > 100.0) > 0.2

    def test_log_scale_false_keeps_plain_uniform_sampling(self):
        distributions = {
            "x1": {"distribution": "uniform", "min": 1.0, "max": 1000.0, "log_scale": False}
        }
        values = np.array(
            create_manual_uq_samples(["x1"], distributions, num_samples=5000, seed=1)["x1"]
        )

        assert values.mean() == pytest.approx(500.5, abs=30)
        assert np.mean(values < 10.0) < 0.02


# --- _parse_data / load_data / get_results / get_variable_names -------------


def test_parse_data_space_delimited(tmp_path):
    file = tmp_path / "data.dat"
    file.write_text("col1 col2\n1 2\n3 4\n")
    parsed = _parse_data(file)
    assert parsed == [["col1", "col2"], ["1", "2"], ["3", "4"]]


def test_load_data_dat_file(tmp_path):
    file = tmp_path / "data.dat"
    file.write_text("x y\n1 2\n3 4\n")
    df = load_data(file)
    assert list(df.columns) == ["x", "y"]
    assert len(df) == 2


def test_load_data_csv_file(tmp_path):
    file = tmp_path / "data.csv"
    pd.DataFrame({"x": [1, 2], "y": [3, 4]}).to_csv(file, index=False)
    df = load_data(file)
    assert list(df.columns) == ["x", "y"]
    assert len(df) == 2


def test_load_data_unsupported_extension_raises(tmp_path):
    file = tmp_path / "data.xyz"
    file.write_text("nonsense")
    with pytest.raises(ValueError, match="not a DAT / TXT / JSON / CSV file"):
        load_data(file)


def test_load_data_missing_file_raises(tmp_path):
    with pytest.raises(AssertionError, match="does not exist"):
        load_data(tmp_path / "missing.csv")


def test_get_results_extracts_column_as_float_array(tmp_path):
    file = tmp_path / "predictions.dat"
    file.write_text("-AFpeak other\n1.5 9\n2.5 9\n")
    result = get_results(file)
    np.testing.assert_array_equal(result, np.array([1.5, 2.5]))


def test_get_variable_names_dat(tmp_path):
    file = tmp_path / "data.dat"
    # NOTE: .dat parsing splits on whitespace, so header columns are space-delimited
    file.write_text("col_a col_b\n1 2\n")
    assert get_variable_names(file) == ["col_a", "col_b"]


def test_get_variable_names_csv(tmp_path):
    file = tmp_path / "data.csv"
    pd.DataFrame({"col a": [1], "col b": [2]}).to_csv(file, index=False)
    assert get_variable_names(file) == ["col_a", "col_b"]


def test_get_variable_names_unsupported_extension_raises(tmp_path):
    file = tmp_path / "data.xyz"
    file.write_text("nonsense")
    with pytest.raises(ValueError, match="not a DAT / TXT / JSON / CSV file"):
        get_variable_names(file)


def test_get_variable_names_missing_file_raises(tmp_path):
    with pytest.raises(AssertionError, match="does not exist"):
        get_variable_names(tmp_path / "missing.dat")


# --- _filter_data -------------------------------------------------------------


def test_filter_data_keep_idxs():
    df = pd.DataFrame({"a": [1, 2, 3]}, index=[0, 1, 2])
    result = _filter_data(df, keep_idxs=[0, 2])
    assert list(result.index) == [0, 2]


def test_filter_data_filter_n_samples():
    df = pd.DataFrame({"a": [1, 2, 3, 4]})
    result = _filter_data(df, filter_N_samples=2)
    assert len(result) == 2


def test_filter_data_filter_highest_n():
    df = pd.DataFrame({"a": [1, 2, 3, 4, 5]})
    result = _filter_data(df, filter_highest_N=2)
    # top 2 values (5, 4) are dropped by `.iloc[filter_highest_N:]` after sorting descending
    assert len(result) == 3
    assert 5 not in result["a"].values
    assert 4 not in result["a"].values


def test_filter_data_both_filters_raises():
    df = pd.DataFrame({"a": [1, 2, 3]})
    with pytest.raises(AssertionError, match="only one of"):
        _filter_data(df, filter_highest_N=1, filter_N_samples=1)
