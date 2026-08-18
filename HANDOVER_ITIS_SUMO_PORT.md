# Handover: port mmux-vite's Dakota blueprint to `itis_sumo.api`

**Read this before touching `flaskapi/src/mmux_flaskapi/blueprints/dakota.py`.**
This documents an in-progress, multi-session port. One route is done and
committed; seven remain. The pattern is mechanical and repeats per route.

## Goal

`itis-sumo` (sibling repo, `../itis-sumo`) now exposes a stable public
`itis_sumo.api` surface that owns all surrogate machinery end-to-end —
preprocessing, Dakota config, run dirs, inverse transforms (SPEC V16qf in
`itis-sumo/SPEC.md`). mmux-vite's Flask blueprint currently vendors its own
duplicate of that machinery in `flaskapi/src/mmux_flaskapi/dakota/` +
`data_preprocessor/`. The goal is to replace each Flask route's internals
with a call into `itis_sumo.api`, keeping the HTTP request/response schema
byte-for-byte identical, so the frontend needs zero changes.

Only when **all 8 routes** are ported should the vendored
`flaskapi/src/mmux_flaskapi/dakota/` and `data_preprocessor/` modules be
deleted (do not delete early — some helpers, e.g. `create_run_dir`,
`_jobs_to_df`, `JobVariableSelection`, are still load-bearing for routes not
yet ported, and even after the last route some may still be used by
`_jobs_to_df`/request validation, which stays in mmux-vite).

## State right now

- Branch: `feat/consume-itis-sumo-api` in `mmux_vite`, based off `develop`
  @ `ec87e6c`. Not pushed.
