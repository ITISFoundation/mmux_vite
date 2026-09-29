import logging
import os
import re
import shutil
from collections.abc import Callable
from pathlib import Path
from typing import Any, Literal

import numpy as np
import pandas as pd
from sklearn.model_selection import KFold

from mmux_flaskapi.dakota.dakota_object import DakotaObject
from mmux_flaskapi.dakota.funs_create_dakota_conf import (
    create_moga_optimization_conffile,
    create_sumo_crossvalidation_conffile,
    create_sumo_evaluation_conffile,
    create_sumo_manual_crossvalidation_conffile,
    create_uq_propagation_conffile,
)
from mmux_flaskapi.dakota.funs_data_processing import (
    create_grid_samples,
    create_samples_along_axes,
    extract_predictions_along_axes,
    extract_predictions_gridpoints,
    get_bounds_uniform_distributions,
    get_results,
    load_data,
    sanitize_varnames,
)

_logger = logging.getLogger(__name__)


def retrieve_csv_result(
    csv_file_path: str, inputs: dict[str, float], outputs: list[str] | None = None
) -> dict[str, float]:
    """
    Retrieve the result from a csv file.
    """

    df = pd.read_csv(csv_file_path)

    for col in inputs:
        if col not in df.columns:
            raise ValueError(f"Input {col} not in the csv file. Columns are: {df.columns.values}")

    if outputs is not None:
        for col in outputs:
            if col not in df.columns:
                raise ValueError(
                    f"Output {col} not in the csv file. Columns are: {df.columns.values}"
                )
        result = df.loc[np.all(df[inputs.keys()] == inputs.values(), axis=1), outputs]
    else:
        result = df.loc[np.all(df[inputs.keys()] == inputs.values(), axis=1)]
    # Check if the result is empty or has multiple rows
    if len(result) == 0:
        raise ValueError(f"No result found for inputs {inputs}.")
    if len(result) > 1:
        raise ValueError(f"Multiple results found for inputs {inputs}.")

    return result.iloc[0].to_dict()


def evaluate_sumo_along_axes(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    response_var: str,
    cut_values: dict[str, float] | None = None,
    sumo_import_name: str | None = None,
    sumo_export_name: str | None = None,
    NSAMPLESPERVAR: int = 21,
    xscale: Literal["linear", "log"] = "linear",
    yscale: Literal["linear", "log"] = "linear",
    label_converter: Callable | None = None,
    MAKEPLOT: bool = False,
) -> dict[str, dict[str, list[float]]]:
    """Given a training data to create a SuMo, generate it, and plot the profile along the central axes
    (e.g. all variables but the sweeped one will be set to its central value).
    No callback is necessary (everything internal to Dakota).

    Log / Linear scale of the variable is inferred its name; mean value is taken in the corresponding scale.
    Plots scales (after SuMo creation and sampling) can be either linear or logarithmic.
    """
    # sanitize variable names
    input_vars = sanitize_varnames(input_vars)
    response_var = sanitize_varnames(response_var)
    cut_values = sanitize_varnames(cut_values) if cut_values else None

    # create sweeps data
    data = pd.read_csv(PROCESSED_TRAINING_FILE, sep=" ")
    PROCESSED_SWEEP_INPUT_FILE = create_samples_along_axes(
        run_dir, data, input_vars, NSAMPLESPERVAR, cut_values=cut_values
    )

    if sumo_import_name:
        models_dir = run_dir.parent / "models"
        if not models_dir.exists():
            raise FileNotFoundError(
                f"Models dir {models_dir} does not exist, but SuMo import is trying to copy files there"
            )
        for file in models_dir.glob(f"{sumo_import_name}*"):
            shutil.copy(file, run_dir)

    # create dakota file
    dakota_conf = create_sumo_evaluation_conffile(
        build_file=PROCESSED_TRAINING_FILE,
        sumo_import_name=sumo_import_name,
        sumo_export_name=sumo_export_name,
        samples_file=PROCESSED_SWEEP_INPUT_FILE,
        input_variables=input_vars,
        output_responses=[response_var],
    )

    # run dakota
    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)
    results = extract_predictions_along_axes(run_dir, response_var, input_vars, NSAMPLESPERVAR)
    return results


### TODO refactor in new MMUX-compatible version (like above)
def propagate_uq(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    output_response: str,
    means: dict[str, float],
    stds: dict[str, float],
    n_samples: int = 1000,
    xscale: Literal["linear", "log"] = "linear",
    label_converter: Callable | None = None,
) -> list[float]:
    input_vars = sanitize_varnames(input_vars)
    output_response = sanitize_varnames(output_response)
    means = {sanitize_varnames(k): v for k, v in means.items()}
    stds = {sanitize_varnames(k): v for k, v in stds.items()}

    # create dakota file
    dakota_conf = create_uq_propagation_conffile(
        build_file=PROCESSED_TRAINING_FILE,
        input_variables=input_vars,
        input_means=means,
        input_stds=stds,
        output_responses=[output_response],
        n_samples=n_samples,
    )

    # run dakota
    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)
    x = get_results(run_dir / "predictions.dat", output_response)
    return x.tolist()


