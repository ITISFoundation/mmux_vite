# INVARIANTS â€” mmux_vite

<!-- Auto-injected into SPEC Â§C on every dispatch. Agents must not modify. -->
<!-- Source: Serena memories + ConvInt extracts 2026-04-20 to 2026-04-30 -->
<!-- To update: add rows to Fix-Regression History, never remove existing ones -->

## Coupling Invariants

- **[INV-001]** State shapes in test fixtures must be typed with explicit unions (not inferred
  from initial literals). TypeScript infers the narrowest type from the first assignment;
  later `undefined` or different-shape assignments will fail.
  Verified by: `cd node && npm run build` (tsc type-check, no separate script needed)

- **[INV-002]** Per-variable metadata (e.g. log-scale toggle) must flow end-to-end:
  parameter-card UI â†’ shared state/context â†’ request payload â†’ backend preprocessing â†’
  workflow handler. A UI-only toggle that never reaches the backend is not done.
  Verified by: manual trace of request payload in browser DevTools network tab

- **[INV-003]** CSV upload must produce one authoritative parsed result that drives all four
  downstream effects atomically: function entry added, function selected, parameter bounds
  pre-populated, distribution/log tags inferred. Partial updates leave UI inconsistent.
  Verified by: `npm run test` (Vitest) + manual upload flow

- **[INV-004]** Frontend and backend payload field contracts must be changed together and
  validated together. Opportunistic field renames during feature delivery cause silent
  mismatches. Verified by: `npm run build` + `cd flaskapi && uv run pytest`

- **[INV-005]** Effects that set state from context data must guard with equality checks
  before calling setters. Without guards, object recreation alone retriggers effects and
  fans out into duplicate Dakota requests or persistence writes.
  Verified by: React DevTools profiler (renders tab) during manual smoke test

- **[INV-006]** Expensive Dakota-backed plot requests (1D curves, 2D surfaces, 3D
  isosurfaces) must be deduplicated by a stable logical request key built from axes,
  slider values, selected QoI, selected function, job list, and log-scale settings.
  Same key â†’ no new fetch. Verified by: browser DevTools network tab during smoke test

## Regression Test Suite

```bash
# Unit + component tests
cd node && npm run test

# TypeScript type check
cd node && npm run build

# Backend tests
cd flaskapi && uv run pytest

# Full stack smoke test (requires both servers running)
# Terminal 1: cd flaskapi && uv run python -m flask --app src.mmux_flaskapi run --port 5000
# Terminal 2: cd node && npm run dev
# Then: open http://localhost:5173, upload a CSV, verify all four effects fire
```

## Fix-Regression History

| Date | Fixed | What it broke | Lesson |
|------|-------|---------------|--------|
| 2026-04-30 | TypeScript test for FunctionContext state | Tests failed with type mismatch on `persistenceState.values` | Initial literal infers narrow type; `as` casts needed at declaration. Applies to all mutable shared state. |
| 2026-04-28 | Log-scale variable toggle (UI only) | Backend trained in linear space despite UI showing log-scale | UI toggles must flow to request payload and backend handler â€” not just local rendering. |

## Constraints for Teammates

1. **Before adding any mutable shared state**: declare with an explicit union type, not inferred from initial value (INV-001).
2. **Before adding any per-variable UI feature**: trace the full path to backend handler before marking done (INV-002).
3. **Before merging CSV upload changes**: verify all four downstream effects fire atomically (INV-003).
4. **Before renaming any payload field**: confirm both frontend serialization and backend parser are updated in the same PR (INV-004).
5. **Before adding any useEffect or context-derived setter**: add an equality guard (INV-005).
6. **Before adding any Dakota plot fetch**: build a stable logical request key and deduplicate (INV-006).
