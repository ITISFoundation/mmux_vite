# API Testing Best Practices for MMUX Flask API

## Table of Contents
1. [Introduction](#introduction)
2. [Types of API Testing Relevant to MMUX](#types-of-api-testing-relevant-to-mmux)
3. [Testing Environment Setup](#testing-environment-setup)
4. [Best Practices for MMUX API Testing](#best-practices-for-mmux-api-testing)
5. [Test Structure and Organization](#test-structure-and-organization)
6. [Working with Scientific Computing Workflows](#working-with-scientific-computing-workflows)
7. [Tools and Resources](#tools-and-resources)

## Introduction

This guide provides focused testing best practices for the MMUX Flask API. Our API primarily handles scientific computation workflows, particularly related to Dakota simulations, without complex authentication or database dependencies.

## Types of API Testing Relevant to MMUX

### 1. Unit Testing

Focus on testing individual components in isolation:

- Utility functions and helpers
- Data transformation logic
- Configuration handling

```python
def test_workflow_config_parsing():
    """
    GIVEN a workflow configuration file
    WHEN the parser processes it
    THEN check that all parameters are correctly extracted
    """
    config = parse_workflow_config("test_config.yaml")
    assert "steps" in config
    assert config["parameters"]["iterations"] == 100
```

### 2. Integration Testing

Test how components work together:

- API endpoint responses
- Workflow execution paths
- File handling and I/O operations

```python
def test_workflow_submission_endpoint(client):
    """
    GIVEN a workflow configuration
    WHEN the submission endpoint is called
    THEN check that the response includes a valid job ID and status
    """
    response = client.post(
        '/workflows/submit',
        json={'config': {'type': 'dakota', 'parameters': {'method': 'moga'}}}
    )
    assert response.status_code == 202
    assert 'job_id' in response.json
    assert response.json['status'] == 'submitted'
```

### 3. Functional Testing

Test complete workflows from start to finish:

- Workflow execution and results
- Error handling and recovery
- Resource cleanup

## Testing Environment Setup

### Project Structure

Your current test structure in `tests/` should align with your code organization:

```
tests/
├── conftest.py         # Shared fixtures
├── unit/               # Unit tests
│   ├── test_helpers.py
│   └── test_config.py
├── integration/        # Integration tests
│   ├── test_endpoints.py
│   └── test_workflows.py
└── functional/         # Functional tests
    └── test_dakota_runs.py
```

### Configuration

Use your existing pytest configuration in `pyproject.toml`, which already includes:

- Test paths
- Naming conventions
- Coverage reporting
- Test markers for categorization

## Best Practices for MMUX API Testing

### 1. Isolated and Independent Tests

- Tests should run independently without dependencies between tests
- Use temporary directories for file operations
- Clean up resources after tests complete

### 2. Testing Scientific Computing Operations

- Test with small, predictable datasets
- Verify computational results against known outputs
- Handle numerical precision appropriately in assertions:

```python
def test_numerical_result():
    result = calculate_function(input_data)
    assert abs(result - expected_value) < 1e-6  # Use appropriate tolerance
```

### 3. Test Both Success and Error Cases

- Test valid inputs
- Test invalid inputs and error handling
- Test resource limits and timeout handling

### 4. Mocking Expensive Operations

For operations that would be too expensive or time-consuming during tests:

```python
def test_long_running_workflow(mocker):
    """Test a workflow that normally takes a long time to run"""
    # Mock the expensive computation
    mocker.patch('mmux_flaskapi.compute.run_simulation',
                 return_value={'status': 'completed', 'result': expected_data})

    result = client.post('/workflows/run', json={'type': 'expensive_simulation'})
    assert result.status_code == 200
    assert result.json['status'] == 'completed'
```

## Test Structure and Organization

### Use Descriptive Test Names

Name tests clearly to describe the behavior being tested:

```python
def test_dakota_workflow_returns_expected_output_format()
def test_workflow_fails_gracefully_when_input_file_missing()
```

### Group Related Tests

Group related tests in classes where it makes sense:

```python
class TestDakotaWorkflows:
    def test_moga_workflow(self, client):
        # Test implementation

    def test_evaluate_workflow(self, client):
        # Test implementation
```

## Working with Scientific Computing Workflows

### Testing File-Based Workflows

If your API works with files (evident from the `runs/` directory):

1. Create temporary test files
2. Validate file creation and modification
3. Check output file content and format

```python
def test_dakota_file_output(tmp_path):
    """Test that Dakota workflow generates expected output files"""
    # Setup input file in temporary directory
    input_file = tmp_path / "input.dat"
    input_file.write_text("parameter_data")

    # Run workflow
    result = run_workflow(input_file)

    # Check output files
    output_file = tmp_path / "output.dat"
    assert output_file.exists()
    content = output_file.read_text()
    assert "Expected output pattern" in content
```

Note that these scientific workflows are very performant and fast, and do not need to be mocked.

## Tools and Resources

### Recommended Testing Tools

- **pytest** - Your main testing framework
- **pytest-cov** - For code coverage analysis

### Logging and Debugging

Test your logging functionality to ensure proper diagnostics:

```python
def test_workflow_logging(caplog):
    """Test that workflows log appropriate information"""
    caplog.set_level(logging.INFO)
    run_workflow(test_config)

    # Check that expected log messages were produced
    assert "Workflow started" in caplog.text
    assert "Processing step 1" in caplog.text
    assert "Workflow completed successfully" in caplog.text
```
