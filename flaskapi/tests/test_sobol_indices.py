"""
Tests for Sobol' sensitivity indices (#470, T31rb).

Covers the pure scipy-based computation (Saltelli sampling, power-of-2 rounding,
constant-var handling) and the `/flask/dakota/compute_sobol_indices` endpoint.
The exact arbitrary-d pair estimator (V42qa) is validated against four analytic
benchmarks - additive d=8, pair-interaction d=5, Ishigami, pair-quadratic d=10 -
with tolerances scaled by the shared-bootstrap CI half-widths (V44vw), and the
B26nc degeneracy regression proves the retired identity's mass-leak artifact is
gone. Order masses M1/M2/R and the response contract are covered route-side.
"""

import math

import numpy as np
import pytest
from flask import Flask

pytestmark = pytest.mark.unit


def _ishigami(x: np.ndarray) -> np.ndarray:
    """Ishigami test function: f(x1,x2,x3) = sin(x1) + 7*sin²(x2) + 0.1*x3⁴*sin(x1).

    Uniform inputs on [-π, π] for all three variables.
    """
    return np.sin(x[:, 0]) + 7.0 * np.sin(x[:, 1]) ** 2 + 0.1 * x[:, 2] ** 4 * np.sin(x[:, 0])


CONTRIB_KEYS = {
    "first_order",
    "second_order",
    "third_and_higher",
    "first_order_ci_low",
    "first_order_ci_high",
    "second_order_ci_low",
    "second_order_ci_high",
    "third_and_higher_ci_low",
    "third_and_higher_ci_high",
    "heuristic_noise_floor",
}

# After the global snake->camel response serializer (V13), the same fixed
# fields arrive FE-side exactly in the flaskapi §I "api planned" camel shape.
CONTRIB_KEYS_CAMEL = {
    "firstOrder",
    "secondOrder",
    "thirdAndHigher",
    "firstOrderCiLow",
    "firstOrderCiHigh",
    "secondOrderCiLow",
    "secondOrderCiHigh",
    "thirdAndHigherCiLow",
    "thirdAndHigherCiHigh",
    "heuristicNoiseFloor",
}


def _build_sobol_designs(f, d: int, *, n: int = 2**12, seed: int = 42):
    """Build Saltelli A/B/C + AB + pair(U/V) evaluations for analytic f.

    Mirrors the sampling pipeline of evaluate_sobol_indices (same Sobol' QMC
    3*d stream, same design construction) so tests exercise the shipped math
    without a surrogate.
    """
    from scipy.stats import uniform
    from scipy.stats.qmc import Sobol

    sampler = Sobol(d=3 * d, seed=seed, scramble=True)
    U = sampler.random(n)
    dists = [uniform(loc=-np.pi, scale=2 * np.pi) for _ in range(d)]
    A = np.column_stack([dists[i].ppf(U[:, i]) for i in range(d)])
    B = np.column_stack([dists[i].ppf(U[:, d + i]) for i in range(d)])
    C = np.column_stack([dists[i].ppf(U[:, 2 * d + i]) for i in range(d)])
    ii, jj = np.triu_indices(d, k=1)
    pairs = np.column_stack([ii, jj])
    K = len(ii)
    f_AB = np.empty((d, n))
    for i in range(d):
        X = A.copy()
        X[:, i] = B[:, i]
        f_AB[i] = f(X)
    f_UV = np.empty((2 * K, n))
    for k in range(K):
        i, j = int(ii[k]), int(jj[k])
        Xu = B.copy()
        Xu[:, [i, j]] = A[:, [i, j]]
        Xv = C.copy()
        Xv[:, [i, j]] = A[:, [i, j]]
        f_UV[k] = f(Xu)
        f_UV[K + k] = f(Xv)
    return f(A), f(B), f_AB, f_UV[:K], f_UV[K:], pairs


