# Job Information Retrieval Endpoints Tests

This directory contains comprehensive tests for the job information retrieval endpoints in `flask_workflows.py`. The tests are based on the patterns observed in `flask_workflows.log` and the API structure defined in the Flask application.

## Test Structure

### Core Test Files

1. **`test_job_endpoints.py`** - Basic unit tests for all job-related endpoints
2. **`test_job_endpoints_integration.py`** - Integration tests with complex scenarios and edge cases
3. **`test_job_endpoints_performance.py`** - Performance tests and load testing scenarios
4. **`test_job_endpoints_frontend_patterns.py`** - Tests based on real frontend usage patterns
5. **`conftest.py`** - Shared fixtures and test configuration
6. **`test_basic_endpoints.py`** - Existing tests for basic Flask endpoints

### Tested Endpoints

The following job information retrieval endpoints are tested:

- `GET /flask/list_jobs` - List all jobs
- `GET /flask/get_function_job?jobUid=<uid>` - Get a specific job by UID
- `GET /flask/list_function_jobs_for_functionid?functionUid=<uid>` - Get jobs for a specific function
- `GET /flask/list_function_jobs_for_jobcollectionid?JobCollectionUid=<uid>` - Get jobs for a specific job collection
- `GET /flask/list_function_job_collections` - List all job collections
- `GET /flask/list_function_job_collections_for_functionid?functionUid=<uid>` - Get job collections for a specific function
- `GET /flask/get_function_job_status?jobUid=<uid>` - Get job status
- `GET /flask/get_function_job_outputs?jobUid=<uid>` - Get job outputs

## Test Categories

### Unit Tests (`test_job_endpoints.py`)
- Basic functionality testing
- Success and error scenarios
- Parameter validation
- Response format validation
- Mock-based testing with controlled inputs

### Integration Tests (`test_job_endpoints_integration.py`)
- Complex data structures
- Large datasets with pagination
- Mixed status scenarios
- Special characters in UIDs
- Concurrent request handling
- Error recovery scenarios

### Frontend Pattern Tests (`test_job_endpoints_frontend_patterns.py`)
- Status mapping and classification logic
- Job collection structure matching frontend expectations
- Job selector component usage patterns
- Parallel runner status handling
- LHS sampling job processing
- Job context persistence structure
- Minimum job requirements for surrogate modeling

### Performance Tests (`test_job_endpoints_performance.py`)
- Large dataset handling
- Concurrent request performance
- Memory usage with large responses
- Pagination performance
- Error handling performance
- Load testing scenarios

## Test Data Patterns

The tests are based on real patterns observed in `flask_workflows.log`:

### Job Data Structure
```json
{
  "uid": "job-uid-123",
  "functionUid": "function-uid-456",
  "inputs": {"param1": 1.0, "param2": 2.0},
  "outputs": {"result": 3.0},
  "createdAt": "2025-09-03T12:00:00Z",
  "status": "COMPLETED"
}
```

### Function UIDs Observed
- `eb36b40e-a76d-48e4-a69f-7628697f5467`
- `67fa2957-a804-4e8f-9e0f-ec470ce2e5fb`
- `fe0eef26-56aa-46bb-926a-1b9b7ea18cfa`
- `9c725f08-34f0-423d-be04-760520aa29d1`

### Job Statuses
- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `SUCCESS` (frontend-specific)
- `STARTED` (frontend-specific)
- `UNKNOWN` (frontend-specific)
- `PUBLISHED` (frontend-specific)
- `NOT_STARTED` (frontend-specific)
- `WAITING_FOR_RESOURCES` (frontend-specific)
- `ABORTED` (frontend-specific)
- `WAITING_FOR_CLUSTER` (frontend-specific)

## Running the Tests

### Prerequisites
```bash
pip install -r requirements-test.txt
```

### Run All Tests
```bash
pytest tests/
```

### Run Specific Test Categories
```bash
# Unit tests only
pytest tests/test_job_endpoints.py

# Integration tests only
pytest tests/test_job_endpoints_integration.py

# Frontend pattern tests only
pytest tests/test_job_endpoints_frontend_patterns.py

# Performance tests only
pytest tests/test_job_endpoints_performance.py

# Skip slow tests
pytest tests/ -m "not slow"
```

### Run with Coverage
```bash
pytest tests/ --cov=flask_workflows --cov-report=html
```

### Run with Verbose Output
```bash
pytest tests/ -v
```

## Test Configuration

### Environment Variables
Tests automatically set up the following environment variables:
- `LOG_LEVEL=DEBUG`
- `SERVICE_MODE=TEST`
- `PERMISSIONS=READ-ONLY`
- `DEPLOYMENT_MODE=LOCAL`
- `TESTING=true`

### Mock Configuration
All tests use mocked OSPARC API calls to ensure:
- Tests run without external dependencies
- Predictable test results
- Fast execution
- Controlled error scenarios

## Test Fixtures

### Available Fixtures
- `client` - Flask test client
- `mock_osparc_config` - Mocked OSPARC configuration
- `sample_job_data` - Sample job data for testing
- `sample_function_data` - Sample function data for testing
- `sample_job_collection_data` - Sample job collection data for testing
- `mock_paginated_response` - Helper for creating paginated responses

## Performance Benchmarks

The performance tests include the following benchmarks:
- List jobs with 1000+ items: < 5 seconds
- Get function job: < 0.5 seconds per call
- Get job status: < 0.1 seconds per call
- Get job outputs: < 0.3 seconds per call
- Concurrent requests: < 0.2 seconds per request

## Error Scenarios Tested

- Missing required parameters
- Invalid UIDs
- API connection failures
- Malformed responses
- Empty datasets
- Large datasets
- Special characters in UIDs
- Concurrent request handling
- Error recovery

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Use appropriate fixtures from `conftest.py`
3. Include both success and error scenarios
4. Add performance tests for new endpoints
5. Update this README if adding new test categories

## Frontend Integration Patterns

The tests are designed to match the actual usage patterns observed in the React frontend:

### Status Classification
The frontend uses a status classification system in `ParallelRunner.tsx`:
- `SUCCESS` → `COMPLETED`
- `STARTED` → `RUNNING`
- `FAILED` → `FAILED`
- `PENDING`, `PUBLISHED`, `NOT_STARTED`, `WAITING_FOR_RESOURCES`, `WAITING_FOR_CLUSTER` → `PENDING`

### Job Collection Structure
Job collections are used extensively in `JobSelector.tsx`:
- Each collection contains multiple jobs (`jobIds` array)
- Jobs are fetched individually using `getFunctionJob`
- Status aggregation is performed for collection-level status display

### Data Flow
1. **FunctionList.tsx**: Fetches job collections to show job counts
2. **JobSelector.tsx**: Fetches individual jobs for selection and display
3. **ParallelRunner.tsx**: Monitors job status during execution
4. **LHSSampling.tsx**: Processes completed jobs for surrogate modeling

### Minimum Requirements
- At least 5 jobs are required for surrogate modeling (Dakota requirement)
- Only `SUCCESS` status jobs are used for modeling
- Job outputs must be numeric for processing

## Notes

- Tests are designed to run in isolation
- All external dependencies are mocked
- Tests cover both happy path and error scenarios
- Performance tests are marked with `@pytest.mark.slow`
- Integration tests focus on real-world usage patterns
- Frontend pattern tests ensure API compatibility with React components
