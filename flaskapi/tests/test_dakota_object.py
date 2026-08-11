"""Tests for mmux_flaskapi.dakota.dakota_object."""

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

from mmux_flaskapi.dakota.dakota_object import DakotaObject, _dak_exec_static, working_directory


def test_working_directory_changes_and_restores_cwd(tmp_path):
    original_cwd = Path.cwd()
    with working_directory(tmp_path):
        assert Path.cwd() == tmp_path.resolve() or Path.cwd() == tmp_path
    assert Path.cwd() == original_cwd


def test_working_directory_restores_cwd_even_on_exception(tmp_path):
    original_cwd = Path.cwd()
    try:
        with working_directory(tmp_path):
            raise RuntimeError("boom")
    except RuntimeError:
        pass
    assert Path.cwd() == original_cwd


def test_dak_exec_static_runs_study_and_captures_output(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    fake_study = MagicMock()

    def fake_execute():
        os.write(1, b"dakota stdout output\n")

    fake_study.execute.side_effect = fake_execute

    with patch(
        "mmux_flaskapi.dakota.dakota_object.dakenv.study", return_value=fake_study
    ) as mock_study:
        stdoutstr, stderrstr = _dak_exec_static("some dakota conf")

    mock_study.assert_called_once_with(callback=None, input_string="some dakota conf")
    fake_study.execute.assert_called_once()
    assert "dakota stdout output" in stdoutstr
    assert stderrstr == ""


def test_dakota_object_run_writes_stdout_and_stderr_files(tmp_path):
    dakobj = DakotaObject()
    with patch.object(dakobj, "future_exec", return_value=("stdout content", "stderr content")):
        dakobj.run("dummy conf", tmp_path)

    assert (tmp_path / "dakota_stdout.txt").read_text() == "stdout content"
    assert (tmp_path / "dakota_stderr.txt").read_text() == "stderr content"


def test_dakota_object_run_handles_empty_stdout_stderr(tmp_path):
    dakobj = DakotaObject()
    with patch.object(dakobj, "future_exec", return_value=(None, None)):
        dakobj.run("dummy conf", tmp_path)

    assert (tmp_path / "dakota_stdout.txt").read_text() == ""
    assert (tmp_path / "dakota_stderr.txt").read_text() == ""
