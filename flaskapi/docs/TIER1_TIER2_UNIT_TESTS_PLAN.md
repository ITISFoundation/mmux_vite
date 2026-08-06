# Tier 1, 2 & 3: Tests for the MMUX Metamodeling Backend

## Scope

Standard code-level tests for the MMUX solver backend, organized around the actual metamodeling
workflow it implements — **LHS sampling → grid/axis sampling → surrogate model building →
cross-validation → uncertainty quantification → (MOGA, deferred)** — rather than by source file.

- **Tier 1 & 2** are pure/near-pure function tests and their mathematical invariants. They run fast,
  need no Dakota execution, and are tagged `@pytest.mark.unit`.
- **Tier 3** is new: it runs the real Dakota solver (not mocked) against small analytical functions
  and checks the outputs match known answers. Tagged `@pytest.mark.analytical`, run as a distinct CI
  step since each test spawns a real Dakota subprocess.

None of this is the V&V report (`flaskapi/docs/VERIFICATION_VALIDATION_PLAN.md`) — that remains a
later, separate deliverable (full analytical test-function suite F1–F8, pass/fail tables, plots,
MOGA). Tier 3 here is a narrow, report-free slice of that same idea, scoped to what's needed now.

---

## Tier 1: Direct Unit Tests (No Dakota Dependency)

### 1. LHS Sampling (`lhs.py`)

**`lhs(n, k, method, seed) -> np.ndarray`**
- Output shape: `(k, n)` — k samples, n dimensions
- Values in `[0, 1]`
- **Stratification**: each column has exactly one sample in each interval `[i/k, (i+1)/k]`
- **Reproducibility**: same seed → identical output
- **Maximin**: `_lhsmaximin` produces larger min pairwise distance than `_lhsclassic`
- **Correlation**: `_lhscorrelate` produces smaller max off-diagonal correlation than `_lhsclassic`
- **Centered**: all values at interval midpoints `(i + 0.5) / k`

### 2. Grid & Axis Sweep Sampling (`funs_data_processing.py`)

**`create_grid_samples(run_dir, grid_vars, input_vars, mins, cut_values, maxs, n_points_per_dimension) -> Path`**
- 2D grid, 3 points per dim → 9 total points
- 3D grid, 2 points per dim → 8 total points
- Non-grid variables fixed at cut values
- Output values within `[min, max]` bounds
- File is written and readable

**`create_samples_along_axes(run_dir, data, input_vars, NSAMPLESPERVAR, cut_values) -> Path`**
- 2 input vars, 10 samples per var → 20 total points
- Sweep variable varies linearly from min to max
- Non-sweep variables fixed at cut value
- Output file dimensions match expected count

### 3. Surrogate Model Building (`funs_create_dakota_conf.py`)

**`add_surrogate_model(training_samples_file) -> str`**
- Contains `gaussian_process surfpack`
- Contains `import_build_points_file` with correct path
- Contains `export_approx_points_file "predictions.dat"`
- Contains `export_approx_variance_file "variances.dat"`
- With `cross_validation_folds` set: contains `cross_validation folds = N` and `metrics`

**`create_sumo_evaluation_conffile(build_file, samples_file, input_variables, output_responses) -> str`**
- Contains all expected blocks: environment, model, method, variables, responses
- Variable count matches `input_variables`
- Response descriptor matches `output_responses`

### 4. Cross-Validation (`funs_create_dakota_conf.py`, `funs_evaluate.py`)

**`create_sumo_crossvalidation_conffile(...) -> str`**
- Contains `cross_validation` block with the requested fold count
- Contains the expected metrics list (`root_mean_squared`, `sum_abs`, `mean_abs`, `max_abs`)

**`create_sumo_manual_crossvalidation_conffile(...) -> str`**
- Contains `import_build_points_file` referencing the training file
- Correctly encodes the provided validation indices (fold-out points)

**`_parse_crossvalidation_outputlogs(log_output, N_CROSS_VALIDATION) -> dict`**
- Valid Dakota CV log output → correct RMSE, MAE, max_abs, sum_abs extraction
- Empty log output → returns empty dict or "No surrogate quality metrics found"
- Malformed log output → handled without crash
- Multiple variables in log → correct per-variable extraction

