# SPEC — MMUX Vite (root)

Caveman-encoded (see encoding rules: drop articles/filler, `→` becomes, `!` must, `?` may/uncertain, `⊥` never, `∈` in, `§` section). Distilled from code 2026-05-28. Hierarchical: this root spec owns orchestration; layer detail in child specs.

## LINKS
- child → [`node/SPEC.md`](node/SPEC.md) — frontend (Vite+React+TS)
- child → [`flaskapi/SPEC.md`](flaskapi/SPEC.md) — backend (Flask+Dakota+oSPARC)
- orchestration → `docker-compose.yml`, `docker-compose-development.yml`, `docker-compose-local.yml`, `Makefile`
- proxy → `proxy/Caddyfile` ; oSPARC svc manifests → `.osparc/*/metadata.yml`,`runtime.yml`

Legend: `{mode}` ∈ {sumo,uq,moga} ; `{perm}` ∈ {read,write}.

## §G
Orchestrate MMUX meta-modeling web app: React frontend + Flask backend behind Caddy proxy → oSPARC API. Guided step-by-step meta-modeling, 3 modes {UQ|SUMO|MOGA} × 2 perms {READ-ONLY|WRITE}, shipped as oSPARC dynamic service.

Domain: scientific UQ & sensitivity analysis; documented use-case = TI (Temporal Interference) stimulation — quantify how tissue-conductivity variation → simulated electric-field predictions. ("MMUX" ≈ Multi-platform Uncertainty eXplorer ?, unverified acronym.)

## §C
- orchestration ! docker compose; final `docker-compose.yml` assembled by `ooil compose` (target `compose-spec`)
- ship as oSPARC dynamic svc keys `simcore/services/dynamic/mmux-vite-*`
- Node ≥24 (frontend), Python 3.11 (backend)
- runtime behavior env-driven: `SERVICE_MODE`, `PERMISSIONS`, `DEPLOYMENT_MODE`
- version single-sourced `.bumpversion.cfg` current=`1.5.18`; bumped across 8 `.osparc/*/metadata.yml` + `Makefile` + `docker-compose-local.yml` + `docker-compose-development.yml` via `bump2version`
- secrets via `.env` (`make .env` clones `.env-devel`); `.env` ∉ git
- CI green before merge: prek + node tests + flaskapi tests + image build (`ooil compose` then `docker compose build`)
- e2e tests = TS `@playwright/test` runner in `tests/e2e/` (⊥ vitest browser mode for e2e); pixel-perfect `toHaveScreenshot` baselines committed to git; determinism via pinned Playwright docker image (fonts/render); oSPARC mocked at backend boundary (⊥ real oSPARC in e2e)
- commits ! Conventional Commits `<type>(<scope>): <subject> (#PR)`; types {feat,fix,refactor,chore,docs,test}; feature branch → PR review → merge to `main`
- ⊥ hardcoded secrets / sensitive data in code or git

