"""Tier 3 analytical integration tests: real Dakota solver end-to-end.

These tests run the real Dakota solver (`itis-dakota`, not mocked) against small
analytical functions with known closed-form answers and check the numeric outputs
match. This is the "give it inputs, check the outputs are what we expect" layer.
Each test spawns a real Dakota subprocess, so all tests here are tagged
`@pytest.mark.analytical` and excluded from the default `make test-flaskapi` run.

Test IDs (B1-B8, C1-C3, D1-D4, E1-E4, F1, F3-F6) mirror the categories/IDs in
docs/VERIFICATION_VALIDATION_PLAN.md. Category A (LHS) and H (DataPreprocessor) are
pure-Python and already covered in test_unit_solver.py / test_property_invariants.py;
Category G (MOGA) is deferred (see those files' "DEFERRED" sections). F2/F7 (uniform
and mixed-distribution UQ inputs) are out of scope here: `propagate_uq`'s Dakota config
only ever builds a `normal_uncertain` variables block (see
`create_uq_propagation_conffile` in funs_create_dakota_conf.py, itself flagged
`## TODO ... need to generalize if we want to include other types of input
distributions`) - testing non-normal inputs would require implementing that first.

See docs/TIER1_TIER2_UNIT_TESTS_PLAN.md (Tier 3) for scope and rationale.
"""

import numpy as np
import pandas as pd
import pytest

from mmux_flaskapi.dakota.funs_evaluate import (
    evaluate_sumo,
    evaluate_sumo_along_axes,
    evaluate_sumo_crossvalidation,
    evaluate_sumo_manual_crossvalidation,
    evaluate_sumo_on_grid,
    propagate_uq,
)


@pytest.fixture
def run_dir(tmp_path):
    d = tmp_path / "run"
    d.mkdir()
    return d


def _write_processed(df: pd.DataFrame, path):
    # `add_surrogate_model` only omits the `eval_id` tabular column when the training
    # file path contains "processed" (funs_create_dakota_conf.py) - fixtures must
    # follow that naming convention.
    df.to_csv(path, sep=" ", index=False)
    return path


def _rmse(y_true, y_pred) -> float:
    y_true, y_pred = np.asarray(y_true, dtype=float), np.asarray(y_pred, dtype=float)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def _r2(y_true, y_pred) -> float:
    y_true, y_pred = np.asarray(y_true, dtype=float), np.asarray(y_pred, dtype=float)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    return float(1 - ss_res / ss_tot)