### 5. Uncertainty Quantification (`funs_data_processing.py`, `funs_create_dakota_conf.py`)

**`create_manual_uq_samples(input_vars, distributions, num_samples, seed) -> dict`**
- Normal distribution: output mean ≈ input mean, output std ≈ input std (large N)
- Uniform distribution: output range ≈ [min, max]
- Constant distribution: all values equal to the constant
- Mixed distributions: correct types per variable

**`get_bounds_uniform_distributions(input_vars, distributions) -> tuple[list, list]`**
- Correct lower/upper bounds from uniform distributions
- Non-uniform distribution → raises ValueError

**`get_bounds_uniform_distribution(var, dist) -> tuple[float, float]`**
- Returns (min, max) for uniform
- Non-uniform → raises ValueError

**`create_uq_propagation_conffile(...)`**
- Contains `normal_uncertain` with correct means and std_deviations
- Contains `lhs` sampling with correct sample count

### 6. Data Filtering / Preprocessing (`funs_data_processing.py`, `data_preprocessor/`)

Supporting utility used across the workflow above, not a workflow stage on its own.

**`_filter_data(df, keep_idxs, filter_N_samples, filter_highest_N) -> pd.DataFrame`**
- `keep_idxs=[0,2,4]` → keeps rows 0, 2, 4
- `filter_N_samples=3` → keeps first 3 rows
- `filter_highest_N=2` → drops the 2 rows with the highest value in the target column
- Invalid index (out of range) → handled gracefully
- Empty filter criteria → returns original

**`DataPreprocessor`** — roundtrip fidelity (see Tier 2, P3/P6)

---

## Tier 2: Property-Based / Invariant Tests

These verify mathematical properties that must hold regardless of specific inputs.

### P1. LHS Invariants
- **Stratification**: for each column, `np.histogram(col, bins=k)` produces exactly 1 count per bin
- **Bounds**: `0 ≤ lhs[i,j] ≤ 1` for all i, j
- **Permutation**: each column is a permutation of its stratified intervals (no two points in the same interval for the same variable)
- **Maximin monotonicity**: `_lhsmaximin` min distance ≥ `_lhsclassic` min distance (for same iter count)

### P2. Grid Sample Invariants
- Total points = `∏ n_points_per_dimension[i]` for grid variables
- All grid variable values within `[min, max]`
- Non-grid variable values exactly equal to cut values
- For 2D grid: `np.meshgrid` consistency (row/column ordering matches reshaped output)

### P3. Axis Sweep Invariants
- Total points = `NSAMPLESPERVAR × len(input_vars)`
- Sweep variable varies monotonically from min to max
- Non-sweep variables constant at cut value
- Sweep spacing is uniform (equal differences between consecutive points)

### P4. DataPreprocessor Roundtrip
- `inverse_transform(transform(df)) ≈ df` for any valid config (z-score or min-max)
- After z-score transform: column means ≈ 0, column stds ≈ 1
- After min-max transform: column ranges = [0, 1]
- With sign switching: roundtrip still exact

### P5. Normalization Invariants
- Z-score: `(x - mean) / std` produces mean ≈ 0, std ≈ 1 across a representative sample
- Min-max: `(x - min) / (max - min)` produces range [0, 1]
- Sign flip: negating a variable and then negating again returns original

---

## Tier 3: Analytical Integration Tests (Real Dakota)

Unlike Tiers 1–2, these run the **real** Dakota solver (`itis-dakota`, no mocking) end-to-end against
small analytical functions with known closed-form answers, and assert the outputs match. This is the
"give it inputs, check the outputs are what we expect" layer — a narrow, report-free precursor to the
full `VERIFICATION_VALIDATION_PLAN.md` (which remains the later, separate deliverable: F1–F8 test
functions, Categories A–H, pass/fail tables, plots, MOGA).

Location: `flaskapi/tests/test_metamodeling_analytical.py`. All tests tagged `@pytest.mark.analytical`
and excluded from the default `make test-flaskapi` run (see Implementation) since each spawns a real
Dakota subprocess.

