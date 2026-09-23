from pathlib import Path

import pytest

from mmux_flaskapi.blueprints import dakota, sampling

pytestmark = pytest.mark.unit


def test_dakota_runs_dir_defaults_to_project_directory():
    expected = Path(dakota.__file__).resolve().parents[3] / "runs_dakota"

    assert dakota.DAKOTA_RUNS_DIR == expected
    assert dakota.DAKOTA_RUNS_DIR.is_dir()


def test_sampling_runs_dir_defaults_to_project_directory():
    expected = Path(sampling.__file__).resolve().parents[3] / "runs_sampling"

    assert sampling.SAMPLING_RUNS_DIR == expected
    assert sampling.SAMPLING_RUNS_DIR.is_dir()
