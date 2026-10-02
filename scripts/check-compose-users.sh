#!/usr/bin/env bash
# SPEC V31vr: every docker-compose-development.yml service bind-mounting live
# source (./flaskapi:/app, ./node:/app) must pin `user:` to the host UID/GID
# VALUE `"${HOST_UID:-1000}:${HOST_GID:-1000}"`. A bare `user:` PRESENCE check
# is vacuous — `user: root` or `user: "0:0"` passes it while reproducing the
# exact failure (B18kt: root-owned .venv/__pycache__/node_modules on the host);
# this recurrence class was recorded in B24kp and re-flagged by the
# GH-Copilot audit of #661.
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/docker-compose-development.yml"

expected='    user: "${HOST_UID:-1000}:${HOST_GID:-1000}"'

fail=0
for service in mmux-vite-backend mmux-vite-web; do
  rc=0
  awk -v svc="$service:" -v expected="$expected" '
    $0 == "  " svc { in_service = 1; next }
    in_service && /^  [A-Za-z]/ { in_service = 0 }
    in_service && /^    user:/ { found = 1; if ($0 == expected) exact = 1 }
    END { if (!found) exit 1; if (!exact) exit 2 }
  ' "$compose_file" || rc=$?
  case "$rc" in
    0) ;;
    1)
      echo "check-compose-users: service '$service' in docker-compose-development.yml has no 'user:' override (SPEC V31vr) -- it will run as root and pollute the host bind mount with root-owned files" >&2
      fail=1
      ;;
    2)
      echo "check-compose-users: service '$service' has a 'user:' override with the WRONG value (SPEC V31vr pins exactly: ${expected# }) -- any other value (e.g. root or 0:0) reproduces the root-owned-bind-mount failure" >&2
      fail=1
      ;;
    *) exit "$rc" ;;
  esac
done

exit "$fail"
