"""Shared endpoint error surface (V48jd).

Single owner of the HTTP error contract for every ``/flask/*`` route:
``{"error": <str>}`` JSON with ErrorResponse as the canonical shape — never
Werkzeug's HTML page, because the frontend renders error text verbatim (V44eh).

The decorator map is the V11 contract: KeyError→400, ValueError→422,
OsparcApiException→its own status, anything else→500. Routes keep their
explicit branches where a pinned status deviates from this map; the decorator
catches everything they let through, and `register_json_error_handlers` covers
errors raised outside any view (404/405/unhandled).
"""

import json
import logging
from collections.abc import Callable
from functools import wraps
from pathlib import Path
from typing import Any

from flask import Flask, Response, jsonify, make_response
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import HTTPException

from ..blueprints.sampling_models import ErrorResponse
from .json_serializer import RequestParsingError
from .webserver_config import OsparcApiException

_logger = logging.getLogger(__name__)


def api_endpoint(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator for API endpoints to handle errors, logging, and return proper HTTP status codes.
    Propagates downstream OsparcApiException errors with their status code and message.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = getattr(func, "__name__", str(func))
        _logger.debug(f"Starting flask function: {func_name}")
        _logger.debug(f"Cwd: {Path.cwd()}")
        try:
            result = func(*args, **kwargs)
            # If the endpoint returns a tuple (data, status), use it directly
            if isinstance(result, tuple) and len(result) == 2:
                data, status = result
                if isinstance(data, Response):
                    # Already-serialized responses (jsonify + explicit status) pass through.
                    return make_response(data, status)
                return make_response(jsonify(data), status)
            # Responses pass through; dicts/lists serialize (V48jd-safe either way)
            return make_response(result)
        except KeyError as e:
            _logger.error(f"Missing required parameter: {e}")
            return make_response(jsonify({"error": f"Missing required parameter: {e}"}), 400)
        except ValueError as e:
            _logger.error(f"Invalid value: {e}")
            return make_response(jsonify({"error": str(e)}), 422)
        except OsparcApiException as e:
            # Propagate downstream API error with its status code and message
            status_code = getattr(e, "status", getattr(e, "status_code", 500))
            error_msg = getattr(e, "body", str(e))
            _logger.error(f"Downstream API error: {status_code} - {error_msg}")
            return make_response(jsonify({"error": error_msg}), status_code)
        except HTTPException:
            # abort() with an explicit JSON response (e.g. dakota's
            # handle_workflow_error) keeps its status and payload.
            raise
        except RequestParsingError:
            # Dedicated app handler owns status + details (400 today); ⊥ re-map.
            raise
        except Exception as e:
            status = getattr(e, "status_code", None)
            if isinstance(status, int):
                # Status-carrying exceptions keep their status (JSON either way).
                _logger.error(f"Handled error ({status}): {e}")
                return make_response(jsonify({"error": str(e)}), status)
            _logger.error(f"Internal server error: {e}")
            return make_response(jsonify({"error": str(e)}), 500)

    return wrapper


def register_json_error_handlers(app: Flask) -> None:
    """JSON-ify errors raised outside any view: HTTP status errors and unhandled exceptions (V48jd)."""

    @app.errorhandler(HTTPException)
    def _http_exception(error: HTTPException) -> ResponseReturnValue:
        if error.response is not None:
            # abort(response) carries its own JSON body; do not re-wrap it.
            return error.response
        # error.get_response() (not a fresh jsonify response) carries the headers the
        # status REQUIRES: 405 Allow, 429 Retry-After, ... Only the body is swapped
        # for the {"error": <str>} JSON contract (V48jd).
        response = error.get_response()
        payload = ErrorResponse(
            error=f"{error.code} {error.name}: {error.description}"
        ).model_dump()
        response.set_data(json.dumps(payload))
        response.headers["Content-Type"] = "application/json"
        return response

    @app.errorhandler(Exception)
    def _unhandled(error: Exception) -> ResponseReturnValue:
        _logger.error(f"Unhandled exception: {error}")
        return jsonify(ErrorResponse(error=str(error)).model_dump()), 500
