from flask import Flask
from mmux_flaskapi.blueprints.deployment import deployment_bp
from mmux_flaskapi.blueprints.osparc import osparc_bp
from mmux_flaskapi.utils.webserver_config import OsparcApi
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
    app.config['APPLICATION_ROOT'] = '/flask'
    app.register_blueprint(deployment_bp)
    app.register_blueprint(osparc_bp)
    app.register_blueprint(textfile_bp)  
    app.register_blueprint(sampling_bp)
    app.register_blueprint(dakota_bp)
    return app