def _parse_crossvalidation_outputlogs(log_output: str, N_CROSS_VALIDATION: int):
    variable_name_pattern = (
        rf"Surrogate quality metrics \({N_CROSS_VALIDATION}-fold CV\) for (\w+):"
    )
    metrics_pattern = r"\s+(root_mean_squared|sum_abs|mean_abs|max_abs)\s+([\d.e+-]+|nan)"

    # Find all occurrences of variable names in the log
    variables = re.findall(variable_name_pattern, log_output)

    # Split the log output by the variable name to handle each output separately
    log_parts = re.split(variable_name_pattern, log_output)
    log_parts = log_parts[1:]  # Skip the first part (before the first variable name)

    # Dictionary to hold the parsed results for each output variable
    parsed_error_metrics = {}

    # Loop through the log parts, and extract metrics for each output variable
    for i, variable in enumerate(variables):
        # The log part after each variable name contains the metrics section for that variable
        metrics_section = log_parts[2 * i + 1]  # The log part immediately after the variable name

        ## remove the training error of the next variable
        metrics_section = metrics_section.split("build (training) points")[0]

        # Find all the surrogate quality metrics for this particular output variable
        metrics_matches = re.findall(metrics_pattern, metrics_section)

        if metrics_matches:
            metrics = {metric: value for metric, value in metrics_matches}
            parsed_error_metrics[variable] = metrics
        else:
            parsed_error_metrics[variable] = "No surrogate quality metrics found."

    _logger.debug("Parsed cross-validation metrics: %s", parsed_error_metrics)
    return parsed_error_metrics


def evaluate_sumo_crossvalidation(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    output_response: str,
    N_CROSS_VALIDATION: int = 5,
):
    input_vars = sanitize_varnames(input_vars)
    output_response = sanitize_varnames(output_response)

    dakota_conf = create_sumo_crossvalidation_conffile(
        PROCESSED_TRAINING_FILE,
        input_vars,
        [output_response],
        N_CROSS_VALIDATION=N_CROSS_VALIDATION,
    )
    # run dakota
    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)
    # `dakobj.run` writes captured stdout to "dakota_stdout.txt" in run_dir (see DakotaObject.run)
    stdout_file = run_dir / "dakota_stdout.txt"
    log_output = stdout_file.read_text() if stdout_file.is_file() else ""
    parsed_error_metrics = _parse_crossvalidation_outputlogs(log_output, N_CROSS_VALIDATION)

    return parsed_error_metrics


def evaluate_sumo_manual_crossvalidation(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    output_response: str,
    N_CROSS_VALIDATION: int = 5,
):
    input_vars = sanitize_varnames(input_vars)
    output_response = sanitize_varnames(output_response)

    all_observations = load_data(PROCESSED_TRAINING_FILE)[output_response].astype(float)
    n_samples = len(all_observations)
    indices = np.arange(n_samples)
    all_predictions = np.empty(n_samples)
    all_stds = np.empty(n_samples)
    kf = KFold(n_splits=N_CROSS_VALIDATION, shuffle=True, random_state=42)

    for fold, (_, val_idx) in enumerate(kf.split(indices)):
        fold_run_dir = run_dir / f"fold_{fold}"
        os.makedirs(fold_run_dir, exist_ok=True)

        # Create Dakota config for this fold
        dakota_conf = create_sumo_manual_crossvalidation_conffile(
            fold_run_dir,
            PROCESSED_TRAINING_FILE,
            input_vars,
            output_response,
            validation_indices=val_idx.tolist(),
            dakota_conf_file=fold_run_dir / "dakota_config.in",
        )
        dakobj = DakotaObject()
        dakobj.run(dakota_conf, fold_run_dir)

        # Extract predictions for this fold and store in the correct positions
        fold_predictions = get_results(fold_run_dir / "predictions.dat", output_response)
        _logger.debug("Fold %d predictions: %s", fold, fold_predictions)
        _logger.debug("Validation indices: %s", val_idx)

        all_predictions[val_idx] = fold_predictions
        if (fold_run_dir / "variances.dat").is_file():
            fold_var = get_results(fold_run_dir / "variances.dat", output_response + "_variance")
            all_stds[val_idx] = np.sqrt(fold_var)

    return {
        output_response: all_observations.tolist(),
        output_response + "_hat": all_predictions.tolist(),
        output_response + "_std_hat": all_stds.tolist(),
    }


def evaluate_sumo(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    PROCESSED_EVALUATION_SAMPLES_FILE: Path,
    input_vars: list[str],
    response_var: str,
) -> dict[str, list[float]]:
    input_vars = sanitize_varnames(input_vars)
    response_var = sanitize_varnames(response_var)

    """Given a training data to create a SuMo, generate it, and evaluate on the training data.
    No callback is necessary (everything internal to Dakota).
    """
    # create dakota file
    dakota_conf = create_sumo_evaluation_conffile(
        build_file=PROCESSED_TRAINING_FILE,
        samples_file=PROCESSED_EVALUATION_SAMPLES_FILE,
        input_variables=input_vars,
        output_responses=[response_var],
    )

    # run dakota
    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)

    results = {
        response_var + "_hat": get_results(run_dir / "predictions.dat", response_var).tolist()
    }
    if (run_dir / "variances.dat").is_file():
        variances = get_results(run_dir / "variances.dat", response_var + "_variance")
        results[response_var + "_std_hat"] = np.sqrt(variances).tolist()

    return results


