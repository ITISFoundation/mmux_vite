"""Shared setup for the CodSpeed benchmark suite.

The benchmarks live outside `tests/` on purpose: the test suite's autouse
fixtures (DEBUG logging to disk, env patching) would be measured together with
the code under test and add noise. Everything here is deterministic (fixed
seeds, fixed shapes) so measurements only move when the code moves.

These benchmarks measure the *application* (the Flask API boundary). Benchmarks
for the Dakota data-processing internals live with the itis-sumo package.
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

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _quiet_logging():
    """Keep library logging out of the measured section."""
    logging.disable(logging.WARNING)
    yield
    logging.disable(logging.NOTSET)
