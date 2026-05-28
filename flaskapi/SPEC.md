# SPEC — MMUX backend (flaskapi/)

Caveman-encoded. Distilled from code 2026-05-28. Child of root spec.

## LINKS
- parent → [`../SPEC.md`](../SPEC.md) — orchestration, services, version
- sibling → [`../node/SPEC.md`](../node/SPEC.md) — frontend that consumes this `/flask/*` API
- vendored lib → `mmux_python/` (own git repo; Dakota conf-gen + evaluate)

## §G
Flask API: relay frontend ↔ oSPARC (functions, jobs, collections, studies), generate samples (LHS / grid / single), run Dakota meta-modeling (SUMO surrogate, UQ propagation, MOGA optimization), persist state text files. Serve under `/flask/*`, port 5000.

## §C
- Python 3.11, `flask==3.1.1`, `flask-cors==6.0.0`, `gevent==25.5.1`
- run: dev `uv run python -m flask run` (entrypoint.sh), prod `uvx gunicorn main:app` (`main:app = create_flask_app()`)
- oSPARC client `osparc==0.8.3.post0.dev30`; Dakota `itis-dakota==1.5.9`
- numerics: `numpy==2.2.6`, `pandas==2.2.3`, `scipy==1.15.3`, `scikit-learn==1.6.1`
- workspace dep `mmux_python` (local pkg) → Dakota conf generation + result evaluation + `lhs()`
- requests accept camelCase|snake_case (pydantic `populate_by_name`); responses camelCase
- `DataPreprocessor` maps orig var names → `x1..xn`,`y1..yn` for Dakota, inverse on response
- ≥5 completed jobs required for any surrogate/UQ/MOGA endpoint
- ruff line-length 100, select E/F/I/UP; pytest markers slow/integration/unit; coverage aim ≥70% on modified code (soft)
- naming: Classes PascalCase | funcs/methods snake_case | constants CONSTANT_CASE | private `_`prefix
- type hints + PEP257/NumPy docstrings on public APIs; raise ValueError/RuntimeError w/ descriptive msg; log via `utils/logger.py`

## §I
parent: [`../SPEC.md`](../SPEC.md) ; frontend consumer: [`../node/SPEC.md`](../node/SPEC.md) §I
factory: `create_flask_app() -> MMUXFlask` registers 5 blueprints under `/flask`
--- deployment_bp `/flask/deployment` ---
api: GET `/health` → 200 `{status:"healthy"}` (docker healthcheck)
api: GET `/service-mode` → `{service_mode:<env SERVICE_MODE>}`
api: GET `/permissions` → `{permissions:<env PERMISSIONS>}`
api: GET `/mode` → `{deployment_mode:<env DEPLOYMENT_MODE>}`
--- osparc_bp `/flask/osparc` ---
api: GET `/list_functions` → Function[]
api: GET `/list_jobs` → FunctionJob[]
api: GET `/list_function_job_collections` → Collection[]
api: GET `/list_function_jobs_for_functionid?functionUid=` → FunctionJob[] (+status each)
api: GET `/list_function_jobs_for_jobcollectionid?JobCollectionUid=` → FunctionJob[]
api: GET `/list_function_job_collections_for_functionid?functionUid=` → Collection[]
api: GET `/get_function_job?jobUid=` → `{uid,status,outputs}`
api: GET `/get_function_job_status?jobUid=` → `{status}`
api: GET `/get_function_job_outputs?jobUid=` → outputs
--- textfile_bp `/flask/text-file` ---
api: POST `/` `{filename,content}` → `{status:"success",filename}`
api: GET `/<filename>` → `{filename,content}` | 404
--- sampling_bp `/flask/sampling` ---
api: POST `/lhs` `{funUid,config[{variable,start,end}],seed,n}` → job collection (camelCase)
api: POST `/grid` `{funUid,config[{variable,start,end,steps}]}` → job collection
api: POST `/test_job` `{funUid,config[{variable,value}]}` → job {status,inputs,outputs}
api: POST `/clone_job` `{functionName,projectJobId,projectInputs}` → study
--- dakota_bp `/flask/dakota` ---
api: POST `/sumo_cross_validation` `{inputVars[],output,FunctionJobs[]}` → `{outputName,outputNameHat,outputNameStdHat}`
api: POST `/manual_uq_propagation_with_uncertainty` `{output,inputVars[],distributions,numSamples,FunctionJobs[],nHistograms,seed}` → histogram+box stats
api: POST `/sumo_along_axes` `{output,inputs[],FunctionJobs[],sliderValues?}` → `{predictions:{var:{x,yHat,stdHat}}}`
api: POST `/sumo_grid_evaluation` `{output,gridVars[],inputVars[],FunctionJobs[],sliderValues?}` → `{gridData}`
api: POST `/get_sumo_cv_accuracy_metrics` `{inputs[],output,FunctionJobs[]}` → `{metrics}`
api: POST `/perform_moga_optimization` `{inputVars[],distributions,outputVarSelection{var:minimize|maximize},FunctionJobs[]}` → `{optimizationResults}`
--- env ---
env: `OSPARC_API_BASE_URL`,`OSPARC_API_KEY`,`OSPARC_API_SECRET` ! set
env: `SERVICE_MODE`,`PERMISSIONS`,`DEPLOYMENT_MODE` (surfaced by deployment_bp)
env: `OSPARC_NODE_ID`,`OSPARC_STUDY_ID` ? (req when DEPLOYMENT_MODE=OSPARC, else "null")
env: `LOG_LEVEL` ? default `DEBUG`
--- lib mmux_python public surface ---
lib: `lhs(n,k,seed)` → normalized [0,1] sample matrix
lib: `create_grid_samples()`,`create_manual_uq_samples()`,`create_samples_along_axes()`
lib: `DakotaObject.run(conf,output_dir)` → subprocess `dakota.environment.study()`
lib: `create_{sumo_evaluation|sumo_crossvalidation|sumo_manual_crossvalidation|moga_optimization|uq_propagation}_conffile()`
lib: `evaluate_sumo()`,`evaluate_sumo_along_axes()`,`evaluate_sumo_on_grid()`,`evaluate_sumo_crossvalidation()`,`evaluate_sumo_manual_crossvalidation()`,`perform_moga_optimization()`,`propagate_uq()`

