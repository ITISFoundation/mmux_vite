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
  downloadAndParseJson,
} from "./helpers";

// The mock function's input schema (mock_osparc/data.py) — the correlation and Sobol payloads
// are keyed by exactly these variables.
const INPUT_VARS = ["x1", "x2", "x3", "x4"];

// 50 bins is the shipped default (uqSettings nHistograms || 50, echoed by the flaskapi ManualUQ
// response validator), so the exported histogram arrays are pinned.
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

  // Raw-data download (T53st sweep, fork issue #79; root V36ez): mock backend + default
  // nHistograms/seed make the propagation deterministic, so replay the legacy shape +
  // five-number-summary ordering assertions on the exported JSON.
  const uqDownload = (await downloadAndParseJson(page, "download-uq-data-btn", "uq-histogram-y.json")) as {
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
  await expect(page.locator('[mmux-testid="download-uq-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-histogram-btn.png",
  );

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

  // Raw-data download (root V36ez witness): the export carries the FULL
  // {correlations:{<var>:{pearson,spearman}}} response — wrapper included — one finite [-1,1]
  // coefficient pair per mock input variable.
  const corrDownload = (await downloadAndParseJson(
    page,
    "download-correlation-data-btn",
    "correlation-y.json",
  )) as { correlations: Record<string, { pearson: number; spearman: number }> };
  expect(Object.keys(corrDownload.correlations).sort()).toEqual([...INPUT_VARS].sort());
  for (const varName of INPUT_VARS) {
    const { pearson, spearman } = corrDownload.correlations[varName];
    expect(Number.isFinite(pearson), `${varName} pearson finite`).toBe(true);
    expect(Number.isFinite(spearman), `${varName} spearman finite`).toBe(true);
    expect(Math.abs(pearson), `${varName} pearson in [-1,1]`).toBeLessThanOrEqual(1.000001);
    expect(Math.abs(spearman), `${varName} spearman in [-1,1]`).toBeLessThanOrEqual(1.000001);
  }
  await expect(page.locator('[mmux-testid="download-correlation-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-correlation-btn.png",
  );

  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-sobol-indices.png");

  // Raw-data download (root V36ez witness): main/total + CI bounds per mock input, exactly the
  // response that feeds the first/total/second-order views.
  const sobolDownload = (await downloadAndParseJson(page, "download-sobol-data-btn", "sobol-y.json")) as {
    sobol: Record<string, { main: number; total: number; mainCiLow: number; mainCiHigh: number }>;
    sobolSecondOrder: Record<string, unknown>;
  };
  expect(Object.keys(sobolDownload.sobol).sort()).toEqual([...INPUT_VARS].sort());
  for (const varName of INPUT_VARS) {
    const entry = sobolDownload.sobol[varName];
    expect(Number.isFinite(entry.main) && entry.main >= 0, `${varName} main >= 0`).toBe(true);
    expect(Number.isFinite(entry.total) && entry.total >= 0, `${varName} total >= 0`).toBe(true);
    expect(entry.mainCiLow, `${varName} CI ordering`).toBeLessThanOrEqual(entry.mainCiHigh);
  }
  expect(typeof sobolDownload.sobolSecondOrder, "second-order matrix present").toBe("object");
  await expect(page.locator('[mmux-testid="download-sobol-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-sobol-btn.png",
  );

  // The histogram's log display gets TWO witness baselines:
  // (a) DISABLED on QoI y — its linearized-Gaussian spread (σ = √(Σg²σ²), √2 over
  //     the N(1,1) inputs) reaches negative bin centers, so the ≤0 gate (B54rz
  //     reading) kills the LOG option — element baseline pins exactly that state.
  // (b) LIVE on QoI y4 = 2 + 0.5·(x3+x4)² — its convexity makes the QoI card's
  //     auto-detect COMMIT LOG as compute scale (visible on the inputs shots),
  //     and log-space prediction exp's back STRICTLY positive samples
  //     (≈ 0.14 .. 49 ⇒ > 2 decades) so the log histogram is renderable AND
  //     worth seeing. The display DEFAULT is log here — click linear first,
  //     then log, so the shot always captures an actual toggle action.
  const plotBack = page.locator('[mmux-testid="uq-plot-back"]');
  for (let step = 0; step < 2; step += 1) {
    await expect(plotBack).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotBack.click();
  }
  await expect(page.getByText("Uncertainty Quantification Histogram")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator('[mmux-testid="uq-display-scale"]')).toHaveScreenshot("uq-readonly-histogram-log-disabled.png");

  await page.locator('[mmux-testid="uq-plot-qoi-select"]').click();
  await page.getByRole("option", { name: "y4", exact: true }).click();
  // ANY positive Min proves the y4 histogram replaced the y one (y's is "Min: -3.145")
  await expect(page.getByText(/Min: \d/)).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  const histogramScale = page.locator('[mmux-testid="uq-display-scale"]');
  await histogramScale.getByRole("button", { name: "linear" }).click({ timeout: MODEL_READY_TIMEOUT });
  await histogramScale.getByRole("button", { name: "log" }).click({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-histogram-log-y4.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