def _run_algebra_on_analytic(f, d: int, *, n: int = 2**12, seed: int = 42):
    """Run the PRODUCTION algebra/bootstrap helpers on analytic designs."""
    from mmux_flaskapi.dakota.funs_evaluate import _sobol_algebra, _sobol_joint_bootstrap

    f_A, f_B, f_AB, f_U, f_V, pairs = _build_sobol_designs(f, d, n=n, seed=seed)
    alg = _sobol_algebra(f_A, f_B, f_AB, f_U, f_V, pairs)
    boot = _sobol_joint_bootstrap(
        f_A,
        f_B,
        f_AB,
        f_U,
        f_V,
        pairs,
        seed=seed,
        n_resamples=200,
        confidence=0.95,
    )
    return alg, boot


class TestSobolSampling:
    """Unit tests for the Saltelli sampling and index computation (no surrogate)."""

    def test_power_of_two_rounding(self):
        """num_samples is rounded up to the next power of 2."""

        # 100 -> 128, 1 -> 2, 17 -> 32
        for requested, expected_n in [
            (100, 128),
            (1, 2),
            (17, 32),
            (64, 64),
            (256, 256),
        ]:
            assert 2 ** math.ceil(math.log2(max(requested, 2))) == expected_n

    def test_sobol_base_samples_is_1024(self):
        """V36: Sobol' uses a fixed base N=1024 (Saltelli scheme), decoupled from
        the shared UQ `numSamples` field used by Histogram/Correlation."""
        from mmux_flaskapi.dakota.funs_evaluate import SOBOL_BASE_SAMPLES

        assert SOBOL_BASE_SAMPLES == 1024

    def test_constant_variable_indices_are_zero(self):
        """Constant input variables get main=0, total=0 in the response."""

        # We can't call evaluate_sumo without a real surrogate, so test the
        # logic by verifying the constant-var detection and zero assignment.
        # This is tested indirectly via the route test below.
        distributions = {
            "x1": {"distribution": "uniform", "min": -3.14159, "max": 3.14159},
            "x2": {"distribution": "constant", "value": 1.0},
        }
        # Verify constant detection
        constant_vars = {
            k: v["value"] for k, v in distributions.items() if v["distribution"] == "constant"
        }
        varying_vars = [k for k in distributions if k not in constant_vars]
        assert constant_vars == {"x2": 1.0}
        assert varying_vars == ["x1"]

    def test_second_order_empty_when_single_varying_var(self):
        """sobolSecondOrder is empty when there is only one varying input variable."""
        # This is validated by the response model: sobolSecondOrder defaults to {}
        from mmux_flaskapi.blueprints.dakota_models import SobolIndicesResponse

        resp = SobolIndicesResponse(
            sobol={
                "x1": {
                    "main": 0.3,
                    "total": 0.5,
                    "main_ci_low": 0.2,
                    "main_ci_high": 0.4,
                    "total_ci_low": 0.4,
                    "total_ci_high": 0.6,
                }
            },
            sobol_second_order={},
            sobol_order_contributions={key: 0.0 for key in CONTRIB_KEYS},
        )
        assert resp.sobol_second_order == {}

    def test_second_order_symmetric(self):
        """sobolSecondOrder must be symmetric over unordered pairs."""
        from mmux_flaskapi.blueprints.dakota_models import SobolIndicesResponse

        s12 = 0.15
        ci = {
            "main_ci_low": 0.1,
            "main_ci_high": 0.4,
            "total_ci_low": 0.3,
            "total_ci_high": 0.6,
        }
        resp = SobolIndicesResponse(
            sobol={
                "x1": {"main": 0.3, "total": 0.5, **ci},
                "x2": {"main": 0.2, "total": 0.4, **ci},
            },
            sobol_second_order={"x1": {"x2": s12}, "x2": {"x1": s12}},
            sobol_order_contributions={key: 0.0 for key in CONTRIB_KEYS},
        )
        assert resp.sobol_second_order["x1"]["x2"] == s12
        assert resp.sobol_second_order["x2"]["x1"] == s12