## §V
V1: `create_flask_app()` registers exactly 5 bp {deployment,osparc,text-file,sampling,dakota} under `/flask/*`
V2: ∀ dakota endpoint → ≥5 completed jobs else 400; job complete ⟺ `status.lower() ∈ {"completed","success"}`
V3: requests parse camelCase|snake_case (pydantic `populate_by_name=True`); JSON responses camelCase (e.g. `drag_force` → `dragForce`)
V4: `DataPreprocessor` maps orig→`x1..`,`y1..` before Dakota, `inverse_transform` back on response; mapping persisted `preprocessor_config.json`
V5: UQ-with-uncertainty needs `{output}_std_hat` in job outputs (surrogate uncertainty); uses `scipy.special.erfinv`
V6: MOGA `maximize` objective → sign-switch to internal minimize, inverse on result
V7: `DEPLOYMENT_MODE=LOCAL` → parent node/project ids = `"null"`; `=OSPARC` → read `OSPARC_NODE_ID`/`OSPARC_STUDY_ID`; other → ValueError
V8: text-file `filename` rejects path separators (⊥ traversal); root `/text-files/`
V9: GET `/health` → 200 `{status:"healthy"}` (matches docker HEALTHCHECK & Caddy `health_uri`)
V10: `OSPARC_API_{BASE_URL,KEY,SECRET}` ! set → `OsparcApi` init (BASE_URL `.rstrip("/")`)
V11: error map (`@api_endpoint`): KeyError→400, ValueError→422, OsparcApiException→its status, else→500
V12: sampling executes via oSPARC `functions_api.map_function(...)` (lhs/grid) / `run_function(...)` (test_job), inputs validated by `validate_function_inputs`

## §T
id|status|task|cites
T1|.|frontend expects `/flask/osparc/download_job_collection_csv` & `/flask/sampling/upload_job_collection_csv` — ⊥ implemented; add routes or coordinate removal|../node/SPEC.md T1, I
T2|.|`pyproject.toml` & `mmux_python/pyproject.toml` version `1.5.14` ≠ service `1.5.18`; add to `.bumpversion.cfg` or align|../SPEC.md V5,T1
T3|.|`/get_sumo_cv_accuracy_metrics` not consumed by frontend — confirm used (tests?) or mark dead|I
T4|.|`tests/implementation instructions/` + `tests/logs/` in tests tree — relocate to `docs/` or gitignore|—
T5|.|add explicit test asserting all 5 blueprints + every route registered (guards V1)|V1

## §B
id|date|cause|fix
