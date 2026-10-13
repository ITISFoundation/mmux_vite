import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  fetchJson,
  resetPersistence,
  setDeployment,
  fillNormalDistributions,
  expectModelModalReady,
  expectPlotlyReady,
} from "./helpers";

/**
 * UQ (Uncertainty Quantification) READ-ONLY behavioral + pixel-snapshot suite
 * (§T12 / §V14).
 *
 * Shares the deterministic local stack and the single backend boot with the
 * SuMo/MOGA specs; SERVICE_MODE is switched to UQ up front via the test-only
 * control endpoint (§T13) so the spec is order-independent. UQ inputs use a
 * NORMAL distribution (Mean / Std), and the histogram is driven by the mock
 * jobs' `<qoi>_std_hat` outputs (present on the job payloads but absent from the
 * output schema, so the QoI dropdown stays unchanged).
 *
 * Also exercises the "Inspect Model" SuMo modal, which previously failed to open
 * because the MUI Modal child was a non-ref-forwarding function component, and the
 * "UQ Settings" icon button (§V36 — every interactive element gets its own
 * e2e test + regression screenshot).
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed.
 */

test("UQ read-only propagation flow renders histogram and inspect-model modal", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: UQ service in READ-ONLY mode, served by the test-double.
  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  const health = await page.request.get(`${url}/flask/deployment/health`);
  expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
  const serviceMode = await fetchJson(page.request, `${url}/flask/deployment/service-mode`);
  expect(serviceMode.serviceMode).toBe("UQ");
  const permissions = await fetchJson(page.request, `${url}/flask/deployment/permissions`);
  expect(permissions.permissions).toBe("READ-ONLY");

  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  // Pixel baseline: the function-selection setup grid (full 1920x1080 viewport).
  await expect(page).toHaveScreenshot("uq-readonly-setup.png");

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // UQ uses a normal distribution: Mean / Standard Deviation blocks open once a
  // function is selected.
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Mean"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillNormalDistributions(page);

  // Pixel baseline: function selected, parameter distributions configured.
  await expect(page).toHaveScreenshot("uq-readonly-inputs.png");

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }

  // UQ output setup: QoI selector + Inspect Model button.
  const qoiSelect = page.locator('[mmux-testid="uq-plot-qoi-select"]');
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The UQ histogram renders once propagation over the mock jobs completes.
  await expectPlotlyReady(page);

  // Pixel baseline: the UQ histogram with the real (deterministic) Plotly render.
  await expect(page).toHaveScreenshot("uq-readonly-histogram.png");

  // UQ Settings opens the sample/histogram/seed config modal (§V36 — every button
  // gets an e2e test + regression screenshot).
  const settingsButton = page.locator('[mmux-testid="uq-settings-button"]');
  await expect(settingsButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await settingsButton.click();

  const settingsModal = page.locator('[mmux-testid="uq-settings-modal"]');
  await expect(settingsModal).toBeVisible({ timeout: VIEW_TIMEOUT });

  // Pixel baseline: the UQ Settings modal.
  await expect(page).toHaveScreenshot("uq-readonly-settings-modal.png");
  await page.keyboard.press("Escape");
  await expect(settingsModal).toBeHidden({ timeout: VIEW_TIMEOUT });

  // Inspect Model opens the SuMo cross-validation modal (regression guard: the
  // MUI Modal child must forward a ref, otherwise the modal never renders).
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();

  const modal = await expectModelModalReady(page);

  // Pixel baseline: the Inspect Model modal (cross-validation view).
  await expect(page).toHaveScreenshot("uq-readonly-inspect-modal.png");

  // Pixel baseline: the same modal on the log DISPLAY scale. The modal's violins
  // plot the raw mock job values (strictly positive), so LOG is enabled; toggle
  // back to linear afterwards so later baselines keep the default display.
  // (The histogram itself has NO -log baseline: its synthesized bins span negative
  // values for QoI y, which disables its LOG toggle by design.)
  const validationScale = modal.locator('[mmux-testid="sumo-validation-display-scale"]');
  await validationScale.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("uq-readonly-inspect-modal-log.png");
  await validationScale.getByRole("button", { name: "linear" }).click();

  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });

  const plotNext = page.locator('[mmux-testid="uq-plot-next"]');
  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sensitivity / Correlation Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-correlation-indices.png");

  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-sobol-indices.png");

  // The histogram's log display gets TWO witness baselines:
  // (a) DISABLED on QoI y — its linearized-Gaussian spread (σ = √(Σg²σ²), √2 over
  //     the N(1,1) inputs) reaches negative bin centers, so the ≤0 gate (B54rz
  //     reading) kills the LOG option — element baseline pins exactly that state.
  // (b) LIVE on QoI y4 = 2 + 0.02·(x3+x4)² — strictly positive by construction,
  //     tight gradient ⇒ positive bins ⇒ full log-histogram baseline.
  const plotBack = page.locator('[mmux-testid="uq-plot-back"]');
  for (let step = 0; step < 2; step += 1) {
    await expect(plotBack).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotBack.click();
  }
  await expect(page.getByText("Uncertainty Quantification Histogram")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator('[mmux-testid="uq-display-scale"]')).toHaveScreenshot("uq-readonly-histogram-log-disabled.png");

  await page.locator('[mmux-testid="uq-plot-qoi-select"]').click();
  await page.getByRole("option", { name: "y4", exact: true }).click();
  // the positive stats line proves the y4 histogram replaced the y one
  await expect(page.getByText(/Min: [12]\./)).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  const histogramScale = page.locator('[mmux-testid="uq-display-scale"]');
  await histogramScale.getByRole("button", { name: "log" }).click({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-histogram-log-y4.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
