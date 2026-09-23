"""Benchmarks for the Dakota data-processing helpers.

These run on every SuMo / UQ / MOGA request: the job collection is loaded from
disk, sanitized, filtered and turned into the sample files Dakota consumes, and
the results are post-processed before being returned to the frontend.
"""

import numpy as np
import pytest

from mmux_flaskapi.dakota.funs_data_processing import (
    compute_correlation_indices,
    create_grid_samples,
    create_manual_uq_samples,
    create_samples_along_axes,
    get_non_dominated_indices,
    load_data,
    process_input_file,
    sanitize_varnames,
)

SEED = 20240101
MESSY_VARNAMES = [f"Input Var #{i} [mm/s]" for i in range(200)]


def test_sanitize_varnames_list(benchmark):
    benchmark(sanitize_varnames, MESSY_VARNAMES)


def test_sanitize_varnames_dataframe(benchmark, study_dataframe):
    benchmark(sanitize_varnames, study_dataframe)


def test_load_data_dat(benchmark, dat_file):
    df = benchmark(load_data, dat_file)
    assert len(df) > 0


def test_load_data_csv(benchmark, csv_file):
    df = benchmark(load_data, csv_file)
    assert len(df) > 0


def test_process_input_file_with_log(benchmark, csv_file, output_vars):
    # `load_data` sanitizes the column names, so the log-transform list has to
    # use the sanitized names too.
    log_vars = sanitize_varnames(output_vars)
    processed = benchmark(lambda: process_input_file(csv_file, make_log=log_vars, suffix="bench"))
    assert processed.exists()


def test_get_non_dominated_indices(benchmark, make_dataframe, output_vars):
    # Pareto front extraction for the MOGA table: O(n^2) dominance checks over
    # the optimized objectives.
    data = make_dataframe(n_samples=200)
    indices = benchmark(
        get_non_dominated_indices,
        data,
        output_vars[:2],
        ["min", "max"],
    )
    assert len(indices) > 0


def test_compute_correlation_indices(benchmark, study_dataframe, input_vars):
    rng = np.random.default_rng(SEED)
    output_samples = rng.normal(size=len(study_dataframe))
    correlations = benchmark(
        compute_correlation_indices,
        study_dataframe[input_vars],
        output_samples,
        input_vars,
    )
    assert len(correlations) == len(input_vars)


@pytest.mark.parametrize("num_samples", [1000, 10000])
def test_create_manual_uq_samples(benchmark, input_vars, num_samples):
    distributions: dict[str, dict[str, float | str]] = {}
    for i, var in enumerate(input_vars):
        if i % 3 == 0:
            distributions[var] = {"distribution": "normal", "mean": 1.0 + i, "std": 0.2}
        elif i % 3 == 1:
            distributions[var] = {"distribution": "uniform", "min": 0.1 + i, "max": 1.1 + i}
        else:
            distributions[var] = {"distribution": "constant", "value": 0.5 + i}

    samples = benchmark(
        create_manual_uq_samples,
        input_vars,
        distributions,
        num_samples,
        SEED,
    )
    assert len(samples) == len(input_vars)


def test_create_grid_samples(benchmark, tmp_path, input_vars):
    # 2D surface plot: a 60x60 grid over two inputs, the remaining inputs held
    # at their cut values.
    n_vars = len(input_vars)
    processed = benchmark(
        create_grid_samples,
        tmp_path,
        input_vars[:2],
        input_vars,
        [0.0] * n_vars,
        [0.5] * n_vars,
        [1.0] * n_vars,
        [60] * n_vars,
    )
    assert processed.exists()


def test_create_samples_along_axes(benchmark, tmp_path, study_dataframe, input_vars):
    processed = benchmark(
        create_samples_along_axes,
        tmp_path,
        study_dataframe,
        input_vars,
        25,
    )
    assert processed.exists()
