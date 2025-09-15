from flask import Flask
from mmux_flaskapi.blueprints.deployment import deployment_bp
from mmux_flaskapi.blueprints.osparc import osparc_bp, osparc_api, OsparcApi

class MMUXFlask(Flask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.osparc_api: OsparcApi

def create_flask_app() -> MMUXFlask:
    app = MMUXFlask("MMUX Flask API")
    app.register_blueprint(deployment_bp)
    app.register_blueprint(osparc_bp)
    app.osparc_api = osparc_api
    return app
