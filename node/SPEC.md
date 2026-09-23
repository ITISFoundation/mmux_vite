# SPEC — MMUX frontend (node/)

Caveman-encoded. Distilled from code 2026-05-28. Child of root spec.

## LINKS
- parent → [`../SPEC.md`](../SPEC.md) — orchestration, services, version
- sibling → [`../flaskapi/SPEC.md`](../flaskapi/SPEC.md) — backend `/flask/*` contract this layer consumes

## §G
Vite + React 19 + TS frontend: guided 2-step meta-modeling UX (Setup → Results). Renders one of {UQ|SuMo|MOGA} results view per backend `service-mode`. Drives oSPARC functions/jobs & Dakota studies through Flask backend under `/flask/*`.

## §C
- React `^19.0.0`, Vite `^6.3.1`, TS `^5.7.2` (strict), MUI `^7` + `@mui/x-data-grid ^8`, Plotly `plotly.js ^3` / `react-plotly.js ^2.6`, HTTP via `superagent ^10.2`
- Node ≥24, ESM (`"type":"module"`)
- dev server port 8080 `strictPort`, host `0.0.0.0`; dev proxy `"proxy":"http://localhost:5000"` → backend
- `src/osparc-api-ts-client/` generated (oSPARC API client) → ⊥ hand-edit, ∉ eslint
- global state in React contexts; persisted to backend via `/flask/text-file`
- lint = eslint airbnb+TS+prettier; format = prettier (`.prettierrc`: tabWidth 2, printWidth 130, double quotes, trailingComma "all", semi, arrowParens "avoid")
- style: functional components + hooks only; ⊥ `any`; props typed via TS (⊥ PropTypes); destructure props in signature
- naming: Components PascalCase | funcs/vars camelCase | util/hook files kebab|camel `.ts` | constants CONSTANT_CASE
- errors: console.warn/error dev feedback + react-toastify user-facing
--- structural conventions (alexpargon review on #456 + fix commit `0811bcb`) ---
- pure utility modules (⊥ JSX/React) live `utils/` ∀ consumer count (⊥ co-locate in `components/`); e.g. (see `0811bcb`) `sumoResponse.ts` belongs `utils/` not `components/plots/`
- shared helpers single-sourced + exported (⊥ duplicate identical defs across files); e.g. one `snakeToCamelCase` exported from `utils/functionUtils.ts`
- test fixtures/data → `__fixtures__/` (⊥ temp data files committed in `src/` tree or repo root, e.g. `tmp_job_collection_import.csv`)
- component internal order: theme → context hooks → derived values → state → ref → handlers → effects → layout/style obj literals → JSX return

## §I
parent: [`../SPEC.md`](../SPEC.md) ; backend contract: [`../flaskapi/SPEC.md`](../flaskapi/SPEC.md) §I
cmd: `npm run dev` → `vite` :8080
cmd: `npm run build` → `tsc -b && vite build`
cmd: `npm run build:e2e` → `npm run generate-osparc-cli && tsc -b && vite build` (Playwright webServer build; regenerates the committed client when missing)
cmd: `npm run lint` → `eslint .`
cmd: `npm test` → `npx vitest`
cmd: `npm run test:e2e` → `playwright test` (TS `@playwright/test`, testDir `../tests/e2e/`) — SuMo read-only pixel-snapshot e2e ; ⊥ vitest browser mode for e2e ; pairs root §T4/§T8-T12
cmd: `npm run preview` → `vite preview`
cmd: `npm run pretty` → `prettier --write`
entry: `src/index.tsx` → providers (Persistence,Navigation) → `App.tsx`
view: `Setup` → step0: pick oSPARC function, config input dists + output QoI/targets
view: `UQ`|`SuMo`|`MOGA` → step1 results, selected by `serviceMode` (`ReturnCurrentView.tsx`)
ctx: `NavigationContext` (currentView 0/1, steps) | `ServiceContext` (permissions, serviceMode) | `FunctionContext` (function+input/output vars+distributions+targets) | `SamplingContext` (LHS/grid/single configs) | `JobContext` (collections, selected jobs, status poll) | `MMUXContext` (selectedQoI, numSamples, isSuMoGenerated) | `MOGASettingsContext` / `MOGATableContext` | `PersistenceContext` (save/load state)
consumes: GET `/flask/deployment/health` | `/flask/deployment/permissions` | `/flask/deployment/service-mode`
consumes: GET `/flask/osparc/list_functions` | `/flask/osparc/list_jobs` | `/flask/osparc/list_function_jobs_for_functionid?functionUid=` | `/flask/osparc/list_function_job_collections_for_functionid?functionUid=` | `/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=`
consumes: POST `/flask/sampling/lhs` {funUid,config[],seed,n} | `/flask/sampling/grid` {funUid,config[]} | `/flask/sampling/test_job` {funUid,config[]} | `/flask/sampling/clone_job` {functionName,projectJobId,projectInputs}
consumes: POST `/flask/dakota/sumo_along_axes` (Curves1DPlot) | `/flask/dakota/sumo_grid_evaluation` (Surface2D,IsoSurface3D) | `/flask/dakota/sumo_cross_validation` (SuMoValidation) | `/flask/dakota/manual_uq_propagation_with_uncertainty` (UncertainUQ) | `/flask/dakota/perform_moga_optimization` (MOGAPareto)
consumes: POST `/flask/text-file` {filename,content} | GET `/flask/text-file/{filename}`
consumes: GET `/flask/osparc/download_job_collection_csv?JobCollectionUid=` & POST `/flask/sampling/upload_job_collection_csv` → backend routes IMPLEMENTED on feature/local-functions; resolves old consumes-MISSING via §T5,T6 + ../flaskapi/SPEC.md T6
--- surface distilled from feature/local-functions (to port) ---
util: `utils/jobCollectionCsv.ts` → parse/serialize job-collection CSV (metadata preamble + inputs/outputs table); round-trips backend CSV (§T6)
comp: `components/data/UploadJobCollectionButton.tsx` → upload CSV → 1 authoritative parse drives 4 effects atomically {add fn entry, select fn, prefill param bounds, infer dist+log tags} (V13, §T6)
util: `utils/distributionDiagnostics.ts` → infer/validate per-input distribution + log-scale tags from sample data (§T8)
util: `utils/functionUtils.ts` `normalizePayloadToCamelCase` preserves nested value-key dicts {inputs,outputs,properties,defaultInputs} (V24, done); still open: `camelToSnakeCase`/`toBackendVarNames` (FE var names → backend snake_case on outgoing requests, paired w/ ../flaskapi V13/V14) (§T19)
flow: per-variable log-scale toggle `InputVariableDist`/`OutputVariableDist` → FunctionContext → request payload → backend (V12, §T9, ../flaskapi V16)

## §V
V1: app usable ⟺ `GET /flask/deployment/health` → 200; `App.tsx` polls ≤300×@1s before render
V2: step1 view = `serviceMode` from `GET /flask/deployment/service-mode` ∈ {UQ,SUMO,MOGA}
V3: write actions (launch sampling) enabled ⟺ `permissions` = WRITE (from `/flask/deployment/permissions`)
V4: workflow = 2 steps Setup(0) → Results(1); `NavigationContext.currentView` ∈ {0,1}
V5: backend snake_case responses → frontend normalizes camelCase before use
V6: user selection state persisted via POST `/flask/text-file`; reload restores via GET (PersistenceContext)
V7: dev server port 8080 `strictPort` → fail if port taken (⊥ silent reassign)
V8: `src/osparc-api-ts-client/` generated → ∉ eslint, ⊥ manual edit
V9: `npm run build` ! pass `tsc -b` (typecheck) before `vite build`
V10: jobs polled until status ∈ complete set before analysis enabled (≥5 needed → InsufficientDataWarning)
--- state-mgmt invariants distilled from prior porting (INVARIANTS.md) — caused garbled state, ! hold on reimpl ---
V11: mutable shared/context state typed w/ explicit union (⊥ inferred from initial literal); later `undefined`/diff-shape assignment ! still typecheck. guard: `npm run build` (INV-001, §T5)
V12: per-variable metadata (e.g. log-scale) ! flow end-to-end UI→context→payload→backend; UI-only toggle ⊥ done (INV-002, §T8 ../flaskapi V16)
V13: CSV upload → 1 authoritative parsed result drives 4 effects atomically {add fn, select fn, prefill bounds, infer dist/log}; ⊥ partial update (INV-003, §T6)
V14: FE↔BE payload field contracts changed together (⊥ opportunistic rename one side) (INV-004, ../flaskapi V13/V14)
V15: context-derived setters guard w/ equality check before set; ⊥ object-recreation-only retrigger → duplicate Dakota/persistence fan-out (INV-005, §T5)
V16: Dakota plot fetches (1D/2D/3D) deduped by stable logical request key {axes,sliderValues,QoI,fn,jobList,logScale}; same key → ⊥ new fetch (INV-006, §T5)
--- review-backprop invariants (Copilot review on #468/#469; bugs §B6-B9, fixes §T11-T13) ---
V17: persist success-marker (`lastSavedContent`) set ONLY after confirmed OK `setFile` response; failed/non-OK save ⊥ mark content saved (else V15 equality-guard suppresses retry of the failed write) (B6, refines V15)
V18: Dakota plot dedup key (`lastFetchedKey`) cached ONLY on fetch success (or cleared on error); transient/rejected fetch ⊥ block retry of identical inputs (B7, refines V16)
V19: FE `opaqueValueDictKeys` (read-path only, `functionUtils.ts`) ⊆ backend `_DEFAULT_PRESERVE_NESTED_KEYS` (`../flaskapi/utils/helpers.py`); asserted by flaskapi cross-language test `test_preserve_nested_keys_matches_frontend_opaque_keys` (subset, not equality — backend also covers write-path-only keys FE has no reason to track); no shared runtime file (B8,B9, pairs ../flaskapi V13/V14/V26)
V20: app src (⊥ `src/osparc-api-ts-client/`) consumes oSPARC functions/jobs via REGISTERED types only (carry `uid`): `RegisteredFunction` union alias (`context/types.d.ts`) for functions; `RegisteredFunctionJobCollection` (generated) for collections; `OsparcFunctionJob` (`context/types.d.ts` — minimal post-normalization shape `{uid, status:string, inputs, outputs}`) for jobs. ⊥ import bare generated `Function`/`FunctionJob` unions (lack `uid`; job `status` is a `FunctionJobStatus` object pre-flatten, flattened to string by `JobContext.jobStatusFilter`). enforced by `tsc -b` (B10)
V21: `npm run build:e2e` regenerates `osparc-api-ts-client/` via `npm run generate-osparc-cli` before `tsc -b && vite build`; e2e job must provide Java/JRE because the Playwright image does not ship one (B14)
V22: every MUI `Modal` wrapper carries `aria-labelledby`+`aria-describedby` (screen-reader semantics; parity w/ Footer/PerformanceModal/MOGAModal/MOGAPlotModal/AddOutputModal); ⊥ drop on refactor (B17)
V23: non-OK plot fetch (1D/2D/3D) ! reject the promise (`Promise.reject`/`throw`, ⊥ `return new Error`) so `.catch` runs → `lastFetchedKey` cleared; resolving a returned Error caches the key as success & blocks retry (B16, refines V18)
V24: `normalizePayloadToCamelCase` ⊥ case-convert keys nested *inside* identifier-keyed value dicts `{properties,defaultInputs,inputs,outputs}` — those keys are oSPARC/user variable names, not API field names; only the dict's own key (e.g. `default_inputs`→`defaultInputs`) converts, contents pass through verbatim (B18, closes T10, pairs ../flaskapi V13)
V25: `JobSelector`'s destructive auto-select-all-SUCCESS (`onToggleAll(true)`+`setIsSuMoGenerated(true)`) fires ≤1× per genuinely-fetched `fetchedJobCollections` (`JobContext.hasAutoSelectedJobs`, reset only on refetch); ⊥ retrigger on view remount (Setup↔Results nav unmounts/remounts MOGA/SuMo/UQ per `ReturnCurrentView`, clobbering manual job (de)selection each time). Clearing the view-local `loading` spinner stays decoupled — that still fires on every remount (B19, refines B11)
V26hs: shared MUI `MuiTable`/`MuiDataGrid` roots ! use `theme.palette.background.default` as their surface; ⊥ table backgrounds inherit the lighter card/paper surface (root V37hs)
V27qn: shared `MuiDataGrid.columnHeaders` ! use `theme.palette.background.default` as their surface; ⊥ table headers inherit the lighter card/paper surface; guard: `theme.test.ts`
V26jt: every `/flask/*` frontend call has success + failure coverage; rejected/non-OK responses surface to caller or user (⊥ silent failure)
V27ku: Vitest global coverage gate starts at 40% lines/statements/functions/branches; only ratchets upward → 60% → 80%
V28lv: Vitest setup fails tests on unexpected `console.error` or unhandled rejection; intentional error-path tests explicitly consume/clear those signals
V29mw: app render failures cross an ErrorBoundary → user-visible recovery state; ⊥ blank/crashed UI
V30nx: permissions/health fetch failure defaults app to READ-ONLY with visible degraded-state feedback; ⊥ enable write actions on unknown permissions
V31rs: `runningSampling` = one-shot "launched, refresh pending" flag; `JobSelector` ! clear it after its post-launch `requestForceFetch` settles; ⊥ stay `true` after success (B22rs)
V32ff: context async actions called from UI (e.g. `requestForceFetch`) ! return the Promise and own failure feedback (toast); ⊥ fire-and-forget async that leaks unhandled rejections (B23ff)
V33sv: `stepValidator` step-0 gate ! reject every distribution the inline input errors flag (non-finite values, `std`/`scale`/exponential `mean` ≤ 0, uniform `min ≥ max`); ⊥ enable Next while an input shows an error (B24sv)
V34lw: Dakota plot fetches (1D/2D/3D) ! let only the latest request update plot/loading state; an older response (success or failure) resolving later ⊥ overwrite newer slider/axis results (B25rc)
V35kn: CI `node-tests` ! pass `npm run knip` (⊥ unused files/exports/deps in `node/`); `knip.json` `ignoreDependencies` only for deps consumed outside knip's view (untracked generated client, ambient `@types/react-plotly.js`, `whatwg-fetch` in the generated client, Istanbul libs in `../tests/e2e/coverage-teardown.ts`)
V36ar: `src/architecture.test.ts` (ArchUnitTS) ! stay green: no import cycles in `components|context|utils|views`; `utils`/`context` ⊥ import `components`/`views`; `components` ⊥ import `views`; direct `fetch(` only in the allow-listed modules, and that list only shrinks (utils → context *types* allowed)
V37mg: every settings modal ! disable Apply while ANY of its fields is flagged invalid, and every input ! carry a unique accessible name (B26mg)
V38ap: `/flask/*` JSON calls ! go through `src/api/client.ts` `requestJson` (JSON bodies always sent with `Content-Type: application/json`; failures reject as `ApiError{kind: http|network|parse, status, body}`); remaining direct `fetch(` sites are migration debt tracked by V36ar's allowlist (B27ct)
V39rt: `fetchWithRetry` retries only network errors, 5xx, 408, 429; other 4xx return at once; after exhausting retries it returns the last HTTP response (status preserved) and only throws for network failure (B28rt)
V40ps: a rejected persistence save ! not update `lastSavedContent`/`persistence` and ! stop further saves for the session; a failed (non-404) persistence load ! fall back to in-memory defaults with a warning and ⊥ write anything back (B30ps, refines V17)
V41pv: a loaded persistence file ! be a plain object whose required keys carry the right JSON type (arrays/objects/number/boolean); anything else (JSON `null`/`0`/`""`, a string `inputVars`, ...) → defaults + warning, ⊥ reach contexts (B32pv)
V42ax: every interactive control (icon buttons, selects) ! have an accessible name, and text ! meet WCAG AA contrast (4.5:1) on its surface; enforced by `tests/e2e/a11y.spec.ts` (B33ax)

## §T
id|status|task|cites
T1|.|frontend calls `download_job_collection_csv`/`upload_job_collection_csv` — backend now IMPLEMENTED; resolved-by → §T6|T6, ../flaskapi/SPEC.md T6
T2|.|`package.json` version `0.0.0` — never bumped; decide whether to track service version|../SPEC.md V5,T1
T3|.|surface clear UX msg for backend "≥5 completed jobs" rule pre-call (component `InsufficientDataWarning` exists — confirm all analysis paths gated)|V10, ../flaskapi/SPEC.md V2
T4|.|no `.env` / typed config for backend base URL — relies on dev proxy + same-origin `/flask` in prod (Caddy); document assumption|../SPEC.md V1
T5|.|PORT [topic=fe-state-mgmt] clean reimpl of `JobSelector`/`FunctionContext`/`PersistenceContext` state honoring V11/V15/V16 (typed unions, equality-guarded setters, deduped plot fetch keys). prior port garbled this — start from invariants, ⊥ copy broken state code; cover w/ vitest|V11,V15,V16
T6|.|PORT [topic=fullstack-csv] `utils/jobCollectionCsv.ts` + `UploadJobCollectionButton.tsx` atomic 4-effect upload flow (V13); wire to backend §T6; vitest|V13, ../flaskapi/SPEC.md T6
T7|.|PORT [topic=be-local-functions] FE support for local (uid-prefixed) functions/collections in JobSelector/FunctionList (offline mode) — pairs ../flaskapi T7|../flaskapi/SPEC.md T7
T8|.|PORT [topic=fullstack-logscale] `utils/distributionDiagnostics.ts` + per-variable log-scale UI (InputVariableDist/OutputVariableDist) + log-scale plot rendering (Curves1D/Surface2D/IsoSurface3D) end-to-end per V12|V12, ../flaskapi/SPEC.md V16,T9
T9|.|PORT [topic=testing-e2e] vitest coverage for ported utils/contexts + TS `@playwright/test` SuMo read-only pixel-snapshot e2e (`npm run test:e2e`; ⊥ vitest browser mode for e2e; supersedes Python `test/playwright-automation`); pairs root §T4 + §T8-T12|../SPEC.md T4,T8-T12
T10|x|fix B18: `normalizePayloadToCamelCase` (`utils/functionUtils.ts`) now tracks the parent key during recursion and skips case-conversion of nested keys under `{properties,defaultInputs,inputs,outputs}`, preserving oSPARC variable-name identifiers; regression test `functionUtils.test.ts` ("preserves snake_case variable identifiers..."). Write-path counterpart fixed backend-only, see T13|V24,V14,B18, ../flaskapi/SPEC.md T8,V13
T11|.|fix B6 (#468): update `lastSavedContent` only after confirmed OK `setFile`; surface save success/failure so failed write retries; test failed-save ⊥ marked saved|V17,B6
T12|.|fix B7 (#468): move `lastFetchedKey` update to success path (or clear on error) in Curves1DPlot/Surface2DPlot/IsoSurface3DPlot; test transient-failure retry w/ same inputs|V18,B7
T13|x|fix write-path case-mangling (superseding closed/unmerged PR #469, its B8/B9): backend `recursive_dict_keys_{camel_to_snake,snake_to_camel}` (`../flaskapi/utils/helpers.py`) gained a `preserve_nested_keys` param (default `_DEFAULT_PRESERVE_NESTED_KEYS`, covers `slider_values`,`distributions`,`output_var_selection`,`project_inputs`,`inputs`,`outputs`,`default_inputs`,`properties`), applied to request parsing, response serialization, and SDK ingestion alike. No FE code changed (T19 dropped — backend fix alone suffices, payloads pass through untouched). Tests: `test_utils_helpers.py::TestPreserveNestedKeysForVariableNames`, cross-language subset test, end-to-end `test_flask_dakota_workflows.py::test_moga_preserves_irregular_case_variable_name_end_to_end`|V19,B8,B9,../flaskapi/SPEC.md V13,V26,B11
T14|.|0811bcb [wave-2 carry-over] when opening node csv(T6)/local-fn(T7)/logscale(T8) PRs, apply alexpargon fixes from commit `0811bcb`: (a) move `sumoResponse.ts` `components/plots/`→`utils/` + fix 5 plot imports; (b) export `snakeToCamelCase` from `functionUtils`, dedup in `sumoResponse`; (c) drop dead `@mui/x-data-grid` mocks in `FunctionList.test.tsx`+`FunctionList.upload.test.tsx`; (d) rename `jobcollection_roundtrip.integration.test.ts`→camelCase; (e) `tmp_job_collection_import.csv`→`__fixtures__/jobCollectionImport.csv`; (f) `stepValidator` param `ServiceMode`→`serviceMode` (closes #471)|§C,T6,T7,T8
T15|x|fix e2e startup build: ensure the Playwright e2e job has Java/JRE so `npm run build:e2e` can regenerate `osparc-api-ts-client/` before `tsc -b && vite build`, allowing webServer startup in CI|V21,B14
T16|x|fix B16 (#475): `Surface2DPlot` `return new Error` on non-OK resolved the chain & cached `lastFetchedKey` as success; `Curves1DPlot` had no `!response.ok` guard at all. Reject the promise in both (mirror `IsoSurface3DPlot`) so `.catch` clears the key → retry of identical inputs unblocked|V23,V18,B16
T17|x|fix B17 (#475): restore `aria-labelledby`/`aria-describedby` on `SuMoModal`'s `Modal` (dropped on the inspect-model fix), matching the other codebase modals|V22,B17
T18|x|add e2e regression coverage for underscore-bearing variable names (e.g. `sigma_blood`) so B18-class bugs would be caught; shared `tests/e2e/mock_osparc/data.py` fixture (`x1..x4`/`y..y4`, underscore-free) backs 3 pixel-snapshot specs (sumo/uq/moga-readonly) so it isn't mutated for this. New `tests/e2e/case-preservation.spec.ts` instead intercepts `list_functions` via `page.route()` with a fabricated underscore-named function and asserts on the UQ-mode `input-var-${name}-distribution-selector` testid (InputVariableDist.tsx) rendering with the literal snake_case name — no new pixel baseline, isolated from the other specs. Verified as a real regression test (fails when V24's fix is reverted, passes when restored)|V24,B18
T19|x|DROPPED (2026-07-02): outgoing-request `camelToSnakeCase`/`toBackendVarNames` FE utility deemed unnecessary — backend's T13 fix makes the write-path subtrees pass through untouched regardless of FE-held casing, so this would have been dead code with no caller|V14, ../flaskapi/SPEC.md T8,V13
T20|x|fix B19: `JobContext` gained `hasAutoSelectedJobs`/`setHasAutoSelectedJobs`, reset only when `fetchedJobCollections` is reassigned (genuine refetch); `JobSelector`'s hydration effect now clears `loading` unconditionally but gates `onToggleAll(true)`/`setIsSuMoGenerated(true)` on the flag, so Setup↔Results remounts no longer reset manual job selection. Tests: `JobContext.test.tsx` (flag resets on refetch, survives unrelated `setSelectedJobUids`)|V25,B19,B11
T21|.|testing-negative: add rejected/non-OK tests for every `/flask/*` utility/context call; fix each swallowed error minimally|V26jt
T22|~|testing-ratchet: raise Vitest global thresholds 40→60→80 only after focused suites meet each gate (60/60/60/60 reached 2026-09-23; 80 pending)|V27ku
T23|.|testing-safety: retain global console.error/unhandled-rejection guard; add explicit assertions for expected negative-path diagnostics|V28lv
T24|x|testing-boundary: ErrorBoundary + recovery test at the app root, plus a step-keyed boundary around `ReturnCurrentView` so a crashing view keeps header/footer navigation usable and resets on step change (`App.test.tsx`)|V29mw
T25|x|testing-permissions: `ServiceContext.test.tsx` (full/partial config failure → READ-ONLY + toast; unexpected permission strings → READ-ONLY) and `App.test.tsx` (health gate: recovery after 503/network, 300-attempt budget then toast, no further polls, B31hp)|V30nx,B31hp
T26|x|dead-code removal: delete unreachable `views/ParallelRunner.tsx`/`.css` (only mount path was Footer's `permissions === "WRITE" && false` Task Manager button) + Footer modal state; fix B22rs/B23ff test-first (`JobSelector.test.tsx`, `JobContext.test.tsx`)|V31rs,V32ff,B22rs,B23ff
T27|x|fix B24sv test-first: table-driven `stepValidator.test.ts` (per-distribution valid/invalid, MOGA targets, step bounds); failure-path suites for `LHSSampling` (422 text surfaced, network reject, post-launch job lookup failure, clamped points) and `ReturnCurrentView` (unsupported mode)|V33sv,B24sv,V26jt
T28lw|x|fix B25rc test-first with a request-id guard in `Curves1DPlot`/`Surface2DPlot`/`IsoSurface3DPlot`; per-plot suites cover V16 dedup, V18 retry after 4xx/5xx/network/malformed JSON, missing predictions, <5 jobs / <2 inputs, stale race, 3D axis de-duplication|V34lw,B25rc,V18,V16
T29kn|x|add knip dead-code gate: deleted unused `WhiskerPlot.tsx` + `functionUtilsMockups.ts`, un-exported context objects/internal helpers, removed unused deps (`superagent`, `styled-components`, `@mui/styled-engine-sc`, `autoprefixer`, `postcss`, `ts-node`, `vitest-browser-react`, `globals`); verified with and without the generated client|V35kn
T30ar|x|add ArchUnitTS architecture tests (`archunit` devDep, local `expect` shim since Vitest globals stay off) incl. a guard test proving a real violation is detected; enabling `globals: true` instead surfaced unwrapped-`act()` warnings in 3 suites (left for T23)|V36ar
T31mg|x|fix B26mg test-first (`MOGAModal.test.tsx`: distinct labels, Apply/Discard, per-field invalid values, no function); `InputVariableDist.test.tsx` covers seeded defaults per mode, persisted values, every inline error message and the UQ form switch; deleted the never-rendered `LogNormalInputDistribution`|V37mg,B26mg,V33sv
T32ap|x|centralize `/flask/*` calls in `src/api/client.ts` (test-first `client.test.ts`): LHS/grid/test-job (fixes B27ct), 1D/2D/3D plots + `SuMoValidation`, all `functionUtils` calls (fixes B29lr), `PersistenceContext` (fixes B30ps, posts to canonical `/flask/text-file/`), MOGA/UQ; V36ar allowlist now only `api/client.ts` + `utils/fetchRetry.ts`|V38ap,V39rt,B27ct,B28rt,B29lr,B30ps,V36ar
T33pv|x|fix B32pv test-first (`PersistenceContext.test.tsx`: JSON scalars/array, 10 wrong-typed fields, optional fields missing); `RunSamplingButton` never launches for non-WRITE permissions; `dakotaRequestKey` boundary table; mutation spot-check (removing view `ErrorBoundary`, LHS error toast, or load-failure `avoidPersisting` each fails a unit test; dropping the JSON header fails the WRITE e2e)|V41pv,B32pv

## §B
id|date|cause|fix
B6|2026-06-16|#468 `PersistenceContext` sets `lastSavedContent` even when `setFile` returns non-OK (⊥ throw) → V15 equality-guard then skips retry of the failed save|V17
B20|2026-09-23|`fetchWithRetry` checked `attempt >= retries` inside `attempt < retries`, so exhausted network failures discarded the actionable error and returned a generic fallback; regression test now requires original error propagation|V26jt
B7|2026-06-16|#468 plots cache `lastFetchedKey` before fetch resolves → failed/rejected fetch blocks retry of same inputs (Curves1D/Surface2D/IsoSurface3D)|V18
B8|2026-06-16|#469 FE `preserveSubtreeKeys` ≠ backend `_PRESERVE_SUBTREE_KEYS` (missing distribution(s)/output_var_selection/slider_values; extra default_inputs) → variable-name keys mangled, breaks V13/V14 one direction|V19
B9|2026-06-16|#469 `functionUtils` preserve sets list camelCase `defaultInputs`/`gridData` but membership tested vs `camelToSnakeCase(rawKey)` (snake form) → unreachable dead entries|V19
B10|2026-06-18|#264 generated client replaced old hand-patched client; bare `Function`/`FunctionJob` unions lack `uid` (only `Registered*` variants have it) and job `status` is an object (only on `*WithStatus`), but app imported bare generated unions directly + `context/types.d.ts` never exported app aliases → 53 `tsc -b` errors on docker image build|V20
B11|2026-06-18|SuMo e2e (T11) caught: `JobSelector` auto-select effect cleared `loading` using the stale local `jobCollections` copy (empty on first pass) → never `onToggleAll(true)`, so `selectedJobUids` stayed empty and the SuMo validation never ran. Gate the empty case on source-of-truth `fetchedJobCollections.length`|V10
B12|2026-06-18|SuMo e2e (T11) caught: `SuMoValidation` read prediction key `${selectedQoI}_hat`, but the global after_request serializer camelCases every response key → client received `${selectedQoI}Hat`; CV predictions were `undefined`, plot/metrics never rendered|V10
B13|2026-06-18|SuMo e2e (T11) caught: vite `/flask` proxy `changeOrigin:true` made Flask emit absolute backend-origin `Location` on its strict_slashes 308 (e.g. `/flask/text-file`→`:5000/flask/text-file/`), which the browser blocked via CORS; set `changeOrigin:false` so Host (and thus the redirect) stays same-origin like Caddy|V1,V10
B14|2026-06-19|e2e webServer build needed Java-based `generate-osparc-cli` but the Playwright container had no JRE, so startup failed before Playwright could start; install Java/JRE in the e2e job so `build:e2e` can regenerate the client|V21
B15|2026-06-19|prek ran end-of-file-fixer on `node/.gitignore` because the file lacked a trailing newline|—
B16|2026-06-22|#475 `Surface2DPlot` non-OK fetch path did `return new Error(...)` (⊥ reject) → chain resolved, next `.then` cached `lastFetchedKey` & cleared `propagating` as if successful → 4xx/5xx blocks retry of identical inputs (incomplete B7/T12 fix); `Curves1DPlot` had no `!response.ok` guard at all|V23,V18
B17|2026-06-22|#475 inspect-model fix rewrote `SuMoModal` and dropped the `aria-labelledby`/`aria-describedby` on the `Modal` wrapper → screen-reader semantics lost, inconsistent w/ other codebase modals|V22
B18|2026-07-01|prod oSPARC fn UID `ddfc5b42-...` ("Tissue Conductivity Uncertainty"): all inference calls (model validation, 1D/2D/3D plots, UQ propagation) 400'd. `normalizePayloadToCamelCase` blindly recursed key-casing into every nested object, corrupting `inputSchema.schemaContent.properties`/`defaultInputs` variable names (`sigma_blood`→`sigmaBlood`) while the sibling `required` string array stayed untouched (array items, not object keys) → visible mismatch in the raw schema dump; `FunctionList.tsx` then registered the corrupted names as `inputVars`, propagating them into every downstream request oSPARC rejects. Never caught because `tests/e2e/mock_osparc/data.py` fixture vars (`x1..x4`,`y..y4`) contain no underscores, so the conversion was a no-op there. This was already flagged as unimplemented work in T10/V14 (+ flaskapi T8/V13) but never landed|V24,T10,T18
B19|2026-08-04|PR #502 review (Alex, human, "additional note"): `JobSelector`'s hydration effect coupled clearing view-local `loading` with destructive `onToggleAll(true)`/`setIsSuMoGenerated(true)`, gated only on `loading===true`. Pre-existing `loading` initializer (`fetchedJobCollections===undefined`) usually skipped this on Setup↔Results remounts, so Alex flagged it "likely benign". A same-PR fix for a separate Copilot-flagged loading-flash bug changed the initializer to always `true` — turning the coupling into a guaranteed reset of the user's manual job (de)selection on every remount (`ReturnCurrentView` unmounts MOGA/SuMo/UQ per nav). Caught while following up on Alex's note, not by a failing test|V25
B20hs|2026-09-23|`MuiDataGrid` lacked the `MuiTable` shared dark-surface override, so all DataGrid-backed tables inherited the lighter card/paper background|V26hs
B21qn|2026-09-23|`MuiDataGrid` root dark-surface restoration did not cover `columnHeaders`, so function-selection table headers remained on the lighter card/paper surface|V27qn
B22rs|2026-09-23|dead-code audit: only success-path `setRunningSampling(false)` lived in never-mounted `ParallelRunner` `Dashboard.checkIfFinished` → after any successful launch `runningSampling` stayed `true`, so every later `selectedFunction` change re-fired a forced job refresh + a spurious "Sampling started" toast|V31rs
B23ff|2026-09-23|`JobContext.requestForceFetch` called async `updateJobCollections` without await/catch → failed job-collection refresh leaked an unhandled rejection with no user feedback, and callers' `await` resolved before the refresh finished|V32ff
B24sv|2026-09-23|negative-test audit: `stepValidator` only checked `!isNaN`, so `std ≤ 0`, `±Infinity`, uniform `min = max`, `scale ≤ 0` and exponential `mean ≤ 0` passed the Next-step gate while `InputVariableDist` already showed "Out of range"/"Min >= Max" errors for the same values → invalid distributions reached the backend|V33sv
B25rc|2026-09-23|negative-test audit: plot fetches had no ordering guard, so moving a slider twice quickly let the slower, older `sumo_along_axes` response overwrite the newer curve (wrong plot shown for the current slider values)|V34lw
B26mg|2026-09-23|negative-test audit: `MOGAModal` Apply ignored `seedError`/`numberSeedsError`, so seed 0 / empty / >1e6 and 0 or empty "Number of Seeds" (NaN) were saved and sent to MOGA; the "Number of Seeds" field was also `aria-label="Seed"`, duplicating the Initial Seed label|V37mg
B27ct|2026-09-23|API-client audit: `LHSSampling`, `GridSearchSampling` and `runSingleJob` POSTed JSON strings without a `Content-Type` header (browser sends `text/plain`), while the backend's `parse_request_model` → `request.get_json()` (since #442) requires `application/json` → every WRITE-mode LHS/grid/test-job launch got 415 Unsupported Media Type; unseen because e2e only covers READ-ONLY and unit tests never asserted headers (reproduced with a Flask test client)|V38ap
B28rt|2026-09-23|`fetchWithRetry` retried every non-OK except 404 (a 422 validation error was re-sent 5× with backoff) and, once retries ran out, threw a generic error that dropped the HTTP status the callers needed|V39rt
B29lr|2026-09-23|`functionUtils` `list_*` helpers called `.json()` on `fetchWithRetry`'s response without checking `ok`; a 404 (returned without retry) or exhausted 5xx body like `{"error": ...}` was normalized and returned as the job/function list → downstream `.map` on a non-array|V38ap
B30ps|2026-09-23|persistence negative tests: (a) `setFile` returned normally on non-OK, so `saveState` still set `lastSavedContent` + `persistence` (V17 regressed); (b) `avoidPersisting` was state read inside a `useCallback(..., [])`, so the stale `false` never stopped later saves; (c) a 5xx on load left `persistence` undefined → `loading` stuck `true` forever (app never leaves the loading state)|V40ps
B31hp|2026-09-23|`App` health poll checked the retry budget before the result, so a backend that became healthy exactly on the last attempt still raised "Failed to connect to the backend"; `ServiceContext` also cast any permissions string to the enum and gave no user feedback when the config request failed|V30nx
B32pv|2026-09-23|persistence edge tests: `isValidPersistenceFile` returned `data && ...`, so stored JSON `null`/`0`/`""` yielded a falsy non-`false` value that slipped past the `=== false` check and became `persistence`; it also only checked key presence, so wrong-typed values (e.g. `inputVars: "x1"`) reached contexts that call `.map` on them|V41pv
B33ax|2026-09-23|first axe run (root T37): 6 icon-only buttons had no accessible name (FunctionList open/refresh ×3, JobSelector refresh, add-output, MOGA performance edit), both QoI `Select`s had no label, `MetricRow` put `<p>` directly inside `<ul>`, and the SuMo validation blue metric text (#2992dd) had 3.75:1 contrast on #2e3437; lightened to rgb(66,165,235), which changes `sumo-readonly-validation.png`|V42ax
