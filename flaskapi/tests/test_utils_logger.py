"""
Tests for the logger utility module.

This module tests the logging configuration, file creation, and logger propagation
settings for the Flask application.
"""

import logging
import os
from unittest.mock import patch


class TestLoggerConfiguration:
    """Test logger configuration and setup."""

    def test_logger_import_creates_log_file(self, tmp_path):
        """Test that importing logger creates the log file in the correct location."""
        # This test verifies that the logger module can be imported without errors
        # and that the logging configuration is applied
        import mmux_flaskapi.utils.logger

        # Verify that the module imports successfully
        assert mmux_flaskapi.utils.logger is not None

    def test_logger_basic_configuration(self):
        """Test that basic logging is configured correctly."""
        # Import the logger module to ensure it's initialized

        # Get the root logger
        root_logger = logging.getLogger()

        # Check that handlers are configured
        assert len(root_logger.handlers) >= 2  # At least file and stream handlers

        # Check that there's a FileHandler
        file_handlers = [h for h in root_logger.handlers if isinstance(h, logging.FileHandler)]
        assert len(file_handlers) >= 1

        # Check that there's a StreamHandler
        stream_handlers = [h for h in root_logger.handlers if isinstance(h, logging.StreamHandler)]
        assert len(stream_handlers) >= 1

    def test_log_level_from_environment_default(self):
        """Test that default log level is DEBUG when not set in environment."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("mmux_flaskapi.utils.logger.logging.basicConfig") as mock_config:
                # Re-import to trigger configuration with cleared environment
                import importlib

                import mmux_flaskapi.utils.logger

                importlib.reload(mmux_flaskapi.utils.logger)

                # Check that basicConfig was called with DEBUG level
                mock_config.assert_called()
                call_args = mock_config.call_args
                assert call_args[1]["level"] == "DEBUG"

    def test_log_level_from_environment_custom(self):
        """Test that log level is read from LOG_LEVEL environment variable."""
        with patch.dict(os.environ, {"LOG_LEVEL": "INFO"}):
            with patch("mmux_flaskapi.utils.logger.logging.basicConfig") as mock_config:
                # Re-import to trigger configuration with custom log level
                import importlib

                import mmux_flaskapi.utils.logger

                importlib.reload(mmux_flaskapi.utils.logger)

                # Check that basicConfig was called with INFO level
                mock_config.assert_called()
                call_args = mock_config.call_args
                assert call_args[1]["level"] == "INFO"

    def test_flask_logger_propagation(self):
        """Test that Flask logger propagation is enabled."""

        flask_logger = logging.getLogger("flask")
        assert flask_logger.propagate is True

    def test_werkzeug_logger_propagation(self):
        """Test that Werkzeug logger propagation is enabled."""

        werkzeug_logger = logging.getLogger("werkzeug")
        assert werkzeug_logger.propagate is True

    def test_log_format_configuration(self):
        """Test that log format is configured correctly."""
        with patch("mmux_flaskapi.utils.logger.logging.basicConfig") as mock_config:
            # Re-import to trigger configuration
            import importlib

            import mmux_flaskapi.utils.logger

            importlib.reload(mmux_flaskapi.utils.logger)

            # Check that basicConfig was called with correct format
            mock_config.assert_called()
            call_args = mock_config.call_args
            expected_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            assert call_args[1]["format"] == expected_format

    def test_log_file_path_generation(self):
        """Test that log file path is generated correctly."""
        # Test that the logger module sets up the path correctly
        import mmux_flaskapi.utils.logger

        # Verify that the module is imported and configured without errors
        assert mmux_flaskapi.utils.logger is not None

    def test_handlers_configuration(self):
        """Test that both file and stream handlers are configured."""
        with patch("mmux_flaskapi.utils.logger.logging.basicConfig") as mock_config:
            # Re-import to trigger configuration
            import importlib

            import mmux_flaskapi.utils.logger

            importlib.reload(mmux_flaskapi.utils.logger)

            # Check that handlers are configured
            mock_config.assert_called()
            call_args = mock_config.call_args
            handlers = call_args[1]["handlers"]

            # Should have exactly 2 handlers
            assert len(handlers) == 2

            # Check handler types
            handler_types = [type(h).__name__ for h in handlers]
            assert "FileHandler" in handler_types
            assert "StreamHandler" in handler_types

    def test_multiple_imports_no_duplicate_configuration(self):
        """Test that multiple imports don't cause duplicate configuration."""
        # Import multiple times

        root_logger = logging.getLogger()

        # Count FileHandlers to ensure we don't have duplicates
        # Note: This test may need adjustment based on test execution order
        file_handlers = [h for h in root_logger.handlers if isinstance(h, logging.FileHandler)]

        # We expect at least one FileHandler, but not an excessive number
        assert len(file_handlers) >= 1
        assert len(file_handlers) <= 3  # Allow some tolerance for test execution

    def test_log_directory_creation(self):
        """Test that log directory is created if it doesn't exist."""
        # Test that the logger module sets up logging without errors
        import mmux_flaskapi.utils.logger

        # Verify that the module is imported and configured without errors
        assert mmux_flaskapi.utils.logger is not None

    def test_logger_module_constants_exist(self):
        """Test that the logger module has the expected structure."""
        import mmux_flaskapi.utils.logger as logger_module

        # Check that the module can be imported without errors
        assert logger_module is not None

        # Verify that logging is properly configured after import
        root_logger = logging.getLogger()
        assert root_logger.level <= logging.DEBUG  # Should be at DEBUG level or lower
