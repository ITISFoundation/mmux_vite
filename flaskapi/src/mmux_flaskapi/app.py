from flask import Flask
from mmux_flaskapi.blueprints.deployment import deployment_bp
from mmux_flaskapi.blueprints.osparc import osparc_bp
from mmux_flaskapi.utils.webserver_config import OsparcApi
from mmux_flaskapi.utils.json_serializer import register_json_transformers
from mmux_flaskapi.blueprints.textfile import textfile_bp
from mmux_flaskapi.blueprints.sampling import sampling_bp
from mmux_flaskapi.blueprints.dakota import dakota_bp

class MMUXFlask(Flask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.osparc_api: OsparcApi

def create_flask_app() -> MMUXFlask:
    app = MMUXFlask("MMUX Flask API")
    app.osparc_api = OsparcApi()
    register_json_transformers(app, convert_responses=True)
    app.register_blueprint(deployment_bp, url_prefix="/flask/deployment")
    app.register_blueprint(osparc_bp, url_prefix="/flask/osparc")
    app.register_blueprint(textfile_bp, url_prefix="/flask/text-file")
    app.register_blueprint(sampling_bp, url_prefix="/flask/sampling")
    app.register_blueprint(dakota_bp, url_prefix="/flask/dakota")
    return app
