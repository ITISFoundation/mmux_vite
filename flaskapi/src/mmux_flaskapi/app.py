from flask import Flask
from mmux_flaskapi.helpers import is_test_environment


def create_flask_app() -> Flask:
    app = Flask("MMUX Flask API")

    if is_test_environment():
        # _logger.info("Running in test environment")
        # _logger.info("Flag status before: " + str(app.config["TESTING"]))
        app.config["TESTING"] = True
        # _logger.info("Flag status after: " + str(app.config["TESTING"]))

    return app
