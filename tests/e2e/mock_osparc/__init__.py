"""Deterministic in-backend oSPARC test-double for the read-only SuMo e2e suite.

Imported by `mmux_flaskapi.app.create_flask_app()` (via PYTHONPATH) only when
`MMUX_E2E_MOCK_OSPARC` is set. See root SPEC.md §T9 / §V11.
"""

from .api import MockOsparcApi, build_mock_osparc_api

__all__ = ["MockOsparcApi", "build_mock_osparc_api"]