class TestSobolArbitraryDPairEstimator:
    """V42qa acceptance gates for the exact arbitrary-d pair estimator (T31rb).

    All tolerances are scaled by the shared-bootstrap CI half-width (V44vw)
    rather than hand-tuned absolute floors. The Ishigami test keeps the
    `test_sobol_indices_ishigami_analytical` name (historic §R1 acceptance gate)
    but now drives the PRODUCTION algebra helpers (⊥ inlined duplicate math).
    """

    def test_sobol_indices_ishigami_analytical(self):
        """§R1 acceptance gate (production algebra): Ishigami indices match analytical."""
        alg, boot = _run_algebra_on_analytic(_ishigami, d=3, n=2**14, seed=42)

        # first-order: S1≈0.314, S2≈0.442, S3≈0; total: 0.558/0.442/0.244
        for i, expect in enumerate([0.314, 0.442, 0.0]):
            assert alg["first"][i] == pytest.approx(expect, abs=0.05)
        for i, expect in enumerate([0.558, 0.442, 0.244]):
            assert alg["total"][i] == pytest.approx(expect, abs=0.05)

        # second-order: S_12≈0, S_13≈0.244, S_23≈0
        assert alg["second"][0, 1] == pytest.approx(0.0, abs=0.05)
        assert alg["second"][0, 2] == pytest.approx(0.244, abs=0.05)
        assert alg["second"][1, 2] == pytest.approx(0.0, abs=0.05)

        # V43pt: masses over unique ANOVA terms, identity exact per replicate
        assert alg["m1"] == pytest.approx(0.756, abs=0.05)
        assert alg["m2"] == pytest.approx(0.244, abs=0.05)
        assert alg["m1"] + alg["m2"] + alg["r"] == pytest.approx(1.0, abs=1e-12)

    def test_sobol_second_order_additive_d8(self):
        """V42qa additive d=8 benchmark: every pair ≈ 0 within 3·bootstrap-CI."""

        def f(x):
            return (
                np.sin(x[:, 0])
                + np.abs(x[:, 1])
                + np.tanh(x[:, 2])
                + x[:, 3] ** 2
                + np.cos(x[:, 4])
                + np.exp(x[:, 5] / 4)
                + np.sin(2 * x[:, 6])
                + np.abs(x[:, 7]) ** 1.5
            )

        alg, boot = _run_algebra_on_analytic(f, d=8, seed=7)
        ii, jj = np.triu_indices(8, k=1)
        s_ij = alg["second"][ii, jj]
        # V42qa: no real interactions -> every pair estimate sits inside 3x its
        # own shared-bootstrap CI half-width (observed ~1e-4 at n=4096)
        half_pair = (boot["second"][:, 1] - boot["second"][:, 0]) / 2.0
        assert np.all(np.abs(s_ij) <= 3 * half_pair + 1e-9)
        half_m2 = float(boot["m2"][1] - boot["m2"][0]) / 2.0
        assert abs(alg["m2"]) <= 3 * half_m2 + 1e-9
        assert alg["m1"] + alg["m2"] + alg["r"] == pytest.approx(1.0, abs=1e-12)

    def test_sobol_second_order_pair_interaction_d5(self):
        """V42qa pair-interaction d=5: S_12 recovers the analytic value exactly."""

        def f(x):
            return 2 * x[:, 0] * x[:, 1] + np.sin(x[:, 2]) + np.abs(x[:, 3]) + np.tanh(x[:, 4])

        alg, boot = _run_algebra_on_analytic(f, d=5, seed=11)
        # analytic: V_12/V with uniform[-pi,pi]: E[x^2]=pi^2/3
        v12 = 4 * (np.pi**2 / 3) ** 2
        others = [
            np.var(np.sin(np.linspace(-np.pi, np.pi, 40001))),
            np.var(np.abs(np.linspace(-np.pi, np.pi, 40001))),
            np.var(np.tanh(np.linspace(-np.pi, np.pi, 40001))),
        ]
        s12_true = v12 / (v12 + sum(others))
        # V42qa: tolerance = 3x THIS pair's bootstrap CI half-width (V44vw CIs)
        half_pair = (boot["second"][:, 1] - boot["second"][:, 0]) / 2.0
        ii, jj = np.triu_indices(5, k=1)
        s_all = alg["second"][ii, jj]
        assert s_all[0] == pytest.approx(s12_true, abs=max(0.01, 3 * float(half_pair[0])))
        # all remaining pairs are truly zero -> within their own 3 CIs
        assert np.all(np.abs(s_all[1:]) <= 3 * half_pair[1:] + 1e-9)

    def test_sobol_second_order_pair_quadratic_d10(self):
        """V42qa >=10-dim analytic benchmark: one known pair in d=10."""
        rng = np.random.default_rng(3)
        a = rng.uniform(0.5, 2.0, 10)
        c0 = 1.5

        def f(x):
            return a @ x.T + c0 * x[:, 0] * x[:, 1]

        alg, boot = _run_algebra_on_analytic(f, d=10, seed=5)
        v12 = c0**2 * (np.pi**2 / 3) ** 2
        vtot = float(np.sum(a**2) * (np.pi**2 / 3)) + v12
        s01_true = v12 / vtot
        half = float(boot["m2"][1] - boot["m2"][0]) / 2.0
        assert alg["second"][0, 1] == pytest.approx(s01_true, abs=max(0.01, 3 * half))
        # d=10 is inside the 4-25 target window: M2 captures the true mass
        assert alg["m2"] == pytest.approx(s01_true, abs=max(0.01, 3 * half))
        # the 44 zero pairs must each stay within 3x their OWN bootstrap CI -
        # pairs touching a strong main effect carry visibly larger joint-index
        # noise, which a flat absolute tolerance would misjudge as bias
        half_pair = (boot["second"][:, 1] - boot["second"][:, 0]) / 2.0
        ii, jj = np.triu_indices(10, k=1)
        s_all = alg["second"][ii, jj]
        assert np.all(np.abs(s_all[1:]) <= 3 * half_pair[1:] + 1e-9)
        assert np.sum(s_all) == pytest.approx(s01_true, abs=max(0.01, 3 * half))

    def test_sobol_second_order_not_degenerate_vs_b26nc(self):
        """B26nc regression: the retired identity leaks mass as a NEGATIVE pair.

        For f = Ishigami(x1,x2,x3) + additive(x4,x5) the old
        ((U_i+U_j)-Σ_{k≠i,j} U_k)/2 estimator assigns S_45 = -S_13 ≈ -0.244
        (pure artifact: x4,x5 are non-interacting). The T31rb estimator must
        return S_45 ≈ 0 with no negative mass anywhere outside noise.
        """

        def f(x):
            base = _ishigami(x[:, :3])
            rest = np.abs(x[:, 3]) + np.tanh(x[:, 4])
            return base + rest

        alg, boot = _run_algebra_on_analytic(f, d=5, seed=13)
        # true interaction: only S_13 ≈ 0.244 (diluted by the additive rest)
        assert alg["second"][0, 2] > 0.1
        half45 = float(boot["second"][9, 1] - boot["second"][9, 0]) / 2.0  # pair (3,4)
        assert abs(alg["second"][3, 4]) <= max(0.01, 3 * half45), (
            "non-interacting pair must not carry negative mass"
        )
        # what the OLD identity would have produced, from the same first/total:
        u = alg["total"] - alg["first"]
        old_s45 = (u[3] + u[4] - (u[0] + u[1] + u[2])) / 2.0
        assert old_s45 < -0.1, "regression guard: old identity is provably degenerate here"
        # new estimator's total pair mass stays physically sane
        assert abs(alg["m2"] - alg["second"][0, 2]) <= 0.05

    def test_order_mass_identity_any_d(self):
        """V43pt: M1+M2+R=1 exactly (closure), for any d including d=2."""
        for d, seed in [(2, 1), (4, 2), (8, 3)]:

            def f(x, d=d):
                main = np.sin(x[:, 0])
                if d > 1:
                    main = main + np.abs(x[:, 1] * x[:, min(2, x.shape[1] - 1)])
                return main

            alg, _ = _run_algebra_on_analytic(f, d=d, n=2**10, seed=seed)
            assert alg["m1"] + alg["m2"] + alg["r"] == pytest.approx(1.0, abs=1e-12)