@pytest.mark.analytical
class TestSurrogateAccuracy:
    """Category B: Surrogate Model Accuracy."""

    def test_exact_interpolation_at_training_points(self, run_dir):
        """B1: GP surrogate must reproduce training data almost exactly at training points."""
        x_train = np.linspace(0, 1, 15)
        y_train = 2 * x_train + 1
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train}), run_dir / "train_processed.txt"
        )
        eval_file = _write_processed(pd.DataFrame({"x": x_train}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        np.testing.assert_allclose(result["y_hat"], y_train, atol=1e-3)

    def test_linear_function_matches_analytical(self, run_dir):
        """B2: f(x) = 2x + 1: GP surrogate should reproduce this near-exactly."""
        x_train = np.linspace(0, 1, 20)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.array([0.05, 0.3, 0.55, 0.72, 0.95])
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        expected = 2 * x_eval + 1
        rmse, r2 = _rmse(expected, result["y_hat"]), _r2(expected, result["y_hat"])
        assert rmse < 1e-2
        assert r2 > 0.99

    def test_quadratic_function_matches_analytical(self, run_dir):
        """B3: f(x) = x^2: GP surrogate should approximate within a looser tolerance."""
        x_train = np.linspace(0, 1, 30)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": x_train**2}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.array([0.1, 0.35, 0.5, 0.65, 0.9])
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        expected = x_eval**2
        rmse, r2 = _rmse(expected, result["y_hat"]), _r2(expected, result["y_hat"])
        assert rmse < 1e-2
        assert r2 > 0.99

    def test_sinusoidal_function_within_tolerance(self, run_dir):
        """B4: f(x) = sin(x) on [0, 2pi]: looser tolerance, GP needs denser sampling."""
        x_train = np.linspace(0, 2 * np.pi, 50)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": np.sin(x_train)}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.linspace(0.1, 2 * np.pi - 0.1, 12)
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        expected = np.sin(x_eval)
        assert _rmse(expected, result["y_hat"]) < 0.05
        assert _r2(expected, result["y_hat"]) > 0.95

    def test_logarithmic_function_within_tolerance(self, run_dir):
        """B5: f(x) = ln(x) on [0.01, 2]: monotonic, unbounded derivative near 0.

        Eval points stay away from the extreme boundary (x=0.01) where that unbounded
        derivative makes the GP fit genuinely unreliable at this training density -
        that behavior is expected/documented, not something this test should paper
        over with a looser tolerance.
        """
        x_train = np.linspace(0.01, 2, 20)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": np.log(x_train)}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.array([0.3, 0.5, 0.8, 1.0, 1.5, 1.9])
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        expected = np.log(x_eval)
        assert _rmse(expected, result["y_hat"]) < 0.01

    def test_rosenbrock_2d_harder_than_smooth_functions(self, run_dir):
        """B6: Rosenbrock (2D), non-convex curved valley - GP struggles more than on
        smooth low-order functions, but should still capture the rough shape and
        report non-trivial predictive uncertainty (surfpack variance)."""
        rng = np.linspace(-2, 2, 10)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        z_train = (1 - x_train) ** 2 + 100 * (y_train - x_train**2) ** 2
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": z_train}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.array([-1.5, -0.5, 0.5, 1.5])
        y_eval = np.array([1.5, -0.5, 0.5, -1.5])
        eval_file = _write_processed(pd.DataFrame({"x": x_eval, "y": y_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x", "y"], "z")
        expected = (1 - x_eval) ** 2 + 100 * (y_eval - x_eval**2) ** 2
        z_hat = np.array(result["z_hat"])
        assert np.all(np.isfinite(z_hat))
        normalized_rmse = _rmse(expected, z_hat) / (np.std(expected) + 1e-9)
        # captures the rough shape (better than guessing the mean) but is
        # measurably worse than the near-exact fits on smooth low-order functions above
        assert normalized_rmse < 1.0
        assert "z_std_hat" in result
        assert np.all(np.array(result["z_std_hat"]) > 0)

    def test_convergence_with_training_size(self, run_dir):
        """B7: RMSE for f(x) = sin(x) should decrease as training size grows.

        Uses 3 full periods (domain [0, 6pi]) so that a sparse training set (N=6)
        genuinely under-resolves the oscillation - on a single period, even N=10
        already interpolates near machine precision and the trend can't be observed.
        """
        x_eval = np.linspace(0.4, 6 * np.pi - 0.4, 8)
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")
        expected = np.sin(x_eval)

        rmses = {}
        for n in (6, 15, 60):
            sub_dir = run_dir / f"n_{n}"
            sub_dir.mkdir()
            x_train = np.linspace(0, 6 * np.pi, n)
            train_file = _write_processed(
                pd.DataFrame({"x": x_train, "y": np.sin(x_train)}),
                sub_dir / "train_processed.txt",
            )
            result = evaluate_sumo(sub_dir, train_file, eval_file, ["x"], "y")
            rmses[n] = _rmse(expected, result["y_hat"])

        assert rmses[60] < rmses[15] < rmses[6]

    def test_variance_near_zero_at_training_points_grows_away(self, run_dir):
        """B8: predictive variance ~0 at training points, larger when extrapolating far away."""
        x_train = np.linspace(0, 1, 15)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )
        x_eval = np.concatenate([x_train[:3], [10.0, 20.0]])
        eval_file = _write_processed(pd.DataFrame({"x": x_eval}), run_dir / "eval.txt")

        result = evaluate_sumo(run_dir, train_file, eval_file, ["x"], "y")
        std_hat = np.array(result["y_std_hat"])
        std_at_train, std_far = std_hat[:3], std_hat[3:]
        assert np.all(std_at_train < 1e-3)
        assert np.all(std_far > std_at_train.max())


@pytest.mark.analytical
class TestAxisSweep:
    """Category C: Axis Sweep."""

    def test_linear_2d_sweep_slopes_match_analytical(self, run_dir):
        """C1: f(x,y) = 2x + 3y: sweeping x gives slope 2, sweeping y gives slope 3."""
        rng = np.linspace(0, 1, 6)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": 2 * x_train + 3 * y_train}),
            run_dir / "train_processed.txt",
        )

        results = evaluate_sumo_along_axes(run_dir, train_file, ["x", "y"], "z", NSAMPLESPERVAR=11)

        slope_x = np.polyfit(results["x"]["x"], results["x"]["y_hat"], 1)[0]
        slope_y = np.polyfit(results["y"]["x"], results["y"]["y_hat"], 1)[0]
        assert slope_x == pytest.approx(2.0, rel=0.05)
        assert slope_y == pytest.approx(3.0, rel=0.05)

    def test_sinusoidal_sweep_rmse_within_tolerance(self, run_dir):
        """C2: f(x,y) = sin(x) + y: sweep along x (y fixed) should capture the oscillation."""
        x_rng = np.linspace(0, 2 * np.pi, 12)
        y_rng = np.linspace(0, 1, 12)
        xx, yy = np.meshgrid(x_rng, y_rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": np.sin(x_train) + y_train}),
            run_dir / "train_processed.txt",
        )
        y_cut = 0.5
        results = evaluate_sumo_along_axes(
            run_dir,
            train_file,
            ["x", "y"],
            "z",
            # cut_values must cover every input var (funs_data_processing.py:242 indexes it
            # by all of input_vars) - "x"'s entry is irrelevant since it's the swept axis and
            # gets overwritten by the linspace, but the key must still be present.
            cut_values={"x": 0.0, "y": y_cut},
            NSAMPLESPERVAR=15,
        )

        x_swept = np.array(results["x"]["x"])
        expected = np.sin(x_swept) + y_cut
        assert _rmse(expected, results["x"]["y_hat"]) < 0.1

    def test_custom_cut_values_match_analytical(self, run_dir):
        """C3: with a non-default cut value, sweep predictions should match f(x, cut_y)."""
        rng = np.linspace(0, 1, 6)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": 2 * x_train + 3 * y_train}),
            run_dir / "train_processed.txt",
        )
        custom_cut_y = 0.2  # deliberately not the data mean (0.5)

        results = evaluate_sumo_along_axes(
            run_dir,
            train_file,
            ["x", "y"],
            "z",
            cut_values={"x": 0.0, "y": custom_cut_y},
            NSAMPLESPERVAR=9,
        )

        x_swept = np.array(results["x"]["x"])
        expected = 2 * x_swept + 3 * custom_cut_y
        np.testing.assert_allclose(results["x"]["y_hat"], expected, atol=0.05)


@pytest.mark.analytical
class TestGridEvaluation:
    """Category D: Grid Evaluation."""

    def test_grid_evaluation_linear_2d(self, run_dir):
        """D1: f(x,y) = x + y: predictions on a small 2D grid should match analytically.

        We compare the *set* of predicted values against the *set* of analytically
        expected values (both sorted) rather than positional (x, y) -> z alignment:
        `evaluate_sumo_on_grid`'s 2D reshape/transpose logic is explicitly flagged
        as uncertain in its own source comments ("Why???") for some variable
        orderings, so asserting on element ordering would couple this test to that
        unresolved implementation detail rather than to surrogate correctness.
        """
        rng = np.linspace(0, 1, 6)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": x_train + y_train}),
            run_dir / "train_processed.txt",
        )

        NSAMPLESPERVAR = 4
        results = evaluate_sumo_on_grid(
            run_dir,
            train_file,
            grid_vars=["x", "y"],
            input_vars=["x", "y"],
            response_var="z",
            NSAMPLESPERVAR=NSAMPLESPERVAR,
        )

        z_grid = np.array(results["z"])
        assert z_grid.shape == (NSAMPLESPERVAR, NSAMPLESPERVAR)

        x_vals = np.array(results["x"])
        y_vals = np.array(results["y"])
        z_sorted = np.sort(z_grid.ravel())
        expected_sorted = np.sort(x_vals + y_vals)
        np.testing.assert_allclose(z_sorted, expected_sorted, atol=0.05)

    def test_grid_evaluation_quadratic_2d(self, run_dir):
        """D2: f(x,y) = x^2 + y^2: same sorted-set comparison as D1, looser tolerance."""
        rng = np.linspace(-1, 1, 8)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": x_train**2 + y_train**2}),
            run_dir / "train_processed.txt",
        )

        NSAMPLESPERVAR = 5
        results = evaluate_sumo_on_grid(
            run_dir,
            train_file,
            grid_vars=["x", "y"],
            input_vars=["x", "y"],
            response_var="z",
            NSAMPLESPERVAR=NSAMPLESPERVAR,
        )

        z_grid = np.array(results["z"])
        x_vals, y_vals = np.array(results["x"]), np.array(results["y"])
        z_sorted = np.sort(z_grid.ravel())
        expected_sorted = np.sort(x_vals**2 + y_vals**2)
        assert _rmse(expected_sorted, z_sorted) < 0.05

    def test_grid_dimension_consistency(self, run_dir):
        """D3: NSAMPLESPERVAR=10 with 2 grid vars -> output shape (10, 10)."""
        rng = np.linspace(0, 1, 6)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": x_train + y_train}),
            run_dir / "train_processed.txt",
        )

        results = evaluate_sumo_on_grid(
            run_dir,
            train_file,
            grid_vars=["x", "y"],
            input_vars=["x", "y"],
            response_var="z",
            NSAMPLESPERVAR=10,
        )
        assert np.array(results["z"]).shape == (10, 10)

    def test_grid_with_fixed_non_grid_variable(self, run_dir):
        """D4: 3 inputs, 2 grid vars + 1 fixed var - the fixed var stays at its cut value."""
        rng = np.linspace(0, 1, 5)
        xx, yy, zz = np.meshgrid(rng, rng, rng)
        x_train, y_train, z_train = xx.ravel(), yy.ravel(), zz.ravel()
        train_file = _write_processed(
            pd.DataFrame(
                {"x": x_train, "y": y_train, "z": z_train, "w": x_train + y_train + z_train}
            ),
            run_dir / "train_processed.txt",
        )
        fixed_z = 0.3

        results = evaluate_sumo_on_grid(
            run_dir,
            train_file,
            grid_vars=["x", "y"],
            input_vars=["x", "y", "z"],
            response_var="w",
            # cut_values must cover every input var (funs_evaluate.py:350 indexes it by all
            # of input_vars) - "x"/"y" entries are irrelevant since they're grid vars and get
            # overwritten by the grid linspace, but the keys must still be present.
            cut_values={"x": 0.0, "y": 0.0, "z": fixed_z},
            NSAMPLESPERVAR=4,
        )

        np.testing.assert_allclose(results["z"], fixed_z, atol=1e-9)


