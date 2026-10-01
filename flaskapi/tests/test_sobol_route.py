"""
Route tests for /flask/dakota/compute_sobol_indices (post itis-sumo migration).

The estimator lives in itis_sumo.api (exact arbitrary-d pair estimator + order
masses, V42qa-era math; domain-driven sampling since V26dd). These tests pin
the HTTP contract around the delegation: the FE's distribution-shaped Sobol
panel is TRANSLATED into exploration-domain boxes (uniform -> explicit box,
normal -> auto-inferred observed box), the response carries the fixed
camelCase contract (sobol / sobolSecondOrder / sobolOrderContributions),
variable names survive the serializer untouched, and null order masses (zero
sample output variance) round-trip as null, never as fake (0,0,0) masses.
"""

import pytest
from flask import Flask
from itis_sumo.api import DomainSpec, OrderMasses, SobolResult, SumoInputError

pytestmark = pytest.mark.integration


# After the global snake->camel response serializer, the fixed order-mass
# fields arrive FE-side in the api's planned camel shape.
MASS_FIELDS_CAMEL = {
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


def _masses() -> OrderMasses:
    return OrderMasses(
        first_order=0.62,
        second_order=0.21,
        third_and_higher=0.17,
        first_order_ci_low=0.55,
        first_order_ci_high=0.69,
        second_order_ci_low=0.12,
        second_order_ci_high=0.30,
        third_and_higher_ci_low=0.02,
        third_and_higher_ci_high=0.33,
        heuristic_noise_floor=0.03,
    )


def _index(main: float, total: float) -> dict[str, float]:
    return {
        "main": main,
        "total": total,
        "main_ci_low": main - 0.02,
        "main_ci_high": main + 0.02,
        "total_ci_low": total - 0.02,
        "total_ci_high": total + 0.02,
    }


def _result(
    indices: dict[str, dict[str, float]],
    second_order: dict[str, dict[str, float]],
    masses: OrderMasses | None,
) -> SobolResult:
    return SobolResult(
        response="y",
        indices=indices,
        second_order=second_order,
        order_contributions=masses,
        seed=7,
        domains={var: DomainSpec(minimum=-1.0, maximum=1.0) for var in indices},
        fixed={},
        effective_config={},
    )


def _jobs(n: int, inputs: list[str], output: str) -> list[dict]:
    return [
        {
            "status": "completed",
            "inputs": {k: float(i + j) for j, k in enumerate(inputs)},
            "outputs": {output: float(i)},
        }
        for i in range(n)
    ]


def _payload(
    inputs: list[str],
    distributions: dict,
    output: str = "y",
    seed: int = 7,
) -> dict:
    return {
        "inputVars": inputs,
        "output": output,
        "distributions": distributions,
        "numSamples": 100,
        "FunctionJobs": _jobs(50, inputs, output),
        "seed": seed,
    }


def _uniform(minimum: float, maximum: float) -> dict:
    return {"distribution": "uniform", "min": minimum, "max": maximum}


class TestComputeSobolIndicesRoute:
    def test_success_fixed_response_contract(self, test_client: Flask, monkeypatch):
        """200 with the fixed camelCase contract incl. order masses fields."""

        def fake_evaluate_sobol(*args, **kwargs):
            return _result(
                {"x1": _index(0.4, 0.5), "x2": _index(0.2, 0.3)},
                {"x1": {"x2": 0.1}, "x2": {"x1": 0.1}},
                _masses(),
            )

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(["x1", "x2"], {"x1": _uniform(-1, 1), "x2": _uniform(-1, 1)})
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert set(data) == {"sobol", "sobolSecondOrder", "sobolOrderContributions"}
        assert set(data["sobol"]) == {"x1", "x2"}
        assert data["sobol"]["x1"]["main"] == pytest.approx(0.4)
        assert data["sobolSecondOrder"]["x1"]["x2"] == pytest.approx(0.1)
        assert set(data["sobolOrderContributions"]) == MASS_FIELDS_CAMEL
        # closure identity survives the serializer untouched
        contrib = data["sobolOrderContributions"]
        assert contrib["firstOrder"] + contrib["secondOrder"] + contrib[
            "thirdAndHigher"
        ] == pytest.approx(1.0)

    def test_uniform_panel_translates_to_domain_boxes(self, test_client: Flask, monkeypatch):
        """V26dd: the FE uniform(min,max) selection becomes the EXPLORATION BOX
        (domain vocabulary), forwarded as `domains` -- never as distributions."""
        captured: dict = {}

        def fake_evaluate_sobol(*args, **kwargs):
            captured.update(kwargs)
            return _result({"x1": _index(0.5, 0.5), "x2": _index(0.5, 0.5)}, {}, _masses())

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(
            ["x1", "x2"],
            {"x1": _uniform(1.0, 2.0), "x2": _uniform(-3.0, 3.0)},
        )
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        assert captured["domains"] == {
            "x1": DomainSpec(minimum=1.0, maximum=2.0),
            "x2": DomainSpec(minimum=-3.0, maximum=3.0),
        }
        assert "distributions" not in captured

    def test_normal_panel_falls_back_to_auto_inferred_box(self, test_client: Flask, monkeypatch):
        """V26dd: normal(mean,std) params are UQ-only -- the factor is sampled
        over its observed box (omitted from domains) instead of erroring."""
        captured: dict = {}

        def fake_evaluate_sobol(*args, **kwargs):
            captured.update(kwargs)
            return _result(
                {"x1": _index(0.5, 0.5), "x2": _index(0.5, 0.5)},
                {"x1": {"x2": 0.0}, "x2": {"x1": 0.0}},
                _masses(),
            )

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(
            ["x1", "x2"],
            {
                "x1": {"distribution": "normal", "mean": 0.0, "std": 1.0},
                "x2": _uniform(-1.0, 1.0),
            },
        )
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        assert set(captured["domains"]) == {"x2"}

    def test_zero_variance_orders_round_trip_as_null(self, test_client: Flask, monkeypatch):
        """null order masses (undefined fractions at zero output variance)
        arrive as null -- NOT as (0,0,0)."""

        def fake_evaluate_sobol(*args, **kwargs):
            return _result(
                {"x1": _index(0.0, 0.0), "x2": _index(0.0, 0.0)},
                {},
                None,
            )

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(["x1", "x2"], {"x1": _uniform(-1, 1), "x2": _uniform(-1, 1)})
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["sobolOrderContributions"] is None

    def test_seed_zero_accepted(self, test_client: Flask, monkeypatch):
        """Seed 0 is valid (scipy/numpy RNGs accept it)."""
        captured: dict = {}

        def fake_evaluate_sobol(*args, **kwargs):
            captured.update(kwargs)
            return _result({"x1": _index(0.5, 0.5)}, {}, _masses())

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(["x1"], {"x1": _uniform(-1, 1)}, seed=0)
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        assert captured["seed"] == 0
        assert captured["workspace"] is not None

    def test_second_order_empty_for_single_var(self, test_client: Flask, monkeypatch):
        def fake_evaluate_sobol(*args, **kwargs):
            return _result({"x1": _index(1.0, 1.0)}, {}, _masses())

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(["x1"], {"x1": _uniform(-1, 1)})
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        assert response.get_json()["sobolSecondOrder"] == {}

    def test_variable_names_survive_serializer(self, test_client: Flask, monkeypatch):
        """Multi-word (snake_case) variable names must survive the global
        snake->camel response serializer untouched (else FE lookups default to 0)."""

        def fake_evaluate_sobol(*args, **kwargs):
            return _result(
                {"drag_force": _index(0.4, 0.5), "wing_area": _index(0.2, 0.3)},
                {"drag_force": {"wing_area": 0.1}, "wing_area": {"drag_force": 0.1}},
                _masses(),
            )

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(
            ["drag_force", "wing_area"],
            {"drag_force": _uniform(-1, 1), "wing_area": _uniform(-1, 1)},
            output="stress_max",
        )
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert set(data["sobol"]) == {"drag_force", "wing_area"}
        assert set(data["sobolSecondOrder"]["drag_force"]) == {"wing_area"}

    def test_input_error_maps_to_400(self, test_client: Flask, monkeypatch):
        """itis-sumo input rejection (SumoInputError) is a client error."""

        def fake_evaluate_sobol(*args, **kwargs):
            raise SumoInputError("Domains given for variables that are not in play: ['ghost']")

        monkeypatch.setattr(
            "mmux_flaskapi.blueprints.dakota.sumo_evaluate_sobol",
            fake_evaluate_sobol,
        )
        payload = _payload(["x1"], {"x1": _uniform(-1, 1)})
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
        assert "not in play" in response.get_json()["error"]

    def test_missing_distribution_for_input_var(self, test_client: Flask):
        payload = _payload(["x1", "x2"], {"x1": _uniform(-1, 1)})
        response = test_client.post("/flask/dakota/compute_sobol_indices", json=payload)
        assert response.status_code == 400
