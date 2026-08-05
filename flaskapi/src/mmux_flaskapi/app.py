import os

from flask import Flask

from mmux_flaskapi.blueprints.dakota import dakota_bp
from mmux_flaskapi.blueprints.deployment import deployment_bp
from mmux_flaskapi.blueprints.osparc import osparc_bp
from mmux_flaskapi.blueprints.sampling import sampling_bp
from mmux_flaskapi.blueprints.textfile import textfile_bp
from mmux_flaskapi.utils.json_serializer import register_json_transformers
from mmux_flaskapi.utils.webserver_config import OsparcApi


class MMUXFlask(Flask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.osparc_api: OsparcApi


def _build_osparc_api():
    """Return the oSPARC API instance backing this app.

    For the read-only SuMo e2e suite (`MMUX_E2E_MOCK_OSPARC` set) an in-backend
    deterministic test-double is injected instead of the real `OsparcApi`, so the
    backend never reaches real oSPARC. See root SPEC.md §T9 / §V11.
    """
    if os.environ.get("MMUX_E2E_MOCK_OSPARC"):
        # Lazy import; the package lives under tests/e2e/ (added to PYTHONPATH by
        # the e2e launcher) and must never be imported on the production path.
        from mock_osparc import build_mock_osparc_api  # ty: ignore[unresolved-import]

        return build_mock_osparc_api()
    return OsparcApi()


def create_flask_app() -> MMUXFlask:
    app = MMUXFlask("MMUX Flask API")
    app.osparc_api = _build_osparc_api()
    register_json_transformers(app, convert_responses=True)
    app.register_blueprint(deployment_bp, url_prefix="/flask/deployment")
    app.register_blueprint(osparc_bp, url_prefix="/flask/osparc")
    app.register_blueprint(textfile_bp, url_prefix="/flask/text-file")
    app.register_blueprint(sampling_bp, url_prefix="/flask/sampling")
    app.register_blueprint(dakota_bp, url_prefix="/flask/dakota")
    if os.environ.get("MMUX_E2E_MOCK_OSPARC"):
        # Test-only runtime control endpoint (lets a single backend boot serve
        # every service mode); never registered on the production path. §T9/§V11.
        from mock_osparc.control import e2e_control_bp  # ty: ignore[unresolved-import]

        app.register_blueprint(e2e_control_bp, url_prefix="/flask/e2e")
    return app