**Implementation note:** `add_surrogate_model` only omits the `eval_id` tabular column when the
training file path contains `"processed"` (`funs_create_dakota_conf.py:180`) — fixture files must be
named e.g. `train_processed.txt`, matching the convention `funs_data_processing.py` already uses.

| Test | Function under test | Analytical case | Pass criteria |
|------|---------------------|------------------|----------------|
| Surrogate — linear | `evaluate_sumo` | `f(x) = 2x + 1` | predictions match analytical `f(x)` to tight tolerance (exact GP interpolation) |
| Surrogate — quadratic | `evaluate_sumo` | `f(x) = x²` | predictions match analytical `f(x)` within a looser tolerance |
| Grid evaluation | `evaluate_sumo_on_grid` | `f(x,y) = x + y` | predictions match analytically on a small 2D grid; output shape as expected |
| Cross-validation | `evaluate_sumo_crossvalidation` | well-sampled `f(x) = 2x + 1` | parsed RMSE ≈ 0 (real Dakota CV log, not synthetic) |
| UQ propagation | `propagate_uq` | `f(x) = 2x+1`, `x ~ N(0,1)` | output mean ≈ 1, std ≈ 2 within tolerance |

MOGA (Category G equivalent) is out of scope for this tier — see Deferred section below.

---

## Deferred — MOGA / Pareto (not this round)

MOGA is lower priority for now. The following already exist and keep passing, but are grouped
separately (bottom of their respective test files, under a `DEFERRED` banner) to signal they're not
part of the current tailoring effort. No new work is planned here until MOGA is picked back up.

**`is_dominated(point, other_points) -> bool`** (`funs_data_processing.py`)
- Dominated / not dominated / self-dominance (reflexive, since the implementation uses `>=`) / multi-objective cases

**`get_non_dominated_indices(data, optimized_vars, optimization_modes, sort_by_column) -> list[int]`**
- Known 2D Pareto front, maximization via sign-flip, all-points-on-front, single-point, mixed modes

**`create_moga_optimization_conffile(...)` / `add_moga_method(...)`** (`funs_create_dakota_conf.py`)
- Contains `moga` method with correct parameters and variable bounds

**Tier 2 — Pareto Dominance Invariants (P1, formerly)**
- Reflexivity, asymmetry, transitivity, non-dominated-set completeness/no-internal-domination, max-mode correctness

When MOGA work resumes, extend Tier 3 with a Category-G-equivalent (Pareto front correctness,
convergence, bound compliance) reusing `VERIFICATION_VALIDATION_PLAN.md`'s G1–G4.

---

## Implementation

- **Framework**: pytest (already configured in `pyproject.toml`)
- **Locations**:
  - Tier 1: `flaskapi/tests/test_unit_solver.py`
  - Tier 2: `flaskapi/tests/test_property_invariants.py`
  - Tier 3: `flaskapi/tests/test_metamodeling_analytical.py`
- **Fixtures**: use `tmp_path` for file I/O tests; no Dakota mocking needed anywhere (Tier 1/2 don't
  touch Dakota at all; Tier 3 deliberately runs the real solver)
- **Parametrize**: use `@pytest.mark.parametrize` for multi-case tests
- **Markers**: `@pytest.mark.unit` for Tier 1/2, `@pytest.mark.analytical` for Tier 3
- **CI**: `make test-flaskapi` runs `-m "not analytical"` (fast, default); a separate
  `make test-flaskapi-analytical` step runs `-m analytical` in the same `flaskapi-tests` CI job

## Test Count Estimate

| Category | Tests |
|----------|-------|
| LHS sampling | ~10 |
| Grid & sweep sampling | ~8 |
| Surrogate model building | ~6 |
| Cross-validation (config + parsing) | ~9 |
| Uncertainty quantification | ~9 |
| Data filtering / preprocessing | ~9 |
| Property invariants (P1–P5) | ~19 |
| Deferred — MOGA / Pareto | ~14 |
| **Tier 1+2 total** | **~84** |
| Tier 3 — analytical integration | ~5 |
