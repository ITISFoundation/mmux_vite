#!/usr/bin/env bash
# Single-lane runner for the split e2e CI (root SPEC §T47sl + §V48sl; job wiring in
# .github/workflows/ci.yml). Runs ONE file-grouped lane subset of tests/e2e/
# through the SAME playwright.config.ts as `make test-e2e` (own webServer boot,
# own coverage globalSetup/teardown), so pixel lanes stay §V12-identical.
#
# Usage (from repo root or via `make test-e2e-lane LANE=<lane>`):
#   LANE=uq-moga|sumo|behavior  npm run test:e2e:lane   (cwd node/, via npm)
#
# §V48sl: the lane packaging below is the CURRENT partition of an EVOLVING one —
# lanes partition WHOLE SPEC FILES (⊥ test-title grep: the a11y-fold PR moves axe
# tests INTO the flow spec files, and title lanes would silently retarget/drop on
# merge), and the set/count may be repacked between 2 and 4 lanes as the boot/test
# balance shifts. Repacking edits THIS file + ci.yml + a §T ledger row — ⊥ §V edit,
# but re-sync the branch-protection required checks to the new lane names.
# a11y.spec.ts while it exists standalone (axe only, no pixel baselines) rides
# the `behavior` lane — by design, see the ci.yml job comment.
#
# The GUARD runs on EVERY lane: it asserts (pixel-capturing files + behavior
# files) == total spec files and that every pixel-capturing file EXISTS, so no
# spec can silently drop out of all lanes when a file is renamed/split.
set -euo pipefail

LANE="${LANE:-${1:-}}"
case "$LANE" in
  uq-moga|sumo|behavior) ;;
  *) echo "[run-e2e-lane] usage: LANE=uq-moga|sumo|behavior $0" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"   # tests/e2e

# PIXEL-CAPTURING lanes (§V12-critical): lanes whose specs compare against
# committed baselines under __snapshots__ — uq-readonly, moga-readonly and
# sumo-readonly capture today; sobol-highdim joins uq-moga as the engine-heavy
# analysis-plot FLOW (NO committed baseline yet — the capture arrives with the
# sibling a11y-fold PR, ⊥ adding it here); it rides this lane for boot/test
# balance, and once captured inherits the lane's §V12 guarantees. Keep in sync
# with the ci.yml lane comment.
LANE_UQ_MOGA=(uq-readonly.spec.ts moga-readonly.spec.ts sobol-highdim.spec.ts)
LANE_SUMO=(sumo-readonly.spec.ts sumo-write.spec.ts)
PIXEL_CAPTURING=("${LANE_UQ_MOGA[@]}" "${LANE_SUMO[@]}")

# --- GUARD (root SPEC §V48sl): every listed pixel-capturing file exists and the
# lane files partition tests/e2e/*.spec.ts: (pixel count + behavior count) ==
# total. A file listed twice (or in two lanes) inflates the pixel side and trips it.
mapfile -t ALL_SPECS < <(cd "$E2E_DIR" && printf '%s\n' *.spec.ts)
for f in "${PIXEL_CAPTURING[@]}"; do
  [ -f "$E2E_DIR/$f" ] || {
    echo "[run-e2e-lane] GUARD FAIL: pixel-capturing-lane spec '$f' not found in $E2E_DIR" >&2
    exit 1
  }
done
BEHAVIOR=()
for f in "${ALL_SPECS[@]}"; do
  in_pixel=0
  for p in "${PIXEL_CAPTURING[@]}"; do
    [ "$f" = "$p" ] && { in_pixel=1; break; }
  done
  [ "$in_pixel" -eq 0 ] && BEHAVIOR+=("$f")
done
if [ $(( ${#PIXEL_CAPTURING[@]} + ${#BEHAVIOR[@]} )) -ne ${#ALL_SPECS[@]} ]; then
  echo "[run-e2e-lane] GUARD FAIL: lane files (${#PIXEL_CAPTURING[@]} pixel + ${#BEHAVIOR[@]} behavior)" \
    "!= total spec files (${#ALL_SPECS[@]}) — a spec dropped out of or doubled across lanes" >&2
  exit 1
fi
# --- GUARD end

case "$LANE" in
  uq-moga) FILES=("${LANE_UQ_MOGA[@]}") ;;
  sumo)    FILES=("${LANE_SUMO[@]}") ;;
  behavior) FILES=("${BEHAVIOR[@]}") ;;
esac
[ ${#FILES[@]} -gt 0 ] || { echo "[run-e2e-lane] GUARD FAIL: lane '$LANE' selected 0 files" >&2; exit 1; }

echo "[run-e2e-lane] lane=$LANE (${#FILES[@]}/${#ALL_SPECS[@]} spec files): ${FILES[*]}"

# Invoked through `npm run test:e2e:lane` (cwd node/): the playwright CLI and
# NODE_PATH come from npm's environment, and playwright resolves its config
# from cwd — identical stack to `npm run test:e2e`, just file-filtered.
exec playwright test "${FILES[@]}"
