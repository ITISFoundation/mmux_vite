"""
JSON serialization utilities for converting between snake_case (Python)
and camelCase (TypeScript).

This module provides Flask integration for automatic case conversion on both
incoming requests and outgoing responses, ensuring consistent data format
exchange between backend and frontend.
"""

import json
import logging
from typing import Any, TypeVar

from flask import Flask, jsonify, request
from pydantic import BaseModel, ValidationError
from werkzeug.exceptions import BadRequest
from werkzeug.wrappers import Response

from mmux_flaskapi.utils.helpers import (
    recursive_dict_keys_camel_to_snake,
    recursive_dict_keys_snake_to_camel,
)

_logger = logging.getLogger(__name__)
RequestModelT = TypeVar("RequestModelT", bound=BaseModel)


def _with_invalid_request_prefix(message: str) -> str:
    if message.startswith("Invalid request data:"):
        return message
    return f"Invalid request data: {message}"


class RequestParsingError(Exception):
    """Error raised when a request cannot be parsed or validated."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        details: list[str] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or []


def _format_validation_error(exc: ValidationError) -> tuple[str, list[str]]:
    details = []
    for error in exc.errors():
        location = " -> ".join(str(item) for item in error["loc"]) if error["loc"] else "root"
        details.append(f"{location}: {error['msg']}")
    return f"Validation failed: {', '.join(details)}", details


def parse_request_model(model_class: type[RequestModelT]) -> RequestModelT:
    """Parse request JSON, normalize it to snake_case, and validate it."""
    try:
        request_json = get_request()
    except ValueError as exc:
        raise RequestParsingError(
            _with_invalid_request_prefix(str(exc)),
            status_code=400,
        ) from exc

    if request_json is None:
        raise RequestParsingError(
            _with_invalid_request_prefix("Invalid JSON or missing content-type header"),
            status_code=400,
        )

    try:
        return model_class.model_validate(request_json)
    except ValidationError as exc:
        message, details = _format_validation_error(exc)
        raise RequestParsingError(
            _with_invalid_request_prefix(message),
            status_code=400,
            details=details,
        ) from exc


def get_request(*, silent: bool = False) -> Any:
    """
    Return request JSON. Imposes snake_case keys.

    The converted payload is cached on the Flask request object so every
    endpoint in the request lifecycle reads the same normalized structure.
    """

    try:
        json_data = request.get_json(silent=silent)
    except BadRequest as exc:
        if silent:
            return None
        raise ValueError("Invalid JSON or malformed request") from exc

    if json_data is None:
        return None

    converted_data = to_snake_case_request(json_data)
    return converted_data


def to_camel_case_response(data: Any) -> Any:
    """
    Convert a Python object (dict/list) to camelCase for JSON serialization.

    Args:
        data: Object to convert (dict, list, or primitive)

    Returns:
        Object with all dictionary keys converted from snake_case to camelCase
    """
    if isinstance(data, dict):
        return recursive_dict_keys_snake_to_camel(data)
    if isinstance(data, list):
        return [to_camel_case_response(item) for item in data]
    return data


def to_snake_case_request(data: Any) -> Any:
    """
    Convert incoming JSON data (dict/list) from camelCase to snake_case.

    Args:
        data: Object to convert (dict, list, or primitive)

    Returns:
        Object with all dictionary keys converted from camelCase to snake_case
    """
    if isinstance(data, dict):
        return recursive_dict_keys_camel_to_snake(data)
    if isinstance(data, list):
        return [to_snake_case_request(item) for item in data]
    return data


def register_json_transformers(app: Flask, *, convert_responses: bool = True) -> None:
    """
    Register before_request and after_request hooks for automatic JSON case conversion.

    - before_request: Converts incoming JSON from camelCase to snake_case
    - after_request: Converts outgoing JSON from snake_case to camelCase

    This ensures:
    - Python code always works with snake_case (idiomatic)
    - JavaScript code always receives camelCase (idiomatic)
    - Automatic conversion happens transparently for all endpoints

    Args:
        app: Flask application instance
    """

    @app.before_request
    def convert_request_to_snake_case():
        """Convert incoming JSON request body from camelCase to snake_case."""
        if request.method in ("POST", "PUT", "PATCH"):
            if request.is_json:
                try:
                    if get_request(silent=True) is not None:
                        _logger.debug("Converted request data from camelCase to snake_case")
                except Exception as e:
                    _logger.warning(f"Failed to convert request data: {e}")
                    # Continue with original data if conversion fails

    @app.errorhandler(RequestParsingError)
    def handle_request_parsing_error(error: RequestParsingError):
        payload: dict[str, Any] = {"error": error.message}
        if error.details:
            payload["details"] = error.details
        return jsonify(payload), error.status_code

    if convert_responses:

        @app.after_request
        def convert_response_to_camel_case(response: Response) -> Response:
            """Convert outgoing JSON response from snake_case to camelCase."""
            # Only process JSON responses
            if response.content_type and "application/json" in response.content_type:
                try:
                    # Parse the response JSON
                    json_data = json.loads(response.get_data(as_text=True))
                    # Convert to camelCase
                    converted_data = to_camel_case_response(json_data)
                    # Update response with converted data
                    response.data = json.dumps(converted_data)
                    response.headers["Content-Length"] = len(response.data)
                except Exception as e:
                    _logger.warning(f"Failed to convert response data: {e}")
                    # Continue with original response if conversion fails

            return response
