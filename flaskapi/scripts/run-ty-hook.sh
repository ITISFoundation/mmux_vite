#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
flaskapi_dir="${MMUX_FLASKAPI_DIR:-$repo_root/flaskapi}"

cd "$flaskapi_dir"

# ty type-checks the whole src/ tree (not incrementally per changed file) since
# cross-module inference can surface errors outside the changed files. `uv run`
# syncs the environment as needed, so no separate venv presence check is required.
exec uv run ty check src/mmux_flaskapi
