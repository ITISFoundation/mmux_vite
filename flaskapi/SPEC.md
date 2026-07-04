# SPEC — MMUX backend (flaskapi/)

Caveman-encoded. Distilled from code 2026-05-28. Child of root spec.

## LINKS
- parent → [`../SPEC.md`](../SPEC.md) — orchestration, services, version
- sibling → [`../node/SPEC.md`](../node/SPEC.md) — frontend that consumes this `/flask/*` API

## §G
Flask API: relay frontend ↔ oSPARC (functions, jobs, collections, studies), generate samples (LHS / grid / single), run Dakota meta-modeling (SUMO surrogate, UQ propagation, MOGA optimization), persist state text files. Serve under `/flask/*`, port 5000.

## §C
- Python 3.11, `flask==3.1.1`, `flask-cors==6.0.0`, `gevent==25.5.1`
- run: dev `uv run python -m flask run` (entrypoint.sh), prod `uvx gunicorn main:app` (`main:app = create_flask_app()`)
- oSPARC client `osparc==0.8.3.post0.dev30`; Dakota `itis-dakota==1.5.9`
- numerics: `numpy==2.2.6`, `pandas==2.2.3`, `scipy==1.15.3`, `scikit-learn==1.6.1`
- `mmux_flaskapi.dakota` subpackage (inlined, own module namespace) → Dakota conf generation + result evaluation + `lhs()` — was vendored `mmux_python` dep, ported in-repo (§T15)
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
api: GET `/download_job_collection_csv?JobCollectionUid=` → text/csv (metadata preamble lines + jobs table; preamble = `# key,value`, table = inputs+outputs cols) — distilled from feature/local-functions, port (§T6)
--- textfile_bp `/flask/text-file` ---
api: POST `/` `{filename,content}` → `{status:"success",filename}`
api: GET `/<filename>` → `{filename,content}` | 404
--- sampling_bp `/flask/sampling` ---
api: POST `/lhs` `{funUid,config[{variable,start,end}],seed,n}` → job collection (camelCase)
api: POST `/grid` `{funUid,config[{variable,start,end,steps}]}` → job collection
api: POST `/test_job` `{funUid,config[{variable,value}]}` → job {status,inputs,outputs}
api: POST `/clone_job` `{functionName,projectJobId,projectInputs}` → study
api: POST `/upload_job_collection_csv` `{csvContent}` → parse preamble+table → reconstruct job collection; ? create local function from source if uid ∉ oSPARC (local_job_store) — distilled from feature/local-functions, port (§T6)
--- dakota_bp `/flask/dakota` ---
api: POST `/sumo_cross_validation` `{inputVars[],output,FunctionJobs[]}` → `{outputName,outputNameHat,outputNameStdHat}`
api: POST `/manual_uq_propagation_with_uncertainty` `{output,inputVars[],distributions,numSamples,FunctionJobs[],nHistograms,seed}` → histogram+box stats
api: POST `/sumo_along_axes` `{output,inputs[],FunctionJobs[],sliderValues?}` → `{predictions:{var:{x,yHat,stdHat}}}`
api: POST `/sumo_grid_evaluation` `{output,gridVars[],inputVars[],FunctionJobs[],sliderValues?}` → `{gridData}`
api: POST `/get_sumo_cv_accuracy_metrics` `{inputs[],output,FunctionJobs[]}` → `{metrics,tTest?:{statistic,pValue},convergence:[{nSamples,metric}]}` — computed from `evaluate_sumo_manual_crossvalidation`'s actual/predicted arrays (⊥ Dakota stdout log parsing, see B11)
api: POST `/perform_moga_optimization` `{inputVars[],distributions,outputVarSelection{var:minimize|maximize},FunctionJobs[]}` → `{optimizationResults}`
--- env ---
env: `OSPARC_API_BASE_URL`,`OSPARC_API_KEY`,`OSPARC_API_SECRET` ! set
env: `SERVICE_MODE`,`PERMISSIONS`,`DEPLOYMENT_MODE` (surfaced by deployment_bp)
env: `OSPARC_NODE_ID`,`OSPARC_STUDY_ID` ? (req when DEPLOYMENT_MODE=OSPARC, else "null")
env: `LOG_LEVEL` ? default `DEBUG`
--- lib mmux_flaskapi.dakota public surface (inlined subpackage, `src/mmux_flaskapi/dakota/`) ---
lib: `lhs(n,k,seed)` → normalized [0,1] sample matrix
lib: `create_grid_samples()`,`create_manual_uq_samples()`,`create_samples_along_axes()`
lib: `DakotaObject.run(conf,output_dir)` → subprocess `dakota.environment.study()`
lib: `create_{sumo_evaluation|sumo_crossvalidation|sumo_manual_crossvalidation|moga_optimization|uq_propagation}_conffile()`
lib: `evaluate_sumo()`,`evaluate_sumo_along_axes()`,`evaluate_sumo_on_grid()`,`evaluate_sumo_crossvalidation()`,`evaluate_sumo_manual_crossvalidation()`,`perform_moga_optimization()`,`propagate_uq()`
--- util surface (distilled from feature/local-functions, to port) ---
util: `utils/local_job_store.py` → JSON-backed store for synthetic local functions/collections/jobs (no live oSPARC). uid-prefix detect `is_local_function_uid`/`is_local_job_collection_uid`/`is_local_job_uid`; CRUD `create_local_function`/`create_local_job_collection`/`list_local_*`/`get_local_*`/`list_local_jobs_for_collection` (§T7)
util: `utils/case_preserving.py` → `PreserveCaseTransform`, `FunctionVariablesDict`/`FunctionVariableStr` wrappers, `has_preserve_case_metadata(metadata)` → keep orig variable-name case through serialization (§T8)
util: `json_serializer.recursive_dict_keys_snake_to_camel(d, preserve_nested_keys={"inputs","outputs","default_inputs","properties"})` → value-key dicts ∉ snake↔camel convert (§T8)

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
V13: response serializer ⊥ snake↔camel-convert keys ∈ value dicts `{inputs,outputs,default_inputs,properties}` (these are data/variable names, not API fields) — distilled, to port (§T8)
V14: orig variable-name case preserved through `DataPreprocessor` x1..xn round-trip + serialization (⊥ lowercase); preserve-case driven by function metadata (`has_preserve_case_metadata`) — distilled, to port (§T8)
V15: `DEPLOYMENT_MODE=LOCAL` ⇒ functions/collections/jobs MAY resolve from `local_job_store` w/o live oSPARC; uid-prefix routes local-vs-oSPARC ∀ osparc/sampling/dakota lookup — distilled, to port (§T7)
V16: log-scale per-variable flag (from request payload) reaches Dakota preprocessing → sample/train in log space, inverse on response (⊥ train linear when UI=log) — distilled, to port (§T9, node/SPEC.md V12)
--- review-backprop invariants (Copilot review on #467; bugs §B1-B5, fixes §T10-T14) ---
V17: `local_job_store` dir anchored to explicit base (env `LOCAL_STORE_DIR` or `Path(__file__).resolve().parents[N]`), ⊥ `Path.cwd()`-derived; mkdir deferred to first write + `parents=True` (B1)
V18: response ⊥ emit same datum under both snake+camel key when global serializer camel-converts (⊥ pre-add `jobIds` beside `job_ids`) → ⊥ key-collision overwrite (B2)
V19: CSV cell parse ! raise ValueError w/ row+col ctx on unparseable non-blank cell; truly-blank → NaN sentinel, ⊥ silent `0.0` (⊥ feed accidental zeros to Dakota) (B4)
V20: `local_job_store._load_store` catches only `(OSError, json.JSONDecodeError)`; on corrupt JSON ! backup offending file, ⊥ silent reset-then-overwrite (⊥ unrecoverable loss) (B5)
V21: `_get_all_items` ! loop forever on empty page; empty `response.items` → break after current page, return accumulated items
V22: recursive dict key converters ! mutate input dict/list in-place; conversion returns new object, caller input preserved
V23: `sampling.test_job` polling exit depends on `job["status"]` string, not dict keys; `FAILURE` in status → break
V24: `_anonymize(s, n, m=None)` on non-empty `s` ! expose full string; omitted `m` always masks at least one char
V25: Dakota endpoints ! call `os.chdir()`; run dirs use explicit paths only, request cwd stays process-global and unchanged
V26: SuMo cross-validation accuracy response includes a paired t-test (`t_test.statistic`+`t_test.p_value`, camelCased `tTest.statistic`/`tTest.pValue`) via `scipy.stats.ttest_rel` on CV actual-vs-predicted residuals, surfacing systematic surrogate bias beyond scalar MAE/RMSE
V27: SuMo CV accuracy metrics response includes `convergence: [{n_samples,metric}]` (camelCased `nSamples`) — RMSE recomputed via `evaluate_sumo_manual_crossvalidation` reruns at ≤5 evenly-spaced training-sample-count subsets (`compute_cv_convergence`, capped `max_points` to bound Dakota re-run cost), ⊥ single-N snapshot only
V28: correlation-indices endpoint computes per-input↔output Pearson+Spearman coefficients from the existing UQ Monte Carlo sample set (#470); one response covers ∀ input vars (⊥ 3-var limit of 1D/2D/3D plot views)

## §T
id|status|task|cites
T1|.|frontend expects `/flask/osparc/download_job_collection_csv` & `/flask/sampling/upload_job_collection_csv` — IMPLEMENTED on feature/local-functions; resolved-by → port via §T6|T6, ../node/SPEC.md T1
T2|x|`pyproject.toml` & `mmux_python/pyproject.toml` version `1.5.14` ≠ service `1.5.18`; add to `.bumpversion.cfg` or align — superseded by T15 (mmux_python removed, no more separate versioned pkg to drift)|../SPEC.md V5,T1,T15
T3|x|`/get_sumo_cv_accuracy_metrics` now consumed by frontend `SuMoValidation` view (bias banner + convergence curve, T18/../node/SPEC.md T20) — resolved|I,T18,../node/SPEC.md T20
T4|.|`tests/implementation instructions/` + `tests/logs/` in tests tree — relocate to `docs/` or gitignore|—
T5|.|add explicit test asserting all 5 blueprints + every route registered (guards V1)|V1
T6|.|PORT [topic=fullstack-csv] job-collection CSV import/export: GET `/osparc/download_job_collection_csv` (preamble+table) + POST `/sampling/upload_job_collection_csv` (parse→reconstruct). reuse branch helpers `_split_csv_preamble_and_table`/`_parse_uploaded_job_collection_csv`/`_job_collection_jobs_to_csv`; add tests|I, V13, ../node/SPEC.md T7
T7|.|PORT [topic=be-local-functions] `utils/local_job_store.py` + local resolution paths in osparc/sampling/dakota so DEPLOYMENT_MODE=LOCAL serves uploaded/synthetic functions offline; uid-prefix routing; tests|I, V15
T8|.|PORT [topic=be-preserve-case] `utils/case_preserving.py` + `json_serializer` `preserve_nested_keys` + `DataPreprocessor` orig-case round-trip; tests `test_utils_helpers`/`test_data_preprocessor`|I, V13, V14
T9|.|PORT [topic=fullstack-logscale] accept per-variable log-scale flag in dakota request models → preprocess sample/train in log space, inverse on response; tests|V16, ../node/SPEC.md V12
T10|.|fix B1 (#467): anchor `LOCAL_STORE_DIR` to env/`__file__`, defer `mkdir(parents=True)` to first write; test cwd-independence|V17,B1
T11|.|fix B2 (#467): drop manual `jobIds` (or the snake key), let global serializer convert `job_ids` once; test ⊥ double-key collision|V18,B2
T12|.|fix B3 (#467): gate `list_local_*` merges + per-id local branches (`osparc.py` ~94,135,160,185,224,348) on `DEPLOYMENT_MODE=LOCAL`; test OSPARC mode ⊥ surface `runs_local` state|V15,B3
T13|.|fix B4 (#467): `_parse_number` raise ValueError(row,col) on unparseable non-blank, blank→NaN; test rejects `"abc"`/swapped cols|V19,B4
T14|.|fix B5 (#467): narrow `_load_store` except to `(OSError, json.JSONDecodeError)`, backup before reset; test corrupt-json ⊥ wipe store|V20,B5
T15|x|PORT: inline vendored `mmux_python` → `src/mmux_flaskapi/dakota/` (6 used modules kept verbatim filenames: `lhs`,`dakota_object`,`funs_create_dakota_conf`,`funs_data_processing`,`funs_evaluate`,`wiofiles`; dropped 3 unused: `dakota_object_map`,`funs_git`,`funs_plotting`); rewrote internal cross-imports + blueprint imports (`dakota.py`,`sampling.py`) to `mmux_flaskapi.dakota.*`; removed `mmux-python` dep + `[tool.uv.workspace]`/`[tool.uv.sources]` + 6 dead transitive deps (gitpython,httpx,ipykernel,matplotlib,seaborn,tqdm) + coverage omit line from `pyproject.toml`; `uv sync` verified; full pytest suite green (439 passed) before+after|../SPEC.md T21,T2
T16|.|[topic=dakota-cleanup] dakota/ code-quality pass: fix known lhsmu/log_output/sanitize_varnames bugs (flagged in #477 review) w/ regression tests; raise dakota/ subpackage test coverage; deliberately do NOT invest in `funs_create_dakota_conf.py` — input-file-generation logic likely superseded by Dakota's new JSON input format (T17)|—
T17|.|RESEARCH: Dakota 6.24.0 introduced experimental JSON-format input files (`-json` CLI arg, Pydantic schema `python/dakota/spec/`; legacy NIDR parser deprecated but still available via `-parser legacy`) as the likely eventual replacement for `funs_create_dakota_conf.py`'s string-templated NIDR generation; evaluate migration once the JSON schema stabilizes (⊥ NIDR removed yet) — deferred, pairs T16|T16
T18|x|SuMo validation statistical rigor: (a) paired t-test on CV actual-vs-predicted residuals → surface bias significance (statistic+p-value) alongside MAE/RMSE in `/get_sumo_cv_accuracy_metrics`; (b) convergence analysis: rerun CV metrics at increasing training-sample-count subsets, expose `{n_samples,metric}` series for accuracy-vs-N plotting; tests|V26,V27,../node/SPEC.md T20
T19|.|correlation/sensitivity indices (#470): new endpoint computing per-input↔output Pearson+Spearman correlation from existing UQ Monte Carlo samples; single-plot multi-param sensitivity view (beyond current 3-param 1D/2D/3D limit); tests|V28,../node/SPEC.md T21

## §B
id|date|cause|fix
B1|2026-06-16|#467 `local_job_store` `LOCAL_STORE_DIR=Path.cwd().parent.parent.parent` at import → cwd-dependent unpredictable path (pytest cwd ≠ container cwd), `mkdir` no `parents`|V17
B2|2026-06-16|#467 `osparc.py` normalized collection emits both `jobIds`+`job_ids`; global camel serializer rewrites `job_ids`→`jobIds` → key collision, one silently overwrites (iteration-order dependent)|V18
B3|2026-06-16|#467 `osparc.py` local fn/collection merges + per-id branches run unconditionally ∀ `DEPLOYMENT_MODE` → OSPARC deploy leaks leftover `runs_local` state, violates V15|V15
B4|2026-06-16|#467 `sampling._parse_number` swallows unparseable cell → `0.0` → silent scientific-data corruption (job looks completed w/ zeros fed to Dakota)|V19
B5|2026-06-16|#467 `local_job_store._load_store` bare `except Exception`→empty store; next `_save_store` overwrites corrupt file → unrecoverable loss of saved functions/collections/jobs|V20
B6|2026-06-19|old `_get_all_items` `while retrieved < list_len` had no empty-page guard → paginated oSPARC listing could spin forever on `items=[]`|V21
B7|2026-06-19|recursive camel/snake key converters mutated caller dict while walking nested structures → hidden side effects on shared payloads|V22
B8|2026-06-19|`sampling.test_job` loop checked `"FAILURE" not in job` (dict keys) instead of `job["status"]` → failed jobs could keep polling|V23
B9|2026-06-19|`OsparcApi._anonymize` default `m=None` could fully expose short strings → logging leaked whole secret prefix|V24
B10|2026-06-19|Dakota endpoints called `os.chdir()` per request → process-global cwd mutation and request cross-talk risk|V25
B11|2026-06-19|`evaluate_sumo_crossvalidation`'s `log_output` was hardcoded `""` → `_parse_crossvalidation_outputlogs` never had real Dakota stdout to parse → `/get_sumo_cv_accuracy_metrics` always fell through to "No surrogate quality metrics found.", never returned real metrics in production; fixed by switching the endpoint to reuse the already-working `evaluate_sumo_manual_crossvalidation` compute path (actual/predicted arrays) instead of Dakota log parsing|V26,V27
