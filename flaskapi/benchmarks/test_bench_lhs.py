"""Benchmarks for the Latin Hypercube Sampling implementation.

`POST /flask/sampling/lhs` calls `lhs()` synchronously before mapping the
samples onto oSPARC, so its cost is directly visible to the user creating a
sampling campaign.
"""

import pytest

from mmux_flaskapi.dakota.lhs import lhs

SEED = 20240101
# n = number of samples requested by the user, k = number of input variables.
N_SAMPLES = 500
N_VARS = 8


def test_lhs_classic(benchmark):
    design = benchmark(lhs, N_SAMPLES, N_VARS, seed=SEED)
    assert design.shape == (N_VARS, N_SAMPLES)


@pytest.mark.parametrize("method", ["center", "maximin", "centermaximin", "correlation", "lhsmu"])
def test_lhs_methods(benchmark, method):
    design = benchmark(lhs, N_SAMPLES, N_VARS, method=method, seed=SEED)
    assert design.shape[1] == N_SAMPLES


def test_lhs_large_design(benchmark):
    design = benchmark(lhs, 5000, 12, seed=SEED)
    assert design.shape == (12, 5000)
