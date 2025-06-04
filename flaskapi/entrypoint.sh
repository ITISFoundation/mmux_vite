#!/bin/bash
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'
INFO="INFO: [$(basename "$0")] "

# BOOTING application ---------------------------------------------
echo "$INFO" "Starting container ..."
echo "$INFO" "  User    :$(id "$(whoami)")"
echo "$INFO" "  Workdir :$(pwd)"


# Default configuration
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-5000}
DEVELOPMENT_MODE=${DEVELOPMENT_MODE:-false}
export LOG_LEVEL=${LOG_LEVEL:-INFO}


if [ "$DEVELOPMENT_MODE" = "true" ]; then
  # Development mode - use Flask's built-in server

  # copy library to application directory
  cp -R /mmux_python /app/mmux_python

  export FLASK_APP=flask_workflows.py
  export FLASK_DEBUG=1
  FLASK_ARGS=("--host=$HOST" "--port=$PORT" "--debug" "--debugger" "--reload")
  
  echo "$INFO" "Starting Flask development server with arguments: ${FLASK_ARGS[@]}"
  exec python -m flask run "${FLASK_ARGS[@]}"
else
  # Production mode - use gunicorn
  echo "$INFO" "Starting gunicorn production server on $HOST:$PORT"
  exec gunicorn --bind "$HOST:$PORT" \
    --workers=1 \
    --worker-class=gevent \
    --timeout=120 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=INFO \
    "flask_workflows:app"
fi
