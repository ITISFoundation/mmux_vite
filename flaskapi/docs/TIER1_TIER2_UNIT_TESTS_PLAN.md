# Tier 1 & 2: Unit Tests for Solver Functions

## Scope

Standard code-level unit tests for pure/near-pure functions in the MMUX solver backend. These are **not** part of the V&V report — they are conventional pytest tests that verify each function does what its implementation says.

---

## Tier 1: Direct Unit Tests (No Dakota Dependency)

### 1. Pareto Dominance (`funs_data_processing.py`)

**`is_dominated(point, other_points) -> bool`**
- `a` is dominated by `b` → True
- `a` is NOT dominated by `b` → False
- `a` dominates itself → False
- Multi-objective dominance (3+ objectives)
- Edge case: equal values (not dominated)

**`get_non_dominated_indices(data, optimized_vars, optimization_modes, sort_by_column) -> list[int]`**
- Known 2D Pareto front: 5 points, 2 on front, 3 dominated
- Maximization via sign-flip: `["maximize", "minimize"]`
- All points on the front (no dominated points)
- Single-point input
- Mixed minimize/maximize modes

### 2. Grid & Sweep Sampling (`funs_data_processing.py`)

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

### 3. Data Filtering (`funs_data_processing.py`)

**`_filter_data(df, keep_idxs, filter_N_samples, filter_highest_N) -> pd.DataFrame`**
- `keep_idxs=[0,2,4]` → keeps rows 0, 2, 4
- `filter_N_samples=3` → keeps first 3 rows
- `filter_highest_N=2` → keeps 2 rows with highest value in last column
- Invalid index (out of range) → handled gracefully
- Empty filter criteria → returns original

### 4. Cross-Validation Log Parsing (`funs_evaluate.py`)

**`_parse_crossvalidation_outputlogs(log_output, N_CROSS_VALIDATION) -> dict`**
- Valid Dakota CV log output → correct RMSE, MAE, max_abs, sum_abs extraction
- Empty log output → returns empty dict or "No surrogate quality metrics found"
- Malformed log output → handled without crash
- Multiple variables in log → correct per-variable extraction

### 5. LHS Sampling (`lhs.py`)

**`lhs(n, k, method, seed) -> np.ndarray`**
- Output shape: `(k, n)` — k samples, n dimensions
- Values in `[0, 1]`
- **Stratification**: each column has exactly one sample in each interval `[i/k, (i+1)/k]`
- **Reproducibility**: same seed → identical output
- **Maximin**: `_lhsmaximin` produces larger min pairwise distance than `_lhsclassic`
- **Correlation**: `_lhscorrelate` produces smaller max off-diagonal correlation than `_lhsclassic`
- **Centered**: all values at interval midpoints `(i + 0.5) / k`

### 6. Dakota Config Generation (`funs_create_dakota_conf.py`)

**`start_dakota_file() -> str`**
- Returns string containing `environment` block

**`add_continuous_variables(variables, lower_bounds, upper_bounds) -> str`**
- Correct number of variables in output
- Bounds appear in output string
- Variable names appear in descriptors

**`add_surrogate_model(training_samples_file) -> str`**
- Contains `gaussian_process surfpack`
- Contains `import_build_points_file` with correct path
- Contains `export_approx_points_file "predictions.dat"`
- Contains `export_approx_variance_file "variances.dat"`

**`create_sumo_evaluation_conffile(build_file, samples_file, input_variables, output_responses) -> str`**
- Contains all expected blocks: environment, model, method, variables, responses
- Variable count matches `input_variables`
- Response descriptor matches `output_responses`

**`create_uq_propagation_conffile(...)`**
- Contains `normal_uncertain` with correct means and std_deviations
- Contains `lhs` sampling with correct sample count

**`create_moga_optimization_conffile(...)`**
- Contains `moga` method with correct parameters
- Contains variable bounds

