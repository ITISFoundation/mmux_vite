#!/bin/bash
# Single source-of-truth for installing Flask API dependencies
# Uses uv with system Python to mirror Docker environment

set -euo pipefail

# Resolve to the flaskapi directory regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
cd "$PROJECT_DIR"

# Ensure uv is available; install if missing
if ! command -v uv >/dev/null 2>&1; then
  echo "uv not found. Installing uv..."
  
  # Check
  if ! command -v uv >/dev/null 2>&1; then
    echo "Failed to install uv or add it to PATH." >&2
    exit 1
  fi
  
  echo "uv installed successfully at: $(which uv)"
fi

echo "Installing dependencies via uv..."
uv venv --python 3.11
uv pip install --prerelease=allow osparc==0.8.3.post0.dev30
uv pip install -r ./requirements.txt  \
                        -r ./requirements-test.txt \
                        -r ./mmux_python/requirements.txt

echo "Dependencies installed successfully."