def evaluate_sumo_on_grid(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    grid_vars: list[str],
    input_vars: list[str],
    response_var: str,
    cut_values: dict[str, float] | None = None,
    # sumo_import_name: Optional[str] = None,
    # sumo_export_name: Optional[str] = None,
    NSAMPLESPERVAR: int = 21,
    # xscale: Literal["linear", "log"] = "linear",
    # yscale: Literal["linear", "log"] = "linear",
    # label_converter: Optional[Callable] = None,
    # MAKEPLOT: bool = False,
) -> dict[str, list[float]]:
    """Given a training data to create a SuMo, generate it, and evaluate on a grid of points.
    The grid is created by sweeping the variables in `grid_vars` over their min and max values,
    while the other variables in `input_vars` are set to their central values.
    The grid is created by sampling `NSAMPLESPERVAR` points per variable.
    The results are returned as a dictionary, where the keys are the variable names and the values are lists of values (inputs / predictions).
    No callback is necessary (everything internal to Dakota).

    Log / Linear scale of the variable is inferred its name; mean value is taken in the corresponding scale.
    Plots scales (after SuMo creation and sampling) can be either linear or logarithmic.
    """
    NPOINTSPERDIMENSION = [NSAMPLESPERVAR] * len(
        input_vars
    )  # default number of points per dimension
    grid_vars = sanitize_varnames(grid_vars)
    input_vars = sanitize_varnames(input_vars)
    response_var = sanitize_varnames(response_var)
    cut_values = sanitize_varnames(cut_values) if cut_values else None

    # create sweeps data
    data = pd.read_csv(PROCESSED_TRAINING_FILE, sep=" ")
    PROCESSED_GRIDPOINTS_INPUT_FILE = create_grid_samples(
        run_dir=run_dir,
        grid_vars=grid_vars,
        input_vars=input_vars,
        mins=[
            data[var].min() for var in input_vars
        ],  ## TODO it is here that we should use the distribution values (passed directly from the frontend)
        cut_values=(
            [cut_values[var] for var in input_vars]
            if cut_values
            else [data[var].mean() for var in input_vars]
        ),
        maxs=[
            data[var].max() for var in input_vars
        ],  # TODO it is here that we should use the distribution values (passed directly from the frontend)
        n_points_per_dimension=NPOINTSPERDIMENSION,
    )

    # create dakota file
    dakota_conf = create_sumo_evaluation_conffile(
        build_file=PROCESSED_TRAINING_FILE,
        # sumo_import_name=sumo_import_name,
        # sumo_export_name=sumo_export_name,
        ### TODO once this works, try to get it to work wo evaluation (or just one sample, if not possible?)
        samples_file=PROCESSED_GRIDPOINTS_INPUT_FILE,
        input_variables=input_vars,
        output_responses=[response_var],
    )

    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)

    results = extract_predictions_gridpoints(run_dir, response_var, input_vars, NSAMPLESPERVAR)

    if len(grid_vars) == 2:  ## this is not necessary for 3D
        output = np.array(results[response_var])
        reshape_indices = [
            NPOINTSPERDIMENSION[i] for i in range(len(input_vars)) if input_vars[i] in grid_vars
        ]
        if grid_vars[0] in input_vars[:2] and grid_vars[1] in input_vars[:2]:
            ## reshape fills in row order. For some reason, this needs to be done reversed in XY / YX cases
            ## but NOT for any other input combination...
            output = output.reshape(reshape_indices[::-1]).T
        else:
            output = output.reshape(reshape_indices)
        input_vars_in_grid_vars = [var for var in input_vars if var in grid_vars]
        transpose_indices = [
            input_vars_in_grid_vars.index(grid_vars[i]) for i in range(len(grid_vars))
        ]
        final_output = output.transpose(
            transpose_indices[::-1]
        )  # ZX, XZ, YZ, ZY work; but not YX, XY. Why???
        results[response_var] = final_output.tolist()

    return results


def perform_moga_optimization(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    distributions: dict[str, dict[str, float]],
    output_responses: list[str],
    moga_kwargs: dict,
) -> dict[str, list[float | int]]:
    _logger.debug("Minimizing responses: %s", ", ".join(output_responses))

    input_vars = sanitize_varnames(input_vars)
    output_responses = [sanitize_varnames(resp) for resp in output_responses]
    distributions = sanitize_varnames(distributions)

    # assumes uniform distribution for MOGA - raises Error otherwise
    lower_bounds, upper_bounds = get_bounds_uniform_distributions(input_vars, distributions)

    # create dakota file
    dakota_conf = create_moga_optimization_conffile(
        build_file=PROCESSED_TRAINING_FILE,
        input_variables=input_vars,
        lower_bounds=lower_bounds,
        upper_bounds=upper_bounds,
        output_responses=output_responses,
        moga_kwargs=moga_kwargs,
        dakota_conf_file=run_dir / "dakota_config.in",
    )

    # run dakota
    dakobj = DakotaObject()
    dakobj.run(dakota_conf, run_dir)

    results = {}
    for res in output_responses:
        x = get_results(run_dir / "predictions.dat", res)
        results[res] = x.tolist()
    for inv in input_vars:
        x = get_results(run_dir / "predictions.dat", inv)
        results[inv] = x.tolist()

    return results


SOBOL_BASE_SAMPLES = 1024
"""Fixed base sample count N for Sobol' Saltelli sampling (V36).

A widely-used practical default (SALib/scipy tutorials, Saltelli et al.
"Global Sensitivity Analysis: The Primer") that gives reliable index estimates
for typical dimensionalities. Deliberately decoupled from the frontend's
shared UQ ``numSamples`` (used by Histogram/Correlation) since Sobol' cost is
``SOBOL_BASE_SAMPLES * (d_varying + 2)`` -- reusing the UQ default of 10,000
rounds to 16,384 and multiplies out to 5-10x more surrogate evaluations than
necessary for reliable rankings.
"""

