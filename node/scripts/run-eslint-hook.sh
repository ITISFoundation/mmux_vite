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
# recommended preset) is downgraded to "warn" in eslint.config.js pending the
# incremental refactor tracked as node/SPEC.md §T28. Budget below is a ratchet
# pinned to the §T28 tracked baseline: measured count 31 @ 2026-09-29, ceiling
# intentionally set to 50 (deliberate headroom for in-flight work — PR #647
# author decision, recorded in §T28), so the hook still fails if warnings creep
# past 50. Lower this number as §T28 fixes land; it must never be raised beyond
# the §T28 tracked ceiling without updating that note in node/SPEC.md.
max_warnings=50

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
