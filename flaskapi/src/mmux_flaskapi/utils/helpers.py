import datetime
import os
import re
import uuid
from collections.abc import Callable
from pathlib import Path
from typing import TypeVar, overload

import numpy as np
import pandas as pd


def is_test_environment() -> bool:
    """Check if we're running in a test environment."""
    return "test" in os.environ.get("OSPARC_API_BASE_URL", "").lower()


def create_run_dir(script_dir: Path, dir_name: str = "sampling"):
    ## part 1 - setup
    main_runs_dir = script_dir / "runs"
    current_time = datetime.datetime.now().strftime("%Y%m%d.%H%M%S%d")
    uid = uuid.uuid4().hex
    temp_dir = main_runs_dir / "_".join(["dakota", current_time, uid, dir_name])
    print(str(temp_dir))
    os.makedirs(temp_dir, exist_ok=True)
    print("temp_dir: ", temp_dir)
    return temp_dir


### TypeScript expects camelCase, but Python API is getting snake_case.
# Convert before sending to frontend.
def camel_to_snake(s: str) -> str:
    """Convert camelCase to snake_case."""
    # Insert an underscore before any uppercase letter that follows a lowercase letter
    res = re.sub(r"([a-z])([A-Z])", r"\1_\2", s)
    return res.lower()


def snake_to_camel(s: str) -> str:
    """Convert snake_case to camelCase."""
    components = s.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def dict_keys_camel_to_snake(d: dict) -> dict:
    return {camel_to_snake(k): v for k, v in d.items()}


def dict_keys_snake_to_camel(d: dict) -> dict:
    """Convert dictionary keys from snake_case to camelCase."""
    return {snake_to_camel(k): v for k, v in d.items()}


# Keys whose *own* nested dict values are oSPARC/user-defined variable
# identifiers (e.g. "sigma_blood", "TissueConduc"), not API field names - they
# must survive camel<->snake conversion untouched. Mirrors the frontend's
# `opaqueValueDictKeys` in node/src/utils/functionUtils.ts; kept in sync via
# test_utils_helpers.py::test_preserve_nested_keys_matches_frontend_opaque_keys
# (no shared runtime file - see node/SPEC.md T13/T19).
# - read path (snake_to_camel, response serializer): "properties", "inputs",
#   "outputs", "default_inputs" - flaskapi/SPEC.md V13.
# - write path (camel_to_snake, request parser): "slider_values",
#   "distributions", "output_var_selection", "project_inputs" - audited from
#   every outgoing fetch() body in node/ (Curves1DPlot, Surface2DPlot,
#   IsoSurface3DPlot, MOGAPareto, UncertainUQ, functionUtils.clone_job).
# - read path (snake_to_camel, response serializer): "correlations", "sobol" -
#   per-input-variable result dicts returned by compute_correlation_indices/
#   compute_sobol_indices (flaskapi/SPEC.md V28/V32, B15).
_DEFAULT_PRESERVE_NESTED_KEYS = frozenset(
    {
        "properties",
        "inputs",
        "outputs",
        "default_inputs",
        "slider_values",
        "distributions",
        "output_var_selection",
        "project_inputs",
        "correlations",
        "sobol",
        "sobol_second_order",
    }
)

# Subset of `_DEFAULT_PRESERVE_NESTED_KEYS` whose values are ONE level of
# {variable_name: {field: value}} -- the variable_name keys must stay
# untouched (B15), but the per-field keys (e.g. "main_ci_low") are still API
# field names and must still be camelCased (flaskapi/SPEC.md V37), unlike
# "sobol_second_order" which nests a SECOND variable-name level
# ({varA: {varB: float}}) that must be fully preserved instead.
_FIELD_LEVEL_PRESERVE_KEYS = frozenset({"correlations", "sobol"})


def recursive_dict_keys_camel_to_snake(
    d: dict,
    max_depth: int = -1,
    current_depth: int = 0,
    preserve_nested_keys: frozenset[str] | set[str] = _DEFAULT_PRESERVE_NESTED_KEYS,
) -> dict:
    converted = {}
    for k, v in d.items():
        snake_key = camel_to_snake(k)
        if snake_key in preserve_nested_keys and isinstance(v, dict):
            converted[snake_key] = v
            continue
        if isinstance(v, dict) and (max_depth == -1 or current_depth < max_depth):
            converted[snake_key] = recursive_dict_keys_camel_to_snake(
                v, max_depth, current_depth + 1, preserve_nested_keys
            )
        elif isinstance(v, list) and (max_depth == -1 or current_depth < max_depth):
            converted[snake_key] = [
                recursive_dict_keys_camel_to_snake(
                    i, max_depth, current_depth + 1, preserve_nested_keys
                )
                if isinstance(i, dict)
                else i
                for i in v
            ]
        else:
            converted[snake_key] = v
    return converted


