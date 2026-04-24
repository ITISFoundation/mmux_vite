#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
node_dir="${MMUX_NODE_DIR:-$repo_root/node}"

if [[ ! -d "$node_dir/node_modules" ]]; then
  echo "node/node_modules is missing. Run 'cd node && npm install' first." >&2
  exit 1
fi

cd "$node_dir"

if [[ "$#" -eq 0 ]]; then
  exec npx eslint src/ --fix --max-warnings=0
fi

files=()
for file in "$@"; do
  if [[ "$file" == node/* ]]; then
    files+=("${file#node/}")
  else
    files+=("$file")
  fi
done

exec npx eslint --fix --max-warnings=0 "${files[@]}"
