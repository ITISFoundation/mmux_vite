from datetime import datetime
from pathlib import Path
import logging
import os


# # Create logs directory - use environment variable or default to user's home
# ### TODO put it back if flaskapi directory but w the right user permissions
# log_path = os.environ.get("MMUX_LOG_PATH", str(Path.home() / "mmux_logs" / "flask_workflows.log"))
# log_file = Path(log_path)
log_file = Path(__file__).parent / "logs" / f"flask_workflows_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
log_file.parent.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "DEBUG"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

# Make Flask propagate its logs to the root logger
flask_logger = logging.getLogger("flask")
flask_logger.propagate = True

# Same for Werkzeug (Flask's underlying WSGI library)
werkzeug_logger = logging.getLogger("werkzeug")
werkzeug_logger.propagate = True


#############################################################