- `itis-sumo` is wired in as a **local editable path dependency**
  (`flaskapi/pyproject.toml` → `[tool.uv.sources]` →
  `itis-sumo = { path = "../../itis-sumo", editable = true }`), because it
  is not yet published to any index (current version
  `0.1.1.dev37+g<hash>`, built off `feat/contract-api-spine` in that repo —
  make sure that branch/repo checkout has the `itis_sumo.api` surface you
  need before running `uv sync` here; if `itis-sumo`'s branch changes,
  `flaskapi/` picks it up automatically on the next run since it's editable).
- Commit `4027a10` (this branch): ported `/sumo_cross_validation` →
  `itis_sumo.api.cross_validate`. This is the reference commit — read its
  diff first (`git show 4027a10`) before doing another route; every
  remaining route follows the exact same shape.
- Full test status on this branch: `138 passed, 2 skipped` in
  `tests/test_flask_dakota_workflows.py`. The `test_flask_osparc_endpoints.py`
  failures (9 of them) are **pre-existing on `develop`**, unrelated to this
  port (verified via `git stash`) — ignore them.

## The recipe (repeat per route)

1. Read the Flask route in `dakota.py` end to end. Identify:
   - which `itis_sumo.api` workflow function matches it (table below),
   - what request fields map to that function's parameters,
   - what response shape the route currently returns (json keys, suffixes).
2. Build the `samples: pd.DataFrame` the same way the cross-validation route
   does: reuse `_jobs_to_df(jobs, input_vars, output_vars)` (already handles
   the "≥5 completed jobs" / missing-variable validation via
   `JobVariableSelection` — do not reinvent this).
3. Convert any Pydantic distribution/domain params to the shapes
   `itis_sumo.api` expects (see "Type mapping gotchas" below — field names
   differ).
4. Call the matching `itis_sumo.api` function. Keep `workspace=run_dir`
   (from `create_run_dir(DAKOTA_RUNS_DIR, "<name>")`) so working files are
   still inspectable on disk exactly like before — do not drop this, it's
   the only debugging aid once the vendored code is gone.
5. Rebuild the exact same response dict from the typed result's fields —
   do **not** change JSON key names, suffixes, or nesting. The camelCase
   (de)serialization middleware (`utils/json_serializer.py`) handles
   snake_case → camelCase automatically; keep building snake_case keys as
   the route did before.
6. Map exceptions: `SumoInputError` → same status code the old `ValueError`
   path used (almost always 400); leave `ValidationError` (422) and bare
   `Exception` (500) handling as-is. Import `SumoInputError` from
   `itis_sumo.api` (already imported in `dakota.py` after commit `4027a10`).
7. Update tests in `tests/test_flask_dakota_workflows.py`:
   - Black-box "success" tests (posting a payload, checking response shape)
     should need **no changes** — they test behavior, not internals.
   - White-box tests that `monkeypatch.setattr("mmux_flaskapi.blueprints.
     dakota.<old_internal_function>", ...)` **will break** (`AttributeError`,
     since the import is gone). Grep for the old function name across the
     whole test file first (`grep -n "<old_function_name>"
     tests/test_flask_dakota_workflows.py`) — there are usually 3-4 hits,
     not just the "obvious" test. Rewrite each to monkeypatch the new
     `itis_sumo.api` import alias instead (see commit `4027a10`'s test diff
     for the exact pattern: mock returns a real itis-sumo result dataclass,
     e.g. `CrossValidationResult(...)`, not a raw dict).
8. Validate, in order:
   ```
   cd flaskapi
   uvx ruff check --fix src/mmux_flaskapi/blueprints/dakota.py tests/test_flask_dakota_workflows.py
   uvx ruff format src/mmux_flaskapi/blueprints/dakota.py tests/test_flask_dakota_workflows.py
   uv run ty check src/mmux_flaskapi/blueprints/dakota.py
   uv run pytest tests/test_flask_dakota_workflows.py -q
   ```
   Expect **138 passed, 2 skipped** minimum (grows as new route-specific
   tests get added, if any). If a NEW failure appears outside the route you
   touched, stop and investigate before continuing — don't paper over it.
9. Commit that one route alone (small, revertable, bisectable). Follow the
   commit message shape of `4027a10`: what was replaced, what stayed the
   same (schema/status codes unchanged), which tests were updated and why.

## Route → `itis_sumo.api` mapping table

| Flask route | old internal call | `itis_sumo.api` function | notes |
|---|---|---|---|
| `/sumo_cross_validation` | `evaluate_sumo_manual_crossvalidation` | `cross_validate` | **DONE** (`4027a10`) |
| `/manual_uq_propagation_with_uncertainty` | manual erfinv loop + `evaluate_sumo` (inline in the route) | `evaluate_uncertainty` | Result fields (`bins_start`, `bins_end`, `bin_means`, `bin_stds`, `q1/median/q3`, `whisker_min/max`, `outliers`, `mean/std/min/max`) match `UQWithUncertaintyResponse` field-for-field already — this route should shrink the most. |
| `/compute_correlation_indices` | `compute_correlation_indices` (data/funs_data_processing) + `evaluate_sumo` | `compute_correlations` | Response result is `CorrelationResult.coefficients: dict[str, dict[str,float]]` — matches `CorrelationIndicesResponse.correlations` directly. |
| `/compute_sobol_indices` | `evaluate_sobol_indices` | `evaluate_sobol` | Response needs `{"sobol": result.indices, "sobol_second_order": result.second_order}`. Note V36 in the route's docstring: Sobol' uses a fixed sample count, NOT `validated_request.num_samples` — confirm `evaluate_sobol`'s own default matches or pass through if it takes one. |
| `/sumo_along_axes` | `evaluate_sumo_along_axes` | `evaluate_along_axes` | Response is nested per-variable (`{var: {x, y_hat, std_hat?}}`) — `AlongAxesResult.sweeps: dict[str, AxisSweep]` where `AxisSweep` has `variable, x, predicted, predicted_std`. Rename `predicted`→`y_hat`, `predicted_std`→`std_hat` when building the response dict. Also handle `slider_values` (fixed values for non-swept vars) — check whether `evaluate_along_axes` accepts a `fixed_values`-shaped kwarg; if not, this is a possible facade gap to raise with itis-sumo, not paper over. |
| `/sumo_grid_evaluation` | `evaluate_sumo_on_grid` | `evaluate_grid` | Response can be nested 2D lists for 2-variable grids — `GridResult.data: dict[str, list[float] \| list[list[float]]]` already matches this shape. Also has `slider_values`/fixed-value handling like along-axes above. |
| `/get_sumo_cv_accuracy_metrics` | `evaluate_sumo_crossvalidation` (NOT the manual one — this is the Dakota-native surrogate-quality-metrics path) | `evaluate_cv_metrics` | `CVAccuracyMetrics` dataclass fields (`root_mean_squared, sum_abs, mean_abs, max_abs`) map onto the existing `CVAccuracyMetrics` **Pydantic** response model in `dakota_models.py` — confirm field names line up 1:1 (they should, itis-sumo's dataclass was ported from this same route). This route also has a "no metrics found" degenerate-string fallback (`"No surrogate quality metrics found."`) — check whether `evaluate_cv_metrics` raises `SumoResultError` in that case instead, and decide how to preserve the fallback string behavior (likely: catch `SumoResultError` and substitute the fallback string, matching old behavior). |
| `/perform_moga_optimization` | `perform_moga_optimization` (funs_evaluate) | `optimize` (module-level function in `itis_sumo.api`, not a session method — see "Type mapping gotchas") | Biggest one. `output_var_selection: dict[str, "minimize"\|"maximize"]` maps directly to `optimize`'s `objectives: Mapping[str, Direction]` param. `input_distributions` here are actually **domains** (uniform-only, min/max), not real distributions — convert to `DomainSpec(minimum=..., maximum=...)`, not `DistributionSpec`. Response is `MOGAOptimizationResponse.optimization_results: dict[str, list[float]]` — matches `ParetoFrontResult.data` directly. |

## Type mapping gotchas

- **`min`/`max` vs `minimum`/`maximum`**: mmux-vite's `DistributionParams`
  Pydantic model (in `dakota_models.py`) uses `min`/`max`/`mean`/`std`/
  `distribution`. `itis_sumo.api.DistributionSpec` uses `minimum`/`maximum`
  (not `min`/`max`). You must build a new `DistributionSpec(...)` per
  variable, field-renaming as you go — do not `model_dump()` and pass the
  dict straight through, it won't match.
- **Domain vs Distribution**: MOGA's `input_distributions` in the Flask
  request are always uniform-only (search bounds), never real uncertainty.
  Use `itis_sumo.api.DomainSpec(minimum, maximum)` for MOGA, and
  `DistributionSpec` only for the UQ/Sobol/correlation routes where the
  distribution can be `"normal"` too. This split is deliberate — see SPEC
  T27fr in `itis-sumo/SPEC.md` and the `_bounds_from_distributions` helper
  in `dakota.py` (which already treats these two cases differently for the
  same reason).
- **`optimize` is not a session method.** Unlike every other
  `itis_sumo.api` function, `optimize()` doesn't go through
  `SumoSession(...).fit().X()` — it's a standalone function because MOGA is
  multi-objective and `SumoSession` is single-response by design. Call it
  directly: `optimize(samples, variables, objectives, domains=..., max_evaluations=..., workspace=...)`.
- **Seeds**: `itis_sumo.api.DEFAULT_SEED == 42`, matching every hardcoded
  `random_state=42` / `np.random.seed(42)` in the old mmux-vite code. Don't
  pass an explicit seed unless the Flask request actually carries one
  (several routes do, e.g. UQ/Sobol/correlations have a `seed` request
  field — pass it through explicitly in those cases).

## Known-good validation commands (run from `flaskapi/`)

```bash
uv sync                                                   # after any pyproject.toml change
uvx ruff check --fix <changed files>
uvx ruff format <changed files>
uv run ty check src/mmux_flaskapi/blueprints/dakota.py
uv run pytest tests/test_flask_dakota_workflows.py -q     # expect 138 passed, 2 skipped (grows over time)
uv run pytest tests/ -q                                   # full suite; ignore the 9 pre-existing osparc failures
```

## After all 8 routes are ported

- Delete `flaskapi/src/mmux_flaskapi/dakota/` (except whatever `_jobs_to_df`
  / `JobVariableSelection` / `create_run_dir` still need — check first,
  those may live in `dakota_models.py` / `utils/helpers.py`, not the
  `dakota/` subpackage, so they likely survive untouched).
- Delete `flaskapi/src/mmux_flaskapi/data_preprocessor/` if nothing else
  references it.
- Remove `itis-dakota` as a **direct** mmux-vite dependency if it becomes
  unused (it will still be pulled in transitively via `itis-sumo`).
- Re-run the full test suite + a manual smoke test against the real
  frontend before considering the cutover complete.
- Only then does the itis-sumo-side task "Remove FunctionJob after cutover"
  become actionable — `FunctionJob`/`JobVariableSelection` currently live in
  `itis-sumo/src/itis_sumo/preprocess/models.py` as a leftover from the
  original port and are meant to be deleted once mmux-vite no longer needs
  the job-list shape anywhere (check whether `_jobs_to_df` still needs them
  on the mmux-vite side even after this port — if so, they may need to stay
  in mmux-vite itself rather than itis-sumo, since itis-sumo's public API no
  longer speaks in "jobs" at all, only "samples").
