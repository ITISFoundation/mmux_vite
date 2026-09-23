"""Contract tests that pin frontend-facing request/route guarantees (root SPEC §V31sc, node SPEC §V38ap)."""

import json

import pytest

from mmux_flaskapi.app import create_flask_app


@pytest.mark.unit
def test_e2e_control_routes_absent_without_mock_flag(monkeypatch):
    monkeypatch.delenv("MMUX_E2E_MOCK_OSPARC", raising=False)
    app = create_flask_app()

    assert not [
        rule.rule for rule in app.url_map.iter_rules() if rule.rule.startswith("/flask/e2e")
    ]
    for path in ("/flask/e2e/deployment", "/flask/e2e/faults"):
        assert app.test_client().post(path, json={"operation": "list_functions"}).status_code == 404


@pytest.mark.unit
@pytest.mark.parametrize(
    "path", ["/flask/sampling/lhs", "/flask/sampling/grid", "/flask/sampling/test_job"]
)
def test_sampling_endpoints_reject_json_sent_as_text_plain(test_client, path):
    """A browser `fetch` with a string body and no header sends text/plain; the frontend must set JSON (B27ct)."""
    response = test_client.post(path, data=json.dumps({}), content_type="text/plain;charset=UTF-8")

    assert response.status_code == 415