SOBOL_BOOTSTRAP_RESAMPLES = 1000
"""Bootstrap resamples for first/total-order confidence intervals (V37).

Resampling reuses the already-computed f_A/f_B/f_AB evaluations (row indices
resampled with replacement) -- no extra ``evaluate_sumo()`` calls, so this is
effectively free relative to the surrogate evaluation cost.
"""

SOBOL_BOOTSTRAP_CONFIDENCE = 0.95


def _sobol_algebra(
    f_A: np.ndarray,
    f_B: np.ndarray,
    f_AB: np.ndarray,
    f_U: np.ndarray,
    f_V: np.ndarray,
    pairs: np.ndarray,
) -> dict:
    """Full Saltelli index algebra on aligned sample vectors.

    Single source for BOTH point estimates and bootstrap replicates (V44vw needs
    the identical estimator per resample). ``f_A``/``f_B`` are (n,) baseline and
    alternative evaluations; ``f_AB`` is (d, n), row i = Saltelli AB_i design
    (f(A) with column i swapped to B's). ``f_U``/``f_V`` are (K, n) pair designs
    (K = C(d,2), row k for ``pairs[k] = (i, j)``):
    U^ij_n = f(A_i, A_j, B_rest) and V^ij_n = f(A_i, A_j, C_rest) with ``C`` an
    independent third sample stream.

    Estimators (Saltelli et al., Comput.Phys.Commun. 181 (2010) 259-270, in the
    EXACT form scipy.stats.sobol_indices implements it - _sensitivity_analysis.py
    ``saltelli_2010`` - including its Sobol' & Levitan (1999) pooled mean removal
    and pooled A/B variance. Centering only through ``mu_hat``/``var_hat`` keeps
    point estimates, pair subtraction and bootstrap replicates on ONE estimator
    and makes every index translation-invariant under ``f -> f + c``: the raw
    products below are mean-subtracted before averaging, so physically-offset
    outputs (e.g. stress in Pa, mean >> std) cannot corrupt the ratios.
      first_i  = E[(f_B - mu) . (f_AB_i - f_A)] / Var([f_A, f_B])  Table 2(b)
      total_i  = E[(f_A - f_AB_i)^2] / (2 Var([f_A, f_B]))          Table 2(f)
      S_(i,j)  = E[(f_U^ij - mu) . (f_V^ij - mu)] / Var([f_A, f_B]) joint pair
        EXACT for arbitrary d: conditional on the shared pair values (A_i, A_j),
        U and V differ only in fully independent rest columns, so
        E[f_U . f_V | pair] = g(pair)^2 with g = E[Y | X_i, X_j]; averaging rows
        estimates E[g^2], and E[g] = E[Y] makes E[g^2] - E^2 = Var(g) exactly.
        The ANOVA terms contained in {i, j} are only {i}, {j}, {i, j}, hence
        Var(g)/V = S_i + S_j + S_ij with NO truncation assumption at all.
      S_ij     = S_(i,j) - S_i - S_j                             EXACT any d.
        (Contrast the retired B26nc identity, which inferred O(d^2) pair values
        from d first/total gaps - underdetermined for d>=4, with pair sums
        provably collapsing to 0 at d=4 and negative beyond.)

    Order masses (V43pt): M1 = sum_i S_i; M2 = sum_{i<j} S_ij (each unordered
    pair once); R = 1 - M1 - M2 closure residual (V45xy). Raw finite-sample
    estimates are never clamped.

    Cost note (V42qa, cost-vs-accuracy decision): the exact pair estimator needs
    2x C(d,2) mixed designs, so total surrogate cost is n*(2 + d + d(d-1))
    ~ n*d^2 - the O(d^2) pair-specific mixed evaluation cost T31rb anticipated
    (unavoidable for exact arbitrary-d pairs; verified against the analytic
    additive d=8, pair-interaction d=5, Ishigami and pair-quadratic d=10
    benchmarks in tests/test_sobol_indices.py within bootstrap-CI-scaled
    tolerances).
    """
    n = f_A.shape[0]
    d = f_AB.shape[0]
    # Pooled mean/variance of A and B - exactly what scipy.stats.sobol_indices
    # uses (Sobol' & Levitan 1999 mean removal; var of the independent A/B pool).
    # All products are mean-subtracted before averaging, so every index is
    # invariant under f -> f + c (a raw E[f.f'] - E[f_A]^2 form drifts with the
    # output offset whenever mean >> std, e.g. physical units in Pa).
    pooled = np.concatenate((f_A, f_B))
    mu_hat = float(np.mean(pooled))
    var_hat = float(np.var(pooled))
    if var_hat == 0.0:
        return {
            "first": np.zeros(d),
            "total": np.zeros(d),
            "second": np.zeros((d, d)),
            "m1": 0.0,
            "m2": 0.0,
            "r": 0.0,
            "var_zero": True,
        }
    # scipy saltelli_2010 Table 2(b): mean((f_B - mu) * (f_AB_i - f_A)) / var
    # (the difference f_AB_i - f_A is centering-free).
    first = np.mean((f_B - mu_hat)[None, :] * (f_AB - f_A[None, :]), axis=1) / var_hat  # (d,)
    total = 0.5 * np.mean((f_A[None, :] - f_AB) ** 2, axis=1) / var_hat  # (d,)
    second = np.zeros((d, d))
    if f_U.shape[0] > 0:
        # Centered cross-product of the pair designs: E[g^2] - E[g]^2 = Var(g),
        # estimated translation-invariantly (mu_hat absorbs any output offset).
        joint = (
            np.einsum("kn,kn->k", f_U - mu_hat, f_V - mu_hat) / n
        ) / var_hat  # (K,) Var(E[Y|Xi,Xj])/V, exact
        ii = pairs[:, 0]
        jj = pairs[:, 1]
        s_ij = joint - first[ii] - first[jj]
        second[ii, jj] = s_ij
        second[jj, ii] = s_ij
    m1 = float(np.sum(first))
    m2 = float(np.sum(np.triu(second, k=1)))
    r = 1.0 - m1 - m2
    return {
        "first": first,
        "total": total,
        "second": second,
        "m1": m1,
        "m2": m2,
        "r": r,
        "var_zero": False,
    }


