import os
import re
from typing import Callable
import numpy as np

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


def _get_all_items(api_call: Callable, *args, **kwargs):
    """Helper function to get all items from a paginated API call."""
    list_len = api_call(limit=1,*args, **kwargs).total
    if "limit" not in kwargs:
        kwargs["limit"] = int(np.min([50, list_len])) ## max allowed is 50
        
    retrieved = 0
    items = []
    page = 1
    while retrieved < list_len:
        # _logger.debug(f"Retrieving page {page} of {api_call.__name__} (offset: {retrieved})")
        response = api_call(offset = retrieved, *args, **kwargs)
        retrieved += len(response.items)  # type: ignore
        items += [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    return items

def _get_first_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get first N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        # _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(limit=max(1, N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items

def _get_last_N_items(api_call: Callable, N: int, **kwargs):
    """Helper function to get last N items from a paginated API call."""
    list_len = api_call(limit=1, **kwargs).total
    if list_len < N:
        # _logger.warning(f"Requested {N} items, but only {list_len} are available.")
        N = list_len
    response = api_call(offset=list_len - N, limit=max(1,N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items
