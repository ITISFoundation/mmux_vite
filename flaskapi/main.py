from mmux_flaskapi.app import create_flask_app
from mmux_flaskapi.utils.logger import configure_logging

# Central logging init (flaskapi/SPEC.md V50tl): LOG_LEVEL-aware, stdout-first,
# effective under gunicorn AND flask run. No stray files (B59tl).
logger = configure_logging()
logger.info("Flask API started!")

app = create_flask_app()
