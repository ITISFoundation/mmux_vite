# Objective

Create robust pytest-compatible mockups for the specified external endpoint, based on the provided API documentation. The goal is to enable isolated and flexible testing of Flask API endpoints that depend on this external service, without making real HTTP requests.

# Instructions

1. **Analyze the API Specification**  
   - Review the provided documentation for the specified external endpoint, including its expected request parameters, response structure, and possible status codes.
   - Identify the typical and edge-case responses (e.g., successful response, empty list, error cases).

2. **Design Mock Responses**  
   - Define Python data structures (dicts/lists) that accurately represent the JSON returned by the real endpoint, including all required fields and types.
   - Prepare at least:
     - A standard successful response with multiple function entries.
     - An empty result set.
     - An error/exception scenario (e.g., 422 Validation Error).

3. **Implement Pytest Mocks**  
   - Use `pytest` and `unittest.mock` (or `pytest-mock`) to patch the relevant method or client call in your Flask API code that invokes the specified external endpoint.
   - Ensure the mock can be parameterized to return different responses for different test cases.
   - Provide example test functions that demonstrate:
     - Mocking a successful response.
     - Mocking an empty response.
     - Mocking an error/exception.

4. **Documentation and Usage**  
   - Add clear docstrings and comments explaining the mock setup and how to extend it for future API changes.
   - If applicable, show how to integrate the mock with existing Flask test clients.

# Constraints

- Do not modify production code; all mocking should be done within the test suite.
- The mock responses must strictly follow the documented API schema.
- Tests should be self-contained and not depend on external services or network access.

# Example

```python
import pytest
from unittest.mock import patch

target_endpoint = "osparc_client.api.functions_api.FunctionsApi.listFunctions"
@pytest.fixture
def mock_list_functions_success():
    return {
        "items": [
            {
                "uid": "func1",
                "name": "Function One",
                "description": "First test function"
            },
            {
                "uid": "func2",
                "name": "Function Two",
                "description": "Second test function"
            }
        ],
        "total": 2
    }

def test_list_functions_success(client, mock_list_functions_success):
    with patch(target_endpoint, return_value=mock_list_functions_success):
        response = client.get("/your/endpoint")
        assert response.status_code == 200
        # ... further assertions ...
```

# Deliverable

- A set of pytest fixtures that mock the specified endpoint according to the API documentation.
- A set of pytest test functions ready to be integrated into the existing tests suite.