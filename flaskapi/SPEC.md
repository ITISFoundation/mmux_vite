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
- type checker: `ty` (astral-sh/ty), config via `[tool.ty]` in pyproject.toml; strictness/rule-level TBD in §T18

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
api: POST `/get_sumo_cv_accuracy_metrics` `{inputs[],output,FunctionJobs[]}` → `{metrics}`
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
V2: ∀ dakota endpoint → ≥`max(5, len(input_vars)+1)` completed jobs else 400 (dimension-scaled minimum, V30); job complete ⟺ `status.lower() ∈ {"completed","success"}`
V3: requests parse camelCase|snake_case (pydantic `populate_by_name=True`); JSON responses camelCase (e.g. `drag_force` → `dragForce`)
V4: `DataPreprocessor` maps orig→`x1..`,`y1..` before Dakota, `inverse_transform` back on response; mapping persisted `preprocessor_config.json`
V5: UQ-with-uncertainty needs `{output}_std_hat` in job outputs (surrogate uncertainty); uses `scipy.special.erfinv`, noise `r = sqrt(2)*erfinv(uniform(-1,1))` (~N(0,1); Phi(x) = (1+erf(x/sqrt(2)))/2 — closes B16, V29)
V6: MOGA `maximize` objective → sign-switch to internal minimize, inverse on result
V7: `DEPLOYMENT_MODE=LOCAL` → parent node/project ids = `"null"`; `=OSPARC` → read `OSPARC_NODE_ID`/`OSPARC_STUDY_ID`; other → ValueError
V8: text-file `filename` rejects path separators (⊥ traversal); root `/text-files/`
V9: GET `/health` → 200 `{status:"healthy"}` (matches docker HEALTHCHECK & Caddy `health_uri`)
V10: `OSPARC_API_{BASE_URL,KEY,SECRET}` ! set → `OsparcApi` init (BASE_URL `.rstrip("/")`)
V11: error map (`@api_endpoint`): KeyError→400, ValueError→422, OsparcApiException→its status, else→500
V12: sampling executes via oSPARC `functions_api.map_function(...)` (lhs/grid) / `run_function(...)` (test_job), inputs validated by `validate_function_inputs`
V13: request parser + response serializer ⊥ snake↔camel-convert keys ∈ value dicts `{inputs,outputs,default_inputs,properties,slider_values,distributions,output_var_selection,project_inputs}` (these are data/variable names, not API fields); both directions share `helpers._DEFAULT_PRESERVE_NESTED_KEYS`/`preserve_nested_keys` param (§T8 done)
V14: orig variable-name case preserved through `DataPreprocessor` x1..xn round-trip + serialization (⊥ lowercase); preserve-case driven by function metadata (`has_preserve_case_metadata`) — distilled, to port (§T16, remaining half of former §T8)
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
V26: `recursive_dict_keys_{camel_to_snake,snake_to_camel}` ⊥ convert keys nested *inside* a `preserve_nested_keys` value-dict (default `_DEFAULT_PRESERVE_NESTED_KEYS`); param overridable, not hardcoded; applies uniformly to request parsing, response serialization, AND `_get_all_items`/`_get_first_N_items`/`_get_last_N_items` SDK ingestion since all route through these two functions (closes B11); FE `opaqueValueDictKeys` (`functionUtils.ts`, read-path only) ⊆ this set, asserted by cross-language test `test_preserve_nested_keys_matches_frontend_opaque_keys` — no shared runtime file (../node/SPEC.md V19)
V27: `create_manual_uq_samples` ! draw ∀ distribution sample via the seeded `np.random.Generator` (passed as scipy `random_state=`), never scipy's un-seeded global state — same seed + same request ⇒ byte-identical samples (closes B12)
V28: `get_osparc_api_if_connected()` logs the unreachable-backend WARNING once per unreachability episode (⊥ once per request/call while still down), re-arms (logs again) after a recovery + subsequent drop (closes B14)
V29: `r` (erfinv-based noise injected into UQ-with-uncertainty histogram realizations) must be `sqrt(2)*erfinv(uniform(-1,1))`, not bare `erfinv(...)` (std 1/sqrt(2)~=0.707, understates reported uncertainty ~29%) (closes B16)
V30: Dakota surfpack GP surrogate build aborts (MODEL_ERROR/exit-250) when training points ≤ input dimensionality; `required_completed_jobs(input_vars, floor=5) = max(floor, len(input_vars)+1)` gates all 6 job-consuming request models + `JobVariableSelection`, else clean 400 (closes B17)
V31: ∀ osparc.py endpoint keyed by a real (non-local) function/job-collection uid → `DEPLOYMENT_MODE=LOCAL` + unreachable oSPARC degrades to empty/local-only result (endpoints) or a 422 ValueError (`_function_schema_vars`), ⊥ unconditional `get_osparc_api()` call crashing as a 500 (closes B16)
V32: `_parse_uploaded_job_collection_csv` ⊥ accept a CSV data row whose cell count ≠ header cell count (⊥ silent `dict(zip(header,cells))` truncation/misalignment); mismatched row → `ValueError` w/ row context → 422 (closes B20)
V33: `local_job_store._save_store` ⊥ write directly to `LOCAL_STORE_FILE`; writes to a sibling temp file first, then atomically `os.replace()`s over the target (temp file cleaned up on failure) so an interrupted/concurrent write never leaves a partially-written store file (closes B20)
--- review-backprop invariants (dakota/ cleanup pass; bugs §B21-B23, fix/tests §T22) ---
V34: `lhs()` method dispatch uses exact-match comparison (⊥ substring/`in` membership on a bare string) ∀ branch, incl. `lhsmu` (B21)
V35: `evaluate_sumo_crossvalidation` log_output fed to `_parse_crossvalidation_outputlogs` reads the actual captured Dakota stdout (`run_dir/dakota_stdout.txt`, written by `DakotaObject.run`), ⊥ hardcoded empty string (B22)
V36: `sanitize_varnames` char-class preserves literal `-` (placed last in `[...]`, ⊥ mid-class forming an unintended `*-+` range); e.g. default `get_results` key `-AFpeak` survives sanitization (B23)
V37: `ty check src/mmux_flaskapi` passes with zero errors; enforced blocking in pre-commit (local hook, mirrors eslint-node) and CI (prek job)

