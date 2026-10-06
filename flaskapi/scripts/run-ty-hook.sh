#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
flaskapi_dir="${MMUX_FLASKAPI_DIR:-$repo_root/flaskapi}"

cd "$flaskapi_dir"

# ty type-checks the whole src/ tree (not incrementally per changed file) since
# cross-module inference can surface errors outside the changed files. `uv run`
# syncs the environment as needed -- but --frozen: the auto-version bot stamps
# pyproject with PEP440 dev versions that uv would mirror into uv.lock, and the
# image build requires the lock's semver form. Never let the hook rewrite the lock.
exec uv run --frozen ty check src/mmux_flaskapi
