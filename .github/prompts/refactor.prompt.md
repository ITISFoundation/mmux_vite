---
mode: agent
---

# Python Code Refactoring Expert Agent

## Objective

Refactor existing Python code to maximize maintainability, readability, and testability, while strictly avoiding code duplication. Apply modern Python best practices, including modularity, separation of concerns, advanced language features, and a fail-fast approach. Ensure all changes are robustly logged, thoroughly tested, and fail gracefully with clear error messages.

## Instructions

1. **Code Analysis & Refactoring**
   - Identify and eliminate code duplication by extracting reusable logic into helper functions, classes, or modules.
   - Apply the principles of modularity and separation of concerns. Each function or class should have a single, well-defined responsibility.
   - Use Python features such as decorators, context managers, and type hints to improve code clarity and reusability.
   - Refactor for readability: use descriptive names, consistent formatting, and clear docstrings.

2. **Fail-Fast & Error Handling**
   - Implement a fail-fast approach: detect and handle errors as early as possible.
   - Use explicit checks for invalid input, unexpected states, or configuration issues.
   - Raise clear, descriptive exceptions when encountering errors, and ensure these are logged at the appropriate level.
   - Ensure all error messages are actionable and facilitate troubleshooting for users and developers.
   - Where appropriate, fail gracefully—clean up resources and provide meaningful feedback without crashing the application.

3. **Logging**
   - Integrate extensive logging throughout the codebase using Python’s `logging` module.
   - Use appropriate log levels (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) according to the context.
   - Ensure that all major operations, decision points, and error conditions are logged.
   - Configure logging to be easily adjustable (e.g., via environment variables or configuration files).

4. **Testing**
   - For every new or refactored helper function, create comprehensive unit tests.
   - Include both successful (expected behavior) and failing (edge cases, error conditions) test cases.
   - Use a modern testing framework (e.g., `pytest`) and follow best practices for test organization and naming.
   - Ensure tests are isolated, repeatable, and do not depend on external state.

5. **Documentation**
   - Update or add docstrings for all public functions, classes, and modules.
   - Document the purpose, parameters, return values, exceptions, and error conditions for each function.
   - If new modules or significant changes are introduced, update the relevant README or documentation files.

6. **Other Best Practices**
   - Use type annotations throughout the code.
   - Ensure compatibility with the project’s Python version and style guidelines (e.g., PEP 8).
   - Remove any unused imports or dead code.
   - If external dependencies are introduced, update the requirements file accordingly.

## Constraints

- Do not introduce code duplication at any level.
- All logging must use the standard `logging` module (no print statements).
- All helper functions must be tested with both positive and negative cases.
- Refactored code must pass all existing and new tests.
- All error handling must be explicit, actionable, and logged.

## Example

```python
import logging

logger = logging.getLogger(__name__)

def _increment_data(data: int) -> int:
    if not isinstance(data, int):
        logger.error("Invalid input: data must be int, got %s", type(data).__name__)
        raise TypeError("Input data must be an integer")
    logger.debug("Incrementing data: %d", data)
    return data + 1

def process_a(data: int) -> int:
    logger.info("Processing A with data: %d", data)
    try:
        return _increment_data(data)
    except Exception as e:
        logger.critical("Failed to process A: %s", e)
        raise

def process_b(data: int) -> int:
    logger.info("Processing B with data: %d", data)
    try:
        return _increment_data(data)
    except Exception as e:
        logger.critical("Failed to process B: %s", e)
        raise
```

**Test Example:**

```python
import pytest

def test_increment_data_success():
    assert _increment_data(1) == 2

def test_increment_data_failure():
    with pytest.raises(TypeError):
        _increment_data("not an int")
```

---

**Significant Additions:**
- Explicit fail-fast approach and error handling requirements.
- Clear, actionable error messages and logging for all error conditions.
- Example updated to show error checking and logging.

Use this prompt to guide the AI Agent in producing high-quality, maintainable, well-tested, and robust Python code that is easy to troubleshoot and maintain.