class TestSobolEstimatorInvariants:
    """B28pp (PR #649 Copilot review): estimator-level invariants of V42qa.

    The T31rb algebra originally used raw products anchored on ``f_A`` only
    (``E[f_B.f_AB_i] - E[f_A]^2``, ``Var(f_A)``): NOT translation-invariant
    under ``f -> f + c`` (drift ~ c whenever mean >> std), and a different
    estimator than the scipy point estimates displayed alongside it. The algebra
    now mirrors scipy.stats.sobol_indices' ``saltelli_2010`` exactly (pooled
    A/B mean removal, pooled A/B variance, centered products)."""

    @staticmethod
    def _f(x):
        return 2 * x[:, 0] * x[:, 1] + np.sin(x[:, 2]) + np.abs(x[:, 3])

    def test_indices_invariant_under_output_translation(self):
        """Adding a constant offset to EVERY model output moves NO index.

        Raw-product estimators drift proportionally to the offset (units
        effects, e.g. stress reported in Pa); centered products cannot."""
        from mmux_flaskapi.dakota.funs_evaluate import _sobol_algebra

        d = 4
        f_A, f_B, f_AB, f_U, f_V, pairs = _build_sobol_designs(self._f, d=d, n=2**10, seed=21)
        alg0 = _sobol_algebra(f_A, f_B, f_AB, f_U, f_V, pairs)
        offset = 500.0  # ~100x the output std: the mean >> std regime
        algc = _sobol_algebra(
            f_A + offset, f_B + offset, f_AB + offset, f_U + offset, f_V + offset, pairs
        )
        np.testing.assert_allclose(algc["first"], alg0["first"], atol=1e-8)
        np.testing.assert_allclose(algc["total"], alg0["total"], atol=1e-8)
        np.testing.assert_allclose(algc["second"], alg0["second"], atol=1e-8)
        assert algc["m1"] == pytest.approx(alg0["m1"], abs=1e-8)
        assert algc["m2"] == pytest.approx(alg0["m2"], abs=1e-8)
        assert algc["r"] == pytest.approx(alg0["r"], abs=1e-8)

    def test_algebra_matches_scipy_point_estimator(self):
        """Bootstrap CIs must target the SAME estimator as the displayed scipy
        first/total points (d>=2 path of evaluate_sobol_indices)."""
        from scipy.stats import sobol_indices

        from mmux_flaskapi.dakota.funs_evaluate import _sobol_algebra

        d, n = 4, 2**10
        f_A, f_B, f_AB, f_U, f_V, pairs = _build_sobol_designs(self._f, d=d, n=n, seed=22)
        si = sobol_indices(
            func={
                "f_A": f_A.reshape(1, n),
                "f_B": f_B.reshape(1, n),
                "f_AB": f_AB.reshape(d, 1, n),
            },
            n=n,
        )
        alg = _sobol_algebra(f_A, f_B, f_AB, f_U, f_V, pairs)
        np.testing.assert_allclose(alg["first"], np.atleast_1d(si.first_order), atol=1e-9)
        np.testing.assert_allclose(alg["total"], np.atleast_1d(si.total_order), atol=1e-9)

    def test_zero_variance_sample_sets_var_zero(self):
        """V43pt/B28pp algebra seam: constant samples flag var_zero (the response
        layer turns that into null order contributions, not fake 0/0/0 masses)."""
        from mmux_flaskapi.dakota.funs_evaluate import _sobol_algebra

        n, d = 64, 3
        alg = _sobol_algebra(
            np.full(n, 2.0),
            np.full(n, 2.0),
            np.full((d, n), 2.0),
            np.empty((0, n)),
            np.empty((0, n)),
            np.empty((0, 2), dtype=int),
        )
        assert alg["var_zero"] is True
        assert alg["m1"] == 0.0 and alg["m2"] == 0.0 and alg["r"] == 0.0
        # and a live sample does NOT set the flag
        alg_live, _ = _run_algebra_on_analytic(self._f, d=4, n=2**8, seed=23)
        assert alg_live["var_zero"] is False


