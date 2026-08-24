#!/usr/bin/env bash
# SPEC V31vr: every docker-compose-development.yml service bind-mounting live
# source (./flaskapi:/app, ./node:/app) must pin `user:` to the host UID/GID.
# Without it, the container runs as root, and anything it writes into the
# bind mount (.venv, runs_local/*.json, __pycache__, node_modules) lands on
# the host owned by uid 0 -- permanently undeletable without sudo (B18kt).
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/docker-compose-development.yml"

fail=0
for service in mmux-vite-backend mmux-vite-web; do
  if ! awk -v svc="$service:" '
    $0 == "  " svc { in_service = 1; next }
    in_service && /^  [A-Za-z]/ { in_service = 0 }
    in_service && /^    user:/ { found = 1 }
    END { exit !found }
  ' "$compose_file"; then
    echo "check-compose-users: service '$service' in docker-compose-development.yml has no 'user:' override (SPEC V31vr) -- it will run as root and pollute the host bind mount with root-owned files" >&2
    fail=1
  fi
done

exit "$fail"
