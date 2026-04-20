# Phase 1: Basic Flask Application Structure and Configuration Tests

## Context

The MMUX Flask API is structured with a main entrypoint file `main.py`, a package `mmux_flaskapi` with various utility modules as well as blueprints for the different sub-parts of the application.

## Test File Path

`tests/test_flask_app_setup.py`

## Components to Test

1. Flask application initialization
   - Function `create_flask_app()` in `src/mmux_flaskapi/app.py`
   - Verify the Flask app is created and configured correctly
   - Check that routes are registered properly
   - Validate app configuration settings
   - Test the `is_test_environment()` function in `mmux_flaskapi/helpers.py`

2. Configuration loading
   - Test the `OsparcConfig` class in `mmux_flaskapi/webserver_config.py`
   - Test that configuration is loaded from the proper sources
   - Verify default values are set correctly
   - Check that environment variables override defaults when appropriate

3. Health Check and Environment endpoints
   - Test `/flask/health` endpoint (implemented in `health_check()`)
   - Test `/flask/service-mode` endpoint (implemented in `service_mode()`)
   - Test `/flask/permissions` endpoint (implemented in `permissions()`)
   - Test the `_deployment_mode()` internal function

## Required Fixtures

1. Create a pytest fixture to initialize the Flask app in test mode
```python
@pytest.fixture
def app():
    # Initialize the Flask app for testing
    # Return the app instance
```

2. Create a fixture for mocking configuration if needed
```python
@pytest.fixture
def mock_config():
    # Mock configuration values
    # Return the mock configuration
```

## Assertions to Implement

1. Verify Flask app initializes correctly:
   - Assert that the app instance is created
   - Assert that expected routes are registered
   - Assert that the app is in testing mode

2. Verify configuration values are loaded properly:
   - Assert that default configuration values are set
   - Assert that configuration overrides work as expected
   - Assert that sensitive configuration is handled securely

## Error Cases to Test

1. Missing configuration values:
   - Test behavior when required config values are missing
   - Verify appropriate error messages or default fallbacks

2. Invalid configuration format:
   - Test behavior when configuration has incorrect format
   - Verify error handling for malformed configuration

## Implementation Notes

- Use pytest's monkeypatch fixture to modify environment variables
- Use pytest-flask for testing the Flask application
- Avoid actual file system or database operations, use mocks instead
- Focus on isolated testing of app initialization and configuration only

## Expected Test Coverage

These tests should cover the basic setup of the Flask application, ensuring that it initializes correctly and loads configuration as expected, which is fundamental before testing any specific endpoint functionality.
