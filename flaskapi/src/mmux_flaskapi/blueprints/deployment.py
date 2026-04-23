from flask import Blueprint, jsonify
import os
import logging

_logger = logging.getLogger(__name__)

deployment_bp = Blueprint('deployment', __name__)


def _get_required_env_var(name: str) -> str:
    try:
        value = os.environ[name]
        _logger.info("%s: %s", name, value)
        return value
    except KeyError as exc:
        _logger.error("%s environment variable is not set.", name)
        raise KeyError(f"{name} not set") from exc


def get_service_mode_value() -> str:
    return _get_required_env_var("SERVICE_MODE")


def get_permissions_value() -> str:
    return _get_required_env_var("PERMISSIONS")


def get_deployment_mode_value() -> str:
    return _get_required_env_var("DEPLOYMENT_MODE")

@deployment_bp.route('/health')
def health_check():
    """Used by docker to check the health of the Flask app."""
    return jsonify({'status': 'healthy'}), 200

@deployment_bp.route('/service-mode')
def service_mode():
    """Used to check the environment variable SERVICE_MODE."""
    try:
        return jsonify({'service_mode': get_service_mode_value()}), 200
    except KeyError as exc:
        return jsonify({'error': exc.args[0]}), 500

@deployment_bp.route('/permissions')
def permissions():
    """Used to check the environment variable PERMISSIONS."""
    try:
        return jsonify({'permissions': get_permissions_value()}), 200
    except KeyError as exc:
        return jsonify({'error': exc.args[0]}), 500

@deployment_bp.route('/mode')
def deployment_mode():
    """Used to check the environment variable DEPLOYMENT_MODE."""
    try:
        return jsonify({'deployment_mode': get_deployment_mode_value()}), 200
    except KeyError as exc:
        return jsonify({'error': exc.args[0]}), 500