## §I
spec: [`node/SPEC.md`](node/SPEC.md) → frontend layer interfaces & invariants
spec: [`flaskapi/SPEC.md`](flaskapi/SPEC.md) → backend HTTP interface (`/flask/*`)
svc: `mmux-vite-backend` → Flask, port 5000, health `GET /flask/deployment/health`, build `flaskapi/Dockerfile`
svc: `mmux-vite-web` → Vite build served by thttpd, port 8080, health `GET /`, build `node/Dockerfile`
svc: `mmux-vite-app-{mode}-{perm}` → Caddy 2.10.0 reverse proxy, port 8888, config `proxy/Caddyfile` (6 variants)
svc: `mock-osparc` (e2e-only) → in-backend oSPARC test-double: `create_flask_app()` injects it as `app.osparc_api` when `MMUX_E2E_MOCK_OSPARC` set (dedicated gate, ⊥ pytest's `is_test_environment` which the unit suite already uses); deterministic data (≥5 SUCCESS jobs, valid `sumo_cross_validation` inputs/outputs → flow ⊥ skip) lazy-imported from `tests/e2e/mock_osparc/` (on `PYTHONPATH`); ⊥ real oSPARC HTTP, ⊥ prod code path. (chosen over standalone HTTP stub: avoids re-impl of oSPARC SDK schema surface)
route: Caddy `:8888` `/flask/*` → `{$BACKEND_SERVICE}` (health `/flask/deployment/health`); `*` → `{$WEB_SERVICE}` (health `/`)
env: `OSPARC_API_BASE_URL` ! set
env: `OSPARC_API_KEY` ! set
env: `OSPARC_API_SECRET` ! set
env: `SERVICE_MODE` ∈ {UQ,SUMO,MOGA}
env: `PERMISSIONS` ∈ {READ-ONLY,WRITE}
env: `DEPLOYMENT_MODE` ∈ {LOCAL,OSPARC}
env: `BACKEND_SERVICE`,`WEB_SERVICE` → Caddy upstreams
cmd: `make .env` → clone `.env-devel` → `.env`
cmd: `make build` → `compose-spec` (ooil) + build all images
cmd: `make build-no-cache` → build `--no-cache --pull --parallel`
cmd: `make run-develop-{mode}-{perm}` → `docker compose -f docker-compose-development.yml up` (live source mounts, LOG_LEVEL=DEBUG, DEVELOPMENT_MODE=true)
cmd: `make run-prod-local-{mode}-{perm}` → `docker compose -f docker-compose-local.yml up` (prod build, validation mount only)
cmd: `make prek` → `uvx prek run --all-files`
cmd: `make test-node` → `npm ci && npm test` in `node/`
cmd: `make test-flaskapi` → `uv run pytest tests/ -v --cov-report=html --cov-report=term-missing`
cmd: `make ci` → `test-flaskapi` + `test-node` + `build-no-cache`
cmd: `make test-e2e` → TS Playwright e2e suite (`tests/e2e/`) vs local stack w/ oSPARC mocked (delegates `npm run test:e2e`); run in pinned Playwright docker for snapshot determinism
env (e2e): `SERVICE_MODE=SUMO` ∧ `PERMISSIONS=READ-ONLY` ∧ `DEPLOYMENT_MODE=LOCAL` ∧ `MMUX_E2E_MOCK_OSPARC=1` (→ in-backend test-double) ∧ `OSPARC_API_BASE_URL`=test sentinel (defense-in-depth, ⊥ real oSPARC)
cmd: `make version-{patch|minor|major}` → `bump2version` (no auto-commit/tag)
cmd: `make clean` → rm `node_modules/`, `.venv/`
file: `docker-compose.yml` (base, generated) ; `-development.yml` (dev mounts) ; `-local.yml` (prod-local validation)

## §V
V1: Caddy `:8888` → `/flask/*` to backend `:5000`, else → web `:8080`
V2: backend healthy ⟺ `GET /flask/deployment/health` → 200 ; web healthy ⟺ `GET /` → 200
V3: proxy `depends_on` backend & web healthy before serving
V4: `SERVICE_MODE` ∈ {UQ,SUMO,MOGA} ∧ `PERMISSIONS` ∈ {READ-ONLY,WRITE} ∧ `DEPLOYMENT_MODE` ∈ {LOCAL,OSPARC} ; other → backend errors
V5: ∀ version bump → all 8 `.osparc/*/metadata.yml` + `Makefile` + 2 compose files + `flaskapi/pyproject.toml` updated together (per `.bumpversion.cfg`, 12 file entries)
V6: `OSPARC_API_{BASE_URL,KEY,SECRET}` ! set ∀ deployment, else backend ⊥ reach oSPARC
V7: `docker-compose.yml` ! regenerated by `ooil compose`; manual edits lost on rebuild
V8: `.env` ∉ git (holds oSPARC secrets)
V9: image tag = `.bumpversion.cfg` current across all 6 proxy + backend + web svc keys
V10: e2e snapshot suite (TS `@playwright/test`) drives SuMo read-only common workflow vs live backend w/ oSPARC mocked; green ⟺ no crash ∧ key `mmux-testid` views present ∧ pixel diff ≤ threshold (⊥ crash-free-only)
V11: backend-under-e2e ⊥ reach real oSPARC — `MMUX_E2E_MOCK_OSPARC` set → `create_flask_app` injects in-backend test-double as `app.osparc_api` (never constructs real `OsparcApi`); `OSPARC_API_BASE_URL`=test sentinel as backstop; ⊥ `api.osparc.io`/`api.sim4life.io` HTTP in e2e
V12: snapshot baselines committed to git; regenerated ONLY via `--update-snapshots` in pinned Playwright docker image; ⊥ regen on dev host (font drift)
V13: `mmux-testid` attrs ! preserved on workflow-critical elements (shared selector contract w/ osparc-simcore e2e + this suite); rename/remove → update both sides
V14: `expect.toHaveScreenshot.timeout` set ≥ 30s (⊥ default 5s) so Plotly/DataGrid finish stabilizing before pixel capture on slow CI hosts; pairs V12 determinism (B1)
V15: e2e/client POSTs to strict_slashes Flask routes use the canonical trailing-slash URL (e.g. `/flask/text-file/`) → ⊥ 308 redirect round-trip (B2, pairs node/SPEC.md B13)
V16: ∀ oSPARC publish → all 5 CI jobs (prek+node-tests+flaskapi-tests+e2e-tests+verify-image-build) ! green on `main`; version single-sourced (V5,V9)
V17: local dev Vite server behind Caddy ! derive browser origin from request host ∧ advertise HMR `clientPort` from `APP_PORT`; ⊥ fixed `server.origin`/browser-facing internal `:8080`, so fallback ports serve dev assets/HMR on printed origin (B5)
V18: local run targets ! preflight nonblank `OSPARC_API_{BASE_URL,KEY,SECRET}` from exported env or `.env` before `docker compose up`; ⊥ healthy local stack with blank oSPARC creds that later fails `/flask/osparc/*` (B6)

## §T
id|status|task|cites
T1|x|version drift: `flaskapi/pyproject.toml` & `flaskapi/mmux_python/pyproject.toml` = `1.5.14` but service = `1.5.18`; add pyproject files to `.bumpversion.cfg` or align manually — superseded by T21 (mmux_python removed entirely, drift source eliminated)|V5,T21
T2|.|frontend calls `/flask/osparc/download_job_collection_csv` & `/flask/sampling/upload_job_collection_csv` — backend routes IMPLEMENTED on feature/local-functions; resolved-by porting topic fullstack-csv|node/SPEC.md T6, flaskapi/SPEC.md T6
T3|.|README lacks run matrix doc (modes×perms = 12 `run-*` targets); document|§I
T4|.|e2e snapshot suite umbrella: TS `@playwright/test` in `tests/e2e/`, SuMo read-only common workflow vs live backend w/ oSPARC mocked + pixel `toHaveScreenshot`; covers proxy `/flask/*` split (V1) & SUMO view (V2); → subtasks T8-T12; supersedes Python `test/playwright-automation` (behavioral reference only)|V1,V2,V10,V11,V12,V13,node/SPEC.md T9
T5|.|`concepts/` holds only UX `.pptx` (2025-01-13, 2025-02-17), not code — confirm intentional, link from README?|—
T6|.|PORT-TRACKER: clean re-port of feature/local-functions + test/playwright-automation + jgo/preserve-case work (prior merge garbled React state). 6 topics, 1 worktree/branch each off this SPEC: (a) be-preserve-case [full-stack, own worktree] → flaskapi T8 + node T10; (b) be-local-functions → flaskapi T7 + node T7; (c) fullstack-csv → flaskapi T6 + node T6; (d) fe-state-mgmt → node T5; (e) fullstack-logscale → flaskapi T9 + node T8; (f) testing-e2e → node T9 + T4. ⊥ port branch artifacts `INVARIANTS.md`/`LIVE_DEBUGGING.md`/`.serena/memories/*`/`tmp_job_collection_import.csv` (intent already folded into §V)|node/SPEC.md T5-T9, flaskapi/SPEC.md T6-T9
T7|.|REVIEW-BACKPROP: re-port PRs #467(be)/#468(fe-state)/#469(preserve-case) rebased onto develop (single feature commit each, squashed SPEC base #466 dropped). Copilot review findings recorded as bugs+fix-tasks: flaskapi §B1-B5/§T10-T14, node §B6-B9/§T11-T13. alexpargon structural fixes (commit `0811bcb`) folded into node §C conventions + carry-over task node §T14. ⊥ merge before §T fixes addressed|flaskapi/SPEC.md T10-T14, node/SPEC.md T11-T14
T8|x|e2e tooling: add `@playwright/test` (node/ devDep) + `node/playwright.config.ts` (webServer array, baseURL `PLAYWRIGHT_BASE_URL` default vite `:8080`, viewport 1600×900, `snapshotPathTemplate`→`tests/e2e/__snapshots__/`, `maxDiffPixelRatio` threshold, single chromium project) + `tests/e2e/` TS layout + `npm run test:e2e` (`NODE_PATH` resolves node/ deps for root tests) + `make test-e2e`|V10,V12,node/SPEC.md T9
T9|x|`mock-osparc` in-backend test-double: `create_flask_app()` injects `MockOsparcApi` as `app.osparc_api` when `MMUX_E2E_MOCK_OSPARC` set (dedicated gate ⊥ pytest `is_test_environment`); duck-types `get_{functions,job,job_collection}_api()` surface used by `blueprints/osparc.py` (`_get_all_items` pagination: `.total`/`.items[].to_dict()`); deterministic data module `tests/e2e/mock_osparc/` (1 fn x1→y, ≥6 SUCCESS jobs, valid `sumo_cross_validation` inputs/outputs) lazy-imported via `PYTHONPATH`, ⊥ prod path|V11
T10|x|e2e stack launch (via playwright `webServer`): live Flask (`MMUX_E2E_MOCK_OSPARC=1`, `OSPARC_API_BASE_URL`=test sentinel, `SERVICE_MODE=SUMO`, `PERMISSIONS=READ-ONLY`, `DEPLOYMENT_MODE=LOCAL`, `TEXT_FILES_DIR` local, `PYTHONPATH`+=`tests/e2e`) via `tests/e2e/scripts/run-e2e-backend.sh` + web (vite dev, `E2E_WEB_PORT` 8090) w/ `/flask/*` proxy split → app origin (`PLAYWRIGHT_BASE_URL`; Caddy `:8888` path = CI/docker)|V1,V11
T11|x|SuMo read-only e2e spec (port behavior from `test/playwright-automation:tests/e2e/test_sumo_local.py`): reset persistence (POST `/flask/text-file`) → assert deployment SUMO/READ-ONLY → `select-function-btn-{uid}` → fill `input-block-Min/Max` → `next-button` → wait `jobs-loading` + "Creating AI model…" hidden → assert `sumo-validation-view`/`qoi-select`/`.js-plotly-plot`/`MAE:`/`RMSE:`/`extend-sampling-btn` disabled; ADD `toHaveScreenshot` @Setup grid + validation view (mask/seed Plotly); console-error guard. add missing testids on current branch (`jobs-loading`,`sumo-validation-view`,`select-function-btn-{uid}`) per branch component diffs. e2e served by `vite preview` prod build (⊥ dev mode) for prod-fidelity + ⊥ dev-only React warnings. 3 full-viewport 1920×1080 baselines — setup grid, function-selected/inputs-open, validation view — UNmasked (deterministic mock+surrogate ⇒ reproducible Plotly in pinned image). CAUGHT+FIXED 3 regressions (node/SPEC §B11-B13)|V10,V13,node/SPEC.md B11,B12,B13
T12|x|CI: run `make test-e2e` in pinned Playwright docker image (`mcr.microsoft.com/playwright:v1.61.0-noble`, tag==`@playwright/test`); baselines generated/committed via `make test-e2e-update-docker` + verifiable locally via `make test-e2e-docker`, both in the SAME image (font-stable, §V12); `e2e-tests` job gates merge on green pixel diff vs committed baselines|V12,§C
T13|x|fix B1 (#475): set `expect.toHaveScreenshot.timeout = 30_000` in `node/playwright.config.ts` (config comment described the need but never set it)|V14,B1
T14|x|fix B2 (#475): `resetPersistence` posts canonical `/flask/text-file/` (trailing slash) to skip the strict_slashes 308 redirect|V15,B2

T17|.|RELEASE-1 stable baseline v1.5.19: prereq T1+CI green on develop → PR merge develop→main → `make version-patch` → verify V16 → oSPARC publish; ⊥ new features|V5,V9,V16
T18|.|BUG-FIX #467 backend (PR `jgo/port-backend`): fix flaskapi §B1-§B5 — B1 LOCAL_STORE_DIR cwd-indep+`mkdir parents`; B2 rm duplicate `jobIds`/`job_ids` key; B3 gate local-store merge on `DEPLOYMENT_MODE=LOCAL` only; B4 `_parse_number` raise/reject unparseable cell (⊥ silent 0.0); B5 replace bare `except` w/ typed exception → merge #467→develop|flaskapi/SPEC.md B1,B2,B3,B4,B5
T19|.|RELEASE-2 frontend CSV (new focused PR after T18): CSV upload UI→`POST /flask/sampling/upload_job_collection_csv` + download UI→`GET /flask/osparc/download_job_collection_csv`; ⊥ auto-boundary/log-inference/local-store UI (defer); ⊥ port #456 wholesale|flaskapi/SPEC.md T6,node/SPEC.md T6
T20|.|RELEASE-2 collaborator preview v1.6.0: prereq T18+T19+CI green on develop; optionally include #469 if node §B8-§B9 fixed → PR merge develop→main → `make version-minor` → verify V16 → oSPARC publish; goal: CSV upload+log-scale live for collaborator testing|V5,V9,V16,node/SPEC.md B8,B9
T21|x|REMOVE vendored `mmux_python` dep: inlined 6 used modules (`lhs`,`dakota_object`,`funs_create_dakota_conf`,`funs_data_processing`,`funs_evaluate`,`wiofiles`; dropped 3 unused: `dakota_object_map`,`funs_git`,`funs_plotting`) into `flaskapi/src/mmux_flaskapi/dakota/`; rewired blueprint imports + test mocks; removed `mmux-python` workspace dep + 6 dead transitive deps (gitpython,httpx,ipykernel,matplotlib,seaborn,tqdm) + `[tool.uv.workspace]`/`[tool.uv.sources]`/coverage-omit from `flaskapi/pyproject.toml`; stripped `setup-mmux-python`/`get-access-write-on-mmux-python` Makefile targets + `MMUX_PYTHON_TAG` pin + gitignore entries; `rm -rf flaskapi/mmux_python/`; eliminates the T1 drift class entirely (no more separate versioned dep to go stale)|V5,flaskapi/SPEC.md T15
T22|.|SuMo validation statistical rigor: paired t-test (prediction bias) + convergence analysis (accuracy vs sample size) in cross-validation flow|flaskapi/SPEC.md T18,node/SPEC.md T20
T23|.|sensitivity/correlation indices from UQ Monte Carlo samples, single multi-param view (#470, beyond 3-param 1D/2D/3D limit)|flaskapi/SPEC.md T19,node/SPEC.md T21
T24|x|fix B4: `docker-compose-development.yml` & `docker-compose-local.yml` `mmux-vite-app.depends_on` → long form `condition: service_healthy` for both `mmux-vite-backend`/`mmux-vite-web` (mirrors ooil-generated `docker-compose.yml`), so local dev stacks satisfy V3 like production does|V3,B4

## §B
id|date|cause|fix
B1|2026-06-22|#475 `node/playwright.config.ts` `toHaveScreenshot` comment said the default 5s stabilization window is too tight for Plotly/DataGrid but never set a `timeout` → snapshot gen/compare flaky on slow CI hosts|V14
B2|2026-06-22|#475 e2e `resetPersistence` posts `/flask/text-file` (no trailing slash); route is registered as `/` under that prefix → 308 redirect round-trip (the strict_slashes class fixed at proxy level in node/SPEC.md B13)|V15
B4|2026-07-06|`docker-compose-development.yml` & `docker-compose-local.yml` `mmux-vite-app.depends_on` used plain list form (`service_started` semantics) instead of `condition: service_healthy`, unlike the ooil-generated `docker-compose.yml` which already sets `condition: service_healthy` for both upstreams — violates already-stated V3; Caddy accepted traffic before `mmux-vite-backend`/`mmux-vite-web` passed their `HEALTHCHECK` (30s interval, 20s start-period), producing transient `"no upstreams available"` 503s on every local stack (re)start, misdiagnosed as a networking/port-forwarding fault before being traced here|V3
B5|2026-07-06|`node/vite.config.ts` forced `server.origin` to `http://0.0.0.0:8080` and `docker-compose-development.yml` did not pass `APP_PORT` into `mmux-vite-web`; when Caddy published the app on fallback host ports like 8889/8890, Vite still emitted dev-client socket/internal-origin hints for `localhost:8080`, so the page HTML/API routes were reachable but browser dev assets/HMR did not consistently stay on the printed `APP_PORT` origin|V17
B6|2026-07-06|`make run-develop-uq-write` could launch `docker-compose-development.yml` with no `.env` and no exported `OSPARC_API_{BASE_URL,KEY,SECRET}`; Compose substituted blank strings, backend health still returned 200, but the browser later failed `GET /flask/osparc/list_functions` with 422 and looked like `localhost:8890` was broken|V18
