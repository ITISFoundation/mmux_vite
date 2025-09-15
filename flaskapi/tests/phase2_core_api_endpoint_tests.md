# Phase 2: Core API Endpoint Tests

## Context

The MMUX Flask API contains various endpoints defined in `flask_workflows.py`. This phase focuses on testing these endpoints for correct functionality, response formats, and status codes.

## Test File Path

`tests/test_flask_workflows_endpoints.py`

## Components to Test

1. Function Listing and Management Endpoints
   - Test `/flask/list_functions` endpoint (implemented in `flask_list_functions()`)
   - Test the `_get_all_items`, `_get_first_N_items`, and `_get_last_N_items` helper functions
   - Verify filtering of functions works correctly

2. Job Listing and Management Endpoints
   - Test `/flask/list_jobs` endpoint (implemented in `flask_list_jobs()`)
   - Test `/flask/list_function_jobs_for_functionid` endpoint (implemented in `flask_list_function_jobs_for_functionid()`)
   - Test `/flask/get_function_job` endpoint (implemented in `flask_get_function_job()`)
   - Test `/flask/get_function_job_status` endpoint (implemented in `flask_get_function_job_status()`)
   - Test `/flask/get_function_job_outputs` endpoint (implemented in `flask_get_function_job_outputs()`)
   - Test the `_get_function_job_from_uid` helper function

3. Job Collection Endpoints
   - Test `/flask/list_function_job_collections` endpoint (implemented in `flask_get_function_job_collections()`) 
   - Test `/flask/list_function_jobs_for_jobcollectionid` endpoint (implemented in `flask_list_function_jobs_for_jobcollectionid()`)
   - Test `/flask/list_function_job_collections_for_functionid` endpoint (implemented in `flask_get_function_job_collections_for_functionid()`)

## Required Fixtures

1. Flask test client fixture
```python
@pytest.fixture
def client(app):
    # Return a test client for the app
    return app.test_client()
```

2. Mock request data fixture
```python
@pytest.fixture
def mock_request_data():
    # Return sample request data for different endpoints
    return {
        "endpoint1": {...},
        "endpoint2": {...},
        # More mock data as needed
    }
```

## Assertions to Implement

1. Verify endpoints return expected status codes:
   - Assert 200 OK for successful requests
   - Assert appropriate error codes (400, 404, 500, etc.) for error conditions
   - Assert redirects return correct status codes and locations

2. Verify response formats match API specifications:
   - Assert JSON structure matches expected schema
   - Assert content types are correct
   - Assert pagination/filtering works if applicable

3. Verify basic request validation:
   - Assert required parameters are enforced
   - Assert parameter type validation works
   - Assert parameter range/format validation works

## Error Cases to Test

1. Invalid input data handling:
   - Test with missing required fields
   - Test with invalid data types
   - Test with values outside accepted ranges

2. Missing required parameters:
   - Test omitting required URL parameters
   - Test omitting required headers
   - Test with empty request body when content is required

## Implementation Notes

- Use pytest-flask for testing the Flask endpoints
- Create parameterized tests to test multiple input variations
- Mock any external service calls or database operations
- Focus on HTTP-level testing rather than internal function calls
- Test both successful and error paths for each endpoint

## Expected Test Coverage

These tests should cover the basic functionality of all API endpoints, ensuring they respond correctly to valid inputs and handle invalid inputs appropriately. This builds on Phase 1 by assuming the app initializes correctly and focuses on endpoint behavior.
