#!/usr/bin/env bash
# Boots the Flask backend for the read-only e2e suite (SuMo/UQ/MOGA) with the in-backend
# oSPARC test-double (MMUX_E2E_MOCK_OSPARC) and the e2e deployment env. Launched by
# Playwright's webServer (node/playwright.config.ts). See root SPEC.md §T10 / §V11.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT/flaskapi"

# Inject the in-backend test-double and pin the e2e deployment mode.
export MMUX_E2E_MOCK_OSPARC=1
export OSPARC_API_BASE_URL="${OSPARC_API_BASE_URL:-https://test.example.io}"  # backstop: never real oSPARC
export SERVICE_MODE="${SERVICE_MODE:-SUMO}"
export PERMISSIONS="${PERMISSIONS:-READ-ONLY}"
export DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-LOCAL}"

# Local, writable text-file storage (the container default /text-files is not writable here).
export TEXT_FILES_DIR="${TEXT_FILES_DIR:-$REPO_ROOT/tests/e2e/.e2e-text-files}"
mkdir -p "$TEXT_FILES_DIR"

# Make the deterministic test-double package importable (tests/e2e/mock_osparc/).
export PYTHONPATH="$REPO_ROOT/tests/e2e${PYTHONPATH:+:$PYTHONPATH}"

export FLASK_APP=main.py
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"

echo "[run-e2e-backend] booting Flask on ${HOST}:${PORT} (mock oSPARC, ${SERVICE_MODE}/${PERMISSIONS})"
exec uv run python -m flask run --host="$HOST" --port="$PORT"