def _sobol_joint_bootstrap(
    f_A: np.ndarray,
    f_B: np.ndarray,
    f_AB: np.ndarray,
    f_U: np.ndarray,
    f_V: np.ndarray,
    pairs: np.ndarray,
    *,
    seed: int | None,
    n_resamples: int,
    confidence: float,
) -> dict:
    """Shared-row bootstrap over ALL indices (V44vw).

    ONE row-index resample per replicate recomputes S_i, S_Ti, S_ij and then
    M1, M2, R, so the percentile CIs preserve estimator covariance and the
    M1+M2+R=1 identity holds per replicate. Resampling reuses the already
    computed evaluations - no extra surrogate calls.

    Returns: first/total CIs (d, 2), per-pair CIs (K, 2) (used to scale analytic
    regression tolerances per V42qa), and m1/m2/r CIs as (2,) bounds.
    """
    n = f_A.shape[0]
    d = f_AB.shape[0]
    k_pairs = f_U.shape[0]
    rng = np.random.default_rng(seed)
    boot_first = np.empty((n_resamples, d))
    boot_total = np.empty((n_resamples, d))
    boot_second = np.empty((n_resamples, k_pairs))
    boot_m1 = np.empty(n_resamples)
    boot_m2 = np.empty(n_resamples)
    boot_r = np.empty(n_resamples)
    for b in range(n_resamples):
        idx = rng.integers(0, n, n)
        alg = _sobol_algebra(f_A[idx], f_B[idx], f_AB[:, idx], f_U[:, idx], f_V[:, idx], pairs)
        boot_first[b] = alg["first"]
        boot_total[b] = alg["total"]
        if k_pairs:
            boot_second[b] = alg["second"][pairs[:, 0], pairs[:, 1]]
        boot_m1[b] = alg["m1"]
        boot_m2[b] = alg["m2"]
        boot_r[b] = alg["r"]
    alpha = (1 - confidence) / 2
    lo, hi = 100 * alpha, 100 * (1 - alpha)

    def _bounds(x: np.ndarray) -> np.ndarray:
        return np.stack([np.percentile(x, lo, axis=0), np.percentile(x, hi, axis=0)], axis=-1)

    return {
        "first": _bounds(boot_first),  # (d, 2)
        "total": _bounds(boot_total),  # (d, 2)
        "second": _bounds(boot_second),  # (K, 2) in triu pair order
        "m1": np.array([np.percentile(boot_m1, lo), np.percentile(boot_m1, hi)]),
        "m2": np.array([np.percentile(boot_m2, lo), np.percentile(boot_m2, hi)]),
        "r": np.array([np.percentile(boot_r, lo), np.percentile(boot_r, hi)]),
    }


