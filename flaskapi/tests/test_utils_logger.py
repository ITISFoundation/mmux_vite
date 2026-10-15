"""Tests for the central logging configuration (`utils/logger.configure_logging`).

Pins flaskapi/SPEC.md V50tl (B59tl): stdout-only terminal logging, LOG_LEVEL
effective (also under a gunicorn-style pre-configured root), file logging only
via LOG_FILE, and no package-dir log files — the container/graylog contract
behind upstream issue #112.
"""

import importlib
import logging
import os
from pathlib import Path
from unittest.mock import patch

import pytest

import mmux_flaskapi
from mmux_flaskapi.utils.logger import LOG_FORMAT, configure_logging

pytestmark = pytest.mark.unit

PACKAGE_LOGS_DIR = Path(mmux_flaskapi.__file__).parent / "utils" / "logs"


@pytest.fixture
def reset_root_logging():
    """Restore root handlers/level after each test (conftest re-inits anyway,
    but keep this file self-contained)."""
    yield
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)


def _stdout_handlers():
    return [
        h
        for h in logging.root.handlers
        if isinstance(h, logging.StreamHandler) and not isinstance(h, logging.FileHandler)
    ]


class TestConfigureLogging:
    def test_returns_app_logger(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            logger = configure_logging()
        assert logger.name == "mmux_flaskapi"
        assert logger.propagate is True

    def test_default_level_is_debug(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
        assert logging.root.level == logging.DEBUG

    def test_level_from_environment(self, reset_root_logging):
        with patch.dict(os.environ, {"LOG_LEVEL": "WARNING"}):
            configure_logging()
        assert logging.root.level == logging.WARNING

    def test_invalid_level_fails_loudly(self, reset_root_logging):
        with patch.dict(os.environ, {"LOG_LEVEL": "NOT_A_LEVEL"}):
            with pytest.raises(ValueError):
                configure_logging()

    def test_single_stdout_handler_no_file_handler(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
        assert len(_stdout_handlers()) == 1
        assert [h for h in logging.root.handlers if isinstance(h, logging.FileHandler)] == []

    def test_no_package_dir_log_file(self, reset_root_logging):
        """B59tl: importing/configuring must never create utils/logs/ inside the package."""
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
            importlib.reload(importlib.import_module("mmux_flaskapi.utils.logger"))
        assert not PACKAGE_LOGS_DIR.exists()

    def test_log_file_env_is_opt_in(self, reset_root_logging, tmp_path):
        log_file = tmp_path / "backend.log"
        with patch.dict(os.environ, {"LOG_FILE": str(log_file)}):
            configure_logging()
        file_handlers = [h for h in logging.root.handlers if isinstance(h, logging.FileHandler)]
        assert len(file_handlers) == 1
        assert Path(file_handlers[0].baseFilename) == log_file
        logging.getLogger("test.log_file").error("written to file")
        for handler in logging.root.handlers:
            handler.flush()
        assert "written to file" in log_file.read_text()

    def test_effective_under_preconfigured_root(self, reset_root_logging):
        """gunicorn attaches its own root handler before the app import; a plain
        basicConfig() is then a silent no-op (B59tl). force=True must win."""
        foreign = logging.StreamHandler()
        logging.basicConfig(level=logging.INFO, handlers=[foreign], force=True)
        with patch.dict(os.environ, {"LOG_LEVEL": "DEBUG"}):
            configure_logging()
        assert foreign not in logging.root.handlers
        assert logging.root.level == logging.DEBUG

    def test_idempotent_no_duplicate_handlers(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
            configure_logging()
            configure_logging()
        assert len(_stdout_handlers()) == 1
        assert len(logging.root.handlers) == 1

    def test_format_is_pinned(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
        formatter = _stdout_handlers()[0].formatter
        assert formatter is not None
        assert formatter._fmt == LOG_FORMAT

    def test_flask_werkzeug_propagate(self, reset_root_logging):
        with patch.dict(os.environ, {}, clear=True):
            configure_logging()
        assert logging.getLogger("flask").propagate is True
        assert logging.getLogger("werkzeug").propagate is True
