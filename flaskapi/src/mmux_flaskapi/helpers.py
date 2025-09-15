import os
import re

def is_test_environment() -> bool:
    """Check if we're running in a test environment."""
    return "test" in os.environ.get("OSPARC_API_BASE_URL", "").lower()


### TypeScript expects camelCase, but Python API is getting snake_case. 
# Convert before sending to frontend.
def camel_to_snake(s: str) -> str:
    """Convert camelCase to snake_case."""
    # Insert an underscore before any uppercase letter that follows a lowercase letter
    res = re.sub(r'([a-z])([A-Z])', r'\1_\2', s)
    return res.lower()

def snake_to_camel(s: str) -> str:
    """Convert snake_case to camelCase."""
    components = s.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def dict_keys_camel_to_snake(d: dict) -> dict:
    return {camel_to_snake(k): v for k, v in d.items()}

def dict_keys_snake_to_camel(d: dict) -> dict:
    """Convert dictionary keys from snake_case to camelCase."""
    return {snake_to_camel(k): v for k, v in d.items()}

def recursive_dict_keys_camel_to_snake(d: dict, max_depth: int = -1, current_depth: int = 0) -> dict:
    # Process nested values
    for k, v in d.items():
        if isinstance(v, dict) and (max_depth == -1 or current_depth < max_depth):
            d[k] = recursive_dict_keys_camel_to_snake(v, max_depth, current_depth + 1)
        elif isinstance(v, list) and (max_depth == -1 or current_depth < max_depth):
            d[k] = [
                recursive_dict_keys_camel_to_snake(i, max_depth, current_depth + 1) if isinstance(i, dict) else i 
                for i in v
            ]
    
    # Convert keys and return
    return {camel_to_snake(k): v for k, v in d.items()}

def recursive_dict_keys_snake_to_camel(d: dict, max_depth: int = -1, current_depth: int = 0) -> dict:
    for k, v in d.items():
        if isinstance(v, dict) and (max_depth == -1 or current_depth < max_depth):
            d[k] = recursive_dict_keys_snake_to_camel(v, max_depth, current_depth + 1)
        elif isinstance(v, list) and (max_depth == -1 or current_depth < max_depth):
            d[k] = [
                recursive_dict_keys_snake_to_camel(i, max_depth, current_depth + 1) if isinstance(i, dict) else i
                for i in v
            ]
    return {snake_to_camel(k): v for k, v in d.items()}