def evaluate_sobol_indices(
    run_dir: Path,
    PROCESSED_TRAINING_FILE: Path,
    input_vars: list[str],
    response_var: str,
    distributions: dict[str, dict],
    preprocessor,
    seed: int | None = None,
) -> dict[str, Any]:
    """Compute Sobol' first-order, total-order, and second-order sensitivity indices.

    Generates Saltelli A/B/AB sample matrices locally (honouring per-input
    distributions via ``scipy.stats.rv_continuous.ppf``), evaluates all samples
    in ONE batch through ``evaluate_sumo()`` (surrogate-only, Dakota does not run
    ``variance_based_decomp`` itself), then applies ``scipy.stats.sobol_indices``
    for first-order + total-order indices plus the exact joint-pair second-order
    (pairwise interaction) estimator and order masses.

    Second-order estimator (T31rb/V42qa): the EXACT arbitrary-d joint-pair
    estimator S_ij = Var(E[Y|X_i,X_j])/V - S_i - S_j, where Var(E[Y|X_i,X_j])
    is estimated from pair-specific mixed designs U^ij = f(A_i,A_j,B_rest) and
    V^ij = f(A_i,A_j,C_rest) (C an independent third stream) - see
    ``_sobol_algebra`` for the unbiasedness derivation. Exact for ANY number of
    varying inputs (no truncation assumption: the ANOVA terms inside {i,j} are
    only {i}, {j}, {i,j}), validated vs analytic additive d=8, pair-interaction
    d=5, Ishigami and pair-quadratic d=10 benchmarks within bootstrap-scaled
    tolerances. Replaces the old identity
    V_ij = ((V_Ti - V_i) + (V_Tj - V_j) - Σ_{k≠i,j} (V_Tk - V_k)) / 2, which was
    exact only for d=3 and provably degenerate (pair sums ≡ 0 at d=4, negative
    beyond) for the typical 4-25 parameter studies (§B26nc). Surrogate cost
    grows to n*(2 + d + d(d-1)) ~ n*d^2 - the O(d^2) pair-specific mixed
    evaluation cost T31rb anticipated and documents as the price of exact pairs.
    Saltelli reference: Saltelli, A. (2010). "Variance based sensitivity analysis
    of model output. Design and estimator for the total sensitivity index."
    Computer Physics Communications, 181(2), 259-270.

    Base sample count is the fixed ``SOBOL_BASE_SAMPLES`` constant (V36), NOT
    the frontend's shared UQ ``numSamples`` -- Sobol' has fundamentally
    different sample-cost scaling (multiplicative in ``d_varying``) than the
    other UQ views, so it uses its own well-established practical default.
    All confidence intervals (first/total/second plus the M1/M2/R order masses
    returned as ``sobolOrderContributions``, V43pt/V45xy) come from ONE shared
    bootstrap: each replicate resamples the existing evaluation rows once
    (⊥ extra surrogate calls) and recomputes every index, preserving estimator
    covariance and the M1+M2+R=1 partition per replicate (V44vw).

    Args:
        run_dir: Dakota run directory for intermediate files.
        PROCESSED_TRAINING_FILE: Path to the preprocessed training data file.
        input_vars: Original (unmapped) input variable names.
        response_var: Mapped response variable name (as known to Dakota).
        distributions: Dict mapping original var names to distribution params
            (``{"distribution": "normal", "mean":, "std":}`` /
            ``{"distribution": "uniform", "min":, "max":}`` /
            ``{"distribution": "constant", "value":}``).
        preprocessor: Fitted ``DataPreprocessor`` for transforming samples.
        seed: Random seed for reproducibility (numpy/scipy RNGs accept 0).

    Returns:
        Dict with keys ``"sobol"`` (``{var: {"main": float, "total": float,
        "main_ci_low": float, "main_ci_high": float, "total_ci_low": float,
        "total_ci_high": float}}``), ``"sobolSecondOrder"``
        (``{varA: {varB: float}}`` symmetric over unordered pairs, no self-pair),
        and ``"sobolOrderContributions"`` (unique order masses ``first_order``=M1,
        ``second_order``=M2, ``third_and_higher``=R with bootstrap CIs and
        ``heuristic_noise_floor``, per V43pt/V44vw; ``None`` when the sample
        output variance is zero -- the fractions are undefined there, V43pt).
    """
    import math

    import pandas as pd
    from scipy.stats import norm, sobol_indices, uniform
    from scipy.stats.qmc import Sobol

    # NOTE: input_vars/distributions are NOT sanitized here (unlike sibling
    # evaluate_* functions) - preprocessor.input_variables is keyed by the
    # original request variable names, and the final response dict below must
    # be keyed by those same original names for the frontend lookup to work.

    # --- 1. Separate constant vs. varying input variables ---
    constant_vars: dict[str, float] = {}
    varying_vars: list[str] = []
    for var in input_vars:
        dist_info = distributions[var]
        if dist_info["distribution"] == "constant":
            constant_vars[var] = float(dist_info["value"])
        else:
            varying_vars.append(var)

    d_varying = len(varying_vars)

    # Build frozen scipy distributions with .ppf for each varying variable
    ppfs = {}
    for var in varying_vars:
        dist_info = distributions[var]
        dist_type = dist_info["distribution"]
        if dist_type == "normal":
            ppfs[var] = norm(loc=dist_info["mean"], scale=dist_info["std"])
        elif dist_type == "uniform":
            ppfs[var] = uniform(loc=dist_info["min"], scale=dist_info["max"] - dist_info["min"])
        else:
            raise ValueError(f"Unsupported distribution type: {dist_type}")

    # --- 2. Fixed base sample count, rounded up to next power of 2 (V36) ---
    if d_varying == 0:
        # All variables are constant — indices are trivially zero. Order masses
        # are NOT reported as (0,0,0): a zero-variance output has no variance to
        # partition, so the M1/M2/R fractions are undefined and the response
        # states that explicitly with null (V43pt closure to 1 is a statement
        # about real variance partitions, not this degenerate case).
        sobol = {
            var: {
                "main": 0.0,
                "total": 0.0,
                "main_ci_low": 0.0,
                "main_ci_high": 0.0,
                "total_ci_low": 0.0,
                "total_ci_high": 0.0,
            }
            for var in input_vars
        }
        return {
            "sobol": sobol,
            "sobolSecondOrder": {},
            "sobolOrderContributions": None,
        }

    n = 2 ** math.ceil(math.log2(max(SOBOL_BASE_SAMPLES, 2)))

    # --- 3. Generate Saltelli A/B/C sample matrices via Sobol' QMC ---
    # C is an independent third stream feeding the pair designs (step 4b).
    sampler = Sobol(d=3 * d_varying, seed=seed, scramble=True)
    U = sampler.random(n)  # shape (n, 3*d_varying)
    U_A = U[:, :d_varying]
    U_B = U[:, d_varying : 2 * d_varying]
    U_C = U[:, 2 * d_varying :]

    # Map through ppf to get real-space A, B and C
    A = np.column_stack([ppfs[var].ppf(U_A[:, i]) for i, var in enumerate(varying_vars)])
    B = np.column_stack([ppfs[var].ppf(U_B[:, i]) for i, var in enumerate(varying_vars)])
    C = np.column_stack([ppfs[var].ppf(U_C[:, i]) for i, var in enumerate(varying_vars)])

    # --- 4. Build AB_i matrices: A with column i replaced by B's column i ---
    # (Saltelli 2010 convention: AB_i uses B's values for variable i, A's for the rest)
    AB = np.empty((d_varying, n, d_varying))
    for i in range(d_varying):
        AB_i = A.copy()
        AB_i[:, i] = B[:, i]
        AB[i] = AB_i

    # --- 4b. Build the exact pair designs (V42qa, T31rb): for each unordered
    # pair (i,j), U^ij = pair from A, rest from B; V^ij = pair from A, rest
    # from C (C independent of B). f_U.f_V then estimates Var(E[Y|X_i,X_j])
    # exactly for arbitrary d (derivation in _sobol_algebra). Rows follow
    # np.triu_indices order so they line up with `pairs`.
    pair_ii, pair_jj = np.triu_indices(d_varying, k=1)
    pairs = np.column_stack([pair_ii, pair_jj])
    K = pairs.shape[0]
    uv = np.empty((2 * K, n, d_varying))
    for k in range(K):
        i, j = int(pairs[k, 0]), int(pairs[k, 1])
        rest_b = B.copy()
        rest_b[:, [i, j]] = A[:, [i, j]]
        rest_c = C.copy()
        rest_c[:, [i, j]] = A[:, [i, j]]
        uv[k] = rest_b  # U^ij
        uv[K + k] = rest_c  # V^ij

    # --- 5. Concatenate into one big sample matrix, restore constant columns ---
    # Layout: A (n) + B (n) + AB_0..AB_{d-1} (d*n) + U^0..U^{K-1} (K*n) + V^0..V^{K-1} (K*n)
    all_samples_varying = np.vstack(
        [A, B] + [AB[i] for i in range(d_varying)] + [uv[k] for k in range(2 * K)]
    )

    # Build DataFrame with varying variables only
    df_varying = pd.DataFrame(all_samples_varying, columns=pd.Index(varying_vars))

    # Add constant columns (fixed values for all rows)
    for var, val in constant_vars.items():
        df_varying[var] = val

    # Reorder columns to match original input_vars order
    df_samples = df_varying[input_vars]

    # --- 6. Transform and write processed samples, call evaluate_sumo ONCE ---
    SAMPLES_FILE = run_dir / "sobol_samples.csv"
    df_samples.to_csv(SAMPLES_FILE, index=False)

    df_samples_transformed = preprocessor.transform(df_samples)
    PROCESSED_SAMPLES_FILE = run_dir / "sobol_samples_processed.csv"
    df_samples_transformed.to_csv(PROCESSED_SAMPLES_FILE, sep=" ", index=False)

    mapped_input_vars = [preprocessor.input_variables[var].mapped_name for var in input_vars]
    results = evaluate_sumo(
        run_dir,
        PROCESSED_TRAINING_FILE,
        PROCESSED_SAMPLES_FILE,
        mapped_input_vars,
        response_var,
    )

    prediction_key = response_var + "_hat"
    if prediction_key not in results:
        raise ValueError(
            f"Surrogate evaluation did not produce '{prediction_key}'. "
            f"Available keys: {list(results.keys())}."
        )

    # --- 7. Split the single batch of predictions back into f_A, f_B, f_AB_i ---
    all_preds = np.asarray(results[prediction_key])
    total_rows = n * (d_varying + 2 + 2 * K)
    if len(all_preds) != total_rows:
        raise ValueError(
            f"Expected {total_rows} predictions (n={n}, d_varying={d_varying}, pairs={K}), "
            f"got {len(all_preds)}."
        )

    idx = 0
    f_A = all_preds[idx : idx + n].reshape(1, n)  # shape (1, n)
    idx += n
    f_B = all_preds[idx : idx + n].reshape(1, n)  # shape (1, n)
    idx += n
    f_AB = np.empty((d_varying, 1, n))
    for i in range(d_varying):
        f_AB[i] = all_preds[idx : idx + n].reshape(1, 1, n)
        idx += n
    f_UV = np.empty((2 * K, n))
    for k in range(2 * K):
        f_UV[k] = all_preds[idx : idx + n]
        idx += n
    f_U = f_UV[:K]
    f_V = f_UV[K:]

    # --- 8. Point estimates + shared-row bootstrap CIs (V40, V44vw) ---
    # All CIs come from ONE bootstrap: one row-index resample per replicate
    # recomputes first/total/second AND the M1/M2/R masses (V44vw), resampling
    # the already-computed f_A/f_B/f_AB evaluations -- no extra evaluate_sumo()
    # calls, effectively free.
    fA_flat = f_A.ravel()
    fB_flat = f_B.ravel()
    fAB_2d = f_AB.reshape(d_varying, n)
    alg = _sobol_algebra(fA_flat, fB_flat, fAB_2d, f_U, f_V, pairs)
    boot = _sobol_joint_bootstrap(
        fA_flat,
        fB_flat,
        fAB_2d,
        f_U,
        f_V,
        pairs,
        seed=seed,
        n_resamples=SOBOL_BOOTSTRAP_RESAMPLES,
        confidence=SOBOL_BOOTSTRAP_CONFIDENCE,
    )
    if d_varying == 1:
        # scipy.stats.sobol_indices squeezes to scalar when d=1 and s=1, causing
        # an internal "item assignment" error; the Saltelli 2010 algebra is the
        # exact closed form here anyway (AB_0 IS the full B sample at d=1).
        # NOTE (fixes latent d=1 bug): the former branch estimated S_1 as
        # Cov(f_A, f_AB_0)/Var(f_A) -- but f_AB_0 = f_B at d=1, the covariance of
        # two INDEPENDENT copies, so S_1 always came out ~0 instead of ~1.
        first_order = np.atleast_1d(alg["first"])
        total_order = np.atleast_1d(alg["total"])
    else:
        si = sobol_indices(func={"f_A": f_A, "f_B": f_B, "f_AB": f_AB}, n=n)
        # np.squeeze in scipy can collapse to scalar when d_varying=1; ensure 1-d
        first_order = np.atleast_1d(si.first_order)  # shape (d_varying,)
        total_order = np.atleast_1d(si.total_order)  # shape (d_varying,)
    first_order_ci = boot["first"]  # (d_varying, 2) percentile bounds
    total_order_ci = boot["total"]  # (d_varying, 2)

    # --- 9. Second-order S_ij for every unordered pair (V42qa) ---
    # Exact joint-pair estimator S_ij = Var(E[Y|X_i,X_j])/V - S_i - S_j from the
    # U/V mixed designs (algebra + derivation in _sobol_algebra), replacing the
    # B26nc identity that inferred O(d^2) pairs from d first/total gaps and
    # provably collapsed (pair sums ≡ 0 at d=4, negative beyond).
    sobol_second_order: dict[str, dict[str, float]] = {}
    if d_varying >= 2:
        for ii in range(d_varying):
            for jj in range(ii + 1, d_varying):
                s_ij = float(alg["second"][ii, jj])
                var_a = varying_vars[ii]
                var_b = varying_vars[jj]
                sobol_second_order.setdefault(var_a, {})[var_b] = s_ij
                sobol_second_order.setdefault(var_b, {})[var_a] = s_ij

    # --- 9b. Order masses M1/M2/R + heuristic noise floor (V43pt/V44vw/V45xy) ---
    # M1 sums the DISPLAYED first-order point estimates; M2 sums each unordered
    # pair once; R = 1 - M1 - M2 closes the partition by construction (⊥ clamp;
    # R's bootstrap CI covering 0 means "unresolved from sampling noise", and the
    # noise floor below is an explicitly rough comparator, V44vw).
    # Zero sample variance (degenerate surrogate on these samples): variance
    # fractions are undefined -> report null, NOT silent (0,0,0) masses that
    # contradict V43pt's closure-to-1 (same contract as the d_varying==0 path).
    order_contributions: dict[str, float] | None
    if alg["var_zero"]:
        order_contributions = None
    else:
        m1_mass = float(np.sum(first_order))
        m2_mass = float(np.sum(np.triu(alg["second"], k=1)))
        r_mass = 1.0 - m1_mass - m2_mass
        ci_half_widths = np.concatenate(
            [
                (first_order_ci[:, 1] - first_order_ci[:, 0]) / 2.0,
                (total_order_ci[:, 1] - total_order_ci[:, 0]) / 2.0,
            ]
        )
        order_contributions = {
            "first_order": m1_mass,
            "second_order": m2_mass,
            "third_and_higher": r_mass,
            "first_order_ci_low": float(boot["m1"][0]),
            "first_order_ci_high": float(boot["m1"][1]),
            "second_order_ci_low": float(boot["m2"][0]),
            "second_order_ci_high": float(boot["m2"][1]),
            "third_and_higher_ci_low": float(boot["r"][0]),
            "third_and_higher_ci_high": float(boot["r"][1]),
            "heuristic_noise_floor": float(np.median(ci_half_widths)),
        }

    # --- 10. Assemble final response (all requested input_vars, constants as zeros) ---
    sobol: dict[str, dict[str, float]] = {}
    for i, var in enumerate(input_vars):
        if var in constant_vars:
            # Constant variable: zero variance, Sobol' index is undefined/zero.
            # A constant input contributes no variance to the output, so its
            # first-order and total-order indices are both zero by definition.
            sobol[var] = {
                "main": 0.0,
                "total": 0.0,
                "main_ci_low": 0.0,
                "main_ci_high": 0.0,
                "total_ci_low": 0.0,
                "total_ci_high": 0.0,
            }
        else:
            idx_varying = varying_vars.index(var)
            sobol[var] = {
                "main": float(first_order[idx_varying]),
                "total": float(total_order[idx_varying]),
                "main_ci_low": float(first_order_ci[idx_varying][0]),
                "main_ci_high": float(first_order_ci[idx_varying][1]),
                "total_ci_low": float(total_order_ci[idx_varying][0]),
                "total_ci_high": float(total_order_ci[idx_varying][1]),
            }

    # Only np.isfinite validated — small-N Monte Carlo noise can yield small
    # negative estimates; do NOT clip or reject negative values (§V32).
    for var in sobol:
        for key in (
            "main",
            "total",
            "main_ci_low",
            "main_ci_high",
            "total_ci_low",
            "total_ci_high",
        ):
            val = sobol[var][key]
            if not np.isfinite(val):
                raise ValueError(f"Sobol' index for {var}.{key} is not finite: {val}")
    for var_a in sobol_second_order:
        for var_b in sobol_second_order[var_a]:
            val = sobol_second_order[var_a][var_b]
            if not np.isfinite(val):
                raise ValueError(f"Second-order Sobol' index {var_a}:{var_b} is not finite: {val}")
    if order_contributions is not None:
        for key, val in order_contributions.items():
            if not np.isfinite(val):
                raise ValueError(f"Sobol' order contribution {key} is not finite: {val}")

    return {
        "sobol": sobol,
        "sobolSecondOrder": sobol_second_order,
        "sobolOrderContributions": order_contributions,
    }


if __name__ == "__main__":
    _logger.info("Dakota evaluation module executed")
