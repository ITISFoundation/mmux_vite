"""
Preserve-case wrappers for variable-name strings and mappings.

Variable names coming from oSPARC functions are user-defined identifiers
(e.g. ``angleWidth``, ``peak_Averaged_Field``). They must survive the
camelCase ↔ snake_case round-trip performed by the JSON serializer
without being mutated.

This module provides:

- ``PreserveCaseTransform`` — Pydantic metadata marker; presence in a
  field's metadata list signals that the value is a variable name and
  must not be case-converted.
- ``FunctionVariablesDict`` / ``FunctionVariableStr`` — thin subclass
  wrappers recognised by the recursive helpers in ``utils/helpers.py``
  to skip key-transformation.
- ``FunctionVariablesMapping`` / ``FunctionVariable`` — ``Annotated``
  aliases for use directly in Pydantic field annotations.
- ``has_preserve_case_metadata`` — predicate used by
  ``utils/json_serializer.py`` to decide at annotation-inspection time
  whether a field carries the preserve-case marker.
"""

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
    """Preserve variable-name mapping keys by wrapping the dictionary.

    Parameters
    ----------
    value : dict[str, T]
        The raw mapping to wrap.

    Returns
    -------
    FunctionVariablesDict
        Wrapped mapping; a no-op if already wrapped.
    """
    if isinstance(value, FunctionVariablesDict):
        return value
    return FunctionVariablesDict(value)


def wrap_function_variable_str(value: str) -> FunctionVariableStr:
    """Preserve standalone variable names by wrapping the string.

    Parameters
    ----------
    value : str
        The raw variable name to wrap.

    Returns
    -------
    FunctionVariableStr
        Wrapped string; a no-op if already wrapped.
    """
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


# Backward-compatible aliases.
CaseSensitiveMapping = FunctionVariablesMapping
wrap_native_dict_keys = wrap_function_variables_dict


def has_preserve_case_metadata(metadata: list[Any]) -> bool:
    """Return ``True`` if any item in *metadata* is a :class:`PreserveCaseTransform`.

    Parameters
    ----------
    metadata : list[Any]
        Pydantic field metadata list (from ``FieldInfo.metadata``).

    Returns
    -------
    bool
        ``True`` when the field carries the preserve-case marker.
    """
    return any(isinstance(item, PreserveCaseTransform) for item in metadata)
