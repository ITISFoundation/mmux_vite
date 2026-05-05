# Frontend UI Guardrails For Agents

This note captures recurring pitfalls from the late-April 2026 work on `mmux_vite`
around CSV upload, parameter-card state, and log-scale metadata.

The goal is simple: preserve the current UI contract while extending behavior.
Most breakage came from state-shape drift or metadata-flow drift, not from the
idea of the feature itself.

## Core Invariants

- CSV upload must update the function list, default selection, parameter bounds,
  and inferred tags from one coherent flow.
- Per-variable metadata shown in the UI must be threaded through shared state and
  request payloads all the way to the backend workflow that consumes it.
- Frontend-facing request and response contracts should stay additive unless both
  ends are intentionally changed together and validated together.
- The selected function must remain valid after upload and before any downstream
  action that depends on parameter-card state.

## Anti-Patterns That Break The UI

### 1. Narrow literal typing for mutable state

Do not let test fixtures or context defaults infer a shape that is narrower than
the real runtime state.

Examples of breakage seen in practice:

- `selectedFunction` inferred as always-present from an initial literal, then
  later set to `undefined` in setup code.
- `distribution` inferred with fixed keys from a small sample object, then later
  reassigned with a different variable set.

This does not just break tests. It hides legitimate state transitions and makes
future UI work look unsafe when the real issue is the type declaration.

### 2. Component-local metadata that never reaches the backend

Do not add a new toggle to a parameter card if it only changes local rendering.

If the feature is semantically meaningful, it must flow through:

- parameter-card UI
- shared context/state
- request payload construction
- backend preprocessing and workflow handlers

The late-April log-scale work made this explicit: a UI toggle alone is not enough
if the surrogate model must train in log space.

### 3. Splitting one CSV parse into several disconnected updates

Do not treat these as independent follow-up steps:

- add uploaded function
- select the new function
- pre-populate parameter min/max values
- infer log-relevant tags from the sampled distribution

When these drift apart, the UI looks inconsistent even if each individual step
works in isolation.

### 4. Contract cleanup mixed into feature delivery

Do not rename or reshape payload fields opportunistically while landing a UI
feature unless the entire integration is being migrated together.

The safer pattern is: preserve the existing contract, add the minimum new field
or metadata channel, and leave broader cleanup for a separate refactor.

## Safe Patterns

### 1. Reuse the existing metadata channel pattern

If a feature behaves like existing per-variable metadata, mirror the existing
plumbing instead of inventing a side channel.

For example, log-scale metadata should follow the same end-to-end model as the
existing maximize/minimize-style variable metadata.

### 2. Use one source of truth for upload-derived UI state

CSV import should produce a single authoritative result that drives:

- the function entry
- the default selection
- the parameter-card bounds
- the inferred distribution/log tags

If multiple components need the data, fan it out from one parsed result rather
than re-deriving pieces independently.

### 3. Widen state types where the UI legitimately changes shape

Use explicit unions or other intentional widening in shared state and test
fixtures whenever the UI can move through multiple valid shapes.

That is safer than letting TypeScript infer a narrow literal type from the first
assignment and then fighting those in tests later.

### 4. Keep frontend and backend changes parallel

Any new per-variable semantic flag should be checked in both places before merge:

- frontend state + serialization
- backend request parsing + preprocessing + workflow use

The implementation is only complete when both halves agree on the meaning.

### 5. Make persistence writes idempotent at the boundary

If multiple contexts rebuild equivalent persistence payloads, the persistence
layer must no-op semantically identical snapshots.

The safer pattern is:

- keep a stable ref to the latest committed persistence object
- compare the next serialized payload to the current one before calling any
  state setter or POST write
- treat identical snapshots as a no-op, not as a fresh save

Without this guard, otherwise-harmless context effects can turn into React
render loops or persistence churn.

### 6. Dedupe expensive plot requests by logical request key

For Dakota-backed plot views, React object identity is not a safe trigger.

If the fetch depends on axes, slider values, selected QoI, selected function,
job list, or log-scale settings, build a stable request key from those logical
inputs and skip the fetch when the key has not changed.

This is especially important in:

- 1D curves
- 2D surface plots
- 3D isosurface plots

The contract should be: same logical plot state, at most one request.

### 7. Guard state-setting effects with equality checks

When an effect initializes or synchronizes local UI state from context data,
do not call a setter unless the next value is actually different.

This applies to:

- axis defaults derived from filtered variable lists
- slider maps derived from distributions
- setup cards derived from selected function metadata

Without the equality guard, object recreation alone can retrigger effects and
fan out into duplicate Dakota requests or repeated persistence writes.

## Minimal Validation Checklist

Before merging UI work in this area, verify all of the following:

- `npm ci` has been run in `node/` before final validation or handing the feature back to the human user.
- Uploading a CSV adds the expected function.
- The uploaded function becomes the selected function by default.
- Parameter cards are pre-populated with the min/max values derived from the CSV.
- Log-relevant distributions are surfaced as tags or metadata in the UI.
- The request payload carries the same metadata the UI is showing.
- Backend workflows consume that metadata consistently.
- `npm run build` passes.
- The relevant Vitest coverage passes.
- Expensive Dakota-backed plots do not issue duplicate requests when the user
  has not changed axes, sliders, or QoI.
- The E2E flow covers upload, default selection, parameter pre-population, and
  inferred log tagging.

## Working Rule

When extending this UI, prefer additive behavior over cleanup, and prefer shared
state coherence over isolated local fixes.

If a change cannot be explained as preserving the four-step upload invariant and
the end-to-end metadata invariant, it probably needs another pass.
