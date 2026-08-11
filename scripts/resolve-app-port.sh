#!/usr/bin/env bash
# Prints the current published mmux-vite-app port for this Compose project when
# it already exists; otherwise prints the first free TCP port from <base_port>.
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

compose_file="${1:-docker-compose-development.yml}"
base_port="${2:-8888}"
service="${3:-mmux-vite-app}"
target_port="${4:-8888}"

published="$({ docker compose --file "$compose_file" port "$service" "$target_port" || true; } 2>/dev/null | tail -n 1)"
if [[ -n "$published" ]]; then
  published="${published##*:}"
  if [[ "$published" =~ ^[0-9]+$ ]]; then
    echo "$published"
    exit 0
  fi
fi

bash "$script_dir/find-free-port.sh" "$base_port"
