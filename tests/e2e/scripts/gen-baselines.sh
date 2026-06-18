#!/usr/bin/env bash
# Runs the SuMo read-only Playwright e2e suite INSIDE the pinned Playwright
# docker image (root SPEC §T12 / §V12). Defaults to regenerating the pixel
# baselines; set E2E_MAKE_TARGET=test-e2e to instead verify the committed
# baselines (the same pixel diff CI enforces). Run via:
#
#   docker run --rm --user root --network host \
#     -v "$PWD":/work -w /work -e HOME=/root \
#     mcr.microsoft.com/playwright:v1.61.0-noble \
#     bash /work/tests/e2e/scripts/gen-baselines.sh
#
# Python venv, text-file storage and Dakota runs are redirected to /tmp so the
# host dev tree stays clean; generated files are chowned back to uid/gid 1000.
set -euo pipefail
trap 'chown -R 1000:1000 /work/tests /work/node 2>/dev/null || true' EXIT

E2E_MAKE_TARGET="${E2E_MAKE_TARGET:-test-e2e-update}"

apt-get update -qq
apt-get install -y -qq --no-install-recommends make python3-pip >/dev/null

# uv drives the Flask backend (uv sync / uv run). Install without piping a remote
# script into a shell.
python3 -m pip install --break-system-packages --quiet uv
export PATH="${HOME}/.local/bin:${PATH}"

export UV_PROJECT_ENVIRONMENT=/tmp/flaskapi-venv
export TEXT_FILES_DIR=/tmp/e2e-text-files
export DAKOTA_RUNS_DIR=/tmp/dakota_runs
uv python install 3.11

echo "=== installing flaskapi deps (uv sync) ==="
make install-flaskapi-deps

echo "=== node $(node --version) ; running make ${E2E_MAKE_TARGET} ==="
make "${E2E_MAKE_TARGET}"
