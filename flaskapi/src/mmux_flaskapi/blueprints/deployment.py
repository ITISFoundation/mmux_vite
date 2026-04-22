from flask import Blueprint, jsonify
import os
import logging

_logger = logging.getLogger(__name__)

deployment_bp = Blueprint('deployment', __name__)

@deployment_bp.route('/health')
def health_check():
    """Used by docker to check the health of the Flask app."""
    return jsonify({'status': 'healthy'}), 200

@deployment_bp.route('/service-mode')
def service_mode():
    """Used to check the environment variable SERVICE_MODE."""
    try:
        service_mode = os.environ["SERVICE_MODE"]
        _logger.info(f"Service mode: {service_mode}")
        return jsonify({'service_mode': service_mode}), 200
    except KeyError:
        _logger.error("SERVICE_MODE environment variable is not set.")
        return jsonify({'error': 'SERVICE_MODE not set'}), 500

@deployment_bp.route('/permissions')
def permissions():
    """Used to check the environment variable PERMISSIONS."""
    try:
        permissions = os.environ["PERMISSIONS"]
        _logger.info(f"Permissions: {permissions}")
        return jsonify({'permissions': permissions}), 200
    except KeyError:
        _logger.error("PERMISSIONS environment variable is not set.")
        return jsonify({'error': 'PERMISSIONS not set'}), 500

@deployment_bp.route('/mode')
def deployment_mode():
    """Used to check the environment variable DEPLOYMENT_MODE."""
    try:
        deployment_mode = os.environ["DEPLOYMENT_MODE"]
        _logger.info(f"Deployment mode: {deployment_mode}")
        return jsonify({'deployment_mode': deployment_mode}), 200
    except KeyError:
        _logger.error("DEPLOYMENT_MODE environment variable is not set.")
        return jsonify({'error': 'DEPLOYMENT_MODE not set'}), 500
