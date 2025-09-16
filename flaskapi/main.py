import logging
from mmux_flaskapi.utils.app import create_flask_app

# Configure logging for the module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Flask API started!")

app = create_flask_app()
