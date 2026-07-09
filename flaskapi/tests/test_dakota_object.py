"""Tests for `mmux_flaskapi.dakota.dakota_object._dak_exec_static`.

Regression coverage for flaskapi/SPEC.md B16: Dakota execution failures used to
raise Dakota's own generic exception (e.g. "Dakota aborted: Unknown error 254")
without ever reading back the captured stdout/stderr, discarding the real
diagnostic message that explains *why* Dakota aborted.
"""

import pytest

from mmux_flaskapi.dakota import dakota_object as dakobj


class _FakeStudySuccess:
    def execute(self):
        # flush=True: Python's own stdout buffering is independent from the
        # libc-level FILE* buffer that wiofiles.capture_to_file flushes on
        # exit, so a fake (pure-Python) study must flush explicitly. Real
        # Dakota output goes through libc stdio and is already covered by
        # that existing flush.
        print("dakota ran fine", flush=True)


class _FakeStudyFailure:
    def execute(self):
        print("Some real Dakota parse error before abort", flush=True)
        raise RuntimeError("Dakota aborted: Unknown error 254")


def _fake_study_constructor_failure(callback, input_string):
    # Simulates Dakota's NIDR input-file parsing failing during study
    # *construction* (e.g. a malformed conf like `seed = 0`), not during
    # study.execute() - flaskapi/SPEC.md B17.
    print("Input line 29: seed must be > 0.", flush=True)
    raise RuntimeError("Dakota aborted: Unknown error 254")


def test_dak_exec_static_success_returns_captured_stdout(monkeypatch, tmp_path, capfd):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(dakobj.dakenv, "study", lambda callback, input_string: _FakeStudySuccess())

    # Run via future_exec (ProcessPoolExecutor), matching production's call path.
    # pytest's own fd-level capture must be disabled around this call: it would
    # otherwise dup2 fd 1/2 in the (forked) worker over wiofiles' own redirection.
    with capfd.disabled():
        stdout, stderr = dakobj.DakotaObject().future_exec(conf="dummy conf")

    assert "dakota ran fine" in stdout
    assert stderr == ""


def test_dak_exec_static_failure_raises_with_captured_diagnostics(monkeypatch, tmp_path, capfd):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(dakobj.dakenv, "study", lambda callback, input_string: _FakeStudyFailure())

    with capfd.disabled(), pytest.raises(RuntimeError) as exc_info:
        dakobj.DakotaObject().future_exec(conf="dummy conf")

    message = str(exc_info.value)
    assert "Some real Dakota parse error before abort" in message
    assert "Dakota aborted: Unknown error 254" in message


def test_dak_exec_static_construction_failure_raises_with_captured_diagnostics(
    monkeypatch, tmp_path, capfd
):
    """Regression (flaskapi/SPEC.md B17): a Dakota abort during `dakenv.study(...)`
    construction (e.g. NIDR rejecting `seed = 0`) must also be captured/enriched,
    not just aborts raised from `study.execute()`."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(dakobj.dakenv, "study", _fake_study_constructor_failure)

    with capfd.disabled(), pytest.raises(RuntimeError) as exc_info:
        dakobj.DakotaObject().future_exec(conf="dummy conf")

    message = str(exc_info.value)
    assert "Input line 29: seed must be > 0." in message
    assert "Dakota aborted: Unknown error 254" in message
