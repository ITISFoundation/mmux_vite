import { test, expect } from "@playwright/test";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  fetchJson,
  resetPersistence,
  setDeployment,
  fillUniformInputRanges,
} from "./helpers";

/**
 * SuMo READ-ONLY behavioral + pixel-snapshot suite (§T11 / §V10,§V13).
 *
 * Exercises the deterministic local stack: the live Flask backend with the
 * in-backend oSPARC test-double (§T9, gated by MMUX_E2E_MOCK_OSPARC) behind the
 * vite /flask proxy (§T10). The mock exposes exactly one function
 * (`func-sumo-readonly-e2e`) with deterministic SUCCESS jobs, so the flow is
 * fully deterministic and needs no grid pagination search.
 *
 * The whole suite (SuMo/UQ/MOGA) shares one backend boot whose SERVICE_MODE is
 * switched per-spec via the test-only control endpoint (§T13), so each spec
 * pins its own mode up front to stay order-independent.
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed. Screenshots capture
 * the full 1920x1080 viewport with the real (unmasked) Plotly render: the mock
 * data and surrogate are fully deterministic, so the plot is reproducible in
 * the pinned image and a masked-out plot would defeat the pixel comparison.
 */

test("SuMo read-only response-surface flow renders validation view", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: SuMo service in READ-ONLY mode, served by the test-double.
  await setDeployment(page.request, url, "SUMO", "READ-ONLY");
  const health = await page.request.get(`${url}/flask/deployment/health`);
  expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
  const serviceMode = await fetchJson(page.request, `${url}/flask/deployment/service-mode`);
  expect(serviceMode.serviceMode).toBe("SUMO");
  const permissions = await fetchJson(page.request, `${url}/flask/deployment/permissions`);
  expect(permissions.permissions).toBe("READ-ONLY");

  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  // Pixel baseline: the function-selection setup grid (full 1920x1080 viewport).
  await expect(page).toHaveScreenshot("sumo-readonly-setup.png");

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // The input-range configuration opens once a function is selected.
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);

  // Pixel baseline: function selected, input ranges configured and open.
  await expect(page).toHaveScreenshot("sumo-readonly-inputs.png");

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const jobsLoading = page.locator('[mmux-testid="jobs-loading"]');
  if (await jobsLoading.first().isVisible().catch(() => false)) {
    await jobsLoading.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }
  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }

  const validationView = page.locator('[mmux-testid="sumo-validation-view"]');
  await expect(validationView).toBeVisible({ timeout: VIEW_TIMEOUT });
  const qoiSelect = page.locator('[mmux-testid="qoi-select"]');
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(validationView.locator(".js-plotly-plot")).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(validationView.getByText("MAE:")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(validationView.getByText("RMSE:")).toBeVisible({ timeout: VIEW_TIMEOUT });

  // READ-ONLY invariant (§V13): the extend-sampling control stays disabled.
  const extendSampling = page.locator('[mmux-testid="extend-sampling-btn"]');
  await expect(extendSampling).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(extendSampling).toBeDisabled();

  // Pixel baseline: the cross-validation view with the real Plotly render
  // (full 1920x1080 viewport, unmasked — deterministic in the pinned image).
  await expect(page).toHaveScreenshot("sumo-readonly-validation.png");

  // Navigate through the first plot step (1D curves) and capture it.
  // The SuMoPlotsSteps component has Next/Back buttons in a MobileStepper to navigate between steps.
  // Find the plot stepper's Next button (not the main navigation one with testid="next-button").
  const nextButtons = await page.locator("button:has-text('Next')").all();
  let plotNextButton = null;
  for (const btn of nextButtons) {
    const testid = await btn.getAttribute("mmux-testid");
    if (testid !== "next-button") {
      plotNextButton = btn;
      break;
    }
  }
  expect(plotNextButton, "Could not find plot stepper Next button").toBeTruthy();
  
  // Click Next to navigate to 1D curves plot
  await plotNextButton!.click({ noWaitAfter: true });
  await page.waitForTimeout(1000); // Allow plot to render

  // Wait for the Plotly plot to be visible and rendered
  const plotArea = page.locator(".js-plotly-plot");
  await expect(plotArea.first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Capture the 1D plot view (unmasked for deterministic comparison)
  await expect(page).toHaveScreenshot("sumo-readonly-plot-1d.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});

test("backend endpoints return camelCase keys", async ({ page, baseURL }) => {
  const url = baseURL!;
  const endpoints: Array<[string, string]> = [
    ["/flask/deployment/service-mode", "serviceMode"],
    ["/flask/deployment/permissions", "permissions"],
    ["/flask/deployment/mode", "deploymentMode"],
  ];

  for (const [path, expectedKey] of endpoints) {
    const data = await fetchJson(page.request, `${url}${path}`);
    expect(Object.keys(data), `expected camelCase key '${expectedKey}' in ${path}`).toContain(expectedKey);
  }
});
