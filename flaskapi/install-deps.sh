#!/bin/bash
# Single source-of-truth for installing Flask API dependencies
# will also be run upon local testing - to ensure the same dependencies are installed

set -euo pipefail

# Resolve to the flaskapi directory regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
cd "$PROJECT_DIR"

# Install Python packages directly with system Python
echo "Installing dependencies..."
uv pip install --system -r ./requirements.txt  \
                        -r ./requirements-test.txt \
                        -r ./mmux_python/requirements.txt
uv pip install --system --prerelease=allow osparc==0.8.3.post0.dev30
echo "Dependencies installed successfully."