## §T
id|status|task|cites
T1|.|frontend expects `/flask/osparc/download_job_collection_csv` & `/flask/sampling/upload_job_collection_csv` — IMPLEMENTED on feature/local-functions; resolved-by → port via §T6|T6, ../node/SPEC.md T1
T2|x|`pyproject.toml` & `mmux_python/pyproject.toml` version `1.5.14` ≠ service `1.5.18`; add to `.bumpversion.cfg` or align — superseded by T15 (mmux_python removed, no more separate versioned pkg to drift)|../SPEC.md V5,T1,T15
T3|.|`/get_sumo_cv_accuracy_metrics` not consumed by frontend — confirm used (tests?) or mark dead|I
T4|.|`tests/implementation instructions/` + `tests/logs/` in tests tree — relocate to `docs/` or gitignore|—
T5|.|add explicit test asserting all 5 blueprints + every route registered (guards V1)|V1
T6|.|PORT [topic=fullstack-csv] job-collection CSV import/export: GET `/osparc/download_job_collection_csv` (preamble+table) + POST `/sampling/upload_job_collection_csv` (parse→reconstruct). reuse branch helpers `_split_csv_preamble_and_table`/`_parse_uploaded_job_collection_csv`/`_job_collection_jobs_to_csv`; add tests|I, V13, ../node/SPEC.md T7
T7|.|PORT [topic=be-local-functions] `utils/local_job_store.py` + local resolution paths in osparc/sampling/dakota so DEPLOYMENT_MODE=LOCAL serves uploaded/synthetic functions offline; uid-prefix routing; tests|I, V15
T8|x|PORT [topic=be-preserve-case] `json_serializer`/`helpers` `preserve_nested_keys` half (request+response+ingestion, both directions); remaining `utils/case_preserving.py`+`DataPreprocessor` orig-case round-trip carved out to §T16; tests `test_utils_helpers.py::TestPreserveNestedKeysForVariableNames` + end-to-end `test_flask_dakota_workflows.py::test_moga_preserves_irregular_case_variable_name_end_to_end`|I, V13, V26, B11
T9|.|PORT [topic=fullstack-logscale] accept per-variable log-scale flag in dakota request models → preprocess sample/train in log space, inverse on response; tests|V16, ../node/SPEC.md V12
T10|.|fix B1 (#467): anchor `LOCAL_STORE_DIR` to env/`__file__`, defer `mkdir(parents=True)` to first write; test cwd-independence|V17,B1
T11|.|fix B2 (#467): drop manual `jobIds` (or the snake key), let global serializer convert `job_ids` once; test ⊥ double-key collision|V18,B2
T12|.|fix B3 (#467): gate `list_local_*` merges + per-id local branches (`osparc.py` ~94,135,160,185,224,348) on `DEPLOYMENT_MODE=LOCAL`; test OSPARC mode ⊥ surface `runs_local` state|V15,B3
T13|.|fix B4 (#467): `_parse_number` raise ValueError(row,col) on unparseable non-blank, blank→NaN; test rejects `"abc"`/swapped cols|V19,B4
T14|.|fix B5 (#467): narrow `_load_store` except to `(OSError, json.JSONDecodeError)`, backup before reset; test corrupt-json ⊥ wipe store|V20,B5
T15|x|PORT: inline vendored `mmux_python` → `src/mmux_flaskapi/dakota/` (6 used modules kept verbatim filenames: `lhs`,`dakota_object`,`funs_create_dakota_conf`,`funs_data_processing`,`funs_evaluate`,`wiofiles`; dropped 3 unused: `dakota_object_map`,`funs_git`,`funs_plotting`); rewrote internal cross-imports + blueprint imports (`dakota.py`,`sampling.py`) to `mmux_flaskapi.dakota.*`; removed `mmux-python` dep + `[tool.uv.workspace]`/`[tool.uv.sources]` + 6 dead transitive deps (gitpython,httpx,ipykernel,matplotlib,seaborn,tqdm) + coverage omit line from `pyproject.toml`; `uv sync` verified; full pytest suite green (439 passed) before+after|../SPEC.md T21,T2
T16|.|PORT [topic=be-preserve-case] remaining half of former T8: `utils/case_preserving.py` (`PreserveCaseTransform`/`FunctionVariablesDict`) + `DataPreprocessor` orig-case round-trip driven by function metadata (`has_preserve_case_metadata`) — NOT the Pydantic-wrapper design from closed/superseded PR #469 (its B8/B9, ../node/SPEC.md); design TBD|V14
T17|x|PR #487 review (wvangeit): strengthen `test_dakota_funs_data_processing.py` (V27) w/ a mixed-distribution-types regression test (normal+uniform vars sampled together in 1 seeded call) — existing cases only exercise 1 distribution type per call, future-proofs against a per-type-generator regression|V27
T18|x|fix B16: `flask_manual_uq_propagation_with_uncertainty` noise `r` scaled by `sqrt(2)` (was bare `erfinv(...)`, std 1/sqrt(2)~=0.707 not 1); regression test pins reported `std` to the injected `std_hat` (mocked `evaluate_sumo`) rather than `std_hat/sqrt(2)`. Backported from `jgo/uq-uncertainty-propagation` (simpler pre-T18-decomposition code path on this branch)|V5,V29,B16
T19|x|fix B17: add `required_completed_jobs(input_vars, floor=5) = max(floor, len(input_vars)+1)` helper (`dakota_models.py`) + apply to `JobVariableSelection` (via `minimum_completed_jobs` param, wired through `dakota.py`'s `_jobs_to_df` + `data_preprocessor_integration.py`) and all 6 request models' own hardcoded `< 5` checks (`SumoCrossValidationRequest`,`ManualUQPropagationRequest`,`SumoAlongAxesRequest`,`SumoGridEvaluationRequest`,`MOGAOptimizationRequest`,`SumoCVAccuracyMetricsRequest`); regression test (11 vars/11 jobs→400, 12 jobs→200). Backported from `jgo/uq-uncertainty-propagation`|V2,V30,B17
T20|x|PR #496 Copilot review: fix remaining `get_osparc_api()` unconditional-crash sites for real function/job-collection uids (`list_function_job_collections_for_functionid`, `list_function_jobs_for_functionid`, `_function_schema_vars`) + drop broad `except Exception`/`assert` in `upload_job_collection_csv`; tests|V29,B16
T21|x|backprop PR #496 Copilot review (remaining 2 open comments): reject CSV data rows whose cell count ≠ header (422 w/ row context, `_parse_uploaded_job_collection_csv`); make `local_job_store._save_store` atomic (temp file + `os.replace`, cleaned up on failure); tests|V32,V33,B20
T22|x|[topic=dakota-cleanup] dakota/ code-quality pass (jgo/dakota-cleanup): fix B21-B23 w/ regression tests; add `test_dakota_{lhs,wiofiles,funs_evaluate,funs_data_processing,object}.py` (0%→98% lhs.py, 21%→91% wiofiles.py, 74%→90% funs_evaluate.py, 70%→87% funs_data_processing.py, 80%→100% dakota_object.py); deliberately did NOT invest in `funs_create_dakota_conf.py` (61%, unchanged) — input-file-generation logic likely superseded by Dakota's new JSON input format (§R); full suite green (507 passed, 0 regressions)|V34,V35,V36,B21,B22,B23
T23|x|add `ty` (astral-sh) as flaskapi type checker: dev dep in pyproject.toml, `[tool.ty]` config, baseline-fix existing src/mmux_flaskapi (25 files, mixed type-hint coverage, ~22 legacy `# type: ignore` comments), untyped 3rd-party deps needing overrides (dakota.environment, itis-dakota, osparc, scikit-learn), local pre-commit hook (new flaskapi/scripts/run-ty-hook.sh mirroring eslint-node pattern, entry in .pre-commit-config.yaml scoped `files: ^flaskapi/`), Makefile targets (root + flaskapi/), CI wiring (.github/workflows/ci.yml prek job needs `make install-flaskapi-deps` before `uvx prek run` to let ty resolve imports); blocking in both pre-commit and CI; strictness/rule-level deferred to implementation time|V37

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
B11|2026-07-02|`to_snake_case_request`/`recursive_dict_keys_camel_to_snake` had no preserve-subtree exception (unlike FE's V24/B18 read-path fix) → any irregular-case variable name (e.g. "TissueConduc", not just "sigma_blood"-style all-lowercase) sent in `distributions`/`sliderValues`/`outputVarSelection`/`projectInputs`/job `inputs`/`outputs` got silently mangled on arrival; same gap independently found in `_get_all_items` ingestion (`max_depth=1` still recurses one level into variable-name dicts) and the global `after_request` response hook — all three route through the same two shared functions, fixed once|V26
B12|2026-07-06|`create_manual_uq_samples` (funs_data_processing.py) called `np.random.default_rng(seed=seed)` but discarded the returned `Generator` instead of assigning it; `scipy.stats.norm.rvs`/`uniform.rvs` then drew from scipy's un-seeded global random state — the documented `seed` request param (for reproducibility) silently had zero effect, two identical requests produced different UQ samples|V27
B13|2026-07-09|PR #495 Copilot review: `node/package-lock.json` carried unrelated `"peer": true` churn (~51 lines, different local npm version) alongside an unrelated flaskapi PR, no `package.json` dep change to justify it — noisy diff/merge-conflict risk|no §V (regenerated-artifact hygiene, not app behavior); reverted to match main
B14|2026-07-09|PR #495 Copilot review: `flask_list_functions` logged the LOCAL-mode unreachable-oSPARC fallback at WARNING on every request — an expected, recurring condition while a dev backend stays down, spamming logs|V28
B15|2026-07-09|PR #495 Copilot review: renamed test `test_is_connected_property_short_circuits_after_failure` kept `_property_` in its name though `is_connected` is a method, not a property — misleading re: the API shape|no §V (test-naming, mechanical); renamed to `test_is_connected_short_circuits_after_failure`
B16|2026-07-09|`flask_manual_uq_propagation_with_uncertainty` generated noise via bare `r = erfinv(uniform(-1,1))` w/o the `sqrt(2)` factor required by the inverse-Gaussian-CDF identity (`Phi(x) = (1+erf(x/sqrt(2)))/2`); understated reported uncertainty by ~29% (std 1/sqrt(2) not 1). Backported from `jgo/uq-uncertainty-propagation` (B16 there)|V5,V29
B17|2026-07-09|all 6 Dakota GP-surrogate-building request models validated a flat "≥5 completed jobs" regardless of input dimensionality; Dakota's surfpack GP surrogate build aborts (MODEL_ERROR/exit-250) once training points ≤ input dimensionality (e.g. 11 vars + 11 jobs), so high-dimensional requests could pass validation yet crash Dakota with an opaque "Dakota aborted: Unknown error 250". Backported from `jgo/uq-uncertainty-propagation` (B17 there)|V2,V30
B18|2026-07-09|PR #496 Copilot review: `list_function_job_collections_for_functionid`/`list_function_jobs_for_functionid`/`_function_schema_vars` called `get_osparc_api()` unconditionally for real (non-local) uids — in `DEPLOYMENT_MODE=LOCAL` w/ an unreachable backend this 500'd instead of degrading gracefully like the already-fixed `list_functions`/`list_function_job_collections`; `upload_job_collection_csv` also wrapped `parse_request_model(...)` in a broad `except Exception` (bypassing the registered `RequestParsingError` handler) and used `assert` for request validation (optimized away under `python -O`, surfaces as 500 not a controlled 4xx)|V29
B19|2026-07-09|Manually resolving the `origin/develop` (PR #495) merge conflict in `flask_list_functions` by uniformly picking develop's simpler hunk (predates the local_job_store/CSV-upload feature) silently dropped the `list_local_functions()` merge + its import that only existed on this branch — conflict markers resolved cleanly, file parsed/linted fine, no `git diff` review flagged it; caught only by re-running the full test suite (`test_local_functions_merged_in_local_mode`/`test_local_mode_degrades_gracefully_when_osparc_unreachable`) immediately after the merge|V15
B20|2026-07-09|PR #496 Copilot review (remaining 2 open comments): `_parse_uploaded_job_collection_csv` used `dict(zip(header,cells))` which silently truncates/misaligns a CSV data row whose cell count doesn't match the header instead of rejecting it; `local_job_store._save_store` wrote directly to the store file, risking a partially-written/corrupt file on an interrupted process or concurrent writers|V30,V31
B21|2026-07-04|`lhs.py` `elif method.lower() in ("lhsmu"):` — missing tuple comma made `("lhsmu")` a plain string, so `in` did substring-containment (e.g. `"u" in "lhsmu"` also True) instead of an exact-value check; flagged in #477 review, unresolved until now|V34
B22|2026-07-04|`funs_evaluate.evaluate_sumo_crossvalidation` hardcoded `log_output = ""` (stale "how to parse from stdout now?" TODO from #477 review) → cross-validation metrics parser always ran against an empty string, silently returning no metrics|V35
B23|2026-07-04|`funs_data_processing.sanitize_varnames` regex char-class `[^0-9a-zA-Z_*-+/]` placed `-` between `*` and `+`, forming an unintended range (matching only `*`/`+`) instead of a literal hyphen → real hyphens (e.g. default `get_results` key `-AFpeak`) were silently rewritten to `_`|V36
