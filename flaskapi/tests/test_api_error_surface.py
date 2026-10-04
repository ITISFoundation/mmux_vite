"""V48jd (T32qt): every error from every /flask/* route is JSON {"error": <str>}.

The UI renders error text verbatim (V44eh), so nothing escaping the view layer
may answer as text/html, and every error payload must carry the standard
``error`` key (ErrorResponse shape; context extras like ``workflow``/``details``
are allowed).
"""

from typing import Any


def assert_error_json(response: Any, status: int) -> dict[str, Any]:
    assert response.status_code == status, response.get_data(as_text=True)[:200]
    assert response.content_type is not None
    assert response.content_type.startswith("application/json"), (
        f"V48jd: error responses must never be HTML, got {response.content_type}"
    )
    payload = response.get_json(silent=True)
    assert isinstance(payload, dict), "error body must be a JSON object"
    assert isinstance(payload.get("error"), str) and payload["error"], (
        "missing non-empty 'error' string"
    )
    return payload


class TestV48jdErrorSurface:
    """Errors raised OUTSIDE the per-route handlers must still be JSON."""

    def test_unknown_flask_route_404_is_json(self, test_client: Any) -> None:
        assert_error_json(test_client.get("/flask/nope/missing"), 404)

    def test_method_not_allowed_405_is_json(self, test_client: Any) -> None:
        assert_error_json(test_client.delete("/flask/deployment/health"), 405)

    def test_unhandled_exception_degrades_to_json_500(self, test_app: Any) -> None:
        # Anything outside the views (a crash no try/except sees) must not
        # surface Werkzeug's HTML page.
        test_app.route("/flask/__boom", endpoint="__boom_for_v48jd")(_boom)
        assert_error_json(test_app.test_client().get("/flask/__boom"), 500)

    def test_dakota_validation_failure_is_json(self, test_client: Any) -> None:
        # garbage body → parse_request_model's pinned 400 contract (JSON always)
        assert_error_json(
            test_client.post("/flask/dakota/sumo_cross_validation", json={"bogus": True}), 400
        )

    def test_textfile_missing_fields_is_json(self, test_client: Any) -> None:
        assert_error_json(test_client.post("/flask/text-file/", json={}), 400)


def _boom() -> str:
    raise RuntimeError("forced unhandled failure for V48jd")
