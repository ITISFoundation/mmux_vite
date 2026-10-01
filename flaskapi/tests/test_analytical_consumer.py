"""
Tier-3 analytical tests for the POST-MIGRATION stack (itis-sumo consumption).

The estimator/surrogate math itself is guarded upstream (itis-sumo's own
analytical suite, e.g. ``test_metamodeling_analytical.py``); this file keeps
this repo's Tier-3 promise: the FULL consumer stack — Flask route → request
model → ``itis_sumo.api`` delegation → real Dakota subprocess — reproduces
known analytical science. No mocks; every test spawns real Dakota.

Two ground truths with closed-form Sobol'/CV solutions:
  * ``y = 2*x1`` (linear): a GP surrogate cross-validates essentially exactly.
  * ``y = x1*x2`` on ``U(-1,1)^2``: zero main effects, ALL variance in the
    pair interaction (``S1=S2=0``, ``S_T1=S_T2=1``, ``S_12=1``,
    order masses ``M1≈0, M2≈1``).
"""

import pytest

pytestmark = pytest.mark.analytical


def _jobs(points: list[tuple[float, ...]], inputs: list[str], output: str, fn) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {name: float(value) for name, value in zip(inputs, point, strict=True)},
            "outputs": {output: float(fn(*point))},
        }
        for point in points
    ]


class TestAnalyticalCrossValidationStack:
    def test_linear_qoi_cross_validates_exactly(self, test_client):
        """Route stack CV on y=2*x1: GP predictions match observed values."""
        points = [(i / 10.0,) for i in range(31)]  # x1 in [0, 3]
        payload = {
            "inputVars": ["x1"],
            "output": "y",
            "FunctionJobs": _jobs(points, ["x1"], "y", lambda x1: 2.0 * x1),
        }
        response = test_client.post("/flask/dakota/sumo_cross_validation", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert set(data) == {"observed", "predicted", "predictedStd"}
        observed, predicted = data["observed"], data["predicted"]
        assert len(observed) == len(points)
        assert observed == pytest.approx([2.0 * x1 for (x1,) in points], abs=1e-6)
        assert predicted == pytest.approx(observed, abs=0.05)


class TestAnalyticalSobolStack:
    def test_product_interaction_gets_all_the_variance(self, test_client):
        """y = x1*x2 on U(-1,1)^2: pure interaction — zero main effects,
        total indices ~1, the pair carries ~all the variance, and the order
        masses close (M1+M2+R=1) with M2 dominant."""
        nx, ny = 6, 5
        points = [
            (-1.0 + 2.0 * (i + 0.5) / nx, -1.0 + 2.0 * (j + 0.5) / ny)
            for i in range(nx)
            for j in range(ny)
        ]
        payload = {
            "inputVars": ["x1", "x2"],
            "output": "y",
            "distributions": {
                "x1": {"distribution": "uniform", "min": -1.0, "max": 1.0},
                "x2": {"distribution": "uniform", "min": -1.0, "max": 1.0},
            },
            "numSamples": 256,
            "FunctionJobs": _jobs(points, ["x1", "x2"], "y", lambda x1, x2: x1 * x2),
            "seed": 13,
        }
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        sobol = data["sobol"]
        assert set(sobol) == {"x1", "x2"}
        for var in ("x1", "x2"):
            assert sobol[var]["main"] < 0.15
            assert sobol[var]["total"] > 0.8

        pairs = data["sobolSecondOrder"]
        assert pairs["x1"]["x2"] > 0.7
        assert pairs["x2"]["x1"] == pytest.approx(pairs["x1"]["x2"])

        masses = data["sobolOrderContributions"]
        assert masses is not None
        assert masses["firstOrder"] + masses["secondOrder"] + masses[
            "thirdAndHigher"
        ] == pytest.approx(1.0, abs=1e-9)
        assert masses["firstOrder"] < 0.2
        assert masses["secondOrder"] > 0.6
