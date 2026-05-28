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
consumes-MISSING: GET `/flask/osparc/download_job_collection_csv?JobCollectionUid=` (functionUtils.ts:88) & POST `/flask/sampling/upload_job_collection_csv` (functionUtils.ts:99) → ⊥ exist in backend (§T1)

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

## §T
id|status|task|cites
T1|.|frontend calls `download_job_collection_csv` (osparc) & `upload_job_collection_csv` (sampling) — absent backend; impl backend or remove frontend|../flaskapi/SPEC.md T1
T2|.|`package.json` version `0.0.0` — never bumped; decide whether to track service version|../SPEC.md V5,T1
T3|.|surface clear UX msg for backend "≥5 completed jobs" rule pre-call (component `InsufficientDataWarning` exists — confirm all analysis paths gated)|V10, ../flaskapi/SPEC.md V2
T4|.|no `.env` / typed config for backend base URL — relies on dev proxy + same-origin `/flask` in prod (Caddy); document assumption|../SPEC.md V1

## §B
id|date|cause|fix
