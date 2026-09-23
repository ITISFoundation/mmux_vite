"""Shared fixtures for the CodSpeed benchmark suite.

The benchmarks live outside `tests/` on purpose: the test suite's autouse
fixtures (DEBUG logging to disk, env patching) would be measured together with
the code under test and add noise. Everything here is deterministic (fixed
seeds, fixed shapes) so measurements only move when the code moves.
"""

import logging
import os

# Pin the BLAS/OpenMP thread pools BEFORE numpy is imported: under CodSpeed's
# CPU simulation the threads are serialized, and OpenBLAS' spin-waiting then
# makes linear-algebra benchmarks take orders of magnitude longer (and adds
# noise to the measurement).
for _thread_env_var in (
    "OPENBLAS_NUM_THREADS",
    "OMP_NUM_THREADS",
    "MKL_NUM_THREADS",
    "NUMEXPR_NUM_THREADS",
):
    os.environ.setdefault(_thread_env_var, "1")

from collections.abc import Callable  # noqa: E402

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import pytest  # noqa: E402

SEED = 20240101

# Shapes roughly matching a realistic MMUX study: a couple of thousand oSPARC
# function jobs, ~8 input variables and a handful of quantities of interest.
N_SAMPLES = 2000
INPUT_VARS = [
    "sigma blood",
    "TissueConduc",
    "electrode radius (mm)",
    "pulse width [us]",
    "Amplitude*Gain",
    "fiber diameter",
    "myelin thickness",
    "node length",
]
OUTPUT_VARS = ["-AFpeak", "activation threshold", "energy (uJ)"]


def _make_dataframe(n_samples: int = N_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    data: dict[str, np.ndarray] = {"%eval_id": np.arange(1, n_samples + 1)}
    for i, var in enumerate(INPUT_VARS):
        data[var] = rng.uniform(0.1 + i, 1.1 + i, size=n_samples)
    for i, var in enumerate(OUTPUT_VARS):
        data[var] = rng.lognormal(mean=i, sigma=0.5, size=n_samples)
    return pd.DataFrame(data)


@pytest.fixture(autouse=True)
def _quiet_logging():
    """Keep library logging out of the measured section."""
    logging.disable(logging.WARNING)
    yield
    logging.disable(logging.NOTSET)


@pytest.fixture(scope="session")
def input_vars() -> list[str]:
    return list(INPUT_VARS)


@pytest.fixture(scope="session")
def output_vars() -> list[str]:
    return list(OUTPUT_VARS)


@pytest.fixture(scope="session")
def make_dataframe() -> Callable[..., pd.DataFrame]:
    """Factory building a deterministic study dataframe (inputs + outputs)."""
    return _make_dataframe


@pytest.fixture(scope="session")
def study_dataframe() -> pd.DataFrame:
    return _make_dataframe()


@pytest.fixture(scope="session")
def dat_file(tmp_path_factory) -> str:
    """Space-delimited Dakota tabular file, as produced by a sampling run."""
    path = tmp_path_factory.mktemp("data") / "results.dat"
    df = _make_dataframe()
    # Dakota tabular files are whitespace-delimited, so the headers Dakota
    # writes are already sanitized.
    df.columns = [column.replace(" ", "_") for column in df.columns]
    df.to_csv(path, sep=" ", index=False)
    return str(path)


@pytest.fixture(scope="session")
def csv_file(tmp_path_factory) -> str:
    path = tmp_path_factory.mktemp("data") / "results.csv"
    _make_dataframe().to_csv(path, index=False)
    return str(path)
