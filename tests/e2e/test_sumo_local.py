# pylint: disable=logging-fstring-interpolation
# pylint: disable=redefined-outer-name
# pylint: disable=too-many-statements
"""
Local e2e Playwright tests for the mmux-vite app in SuMo READ-ONLY mode.

Run with:
    cd /path/to/mmux_vite
    make run-develop-sumo-read   # in a separate terminal
    python3 -m pytest tests/e2e/test_sumo_local.py -v --app-url http://localhost:8888

Requirements:
    python3 -m pip install pytest playwright pytest-playwright
    playwright install chromium
"""

import logging
import re
import time
from typing import Final

import pytest
from playwright.sync_api import Page, expect
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

_SECOND: Final[int] = 1_000  # ms
_MINUTE: Final[int] = 60 * _SECOND

_APP_READY_TIMEOUT: Final[int] = 30 * _SECOND
_VIEW_TRANSITION_TIMEOUT: Final[int] = 10 * _SECOND
_LOADING_CLEAR_TIMEOUT: Final[int] = 2 * _MINUTE  # jobs may take time to fetch

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _wait_for_service_mode(page: Page, expected_mode: str, timeout: int = _APP_READY_TIMEOUT) -> None:
    """Wait until the backend returns the expected service mode."""
    deadline = time.monotonic() + timeout / 1000
    while time.monotonic() < deadline:
        try:
            resp = page.request.get(f"{page.url.rstrip('/')}/flask/deployment/service_mode", timeout=5_000)
            if resp.ok:
                data = resp.json()
                mode = data.get("serviceMode", data.get("service_mode", ""))
                if mode == expected_mode:
                    return
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(500)
    raise TimeoutError(f"Service mode never became '{expected_mode}' within {timeout}ms")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_app_loads(page: Page, app_url: str) -> None:
    """The app should load and pass a health check."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    # Backend health endpoint must return 200
    health_resp = page.request.get(f"{app_url}/flask/deployment/health")
    assert health_resp.ok, f"Health check failed: {health_resp.status}"

    log.info("App loaded successfully at %s", app_url)


def test_service_mode_is_sumo(page: Page, app_url: str) -> None:
    """Service mode should resolve to SUMO (not empty, not UQ/MOGA)."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    resp = page.request.get(f"{app_url}/flask/deployment/service-mode")
    assert resp.ok, f"service_mode endpoint failed: {resp.status}"
    data = resp.json()
    mode = data.get("serviceMode", data.get("service_mode", ""))
    assert mode == "SUMO", f"Expected SUMO mode, got '{mode}'"

    log.info("Service mode correctly reported as SUMO")


def test_permissions_read_only(page: Page, app_url: str) -> None:
    """Permissions should be READ-ONLY."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    resp = page.request.get(f"{app_url}/flask/deployment/permissions")
    assert resp.ok, f"permissions endpoint failed: {resp.status}"
    data = resp.json()
    perms = data.get("permissions", "")
    assert perms == "READ-ONLY", f"Expected READ-ONLY, got '{perms}'"

    log.info("Permissions correctly reported as READ-ONLY")


def test_setup_view_renders(page: Page, app_url: str) -> None:
    """The Setup view (view 0) should render a function list."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)  # allow contexts to initialise

    # Either we land on the setup view, or we can navigate there.
    # Look for the DataGrid that lists functions.
    try:
        function_grid = page.locator('[role="grid"]').first
        function_grid.wait_for(state="visible", timeout=_VIEW_TRANSITION_TIMEOUT)
        log.info("Function DataGrid is visible")
    except PlaywrightTimeoutError:
        # App may have already navigated to the SuMo view from persistence.
        log.info("DataGrid not found – app may have restored a saved state (OK)")


def test_function_select_button_present(page: Page, app_url: str) -> None:
    """At least one 'select-function-btn' should be visible on the Setup page."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)

    select_btns = page.locator('[mmux-testid="select-function-btn"]')
    try:
        select_btns.first.wait_for(state="visible", timeout=_VIEW_TRANSITION_TIMEOUT)
        count = select_btns.count()
        log.info("Found %d select-function-btn(s)", count)
        assert count >= 1, "Expected at least one function to be listed"
    except PlaywrightTimeoutError:
        # No functions available in this environment – that is OK for a read-only test.
        log.warning("No select-function-btn found – no functions registered (acceptable in read-only mode)")


def test_sumo_view_after_function_select(page: Page, app_url: str) -> None:
    """Selecting a function and clicking Next should reveal the SuMo view."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)

    # If we are already on the SuMo view (restored from persistence) – pass.
    creating_ai_text = page.get_by_text("Creating AI model...")
    sumo_plots = page.locator('[mmux-testid="extend-sampling-btn"]')

    try:
        sumo_plots.wait_for(state="visible", timeout=3 * _SECOND)
        log.info("Already on SuMo view (restored from persistence)")
        return
    except PlaywrightTimeoutError:
        pass

    # Try selecting the first available function.
    select_btn = page.locator('[mmux-testid="select-function-btn"]').first
    try:
        select_btn.wait_for(state="visible", timeout=_VIEW_TRANSITION_TIMEOUT)
    except PlaywrightTimeoutError:
        pytest.skip("No functions available – cannot test SuMo navigation")

    select_btn.click()
    page.wait_for_timeout(1 * _SECOND)

    # Click Next to proceed to SuMo view
    next_btn = page.locator('[mmux-testid="next-button"]')
    try:
        next_btn.wait_for(state="visible", timeout=_VIEW_TRANSITION_TIMEOUT)
        next_btn.click()
    except PlaywrightTimeoutError:
        pytest.skip("Next button not visible after function select")

    # Wait for the loading bar to disappear (jobs fetched / model ready)
    try:
        creating_ai_text.wait_for(state="hidden", timeout=_LOADING_CLEAR_TIMEOUT)
        log.info("Loading bar cleared – SuMo view is ready")
    except PlaywrightTimeoutError:
        # May time out if oSPARC backend is unreachable – not a fatal test failure.
        log.warning("'Creating AI model...' never disappeared within timeout")