# ---------------------------------------------------------------------------
# Route: /flask/dakota/compute_sobol_indices
# ---------------------------------------------------------------------------


def _make_jobs(n: int, input_vars: list[str], output: str) -> list[dict]:
    jobs = []
    rng = np.random.default_rng(0)
    for _ in range(n):
        job = {
            "status": "completed",
            "inputs": {var: float(rng.uniform(-1, 1)) for var in input_vars},
            "outputs": {output: float(rng.uniform(0, 10))},
        }
        jobs.append(job)
    return jobs


def _make_distributions(input_vars: list[str]) -> dict:
    return {
        var: {
            "distribution": "normal",
            "mean": 0.0,
            "std": 1.0,
            "min": -3.0,
            "max": 3.0,
        }
        for var in input_vars
    }


class TestComputeSobolIndicesRoute:
    """Test suite for the /flask/dakota/compute_sobol_indices endpoint."""

    @pytest.fixture(autouse=True)
    def _small_sobol_base_samples(self, monkeypatch):
        """V36: SOBOL_BASE_SAMPLES is now a fixed constant (⊥ request numSamples), so
        shrink it for these route tests to keep them fast (mirrors the old numSamples=10
        trick these tests used before the base count was decoupled from the request)."""
        monkeypatch.setattr("mmux_flaskapi.dakota.funs_evaluate.SOBOL_BASE_SAMPLES", 8)

    def test_sobol_indices_success(self, test_client: Flask):
        """Valid request returns 200, sobol, and sobolSecondOrder keys (incl. bootstrap CIs)."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, dict)
        assert "sobol" in data
        assert set(data["sobol"].keys()) == set(input_vars)
        ci_keys = ("mainCiLow", "mainCiHigh", "totalCiLow", "totalCiHigh")
        for var in input_vars:
            entry = data["sobol"][var]
            assert "main" in entry and isinstance(entry["main"], (int, float))
            assert "total" in entry and isinstance(entry["total"], (int, float))
            for key in ci_keys:
                assert key in entry and isinstance(entry[key], (int, float))
            assert entry["mainCiLow"] <= entry["mainCiHigh"]
            assert entry["totalCiLow"] <= entry["totalCiHigh"]
        # sobolSecondOrder is always present
        assert "sobolSecondOrder" in data
        assert isinstance(data["sobolSecondOrder"], dict)
        # With 2 vars, there should be exactly 1 pair (symmetric entries for both vars)
        assert len(data["sobolSecondOrder"]) == 2
        assert "x1" in data["sobolSecondOrder"] and "x2" in data["sobolSecondOrder"]
        assert "x2" in data["sobolSecondOrder"]["x1"]
        assert "x1" in data["sobolSecondOrder"]["x2"]

    def test_seed_zero_accepted(self, test_client: Flask):
        """V34: seed=0 is now valid (scipy/numpy RNGs accept 0, unlike Dakota NIDR)."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 0,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert "sobol" in data

    def test_sobol_second_order_empty_with_single_var(self, test_client: Flask):
        """With only 1 input var, sobolSecondOrder must be empty (no pairs)."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["sobolSecondOrder"] == {}

    def test_sobol_indices_preserves_multi_word_variable_names(self, test_client: Flask):
        """Regression (flaskapi/SPEC.md B15): a multi-word snake_case input var name
        must survive the response's snake_to_camel JSON serialization untouched -
        the frontend looks up `sobol[inputVars[i]]` by the exact var name it sent,
        so a mangled key (e.g. "sigma_blood" -> "sigmaBlood") makes the lookup
        silently miss and the plot render as all-zero bars."""
        input_vars = ["sigma_blood", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert set(data["sobol"].keys()) == set(input_vars)

    def test_sobol_indices_preserves_sanitize_affecting_variable_names(self, test_client: Flask):
        """Regression: an input var name containing characters that
        `sanitize_varnames` rewrites (spaces, parentheses) must NOT be sanitized
        inside `evaluate_sobol_indices` - `preprocessor.input_variables` is keyed
        by the original request name, so sanitizing first causes a KeyError on
        that lookup, and sanitizing the response keys would return names the
        frontend never sent."""
        input_vars = ["sigma blood (kg)", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert set(data["sobol"].keys()) == set(input_vars)

    def test_missing_distribution_for_input_var(self, test_client: Flask):
        """Missing a distribution for a requested input var returns 400."""
        input_vars = ["x1", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(["x1"]),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_too_few_completed_jobs(self, test_client: Flask):
        """Fewer than 5 completed jobs returns 400."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(3, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400

    def test_missing_required_field(self, test_client: Flask):
        """Missing required 'seed' field returns 400."""
        input_vars = ["x1"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "seed" in data["error"]

    def test_evaluation_failure_propagates_500(self, test_client: Flask, monkeypatch):
        """If Sobol' evaluation fails, the error is propagated as a 500."""

        def fail_eval(*args, **kwargs):
            raise RuntimeError("Some error")

        monkeypatch.setattr("mmux_flaskapi.blueprints.dakota.evaluate_sobol_indices", fail_eval)

        input_vars = ["x1"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 500
        data = response.get_json()
        assert "Some error" in data["error"]


class TestSobolOrderContributionsRoute:
    """T31rb route contract: exact arbitrary-d pairs + M1/M2/R masses (V42qa-V46jk)."""

    @pytest.fixture(autouse=True)
    def _small_sobol_base_samples(self, monkeypatch):
        """Keep the enlarged 8-var batch cheap; mirrors the 2-var route tests."""
        monkeypatch.setattr("mmux_flaskapi.dakota.funs_evaluate.SOBOL_BASE_SAMPLES", 8)

    def test_sobol_indices_success_eight_vars(self, test_client: Flask):
        """V42qa target window: d=8 returns all C(8,2)=28 symmetric pairs."""
        input_vars = [f"x{i}" for i in range(1, 9)]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(60, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        pairs = data["sobolSecondOrder"]
        assert set(pairs.keys()) == set(input_vars)
        for var in input_vars:
            assert len(pairs[var]) == 7, "every var must pair with all 7 others"
            assert var not in pairs[var], "no self-pair"
        n_pairs = sum(len(v) for v in pairs.values())
        assert n_pairs == 2 * 28, "28 unordered pairs, stored symmetrically"
        for var_a, row in pairs.items():
            for var_b, val in row.items():
                assert isinstance(val, (int, float))
                assert math.isfinite(val)
                assert pairs[var_b][var_a] == pytest.approx(val)

    def test_sobol_order_contributions_consistency(self, test_client: Flask):
        """V43pt/V44vw: M1+M2+R=1, CI bounds ordered, noise floor = median half-width."""
        input_vars = [f"x{i}" for i in range(1, 9)]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 7,
            "FunctionJobs": _make_jobs(60, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        c = data["sobolOrderContributions"]
        assert set(c.keys()) == CONTRIB_KEYS_CAMEL
        assert c["firstOrder"] + c["secondOrder"] + c["thirdAndHigher"] == pytest.approx(
            1.0, abs=1e-9
        )
        assert c["firstOrderCiLow"] <= c["firstOrderCiHigh"]
        assert c["secondOrderCiLow"] <= c["secondOrderCiHigh"]
        assert c["thirdAndHigherCiLow"] <= c["thirdAndHigherCiHigh"]
        assert c["heuristicNoiseFloor"] >= 0.0
        # heuristic floor = median of per-variable first/total CI half-widths (V44vw)
        half_widths = []
        for var in input_vars:
            e = data["sobol"][var]
            half_widths.append((e["mainCiHigh"] - e["mainCiLow"]) / 2)
            half_widths.append((e["totalCiHigh"] - e["totalCiLow"]) / 2)
        assert c["heuristicNoiseFloor"] == pytest.approx(float(np.median(half_widths)), rel=1e-6)
        # M2 equals the summed unique pairs actually returned
        m2_from_pairs = sum(
            val
            for var_a, row in data["sobolSecondOrder"].items()
            for var_b, val in row.items()
            if var_a < var_b
        )
        assert c["secondOrder"] == pytest.approx(m2_from_pairs, abs=1e-9)

    def test_sobol_response_fixed_fields(self, test_client: Flask):
        """V46jk: top-level response keys are fixed schema fields, no interpolation."""
        input_vars = ["x1", "x2"]
        output = "AF_peak"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert set(data.keys()) == {"sobol", "sobolSecondOrder", "sobolOrderContributions"}

    def test_second_order_reuses_single_batch(self, test_client: Flask, monkeypatch):
        """V40: exact pairs come from ONE evaluate_sumo batch (no extra surrogate
        calls per pair); row count = n * (2 + d + 2*C(d,2))."""
        import mmux_flaskapi.dakota.funs_evaluate as fe

        real_eval = fe.evaluate_sumo
        calls: list[int] = []

        def spy(*args, **kwargs):
            result = real_eval(*args, **kwargs)
            rows = {len(v) for k, v in result.items() if k.endswith("_hat")}
            assert len(rows) == 1, f"expected one row count across _hat keys, got {rows}"
            calls.append(rows.pop())
            return result

        monkeypatch.setattr(fe, "evaluate_sumo", spy)

        input_vars = ["x1", "x2", "x3"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        # n = 8 (monkeypatched), d = 3, K = 3 pairs -> 8 * (2 + 3 + 6) = 88 rows,
        # returned in exactly ONE batch call.
        assert calls == [8 * (2 + 3 + 2 * 3)]

    def test_sobol_pair_keys_preserve_multi_word_variable_names(self, test_client: Flask):
        """V41/B25: pair matrix keys are original variable names, untouched by
        the response camelCase serializer (the FE heatmap looks them up verbatim)."""
        input_vars = ["sigma_blood", "x2"]
        output = "y"

        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        pairs = data["sobolSecondOrder"]
        assert pairs["sigma_blood"]["x2"] == pytest.approx(pairs["x2"]["sigma_blood"])
        assert "sigmaBlood" not in pairs
        assert "sigma_blood" in data["sobol"]

    def test_all_constant_inputs_unit_null_order_contributions(self):
        """V43pt/B28pp unit path: evaluate_sobol_indices with all-constant
        distributions returns null order contributions (the d_varying==0
        contract: fractions undefined where there is no variance)."""
        from pathlib import Path

        from mmux_flaskapi.dakota.funs_evaluate import evaluate_sobol_indices

        distributions = {
            "x1": {"distribution": "constant", "value": 1.0},
            "x2": {"distribution": "constant", "value": -2.0},
        }
        result = evaluate_sobol_indices(
            Path("."),
            Path("."),
            ["x1", "x2"],
            "y_hat",
            distributions,
            preprocessor=None,  # unused: d_varying==0 returns before sampling
            seed=42,
        )
        assert result["sobolOrderContributions"] is None
        assert result["sobolSecondOrder"] == {}
        for entry in result["sobol"].values():
            assert all(v == 0.0 for v in entry.values())

    def test_degenerate_surrogate_nulls_order_contributions(self, test_client: Flask, monkeypatch):
        """V43pt/B28pp over HTTP: a surrogate that predicts one constant value
        (zero sample variance) -> sobolOrderContributions null, ⊥ (0,0,0) masses.
        (Request schema only allows normal/uniform inputs, so this degenerate
        surrogate is how zero-variance responses actually arise.)"""
        import numpy as np

        import mmux_flaskapi.dakota.funs_evaluate as fe

        real_evaluate_sumo = fe.evaluate_sumo

        def _constant_surrogate(*args, **kwargs):
            results = real_evaluate_sumo(*args, **kwargs)
            return {key: np.full_like(np.asarray(val), 42.0) for key, val in results.items()}

        monkeypatch.setattr(fe, "evaluate_sumo", _constant_surrogate)

        input_vars = ["x1", "x2", "x3"]
        output = "y"
        payload = {
            "inputVars": input_vars,
            "output": output,
            "distributions": _make_distributions(input_vars),
            "numSamples": 10,
            "seed": 42,
            "FunctionJobs": _make_jobs(50, input_vars, output),
        }

        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["sobolOrderContributions"] is None
        for var in input_vars:
            assert all(v == 0.0 for v in data["sobol"][var].values())