def recursive_dict_keys_snake_to_camel(
    d: dict,
    max_depth: int = -1,
    current_depth: int = 0,
    preserve_nested_keys: frozenset[str] | set[str] = _DEFAULT_PRESERVE_NESTED_KEYS,
) -> dict:
    converted = {}
    for k, v in d.items():
        camel_key = snake_to_camel(k)
        if k in preserve_nested_keys and isinstance(v, dict):
            if k in _FIELD_LEVEL_PRESERVE_KEYS:
                converted[camel_key] = {
                    var_name: (
                        dict_keys_snake_to_camel(inner) if isinstance(inner, dict) else inner
                    )
                    for var_name, inner in v.items()
                }
            else:
                converted[camel_key] = v
            continue
        if isinstance(v, dict) and (max_depth == -1 or current_depth < max_depth):
            converted[camel_key] = recursive_dict_keys_snake_to_camel(
                v, max_depth, current_depth + 1, preserve_nested_keys
            )
        elif isinstance(v, list) and (max_depth == -1 or current_depth < max_depth):
            converted[camel_key] = [
                recursive_dict_keys_snake_to_camel(
                    i, max_depth, current_depth + 1, preserve_nested_keys
                )
                if isinstance(i, dict)
                else i
                for i in v
            ]
        else:
            converted[camel_key] = v
    return converted


def _get_all_items(api_call: Callable, *args, **kwargs):
    """Helper function to get all items from a paginated API call."""
    list_len = api_call(limit=1, *args, **kwargs).total
    if "limit" not in kwargs:
        kwargs["limit"] = int(np.min([50, list_len]))  ## max allowed is 50

    retrieved = 0
    items = []
    while retrieved < list_len:
        response = api_call(offset=retrieved, *args, **kwargs)
        response_items = response.items or []
        if len(response_items) == 0:
            break
        retrieved += len(response_items)  # type: ignore
        items += [
            recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response_items
        ]

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
    response = api_call(offset=list_len - N, limit=max(1, N), **kwargs)
    items = [recursive_dict_keys_camel_to_snake(i.to_dict(), max_depth=1) for i in response.items]
    assert len(items) == N, f"Expected {N} items, but got {len(items)}"
    return items


T = TypeVar("T")


@overload
def sanitize_varnames(input_data: str) -> str: ...


@overload
def sanitize_varnames(input_data: list[str]) -> list[str]: ...


@overload
def sanitize_varnames(input_data: dict[str, T]) -> dict[str, T]: ...


@overload
def sanitize_varnames(input_data: pd.DataFrame) -> pd.DataFrame: ...


def sanitize_varnames(input_data):
    """
    Sanitize variable names by replacing spaces and non-alphanumeric characters with underscores.
    This function handles different input types:
    - str: sanitizes a single variable name
    - list/iterable: sanitizes each item in the list
    - dict: sanitizes the keys of the dictionary
    - pd.DataFrame: sanitizes the column names

    Args:
        input_data: The data to sanitize (string, list, dict, or DataFrame)

    Returns:
        Sanitized version of the input data (same type as input)
    """

    # Helper function for sanitizing a single string
    def _sanitize_single(varname: str) -> str:
        # Replace spaces with underscores and then replace any remaining non-alphanumeric chars (except _*-+/)
        return re.sub(r"[^0-9a-zA-Z_*-+/]", "_", varname.replace(" ", "_"))

    # Handle different input types
    if isinstance(input_data, str):
        return _sanitize_single(input_data)
    elif isinstance(input_data, pd.DataFrame):
        df = input_data.copy()  # Create a copy to avoid modifying the original DataFrame
        df.columns = [_sanitize_single(col) for col in df.columns]
        return df
    elif isinstance(input_data, dict):
        # Recursively handle dictionaries
        result = {}
        for k, v in input_data.items():
            sanitized_key = _sanitize_single(k)
            if isinstance(v, dict):
                result[sanitized_key] = sanitize_varnames(v)
            else:
                result[sanitized_key] = v
        return result
    elif hasattr(input_data, "__iter__") and not isinstance(input_data, (str, bytes)):
        return [_sanitize_single(v) for v in input_data]
    else:
        raise TypeError(f"Unsupported input type: {type(input_data)}")


# Aliases for backward compatibility
sanitize_varname = sanitize_varnames  # For single string input
sanitize_varnames_dict = sanitize_varnames  # For dictionary input
sanitize_varnames_df = sanitize_varnames  # For DataFrame input
