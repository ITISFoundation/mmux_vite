import { test, expect } from "@playwright/test";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  fetchJson,
  resetPersistence,
  setDeployment,
  fillNormalDistributions,
  downloadAndParseJson,
} from "./helpers";

// UncertainUQ.tsx hardcodes nHistograms: 50, seed: 0 for the propagation request,
// so the bin arrays' length is guaranteed by the frontend code, not just the mock.
const HISTOGRAM_BINS = 50;

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
 * because the MUI Modal child was a non-ref-forwarding function component.
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
  await expect(page.locator('[mmux-testid="input-block-Mean"] input').first()).toBeVisible({
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
  const qoiSelect = page.locator('[mmux-testid="qoi-select"]').first();
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The UQ histogram renders once propagation over the mock jobs completes.
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Pixel baseline: the UQ histogram with the real (deterministic) Plotly render.
  await expect(page).toHaveScreenshot("uq-readonly-histogram.png");

  // Download button: the mock backend + hardcoded nHistograms/seed make the
  // propagation result fully deterministic, so both the shape and the ordering
  // relationships between the summary statistics are pinned.
  const uqDownload = (await downloadAndParseJson(page, "download-uq-data-btn")) as {
    binMeans: number[];
    binStds: number[];
    binsStart: number;
    binsEnd: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    std: number;
    whiskerMin: number;
    whiskerMax: number;
    outliers: number[];
  };
  expect(uqDownload.binMeans, "binMeans length").toHaveLength(HISTOGRAM_BINS);
  expect(uqDownload.binStds, "binStds length").toHaveLength(HISTOGRAM_BINS);
  expect(Array.isArray(uqDownload.outliers), "outliers is an array").toBe(true);
  expect(uqDownload.binsStart, "binsStart < binsEnd").toBeLessThan(uqDownload.binsEnd);
  // Five-number-summary ordering must hold regardless of the exact sampled values.
  expect(uqDownload.min, "min <= whiskerMin").toBeLessThanOrEqual(uqDownload.whiskerMin);
  expect(uqDownload.whiskerMin, "whiskerMin <= q1").toBeLessThanOrEqual(uqDownload.q1);
  expect(uqDownload.q1, "q1 <= median").toBeLessThanOrEqual(uqDownload.median);
  expect(uqDownload.median, "median <= q3").toBeLessThanOrEqual(uqDownload.q3);
  expect(uqDownload.q3, "q3 <= whiskerMax").toBeLessThanOrEqual(uqDownload.whiskerMax);
  expect(uqDownload.whiskerMax, "whiskerMax <= max").toBeLessThanOrEqual(uqDownload.max);
  expect(uqDownload.mean, "min <= mean <= max").toBeGreaterThanOrEqual(uqDownload.min);
  expect(uqDownload.mean, "min <= mean <= max").toBeLessThanOrEqual(uqDownload.max);
  expect(uqDownload.std, "std >= 0").toBeGreaterThanOrEqual(0);

  // Inspect Model opens the SuMo cross-validation modal (regression guard: the
  // MUI Modal child must forward a ref, otherwise the modal never renders).
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();

  const modal = page.locator('[mmux-testid="sumo-model-modal"]');
  await expect(modal).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(modal.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Pixel baseline: the Inspect Model modal (cross-validation view).
  await expect(page).toHaveScreenshot("uq-readonly-inspect-modal.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
