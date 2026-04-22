"""
JSON serialization utilities for converting between snake_case (Python)
and camelCase (TypeScript).

This module provides Flask integration for automatic case conversion on both
incoming requests and outgoing responses, ensuring consistent data format
exchange between backend and frontend.
"""

import json
import logging
from typing import Any

from flask import Flask, request
from werkzeug.wrappers import Response

from mmux_flaskapi.utils.helpers import (
    recursive_dict_keys_camel_to_snake,
    recursive_dict_keys_snake_to_camel,
)

_logger = logging.getLogger(__name__)


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


def register_json_transformers(app: Flask) -> None:
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
                    json_data = request.get_json()
                    converted_data = to_snake_case_request(json_data)
                    # Store converted data so we can use it in the view
                    request.json_data_snake_case = converted_data
                    _logger.debug("Converted request data from camelCase to snake_case")
                except Exception as e:
                    _logger.warning(f"Failed to convert request data: {e}")
                    # Continue with original data if conversion fails

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
