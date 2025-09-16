# Phase 2: Core API Endpoint Tests

## Context

The MMUX Flask API is structured with a main entrypoint file `main.py`, a package `mmux_flaskapi` with various utility modules as well as blueprints for the different sub-parts of the application.

## Blueprint Context

- All endpoints are now part of the `osparc` blueprint. Ensure that the test client accesses endpoints using the `osparc` prefix (e.g., `/osparc/list_functions`).

## Components to Test

1. **Function Listing and Management Endpoints**
   - `/osparc/list_functions` (implemented in `flask_list_functions()`)
   - `_get_all_items`, `_get_first_N_items`, and `_get_last_N_items` helper functions

2. **Job Listing and Management Endpoints**
   - `/osparc/list_jobs` (implemented in `flask_list_jobs()`)
   - `/osparc/list_function_jobs_for_functionid` (implemented in `flask_list_function_jobs_for_functionid()`)
   - `/osparc/get_function_job` (implemented in `flask_get_function_job()`)
   - `/osparc/get_function_job_status` (implemented in `flask_get_function_job_status()`)
   - `/osparc/get_function_job_outputs` (implemented in `flask_get_function_job_outputs()`)
   - `_get_function_job_from_uid` helper function

3. **Job Collection Endpoints**
   - `/osparc/list_function_job_collections` (implemented in `flask_get_function_job_collections()`)
   - `/osparc/list_function_jobs_for_jobcollectionid` (implemented in `flask_list_function_jobs_for_jobcollectionid()`)
   - `/osparc/list_function_job_collections_for_functionid` (implemented in `flask_get_function_job_collections_for_functionid()`)

## Required Fixtures

1. **Flask Test Client Fixture**
   ```python
   from conftest import test_client
   ```

2. **Mock Request Data Fixture**
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

1. **Status Code Validation**
   - Assert `200 OK` for successful requests
   - Assert appropriate error codes (`400`, `404`, `500`, etc.) for error conditions
   - Assert redirects return correct status codes and locations

2. **Response Format Validation**
   - Assert JSON structure matches expected schema
   - Assert content types are correct

3. **Request Validation**
   - Assert required parameters are enforced
   - Assert parameter type validation works
   - Assert parameter range/format validation works

## Error Cases to Test

1. **Invalid Input Data Handling**
   - Test with missing required fields
   - Test with invalid data types
   - Test with values outside accepted ranges

2. **Missing Required Parameters**
   - Test omitting required URL parameters
   - Test omitting required headers
   - Test with empty request body when content is required

## Implementation Notes

- Use `pytest-flask` for testing the Flask endpoints.
- Create parameterized tests to test multiple input variations.
- Mock any external service calls or database operations.
- Focus on HTTP-level testing rather than internal function calls.
- Carefully read the implementation of each endpoint in the `osparc` blueprint to understand its behavior and requirements.
- Test both successful and error paths for each endpoint.

## Expected Test Coverage

- Ensure all endpoints under the `osparc` blueprint respond correctly to valid inputs and handle invalid inputs appropriately.
- Cover both basic functionality and edge cases for all endpoints.
