"""
GH-Copilot #706 review: the grid-sampling route must pass a PER-REQUEST run
dir as the engine's ``workspace=``, like every dakota.py route already does.

ENGINE_LOCK serializes Dakota runs *within* a process, but production serves
from four gunicorn workers and the lock is process-local (dakota.py: a
workspace path alone never makes concurrent runs safe). Handing
``generate_grid_samples`` the shared SAMPLING_RUNS_DIR let grid requests
landing on different workers write the same Dakota workspace concurrently and
corrupt each other's files. These tests pin the route contract: the workspace
is a fresh directory under the sampling root (``create_run_dir`` nesting),
never the root itself, and two requests never share one.
"""

from typing import Any

import pytest
from itis_sumo.api import SumoInputError

from mmux_flaskapi.blueprints import sampling

pytestmark = pytest.mark.integration

_PAYLOAD = {
    "funUid": "local-function-1",
    "config": [{"variable": "x", "start": 0.0, "end": 1.0, "steps": 3}],
}


@pytest.fixture()
def captured_workspaces(monkeypatch: pytest.MonkeyPatch) -> list[Any]:
    """Capture the ``workspace=`` of every grid run; halt the route after capture.

    Raising before ``_run_sampling_map`` keeps the oSPARC client out of the
    test -- the workspace under scrutiny is already recorded at that point.
    """
    captured: list[Any] = []

    def fake_generate_grid_samples(domains, points_per_variable, *, workspace=None, **kwargs):
        captured.append(workspace)
        raise SumoInputError("stop-after-capture")

    monkeypatch.setattr(sampling, "generate_grid_samples", fake_generate_grid_samples)
    return captured


class TestGridRouteWorkspace:
    def test_grid_route_passes_a_run_dir_not_the_shared_root(
        self, test_client, captured_workspaces
    ):
        test_client.post("/flask/sampling/grid", json=_PAYLOAD)

        assert len(captured_workspaces) == 1
        workspace = captured_workspaces[0]
        root = sampling.SAMPLING_RUNS_DIR
        assert workspace is not None
        assert workspace != root, "shared root: concurrent workers would collide"
        assert root in workspace.parents, "run dir must stay inside the sampling root"

    def test_consecutive_requests_never_share_a_workspace(self, test_client, captured_workspaces):
        for _ in range(2):
            test_client.post("/flask/sampling/grid", json=_PAYLOAD)

        assert len(captured_workspaces) == 2
        first, second = captured_workspaces
        assert first is not None and second is not None
        assert first != second
