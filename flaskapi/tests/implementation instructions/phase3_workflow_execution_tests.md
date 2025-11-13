# Phase 3: Workflow Execution Tests

## Context

The MMUX Flask API appears to handle workflow executions, as evidenced by the numerous run directories in the `runs` folder. This phase focuses on testing the creation, execution, and management of workflows, including the generation of appropriate directory structures and content.

## Test File Path

`tests/test_workflow_execution.py`

## Components to Test

1. Cross Validation Workflow
   - Test `/flask/sumo_cross_validation` endpoint (implemented in `flask_sumo_cross_validation()`)
   - Test the `_create_training_file_from_jobs` helper function
   - Verify proper handling of input and output variables
   - Test response format and error handling

2. UQ Propagation Workflow
   - Test `/flask/manual_uq_propagation` endpoint (implemented in `flask_manual_uq_propagation()`)
   - Test handling of distributions for uncertainty propagation
   - Verify sample generation and validation
   - Test handling of various input parameters

3. Run directory structure and content generation
   - Test the `create_run_dir` function imported from `mmux_python.utils.funs_evaluate`
   - Verify proper directory creation with expected naming patterns like "dakota_YYYYMMDD.HHMMSS_*"
   - Check that output files are created with correct format and content
   - Test metadata and logging functionality

4. Data Processing and Evaluation Functions
   - Test the `process_input_file` function imported from `mmux_python.utils.funs_data_processing`
   - Test the `evaluate_sumo_manual_crossvalidation` function from `mmux_python.utils.funs_evaluate`
   - Test the `sanitize_varnames` utility function

## Required Fixtures

1. Mock filesystem for run directories
```python
@pytest.fixture
def mock_filesystem(tmp_path, monkeypatch):
    # Set up a temporary directory structure
    # Mock filesystem operations to use this temporary structure
    # Return the mock filesystem handler
```

2. Mock execution environment
```python
@pytest.fixture
def mock_execution_env():
    # Set up mock environment variables
    # Mock any external execution dependencies
    # Return the mock environment configuration
```

3. Sample workflow parameters
```python
@pytest.fixture
def sample_workflow_params():
    # Return sample parameters for workflow execution
    return {
        "workflow_type": "evaluate",  # or "moga" based on directory names
        "parameters": {...},
        # Other necessary parameters
    }
```

## Assertions to Implement

1. Verify workflows execute as expected:
   - Assert workflow initiation returns expected response
   - Assert workflow execution completes with expected status
   - Assert execution time is within reasonable bounds

2. Verify run directories are created with proper structure:
   - Assert directory naming follows the pattern seen in existing runs
   - Assert expected subdirectories and files are created
   - Assert file permissions are set correctly

3. Verify workflow state transitions:
   - Assert workflow states transition correctly (e.g., pending → running → completed)
   - Assert state changes are logged appropriately
   - Assert error states are handled properly

## Error Cases to Test

1. Failed workflow executions:
   - Test behavior when workflow execution fails
   - Verify error reporting and logging
   - Check cleanup operations after failure

2. Invalid workflow parameters:
   - Test with missing required parameters
   - Test with invalid parameter values
   - Test with conflicting parameter combinations

## Implementation Notes

- Use `tmp_path` and monkeypatching to avoid modifying the actual filesystem
- Create thorough mocks for any external execution engines
- Test both normal operation and failure scenarios
- Focus on the API's handling of workflow state rather than the actual execution
- Pay attention to asynchronous behavior if workflows run asynchronously

## Expected Test Coverage

These tests should verify that the workflow execution functionality works correctly, including proper directory creation, state management, and error handling. This builds upon the previous phases by assuming the API endpoints function correctly and focusing on the specific workflow execution behavior.
