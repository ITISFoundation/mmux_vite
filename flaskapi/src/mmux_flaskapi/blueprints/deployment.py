import logging
import os

from flask import Blueprint, jsonify

from mmux_flaskapi.blueprints.sampling_models import ErrorResponse
from mmux_flaskapi.utils.api_endpoint import api_endpoint

_logger = logging.getLogger(__name__)

deployment_bp = Blueprint("deployment", __name__)


# SPEC.md §V4 (fork issue #80): these three env vars are enums, not free text.
# Presence-only checking let `SERVICE_MODE=FOO` pass with 200, so a typo'd
# service definition or a misconfigured compose env silently produced an app
# that served a mode no view implements. Out-of-range → the same JSON error
# path as "not set" (KeyError → api_endpoint surface → 500), in every caller
# of these getters (deployment endpoints AND sampling's DEPLOYMENT_MODE read).
_VALID_ENV_VALUES: dict[str, frozenset[str]] = {
    "SERVICE_MODE": frozenset({"UQ", "SUMO", "MOGA"}),
    "PERMISSIONS": frozenset({"READ-ONLY", "WRITE"}),
    "DEPLOYMENT_MODE": frozenset({"LOCAL", "OSPARC"}),
}


def _get_required_env_var(name: str) -> str:
    try:
        value = os.environ[name]
        _logger.info("%s: %s", name, value)
    except KeyError as exc:
        _logger.error("%s environment variable is not set.", name)
        raise KeyError(f"{name} not set") from exc
    allowed = _VALID_ENV_VALUES.get(name)
    if allowed is not None and value not in allowed:
        _logger.error("%s: %r is not one of %s", name, value, sorted(allowed))
        raise KeyError(f"{name} '{value}' is not one of {sorted(allowed)}")
    return value


def get_service_mode_value() -> str:
    return _get_required_env_var("SERVICE_MODE")


def get_permissions_value() -> str:
    return _get_required_env_var("PERMISSIONS")


def get_deployment_mode_value() -> str:
    return _get_required_env_var("DEPLOYMENT_MODE")


@deployment_bp.route("/health")
@api_endpoint
def health_check():
    """Used by docker to check the health of the Flask app."""
    return jsonify({"status": "healthy"}), 200


@deployment_bp.route("/service-mode")
@api_endpoint
def service_mode():
    """Used to check the environment variable SERVICE_MODE."""
    try:
        return jsonify({"service_mode": get_service_mode_value()}), 200
    except KeyError as exc:
        return jsonify(ErrorResponse(error=str(exc.args[0])).model_dump()), 500


@deployment_bp.route("/permissions")
@api_endpoint
def permissions():
    """Used to check the environment variable PERMISSIONS."""
    try:
        return jsonify({"permissions": get_permissions_value()}), 200
    except KeyError as exc:
        return jsonify(ErrorResponse(error=str(exc.args[0])).model_dump()), 500


@deployment_bp.route("/mode")
@api_endpoint
def deployment_mode():
    """Used to check the environment variable DEPLOYMENT_MODE."""
    try:
        return jsonify({"deployment_mode": get_deployment_mode_value()}), 200
    except KeyError as exc:
        return jsonify(ErrorResponse(error=str(exc.args[0])).model_dump()), 500