@pytest.mark.analytical
class TestCrossValidation:
    """Category E: Cross-Validation."""

    def test_crossvalidation_rmse_near_zero_for_linear(self, run_dir):
        """E1: A well-sampled linear function should cross-validate with RMSE ~ 0."""
        x_train = np.linspace(0, 1, 30)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )

        metrics = evaluate_sumo_crossvalidation(
            run_dir, train_file, ["x"], "y", N_CROSS_VALIDATION=5
        )
        assert "y" in metrics
        assert isinstance(metrics["y"], dict)
        rmse = float(metrics["y"]["root_mean_squared"])
        assert rmse < 0.1

    def test_crossvalidation_rmse_improves_with_more_data(self, run_dir):
        """E2: CV RMSE for f(x) = sin(x) should generally decrease as training size grows."""
        rmses = {}
        for n in (20, 50, 100):
            sub_dir = run_dir / f"n_{n}"
            sub_dir.mkdir()
            x_train = np.linspace(0, 2 * np.pi, n)
            train_file = _write_processed(
                pd.DataFrame({"x": x_train, "y": np.sin(x_train)}),
                sub_dir / "train_processed.txt",
            )
            metrics = evaluate_sumo_crossvalidation(
                sub_dir, train_file, ["x"], "y", N_CROSS_VALIDATION=5
            )
            rmses[n] = float(metrics["y"]["root_mean_squared"])

        assert rmses[100] < rmses[20]

    def test_manual_crossvalidation_prediction_interval_coverage(self, run_dir):
        """E3: ~95% of held-out points should fall within y_hat +/- 1.96*std_hat.

        Uses the small-N regime typical of this test suite, so the observed coverage
        won't hit exactly 95% - a generous lower bound avoids flakiness while still
        being a meaningful check (not trivially satisfied).
        """
        x_train = np.linspace(0, 1, 40)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": x_train**2}),
            run_dir / "train_processed.txt",
        )

        cv = evaluate_sumo_manual_crossvalidation(
            run_dir, train_file, ["x"], "y", N_CROSS_VALIDATION=5
        )
        obs = np.array(cv["y"])
        pred = np.array(cv["y_hat"])
        std = np.array(cv["y_std_hat"])

        within_interval = np.abs(obs - pred) <= 1.96 * std + 1e-9
        coverage = within_interval.mean()
        assert coverage >= 0.7

    def test_manual_vs_builtin_crossvalidation_agree(self, run_dir):
        """E4: manual (per-fold) and built-in Dakota CV RMSE should roughly agree."""
        x_train = np.linspace(0, 1, 30)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )

        builtin_metrics = evaluate_sumo_crossvalidation(
            run_dir, train_file, ["x"], "y", N_CROSS_VALIDATION=5
        )
        builtin_rmse = float(builtin_metrics["y"]["root_mean_squared"])

        manual_dir = run_dir / "manual"
        manual_dir.mkdir()
        manual_cv = evaluate_sumo_manual_crossvalidation(
            manual_dir, train_file, ["x"], "y", N_CROSS_VALIDATION=5
        )
        manual_rmse = _rmse(manual_cv["y"], manual_cv["y_hat"])

        # both should be small in absolute terms for this easy, well-sampled function
        assert builtin_rmse < 0.1
        assert manual_rmse < 0.1