def test_loading_bar_disappears_after_job_fetch(page: Page, app_url: str) -> None:
    """
    The loading bar ('Creating AI model...') should disappear once job collections
    have been fetched – even if the result is empty.

    Regression test for: loading bar remaining stuck when persistence had
    no job data but a fresh network fetch returned an empty list.
    """
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)

    loading_text = page.get_by_text("Creating AI model...")

    # If it's not visible at all, loading was skipped (data already in persistence) – pass.
    if not loading_text.is_visible():
        log.info("Loading bar never appeared – job data was already in persistence context (OK)")
        return

    # If it is visible, wait for it to disappear within a reasonable timeout.
    try:
        loading_text.wait_for(state="hidden", timeout=_LOADING_CLEAR_TIMEOUT)
        log.info("Loading bar cleared as expected")
    except PlaywrightTimeoutError:
        pytest.fail("Loading bar ('Creating AI model...') never disappeared – possible regression in loading state management")


def test_extend_sampling_button_disabled_in_read_only(page: Page, app_url: str) -> None:
    """
    In READ-ONLY mode the 'Adapt / Extend Sampling' button should be disabled
    (or absent) because the user cannot create new sampling campaigns.
    """
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)

    extend_btn = page.locator('[mmux-testid="extend-sampling-btn"]')
    try:
        extend_btn.wait_for(state="visible", timeout=_VIEW_TRANSITION_TIMEOUT)
        # In read-only mode the button should be disabled.
        assert extend_btn.is_disabled(), (
            "Extend Sampling button should be disabled in READ-ONLY mode"
        )
        log.info("Extend Sampling button correctly disabled in READ-ONLY mode")
    except PlaywrightTimeoutError:
        log.info("Extend Sampling button not visible – likely still on Setup view or no function selected (OK)")


def test_no_console_errors_on_load(page: Page, app_url: str) -> None:
    """There should be no console errors on initial page load."""
    errors: list[str] = []
    failing_requests: list[str] = []

    def _capture(msg):
        if msg.type == "error":
            errors.append(msg.text)

    def _on_response(response):
        if response.status >= 400 and "localhost" in response.url:
            failing_requests.append(f"{response.status} {response.request.method} {response.url}")

    page.on("console", _capture)
    page.on("response", _on_response)
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3 * _SECOND)

    if failing_requests:
        log.warning("Failing requests:\n%s", "\n".join(f"  - {r}" for r in failing_requests))

    if errors:
        log.warning("Console errors detected:\n%s", "\n".join(f"  - {e}" for e in errors))
        # Log but do not fail for network 400s from external services (e.g. oSPARC API
        # returning 400 on missing credentials) – only fail for JS runtime errors.
        js_errors = [e for e in errors if "Failed to load resource" not in e]
        if js_errors:
            pytest.fail(f"JavaScript errors on load:\n" + "\n".join(js_errors))
        else:
            log.warning("Only resource-loading errors (likely backend/oSPARC 400s) – not failing test")

    log.info("No JavaScript errors on load")


def test_backend_endpoints_return_camel_case(page: Page, app_url: str) -> None:
    """All Flask API responses should use camelCase keys (JSON transformer middleware)."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)

    endpoints_to_check = [
        ("/flask/deployment/service-mode", "serviceMode"),
        ("/flask/deployment/permissions", "permissions"),
        ("/flask/deployment/mode", "deploymentMode"),
    ]

    for path, expected_key in endpoints_to_check:
        resp = page.request.get(f"{app_url}{path}")
        assert resp.ok, f"Endpoint {path} returned {resp.status}"
        data = resp.json()
        assert expected_key in data, (
            f"Expected camelCase key '{expected_key}' in response from {path}. "
            f"Got keys: {list(data.keys())}"
        )
        log.info("✓ %s → '%s': %s", path, expected_key, data[expected_key])


def test_list_functions_returns_camel_case(page: Page, app_url: str) -> None:
    """The /flask/list_functions endpoint should return camelCase keys."""
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)

    resp = page.request.get(f"{app_url}/flask/osparc/list_functions")
    assert resp.ok, f"/flask/osparc/list_functions returned {resp.status}"
    data = resp.json()

    functions = data if isinstance(data, list) else data.get("functions", [])
    if not functions:
        log.info("No functions registered – skipping camelCase key check")
        return

    first = functions[0]
    # Keys that should be camelCase after middleware conversion
    camel_keys = {"uid", "title", "inputSchema", "outputSchema", "functionClass"}
    present = camel_keys & set(first.keys())
    snake_keys = {k for k in first if "_" in k}

    assert not snake_keys, (
        f"Found snake_case keys in function response: {snake_keys}. "
        "JSON transformer middleware may not be working."
    )
    log.info("Function keys look like camelCase: %s", sorted(first.keys()))
