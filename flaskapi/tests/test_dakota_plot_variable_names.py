"""Regression tests for the dakota plot-endpoint variable-name serialization bug.

Bug class (flaskapi/SPEC.md §B backprop B29dr): the global ``after_request``
camelCase serializer rewrites USER-defined variable-name keys inside the dakota
plot response dicts (``predictions``, ``grid_data``). The frontend looks those
dicts up with the ORIGINAL identifiers (``Curves1DPlot`` ->
``predictions[varName].yHat``, ``Surface2DPlot``/``IsoSurface3DPlot`` ->
``gridData[axis1]``/``gridData[selectedQoI]``), so every lookup silently misses
for any dataset whose variable names contain underscores (e.g. a real customer
LHS dataset: ``grey_matter``, ``bone_cancellous``, ``max_abs_stress``) and the
1D/2D/3D plots render EMPTY at HTTP 200.

The E2E mock fixture (``tests/e2e/mock_osparc``) only uses underscore-free names
(``x1..x4``/``y1..y4``), which camelCase round-trips losslessly - the suite was
blind to this class until a customer CSV exposed it.

Invariant (flaskapi/SPEC.md V47pk, consistent with V46jk + B15/V37): dakota
response dicts keyed by user variable names are serializer-preserved (identifier
keys byte-identical on the wire, never camelCased), exactly like
``correlations``/``sobol`` already are. Fixed schema fields
(``x``/``y_hat``/``std_hat`` inside ``predictions``) still convert.
"""

import numpy as np
import pytest
from flask import Flask

pytestmark = pytest.mark.integration


def _make_jobs(n: int, input_vars: list[str], output_vars: list[str]) -> list[dict]:
    """n completed FunctionJob-like dicts with random values in a sane range."""
    rng = np.random.default_rng(42)
    return [
        {
            "status": "completed",
            "inputs": {var: float(rng.uniform(-2, 2)) for var in input_vars},
            "outputs": {var: float(rng.uniform(0, 10)) for var in output_vars},
        }
        for _ in range(n)
    ]


class TestV47pkPlotVariableNameKeysPreserved:
    """flaskapi V47pk: user variable-name keys inside dakota plot responses survive
    the camelCase serializer byte-identically (⊥ FE lookup miss -> empty plot)."""

    def test_sumo_along_axes_preserves_underscore_variable_names(self, test_client: Flask):
        """Customer-shaped dataset: snake_case input names + snake_case output name.

        Before the fix the response carried {"greyMatter": ..., "boneCancellous": ...,
        "maxAbsStress" ...} and Curves1DPlot's ``data.predictions["grey_matter"]``
        lookup returned undefined -> empty Plotly at 200.
        """
        input_vars = ["grey_matter", "bone_cancellous", "x2"]
        output = "max_abs_stress"
        slider = {var: 0.1 for var in input_vars}

        payload = {
            "inputs": input_vars,
            "output": output,
            "sliderValues": slider,
            "FunctionJobs": _make_jobs(20, input_vars, [output]),
        }
        response = test_client.post("/flask/dakota/sumo_along_axes", json=payload)
        assert response.status_code == 200
        predictions = response.get_json()["predictions"]

        # The bug: keys came back camelCased (greyMatter/boneCancellous), so every
        # FE lookup by original name missed and the curve rendered empty.
        assert set(predictions.keys()) == set(input_vars)
        for var in input_vars:
            axis = predictions[var]
            # Fixed schema fields still convert (y_hat -> yHat) per V37 field-level rule.
            assert "x" in axis and "yHat" in axis
            assert len(axis["x"]) > 0 and len(axis["yHat"]) == len(axis["x"])

    def test_sumo_grid_evaluation_preserves_underscore_variable_names(self, test_client: Flask):
        """2D surface / 3D isosurface consumer path (Surface2DPlot/IsoSurface3DPlot
        read gridData[axis1]/gridData[selectedQoI] verbatim)."""
        input_vars = ["grey_matter", "white_matter", "fat"]
        grid_vars = ["grey_matter", "white_matter"]
        output = "max_abs_stress"
        slider = {var: 0.1 for var in input_vars}

        payload = {
            "inputVars": input_vars,
            "gridVars": grid_vars,
            "output": output,
            "sliderValues": slider,
            "FunctionJobs": _make_jobs(25, input_vars, [output]),
        }
        response = test_client.post("/flask/dakota/sumo_grid_evaluation", json=payload)
        assert response.status_code == 200
        grid_data = response.get_json()["gridData"]

        assert set(input_vars) | {output} <= set(grid_data.keys())
        # No camelCased identifier leak and no Dakota-mapped-name leak
        # (pre-fix the grid std series surfaced as "y1Std"; the mapped response
        # name "y1" could leak the same way). If a std series is present it must
        # carry the ORIGINAL output name with the _std suffix.
        for leaked in ("greyMatter", "whiteMatter", "maxAbsStress", "y1Std", "y1", "y1_std"):
            assert leaked not in grid_data
        std_keys = {k for k in grid_data if k.endswith("_std")}
        assert std_keys <= {f"{output}_std"}
        # 2D grid predictions are rows of the grid, coordinates flat lists.
        assert isinstance(grid_data[output][0], list)
        assert isinstance(grid_data["grey_matter"][0], float)
