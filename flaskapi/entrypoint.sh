#!/bin/bash
set -e

# Default configuration
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-5000}
DEBUG_MODE=${DEBUG_MODE:-false}

FLASK_ARGS=("--host=$HOST" "--port=$PORT")

# Add debug flags if debug mode is enabled
if [ "$DEBUG_MODE" = "true" ]; then
  FLASK_ARGS+=("--debug" "--debugger")
else
  FLASK_ARGS+=("--no-reload")
fi

echo "Starting Flask with arguments: ${FLASK_ARGS[@]}"
exec python -m flask run "${FLASK_ARGS[@]}"
