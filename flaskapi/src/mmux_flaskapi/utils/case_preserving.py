from __future__ import annotations

from typing import Annotated, Any, TypeVar

from pydantic import AfterValidator

T = TypeVar("T")


class FunctionVariablesDict(dict):
    """Dictionary wrapper for variable-keyed mappings that must keep their original case."""


class FunctionVariableStr(str):
    """String wrapper for standalone variable names that must keep their original case."""


class PreserveCaseTransform:
    """Marker used by request normalization to keep variable names untouched."""


def wrap_function_variables_dict(value: dict[str, T]) -> FunctionVariablesDict:
    """Preserve variable-name mapping keys by wrapping the dictionary."""
    if isinstance(value, FunctionVariablesDict):
        return value
    return FunctionVariablesDict(value)


def wrap_function_variable_str(value: str) -> FunctionVariableStr:
    """Preserve standalone variable names by wrapping the string."""
    if isinstance(value, FunctionVariableStr):
        return value
    return FunctionVariableStr(value)


FunctionVariablesMapping = Annotated[
    dict[str, T],
    PreserveCaseTransform(),
    AfterValidator(wrap_function_variables_dict),
]

FunctionVariable = Annotated[
    str,
    PreserveCaseTransform(),
    AfterValidator(wrap_function_variable_str),
]


# Backward-compatible aliases for intermediate rename work.
CaseSensitiveMapping = FunctionVariablesMapping
wrap_native_dict_keys = wrap_function_variables_dict


def has_preserve_case_metadata(metadata: list[Any]) -> bool:
    return any(isinstance(item, PreserveCaseTransform) for item in metadata)
