# CI, branch protection and dependency policy

Single source of truth for what actually gates a merge, what is informational,
and who owns dependency updates. Kept separate from the workflows themselves
per issue [#627](https://github.com/ITISFoundation/mmux_vite/issues/627)
(EPIC #624). Root SPEC invariants: `V34lt` (lockfiles are tool-generated),
`V44qf` (npm lockfile validation), `V47dp` (lockfile freshness + action pinning).

## Branch roles

| Branch | Role | Flow |
| --- | --- | --- |
| `main` | Production releases | `develop → main` via a release PR; the auto-tag bot strips `.devN` and publishes `vX.Y.Z` + GitHub release |
| `develop` | Day-to-day work, review gate | feature branch → PR → review → merge queue; the auto-tag bot stamps `vX.Y.Z.devN` prereleases |

## Branch protection — live state (verified 2026-10-17)

A single **`Protected Branches` ruleset** (id `5597677`, `gh api
repos/ITISFoundation/mmux_vite/rulesets/5597677`) applies to `~DEFAULT_BRANCH`
(`main`) and `refs/heads/develop`:

- PR required, **1 approving review**, review threads resolved, extra approval
  for unattributed (agent-authored) changes; squash/merge/rebase allowed.
- **Merge queue** enabled (`MERGE`, ALLGREEN grouping, max 2 builds / 5 merges).
- Deletion, creation and non-fast-forward pushes blocked.
- Bypass: repository **Admin** role only (`bypass_mode: always`) — this is the
  identity behind the `AUTOTAG_PUSH_TOKEN` secret used by `auto-tag.yml`.
- `required_status_checks`: **6 checks enforced on both branches** (applied 2026-10-17 via the
  `gh api` PUT below, verified live). When #627 was audited the list was still EMPTY — merge
  gating rested on the merge queue + social convention, not on CI being required — exactly
  the gap #627 called out.

### Required status checks (enforced on `main` + `develop` since 2026-10-17)

Merge-blocking (the full suite — mirrors "CI green before merge", SPEC §C), as shown in PR checks:

| Check name (as shown in PR checks) | Source |
| --- | --- |
| `prek` | `ci.yml` job `prek` (includes the lockfile freshness gate) |
| `node-tests` | `ci.yml` job `node-tests` (vitest thresholds = coverage ratchet) |
| `flaskapi-tests` | `ci.yml` job `flaskapi-tests` (regular + analytical tiers) |
| `e2e-tests` | `ci.yml` job `e2e-tests` (pixel baselines — the ci.yml "gates merge via branch protection" comment is now literally true) |
| `verify-image-build` | `ci.yml` job `verify-image-build` |
| `version` | `version-check.yml` job `version` ("Check release version") |

Applied 2026-10-17; kept for reproduction on forks or drift recovery (keeps all other rules intact):

```bash
gh api repos/ITISFoundation/mmux_vite/rulesets/5597677 |
  jq '{name, enforcement, conditions, rules, bypass_actors}
      | (.rules[] | select(.type == "required_status_checks")
         | .parameters.required_status_checks) =
        [{"context":"prek"},{"context":"node-tests"},{"context":"flaskapi-tests"},
         {"context":"e2e-tests"},{"context":"verify-image-build"},{"context":"version"}]' |
  gh api -X PUT repos/ITISFoundation/mmux_vite/rulesets/5597677 --input -
```

Keep `strict_required_status_checks_policy: false` — the merge queue already
re-verifies merges against a fresh base, so per-PR up-to-date-branch enforcement
would only cost extra CI cycles.

### Informational (deliberately NOT required)

| Report | Where | Why informational |
| --- | --- | --- |
| Codecov statuses | commit statuses, project + patch | `codecov.yml` sets `informational: true` for both; uploads run with `fail_ci_if_error: false`. Becomes a gate only per #633 ratchet stage once a stage is adopted (vitest/pytest thresholds already fail the job itself) |
| `CodSpeed Performance Report` | commit status from `codspeed.yml` | benchmarks need stable baselines before regression-gating; `workflow_dispatch` kept for backfill |
| Codecov/CodSpeed PR comments | PR conversation | commentary only |

## Lockfile validation (accept: "CI detects stale lockfiles before merge")

Both lockfiles are **tool-generated only** (`V34lt`, regression B20lt); a
merge-conflict-marker or parse failure in either is caught by
`flaskapi/tests/test_lockfiles_valid.py` in the `flaskapi-tests` job.

Freshness (manifest ↔ lock agreement) is enforced at install time:

| Ecosystem | Gate | Mechanism |
| --- | --- | --- |
| npm (`node/package-lock.json`) | every CI job installing node deps | `npm ci` hard-fails when `package.json` and the lockfile disagree (`V44qf`) |
| uv (`flaskapi/uv.lock`) | every CI job installing python deps (`prek`, `flaskapi-tests`, `e2e-tests`, `codspeed.yml`) | `make install-flaskapi-deps-locked` → `uv sync --locked`: asserts the lock matches `pyproject.toml`, then installs strictly from it. A stale lock **fails the job**; bare `uv sync` would silently re-lock and is banned in CI (`V47dp`) |

Regenerate the right way when a manifest changes: `cd flaskapi && uv lock`,
`cd node && npm install`. Then `uv lock --check` (or `npm ci` locally) mirrors
the CI gate.

## Action & image pinning (accept: "explicit and reproducible")

- Third-party actions are pinned to a **full commit SHA** with the resolved
  version as a trailing comment, e.g.
  `uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`.
  The `github-actions` Dependabot ecosystem (below) updates SHA **and** comment
  together — pins never rot.
- Current pins: `actions/checkout@…# v7.0.1`, `actions/setup-node@…# v7.1.0`,
  `actions/upload-artifact@…# v7.0.2`, `codecov/codecov-action@…# v7.1.1`,
  `astral-sh/setup-uv@…# v10.3.0`, `CodSpeedHQ/action@…# v5.5.0`.
- Container images: `itisfoundation/ci-service-integration-library` (ooil) and
  `mcr.microsoft.com/playwright` stay on **version tags, not digests** — the
  Playwright tag is the human-visible lock-step contract with
  `@playwright/test` (`V12`); digest-pinning it would hide exactly the drift
  the lock-step rule exists to catch. Dockerfile base images are
  Dependabot-managed instead.

## Dependabot (config: `.github/dependabot.yml`)

Six ecosystems (npm `/node`, uv `/flaskapi`, github-actions `/`, docker
`/flaskapi` `/node` `/proxy`), weekly Monday 03:00 CET, grouped per ecosystem,
all targeting `develop`.

**Ownership:** every bump PR is **assigned to @JavierGOrdonnez** (dependency
owner / triager). Merging follows the normal `develop` ruleset: CI green +
1 approval (+ queue). Ignored majors (`@mui/*`, `eslint`, `typescript`) are
deliberate peer-cap blocks documented inline in the config — adopting them is
a standalone PR with its own review, never a queue-bump.

## Failure artifacts (accept: "reports remain available for debugging")

| Artifact | Job | Condition | Retention |
| --- | --- | --- | --- |
| `playwright-report` (HTML report + `test-results` screenshots) | `e2e-tests` | `always()` | 14 d |
| `flaskapi-test-reports` (`htmlcov/`, `coverage-{regular,analytical}.xml`, combined `coverage.xml`, raw `.coverage.*`) | `flaskapi-tests` | `always()` | 14 d |
| `node-coverage-reports` (`node/coverage` incl. `cobertura-coverage.xml`) | `node-tests` | `always()` | 14 d |

Coverage history lives on Codecov (flags `node`, `flaskapi`, `e2e`); benchmark
history on the CodSpeed dashboard. Vitest/pytest thresholds make coverage
regressions *fail the job* — the Codecov status on top is the informational
overlay until a #633 stage promotes it.
