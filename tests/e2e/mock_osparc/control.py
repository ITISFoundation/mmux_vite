"""Test-only runtime control endpoint for the e2e suite.

The deployment blueprint reads ``SERVICE_MODE`` / ``PERMISSIONS`` /
``DEPLOYMENT_MODE`` from ``os.environ`` on every request (see
``blueprints/deployment.py``), and the frontend re-fetches the service mode on
each full page load (``ServiceContext`` mounts once per navigation). That lets a
single backend boot serve all three service modes (SUMO / UQ / MOGA): a spec
POSTs the desired mode here, then reloads the page.

This blueprint is registered by ``create_flask_app()`` only when
``MMUX_E2E_MOCK_OSPARC`` is set, so it never exists on the production path. See
root SPEC.md §T9 / §V11.
"""

from __future__ import annotations

import os

from flask import Blueprint, jsonify, request

e2e_control_bp = Blueprint("e2e_control", __name__)

_ALLOWED_SERVICE_MODES = {"SUMO", "UQ", "MOGA"}
_ALLOWED_PERMISSIONS = {"READ-ONLY", "WRITE"}


@e2e_control_bp.route("/deployment", methods=["POST"])
def set_deployment():
    """Override the deployment env vars at runtime for the next page load.

    Body (all optional): ``{"serviceMode": "UQ", "permissions": "READ-ONLY",
    "deploymentMode": "LOCAL"}``. Unknown/invalid values are rejected so a typo
    in a spec fails loudly instead of silently falling through to a wrong mode.
    """
    payload = request.get_json(silent=True) or {}

    service_mode = payload.get("serviceMode")
    if service_mode is not None:
        if service_mode not in _ALLOWED_SERVICE_MODES:
            return jsonify({"error": f"invalid serviceMode: {service_mode}"}), 400
        os.environ["SERVICE_MODE"] = service_mode

    permissions = payload.get("permissions")
    if permissions is not None:
        if permissions not in _ALLOWED_PERMISSIONS:
            return jsonify({"error": f"invalid permissions: {permissions}"}), 400
        os.environ["PERMISSIONS"] = permissions

    deployment_mode = payload.get("deploymentMode")
    if deployment_mode is not None:
        os.environ["DEPLOYMENT_MODE"] = deployment_mode

    return (
        jsonify(
            {
                "serviceMode": os.environ.get("SERVICE_MODE"),
                "permissions": os.environ.get("PERMISSIONS"),
                "deploymentMode": os.environ.get("DEPLOYMENT_MODE"),
            }
        ),
        200,
    )
