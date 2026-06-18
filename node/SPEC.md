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
cmd: `npm run lint` → `eslint .`
cmd: `npm test` → `npx vitest`
cmd: `npm run test:browser` → `vitest --config vitest.browser.config.ts` (Playwright)
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
util: `utils/functionUtils.ts` `camelToSnakeCase`/`toBackendVarNames` → FE var names → backend snake_case; `normalizePayloadToCamelCase` ! preserve nested value-key dicts {inputs,outputs,properties} (paired w/ ../flaskapi V13/V14) (§T10)
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
V19: FE preserve-subtree-key set ≡ backend `_PRESERVE_SUBTREE_KEYS` (single source / test asserts equality); membership tested against canonical snake form only, ⊥ dead camelCase entries (B8,B9, pairs ../flaskapi V13/V14)
V20: app src (⊥ `src/osparc-api-ts-client/`) consumes oSPARC functions/jobs via REGISTERED types only (carry `uid`): `RegisteredFunction` union alias (`context/types.d.ts`) for functions; `RegisteredFunctionJobCollection` (generated) for collections; `OsparcFunctionJob` (`context/types.d.ts` — minimal post-normalization shape `{uid, status:string, inputs, outputs}`) for jobs. ⊥ import bare generated `Function`/`FunctionJob` unions (lack `uid`; job `status` is a `FunctionJobStatus` object pre-flatten, flattened to string by `JobContext.jobStatusFilter`). enforced by `tsc -b` (B10)

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
T9|.|PORT [topic=testing-e2e] vitest coverage for ported utils/contexts + Playwright local SUMO e2e (`test:browser`); pairs root §T4|../SPEC.md T4
T10|.|PORT [topic=be-preserve-case] homologous FE: `utils/functionUtils.ts` `camelToSnakeCase`/`toBackendVarNames` + `normalizePayloadToCamelCase` preserve nested value-key dicts {inputs,outputs,properties} (mirror of backend nested-key serialization); vitest `functionUtils.test.ts`. own worktree w/ flaskapi T8|V14, ../flaskapi/SPEC.md T8,V13
T11|.|fix B6 (#468): update `lastSavedContent` only after confirmed OK `setFile`; surface save success/failure so failed write retries; test failed-save ⊥ marked saved|V17,B6
T12|.|fix B7 (#468): move `lastFetchedKey` update to success path (or clear on error) in Curves1DPlot/Surface2DPlot/IsoSurface3DPlot; test transient-failure retry w/ same inputs|V18,B7
T13|.|fix B8+B9 (#469): sync FE `preserveSubtreeKeys` with backend `_PRESERVE_SUBTREE_KEYS` (single source / equality test); drop unreachable camelCase entries (`defaultInputs`/`gridData`)|V19,B8,B9,../flaskapi/SPEC.md V13
T14|.|0811bcb [wave-2 carry-over] when opening node csv(T6)/local-fn(T7)/logscale(T8) PRs, apply alexpargon fixes from commit `0811bcb`: (a) move `sumoResponse.ts` `components/plots/`→`utils/` + fix 5 plot imports; (b) export `snakeToCamelCase` from `functionUtils`, dedup in `sumoResponse`; (c) drop dead `@mui/x-data-grid` mocks in `FunctionList.test.tsx`+`FunctionList.upload.test.tsx`; (d) rename `jobcollection_roundtrip.integration.test.ts`→camelCase; (e) `tmp_job_collection_import.csv`→`__fixtures__/jobCollectionImport.csv`; (f) `stepValidator` param `ServiceMode`→`serviceMode` (closes #471)|§C,T6,T7,T8

## §B
id|date|cause|fix
B6|2026-06-16|#468 `PersistenceContext` sets `lastSavedContent` even when `setFile` returns non-OK (⊥ throw) → V15 equality-guard then skips retry of the failed save|V17
B7|2026-06-16|#468 plots cache `lastFetchedKey` before fetch resolves → failed/rejected fetch blocks retry of same inputs (Curves1D/Surface2D/IsoSurface3D)|V18
B8|2026-06-16|#469 FE `preserveSubtreeKeys` ≠ backend `_PRESERVE_SUBTREE_KEYS` (missing distribution(s)/output_var_selection/slider_values; extra default_inputs) → variable-name keys mangled, breaks V13/V14 one direction|V19
B9|2026-06-16|#469 `functionUtils` preserve sets list camelCase `defaultInputs`/`gridData` but membership tested vs `camelToSnakeCase(rawKey)` (snake form) → unreachable dead entries|V19
B10|2026-06-18|#264 generated client replaced old hand-patched client; bare `Function`/`FunctionJob` unions lack `uid` (only `Registered*` variants have it) and job `status` is an object (only on `*WithStatus`), but app imported bare generated unions directly + `context/types.d.ts` never exported app aliases → 53 `tsc -b` errors on docker image build|V20