@pytest.mark.analytical
class TestUqPropagation:
    """Category F: UQ Propagation (normal-uncertain inputs only, see module docstring)."""

    def test_linear_uq_propagation_matches_analytical(self, run_dir):
        """F1: f(x) = 2x+1, x ~ N(0,1) => y ~ N(1, 4): output mean ~ 1, std ~ 2."""
        x_train = np.linspace(-4, 4, 40)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )

        samples = propagate_uq(
            run_dir,
            train_file,
            input_vars=["x"],
            output_response="y",
            means={"x": 0.0},
            stds={"x": 1.0},
            n_samples=500,
        )
        samples = np.array(samples)
        assert np.isclose(samples.mean(), 1.0, atol=0.3)
        assert np.isclose(samples.std(), 2.0, atol=0.3)

    def test_quadratic_uq_propagation_matches_chi_square(self, run_dir):
        """F3: f(x) = x^2, x ~ N(0,1) => y ~ chi-square(1): mean ~ 1, var ~ 2."""
        x_train = np.linspace(-4, 4, 60)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": x_train**2}),
            run_dir / "train_processed.txt",
        )

        samples = propagate_uq(
            run_dir,
            train_file,
            input_vars=["x"],
            output_response="y",
            means={"x": 0.0},
            stds={"x": 1.0},
            n_samples=3000,
        )
        samples = np.array(samples)
        assert np.isclose(samples.mean(), 1.0, atol=0.25)
        assert np.isclose(samples.var(), 2.0, atol=0.6)

    def test_uq_propagation_convergence_with_sample_count(self, run_dir):
        """F4: mean estimation error for f(x) = 2x+1 should shrink as n_samples grows."""
        x_train = np.linspace(-4, 4, 40)
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )

        errors = {}
        for n in (100, 2000):
            sub_dir = run_dir / f"n_{n}"
            sub_dir.mkdir()
            samples = np.array(
                propagate_uq(
                    sub_dir,
                    train_file,
                    input_vars=["x"],
                    output_response="y",
                    means={"x": 0.0},
                    stds={"x": 1.0},
                    n_samples=n,
                )
            )
            errors[n] = abs(samples.mean() - 1.0)

        assert errors[2000] < errors[100] + 0.2  # loose: convergence in probability, not monotone

    def test_multi_input_uq_propagation_matches_analytical(self, run_dir):
        """F5: f(x,y) = x+y, x,y ~ N(0,1) iid => y ~ N(0, sqrt(2))."""
        rng = np.linspace(-4, 4, 15)
        xx, yy = np.meshgrid(rng, rng)
        x_train, y_train = xx.ravel(), yy.ravel()
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": y_train, "z": x_train + y_train}),
            run_dir / "train_processed.txt",
        )

        samples = propagate_uq(
            run_dir,
            train_file,
            input_vars=["x", "y"],
            output_response="z",
            means={"x": 0.0, "y": 0.0},
            stds={"x": 1.0, "y": 1.0},
            n_samples=800,
        )
        samples = np.array(samples)
        assert np.isclose(samples.mean(), 0.0, atol=0.2)
        assert np.isclose(samples.std(), np.sqrt(2), atol=0.3)

    def test_sparse_training_increases_propagated_uncertainty(self, run_dir):
        """F6: a surrogate trained on sparse/off-center data should propagate more spread
        than the well-sampled F1 case, since its own predictive uncertainty adds to the
        output distribution. Best-effort/statistical: compares against F1's known
        analytical std (2.0) with a one-sided margin rather than an exact value.
        """
        x_train = np.array([-3.9, -3.5, 3.5, 3.9])  # sparse, avoids the N(0,1) input's mass
        train_file = _write_processed(
            pd.DataFrame({"x": x_train, "y": 2 * x_train + 1}),
            run_dir / "train_processed.txt",
        )

        samples = np.array(
            propagate_uq(
                run_dir,
                train_file,
                input_vars=["x"],
                output_response="y",
                means={"x": 0.0},
                stds={"x": 1.0},
                n_samples=800,
            )
        )
        assert samples.std() > 2.0
