#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
node_dir="${MMUX_NODE_DIR:-$repo_root/node}"

if [[ ! -d "$node_dir/node_modules" ]]; then
  echo "node/node_modules is missing. Run 'cd node && npm install' first." >&2
  exit 1
fi

cd "$node_dir"

# react-hooks/set-state-in-effect (new in eslint-plugin-react-hooks v7's
# recommended preset) is downgraded to "warn" in eslint.config.js pending an
# incremental refactor (SPEC.md T28); ~30 pre-existing occurrences across the
# codebase. Budget below is a ratchet: lets the known warnings through while
# still failing the hook if new warnings creep in. Lower this number as T28
# fixes land; it must never be raised without a corresponding SPEC.md note.
max_warnings=30

if [[ "$#" -eq 0 ]]; then
  exec npx eslint src/ --fix --max-warnings="$max_warnings" --no-warn-ignored
fi

files=()
for file in "$@"; do
  if [[ "$file" == node/* ]]; then
    files+=("${file#node/}")
  else
    files+=("$file")
  fi
done

exec npx eslint --fix --max-warnings="$max_warnings" --no-warn-ignored "${files[@]}"
