# pylint: disable=logging-fstring-interpolation
# pylint: disable=redefined-outer-name
"""
Local Playwright checks for the read-only SUMO response-surface flow.

Run with:
    make run-develop-sumo-read
    python3 -m pytest tests/e2e/test_sumo_local.py -v --app-url http://localhost:8888

Requirements:
    python3 -m pip install pytest playwright pytest-playwright
    playwright install chromium
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Final

import pytest
from playwright.sync_api import Locator, Page, TimeoutError as PlaywrightTimeoutError, expect

_SECOND: Final[int] = 1_000
_APP_READY_TIMEOUT: Final[int] = 30 * _SECOND
_VIEW_TIMEOUT: Final[int] = 10 * _SECOND
_MODEL_READY_TIMEOUT: Final[int] = 2 * 60 * _SECOND
_LOCAL_IMPORT_CSV: Final[Path] = (
    Path(__file__).resolve().parents[2] / "lhs_loguniform_real_50_high" / "job_collection_import.csv"
)

_DEFAULT_PERSISTENCE: Final[dict[str, Any]] = {
    "currentView": 0,
    "numSamples": {},
    "selectedQoI": None,
    "isSuMoGenerated": False,
    "selectedFunction": None,
    "inputVars": [],
    "outputVars": [],
    "distribution": {},
    "lhsSamplingConfig": {
        "inputs": [],
        "points": 0,
        "seed": 0,
    },
    "gridSamplingConfig": [],
    "singleJobConfig": [],
    "runningJobCollection": None,
    "fetchedJobCollections": [],
    "selectedJobUids": [],
    "outputTargets": {},
    "mogaSettings": {},
    "weights": {},
    "sortModel": [],
}

log = logging.getLogger(__name__)


def _snake_to_camel_case(value: str) -> str:
    return value.split("_")[0] + "".join(part.capitalize() for part in value.split("_")[1:])


def _reset_persistence(page: Page, app_url: str) -> None:
    response = page.request.post(
        f"{app_url}/flask/text-file",
        data=json.dumps(
            {
                "filename": "persistence.json",
                "content": json.dumps(_DEFAULT_PERSISTENCE),
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.ok, f"Failed to reset persistence.json: {response.status} {response.text()}"


def _fetch_json(page: Page, url: str) -> Any:
    response = page.request.get(url)
    assert response.ok, f"Request failed for {url}: {response.status} {response.text()}"
    return response.json()


def _list_successful_jobs(page: Page, app_url: str, function_uid: str) -> list[dict[str, Any]]:
    try:
        response = page.request.get(
            f"{app_url}/flask/osparc/list_function_jobs_for_functionid?functionUid={function_uid}",
            timeout=15_000,
        )
    except PlaywrightTimeoutError:
        log.warning(
            "Skipping function '%s' because listing jobs timed out",
            function_uid,
        )
        return []

    if not response.ok:
        log.warning(
            "Skipping function '%s' because jobs could not be listed: %s %s",
            function_uid,
            response.status,
            response.text(),
        )
        return []

    jobs = response.json()
    return [job for job in jobs if str(job.get("status", "")).upper() == "SUCCESS"]


def _goto_first_grid_page(page: Page) -> None:
    first_page_button = page.get_by_role("button", name="Go to first page")
    if first_page_button.count() and first_page_button.is_enabled():
        first_page_button.click()
        page.wait_for_timeout(500)


def _find_function_select_button(page: Page, function_uid: str) -> Locator:
    for _ in range(20):
        _goto_first_grid_page(page)

        while True:
            select_button = page.locator(f'[mmux-testid="select-function-btn-{function_uid}"]').first
            if select_button.count():
                return select_button

            next_page_button = page.get_by_role("button", name="Go to next page")
            if not next_page_button.count() or not next_page_button.is_enabled():
                break
            next_page_button.click()
            page.wait_for_timeout(500)

        page.wait_for_timeout(500)

    raise AssertionError(f"Could not find a select button for function uid '{function_uid}' in the setup grid")


def _find_rendered_function_with_valid_cross_validation(
    page: Page, app_url: str, min_successes: int = 5, min_input_vars: int = 1
) -> dict[str, Any]:
    functions = _fetch_json(page, f"{app_url}/flask/osparc/list_functions")
    if not functions:
        pytest.skip("No functions are available in this SUMO environment")

    function_by_uid = {function.get("uid"): function for function in functions if function.get("uid")}
    successful_jobs_cache: dict[str, list[dict[str, Any]]] = {}

    _goto_first_grid_page(page)
    first_visible_select_button = page.locator('[mmux-testid^="select-function-btn-"]').first
    first_visible_select_button.wait_for(state="visible", timeout=_VIEW_TIMEOUT)

    while True:
        visible_function_uids = page.locator('[mmux-testid^="select-function-btn-"]').evaluate_all(
            """elements => elements
            .map(element => element.getAttribute("mmux-testid") || "")
            .map(testId => testId.replace("select-function-btn-", ""))
            .filter(Boolean)"""
        )
        for function_uid in visible_function_uids:
            function = function_by_uid.get(function_uid, {})
            input_vars = list(((function.get("inputSchema") or {}).get("schemaContent") or {}).get("properties", {}).keys())
            output_vars = list(((function.get("outputSchema") or {}).get("schemaContent") or {}).get("properties", {}).keys())
            if len(input_vars) < min_input_vars or not output_vars:
                continue

            successful_jobs = successful_jobs_cache.get(function_uid)
            if successful_jobs is None:
                successful_jobs = _list_successful_jobs(page, app_url, function_uid)
                successful_jobs_cache[function_uid] = successful_jobs
            if len(successful_jobs) < min_successes:
                continue

            output_var = output_vars[0]
            response = page.request.post(
                f"{app_url}/flask/dakota/sumo_cross_validation",
                data=json.dumps(
                    {
                        "inputVars": input_vars,
                        "output": output_var,
                        "FunctionJobs": successful_jobs,
                        "log": False,
                    }
                ),
                headers={"Content-Type": "application/json"},
            )
            if not response.ok:
                log.warning(
                    "Skipping function '%s' because sumo_cross_validation returned %s: %s",
                    function.get("title", function_uid),
                    response.status,
                    response.text(),
                )
                continue

            response_data = response.json()
            camel_output_var = _snake_to_camel_case(output_var)
            if camel_output_var not in response_data or f"{camel_output_var}Hat" not in response_data:
                log.warning(
                    "Skipping function '%s' because sumo_cross_validation response was incomplete: %s",
                    function.get("title", function_uid),
                    response_data,
                )
                continue

            return {
                "uid": function_uid,
                "title": function.get("title", function_uid),
                "successfulJobs": len(successful_jobs),
                "inputVars": input_vars,
                "output": output_var,
            }

        next_page_button = page.get_by_role("button", name="Go to next page")
        if not next_page_button.count() or not next_page_button.is_enabled():
            break
        next_page_button.click()
        first_visible_select_button.wait_for(state="visible", timeout=_VIEW_TIMEOUT)
        page.wait_for_timeout(500)

    pytest.skip(
        f"No rendered function with a valid SUMO cross-validation payload and at least {min_input_vars} inputs is available"
    )


def _wait_for_plot_step_to_settle(page: Page, timeout_ms: int = _MODEL_READY_TIMEOUT) -> None:
    calculating = page.get_by_text("Calculating...")
    if calculating.count() and calculating.first.is_visible():
        calculating.first.wait_for(state="hidden", timeout=timeout_ms)

    plot = page.locator(".js-plotly-plot").first
    if plot.count() and plot.first.is_visible():
        return

    known_messages = [
        "Error during calculation, please contact support.",
        "Select at least 5 Samples to be used by the model.",
        "No data available. Please create more Samples.",
    ]
    for message in known_messages:
        locator = page.get_by_text(message)
        if locator.count() and locator.first.is_visible():
            return

    page.wait_for_timeout(2_000)


def _fill_uniform_input_ranges(page: Page) -> None:
    min_inputs = page.locator('[mmux-testid="input-block-Min"] input')
    max_inputs = page.locator('[mmux-testid="input-block-Max"] input')

    min_count = min_inputs.count()
    max_count = max_inputs.count()
    assert min_count > 0, "Expected at least one SUMO Min input after selecting a function"
    assert min_count == max_count, "Expected matching Min/Max input pairs for SUMO distributions"

    for index in range(min_count):
        min_input = min_inputs.nth(index)
        max_input = max_inputs.nth(index)

        min_input.fill(str(index + 1))
        min_input.press("Tab")
        max_input.fill(str((index + 1) * 10))
        max_input.press("Tab")


def test_response_surface_modeling_read_only(page: Page, app_url: str) -> None:
    """Exercise the local read-only SUMO response-surface flow on localhost:8888."""
    errors: list[str] = []
    page_errors: list[str] = []

    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))

    health = page.request.get(f"{app_url}/flask/deployment/health")
    assert health.ok, f"Health check failed: {health.status}"

    service_mode = _fetch_json(page, f"{app_url}/flask/deployment/service-mode")
    assert service_mode.get("serviceMode") == "SUMO", service_mode

    permissions = _fetch_json(page, f"{app_url}/flask/deployment/permissions")
    assert permissions.get("permissions") in {"READ-ONLY", "WRITE"}, permissions

    _reset_persistence(page, app_url)
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    function_grid = page.locator('[role="grid"]').first
    function_grid.wait_for(state="visible", timeout=_VIEW_TIMEOUT)

    target_function = _find_rendered_function_with_valid_cross_validation(page, app_url)
    log.info("Using function '%s' with %d successful jobs", target_function["title"], target_function["successfulJobs"])

    select_button = _find_function_select_button(page, target_function["uid"])
    expect(select_button).to_be_visible(timeout=_VIEW_TIMEOUT)
    select_button.click()

    _fill_uniform_input_ranges(page)

    next_button = page.locator('[mmux-testid="next-button"]')
    expect(next_button).to_be_enabled(timeout=_VIEW_TIMEOUT)
    next_button.click()

    debug_cv_response = page.request.post(
        f"{app_url}/flask/dakota/sumo_cross_validation",
        data=json.dumps(
            {
                "inputVars": ["pair_1_current", "pair_2_current"],
                "output": "collateral_50target",
                "FunctionJobs": jobs,
                "log": False,
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    print("DEBUG cv status:", debug_cv_response.status)
    print("DEBUG cv json:", debug_cv_response.json())

    jobs_loading = page.locator('[mmux-testid="jobs-loading"]')
    if jobs_loading.count() and jobs_loading.first.is_visible():
        jobs_loading.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    creating_ai_model = page.get_by_text("Creating AI model...")
    if creating_ai_model.count() and creating_ai_model.first.is_visible():
        creating_ai_model.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    validation_view = page.locator('[mmux-testid="sumo-validation-view"]')
    expect(validation_view).to_be_visible(timeout=_VIEW_TIMEOUT)
    expect(page.locator('[mmux-testid="qoi-select"]')).to_be_visible(timeout=_VIEW_TIMEOUT)
    expect(validation_view.locator(".js-plotly-plot")).to_be_visible(timeout=_MODEL_READY_TIMEOUT)
    expect(validation_view.get_by_text("MAE:")).to_be_visible(timeout=_VIEW_TIMEOUT)
    expect(validation_view.get_by_text("RMSE:")).to_be_visible(timeout=_VIEW_TIMEOUT)

    expect(page.locator('[mmux-testid="extend-sampling-btn"]')).to_be_visible(
        timeout=_VIEW_TIMEOUT
    )

    runtime_errors = [error for error in errors if "Failed to load resource" not in error]
    assert not runtime_errors, f"JavaScript errors were captured on load: {runtime_errors}"
    assert not page_errors, f"Page errors were captured on load: {page_errors}"


def test_backend_endpoints_return_camel_case(page: Page, app_url: str) -> None:
    """Smoke-check the backend endpoints the read-only flow depends on."""
    endpoints_to_check = [
        ("/flask/deployment/service-mode", "serviceMode"),
        ("/flask/deployment/permissions", "permissions"),
        ("/flask/deployment/mode", "deploymentMode"),
    ]

    for path, expected_key in endpoints_to_check:
        response = page.request.get(f"{app_url}{path}")
        assert response.ok, f"Endpoint {path} returned {response.status}"
        data = response.json()
        assert expected_key in data, (
            f"Expected camelCase key '{expected_key}' in response from {path}. "
            f"Got keys: {list(data.keys())}"
        )


def test_upload_local_csv_and_render_sumo(page: Page, app_url: str) -> None:
    """Upload the generated local CSV, verify 50 imported samples, and render SUMO plots."""
    console_errors: list[str] = []
    page_errors: list[str] = []

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))

    assert _LOCAL_IMPORT_CSV.exists(), f"Missing local import CSV fixture: {_LOCAL_IMPORT_CSV}"

    health = page.request.get(f"{app_url}/flask/deployment/health")
    assert health.ok, f"Health check failed: {health.status}"

    service_mode = _fetch_json(page, f"{app_url}/flask/deployment/service-mode")
    assert service_mode.get("serviceMode") == "SUMO", service_mode

    _reset_persistence(page, app_url)
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    function_grid = page.locator('[role="grid"]').first
    function_grid.wait_for(state="visible", timeout=_VIEW_TIMEOUT)

    with page.expect_file_chooser() as file_chooser_info:
        page.locator('[mmux-testid="setup-upload-data-btn"]').click()
    file_chooser = file_chooser_info.value
    file_chooser.set_files(str(_LOCAL_IMPORT_CSV))

    upload_dialog = page.get_by_role("dialog")
    expect(upload_dialog).to_be_visible(timeout=_VIEW_TIMEOUT)

    with page.expect_response(
        lambda response: response.request.method == "POST"
        and response.url.endswith("/flask/sampling/upload_job_collection_csv")
    ) as upload_response_info:
        page.locator('[mmux-testid="setup-confirm-upload-btn"]').click()

    upload_response = upload_response_info.value
    assert upload_response.ok, (
        f"Upload request failed: {upload_response.status} {upload_response.text()}"
    )
    upload_payload = upload_response.json()
    assert upload_payload.get("importedSamples") == 50, upload_payload
    target_function_uid = upload_payload.get("targetFunctionUid")
    assert target_function_uid, upload_payload

    collections = _fetch_json(
        page,
        f"{app_url}/flask/osparc/list_function_job_collections_for_functionid?functionUid={target_function_uid}",
    )
    assert len(collections) == 1, collections
    jobs = _fetch_json(
        page,
        f"{app_url}/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid={collections[0]['uid']}",
    )
    assert len(jobs) == 50, jobs

    grid_loading = page.get_by_role("progressbar")
    if grid_loading.count():
        grid_loading.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    select_button = _find_function_select_button(page, target_function_uid)
    expect(select_button).to_be_visible(timeout=_VIEW_TIMEOUT)
    if (select_button.text_content() or "").strip() == "Select":
        select_button.click()
    expect(select_button).to_have_text("Unselect", timeout=_VIEW_TIMEOUT)
    page.locator('[mmux-testid="input-block-Min"] input').first.wait_for(
        state="visible",
        timeout=_VIEW_TIMEOUT,
    )

    _fill_uniform_input_ranges(page)

    next_button = page.locator('[mmux-testid="next-button"]')
    expect(next_button).to_be_enabled(timeout=_VIEW_TIMEOUT)
    with page.expect_response(
        lambda response: response.request.method == "POST"
        and response.url.endswith("/flask/dakota/sumo_cross_validation")
    ) as sumo_response_info:
        next_button.click()
    sumo_response = sumo_response_info.value
    assert sumo_response.ok, (
        f"SUMO validation request failed: {sumo_response.status} {sumo_response.text()}"
    )

    jobs_loading = page.locator('[mmux-testid="jobs-loading"]')
    if jobs_loading.count() and jobs_loading.first.is_visible():
        jobs_loading.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    creating_ai_model = page.get_by_text("Creating AI model...")
    if creating_ai_model.count() and creating_ai_model.first.is_visible():
        creating_ai_model.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    validation_view = page.locator('[mmux-testid="sumo-validation-view"]')
    expect(validation_view).to_be_visible(timeout=_VIEW_TIMEOUT)
    expect(validation_view.locator(".js-plotly-plot")).to_be_visible(
        timeout=_MODEL_READY_TIMEOUT
    )

    runtime_errors = [error for error in console_errors if "Failed to load resource" not in error]
    assert not runtime_errors, f"JavaScript errors were captured: {runtime_errors}"
    assert not page_errors, f"Page errors were captured: {page_errors}"


def test_response_surface_modeling_all_sumo_steps_have_no_frontend_errors(
    page: Page, app_url: str
) -> None:
    """Exercise SUMO validation/1D/2D/3D steps and capture frontend errors."""
    console_errors: list[str] = []
    page_errors: list[str] = []
    failed_sumo_responses: list[str] = []

    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))

    def _capture_failed_sumo_response(response) -> None:
        if "/flask/dakota/" not in response.url:
            return
        if response.status >= 400:
            failed_sumo_responses.append(f"{response.request.method} {response.url} -> {response.status}")

    page.on("response", _capture_failed_sumo_response)

    health = page.request.get(f"{app_url}/flask/deployment/health")
    assert health.ok, f"Health check failed: {health.status}"

    service_mode = _fetch_json(page, f"{app_url}/flask/deployment/service-mode")
    assert service_mode.get("serviceMode") == "SUMO", service_mode

    _reset_persistence(page, app_url)
    page.goto(app_url, timeout=_APP_READY_TIMEOUT)
    page.wait_for_load_state("networkidle")

    function_grid = page.locator('[role="grid"]').first
    function_grid.wait_for(state="visible", timeout=_VIEW_TIMEOUT)

    target_function = _find_rendered_function_with_valid_cross_validation(
        page, app_url, min_successes=20, min_input_vars=3
    )
    log.info(
        "Using function '%s' with %d successful jobs and %d inputs",
        target_function["title"],
        target_function["successfulJobs"],
        len(target_function["inputVars"]),
    )

    select_button = _find_function_select_button(page, target_function["uid"])
    expect(select_button).to_be_visible(timeout=_VIEW_TIMEOUT)
    select_button.click()

    _fill_uniform_input_ranges(page)

    next_button = page.locator('[mmux-testid="next-button"]')
    expect(next_button).to_be_enabled(timeout=_VIEW_TIMEOUT)
    next_button.click()

    jobs_loading = page.locator('[mmux-testid="jobs-loading"]')
    if jobs_loading.count() and jobs_loading.first.is_visible():
        jobs_loading.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    creating_ai_model = page.get_by_text("Creating AI model...")
    if creating_ai_model.count() and creating_ai_model.first.is_visible():
        creating_ai_model.first.wait_for(state="hidden", timeout=_MODEL_READY_TIMEOUT)

    plot_step_next_button = page.locator(".MuiMobileStepper-root button").last
    expected_steps = ["Validation", "1D Curves", "2D Surface", "3D IsoSurface"]
    for index, step_title in enumerate(expected_steps):
        expect(page.get_by_role("heading", name=step_title)).to_be_visible(
            timeout=_VIEW_TIMEOUT
        )
        _wait_for_plot_step_to_settle(page)
        if index < len(expected_steps) - 1:
            expect(plot_step_next_button).to_be_enabled(timeout=_VIEW_TIMEOUT)
            plot_step_next_button.click()

    runtime_errors = [
        error
        for error in console_errors
        if "Failed to load resource" not in error
    ]
    assert not runtime_errors, f"JavaScript console errors were captured: {runtime_errors}"
    assert not page_errors, f"Page errors were captured: {page_errors}"
    assert not failed_sumo_responses, (
        f"SUMO endpoint failures were captured during frontend flow: {failed_sumo_responses}"
    )
