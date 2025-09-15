from flask import Flask
from mmux_flaskapi.helpers import is_test_environment
from mmux_flaskapi.blueprints.deployment import deployment_bp



def create_flask_app() -> Flask:
    app = Flask("MMUX Flask API")
    app.register_blueprint(deployment_bp)


    if is_test_environment():
        # _logger.info("Running in test environment")
        # _logger.info("Flag status before: " + str(app.config["TESTING"]))
        app.config["TESTING"] = True
        # _logger.info("Flag status after: " + str(app.config["TESTING"]))

    return app