### 7. UQ Sample Generation (`funs_data_processing.py`)

**`create_manual_uq_samples(input_vars, distributions, num_samples, seed) -> dict`**
- Seed reproducibility (already tested in `test_dakota_funs_data_processing.py`)
- Normal distribution: output mean ≈ input mean, output std ≈ input std (large N)
- Uniform distribution: output range ≈ [min, max]
- Constant distribution: all values equal to the constant
- Mixed distributions: correct types per variable

### 8. Bounds Extraction (`funs_data_processing.py`)

**`get_bounds_uniform_distributions(input_vars, distributions) -> tuple[list, list]`**
- Correct lower/upper bounds from uniform distributions
- Non-uniform distribution → raises ValueError

**`get_bounds_uniform_distribution(var, dist) -> tuple[float, float]`**
- Returns (min, max) for uniform
- Non-uniform → raises ValueError

---

## Tier 2: Property-Based / Invariant Tests

These verify mathematical properties that must hold regardless of specific inputs.

### P1. Pareto Dominance Invariants
- **Irreflexivity**: `is_dominated(a, [a])` → False
- **Asymmetry**: if `is_dominated(a, [b])` then not `is_dominated(b, [a])`
- **Transitivity on dominance**: if `a` dominates `b` and `b` dominates `c`, then `a` dominates `c`
- **`get_non_dominated_indices`**: no returned index is dominated by any other returned index

### P2. LHS Invariants
- **Stratification**: for each column, `np.histogram(col, bins=k)` produces exactly 1 count per bin
- **Bounds**: `0 ≤ lhs[i,j] ≤ 1` for all i, j
- **Permutation**: each column is a permutation of its stratified intervals (no two points in the same interval for the same variable)
- **Maximin monotonicity**: `_lhsmaximin` min distance ≥ `_lhsclassic` min distance (for same iter count)

### P3. DataPreprocessor Roundtrip
- `inverse_transform(transform(df)) ≈ df` for any valid config (z-score or min-max)
- After z-score transform: column means ≈ 0, column stds ≈ 1
- After min-max transform: column ranges = [0, 1]
- With sign switching: roundtrip still exact

### P4. Grid Sample Invariants
- Total points = `∏ n_points_per_dimension[i]` for grid variables
- All grid variable values within `[min, max]`
- Non-grid variable values exactly equal to cut values
- For 2D grid: `np.meshgrid` consistency (row/column ordering matches reshaped output)

### P5. Axis Sweep Invariants
- Total points = `NSAMPLESPERVAR × len(input_vars)`
- Sweep variable varies monotonically from min to max
- Non-sweep variables constant at cut value
- Sweep spacing is uniform (equal differences between consecutive points)

### P6. Normalization Invariants
- Z-score: `(x - mean) / std` produces mean ≈ 0, std ≈ 1 across a representative sample
- Min-max: `(x - min) / (max - min)` produces range [0, 1]
- Sign flip: negating a variable and then negating again returns original

---

## Implementation

- **Framework**: pytest (already configured in pyproject.toml)
- **Location**: `flaskapi/tests/test_unit_solver.py` (Tier 1) and `flaskapi/tests/test_property_invariants.py` (Tier 2)
- **Fixtures**: use `tmp_path` for file I/O tests; no Dakota mocking needed
- **Parametrize**: use `@pytest.mark.parametrize` for multi-case tests (e.g., multiple Pareto front configurations)
- **Markers**: `@pytest.mark.unit` for all tests

## Test Count Estimate

| Category | Tests |
|----------|-------|
| Pareto dominance | ~10 |
| Grid & sweep sampling | ~8 |
| Data filtering | ~6 |
| CV log parsing | ~5 |
| LHS sampling | ~10 |
| Dakota config generation | ~12 |
| UQ sample generation | ~5 |
| Bounds extraction | ~4 |
| Property invariants | ~15 |
| **Total** | **~75** |
