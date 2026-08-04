import { test, expect, type Page } from "@playwright/test";
import {
  REAL_CSV_PATH,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  MODEL_BUILD_TIMEOUT,
  resetPersistence,
  setDeployment,
  uploadCsvViaUi,
  getFunctionUidByTitle,
  fillRealDistributions,
  computeRealInputRanges,
} from "./helpers";

/**
 * Real production-shaped dataset e2e (§T33 / B23 / V41).
 *
 * Uploads `material_sweep_first50_Osparc.csv` (50 oSPARC jobs, 11 inputs, 7
 * outputs) through the real UI file-chooser and traverses the SuMo response
 * surface and the UQ histogram + Inspect-Model modal for the exact QoI that
 * made `/sumo_cross_validation` 500 with `{"error":"'y1'"}` in production:
 * `delta_T_nerve`. The backend fix (V41) must keep that QoI returning 200
 * (with `warnings`) instead of a hard 500; this spec proves the UI never
 * crashes on it and captures pixel baselines for the plots.
 *
 * Shares the deterministic local stack with the read-only specs: one backend
 * boot, SERVICE_MODE pinned per-test via the test-only control endpoint. Pixel
 * baselines are regenerated ONLY in the pinned Playwright docker image (§V12);
 * host-generated baselines must not be committed.
 */

const QOI = "delta_T_nerve";
const SUMO_TITLE = "RealData material_sweep (SUMO)";
const UQ_TITLE = "RealData material_sweep (UQ)";
const VIEW_TIMEOUT_LONG = 60_000;

async function selectQoi(page: Page, qoi: string): Promise<void> {
  const qoiSelect = page.locator('[mmux-testid="qoi-select"]').first();
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT_LONG });
  await qoiSelect.click();
  await page.getByRole("option", { name: qoi }).click();
}

test(
  "real dataset: SuMo cross-validation surface for delta_T_nerve (B23 QoI)",
  { timeout: 600_000 },
  async ({ page, request, baseURL }) => {
    const url = baseURL!;
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await setDeployment(request, url, "SUMO", "READ-ONLY");
    const health = await request.get(`${url}/flask/deployment/health`);
    expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
    const serviceMode = await request.get(`${url}/flask/deployment/service-mode`);
    expect((await serviceMode.json()).serviceMode).toBe("SUMO");

    await resetPersistence(request, url);
    await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
    await page.waitForLoadState("networkidle");

    // Upload the real CSV through the file chooser; the new function auto-selects.
    await uploadCsvViaUi(page, REAL_CSV_PATH, SUMO_TITLE);
    const { inputVars } = await getFunctionUidByTitle(request, url, SUMO_TITLE);
    await fillRealDistributions(page, computeRealInputRanges(inputVars));

    const nextButton = page.locator('[mmux-testid="next-button"]');
    await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await nextButton.click();

    const creatingModel = page.getByText("Creating AI model...");
    if (await creatingModel.first().isVisible().catch(() => false)) {
      await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_BUILD_TIMEOUT });
    }

    // SuMo validation view for the B23 QoI.
    const validationView = page.locator('[mmux-testid="sumo-validation-view"]');
    await expect(validationView).toBeVisible({ timeout: VIEW_TIMEOUT });
    await selectQoi(page, QOI);
    await expect(validationView.locator(".js-plotly-plot")).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    // NB: MAE/RMSE are rendered by the separate Stats step (SuMoStats), not the
    // validation view, so they are asserted there rather than here.
    await expect(page).toHaveScreenshot("realdata-sumo-validation.png");

    // Walk the SuMo response-surface stepper (Validation -> 1D -> 2D -> 3D),
    // capturing each plot. The MobileStepper Next button carries mmux-testid
    // "sumo-plot-next"; the mock data is replaced by the real surrogate, so the
    // plotly figures are the real (deterministic-in-docker) renders.
    const plotNext = page.locator('[mmux-testid="sumo-plot-next"]');
    const plotArea = page.locator(".js-plotly-plot");

    await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotNext.click();
    await expect(page.getByText("1D Curves", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(plotArea.first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    await expect(page).toHaveScreenshot("realdata-sumo-1d.png");

    await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotNext.click();
    await expect(page.getByText("2D Surface", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(plotArea.first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    await expect(page).toHaveScreenshot("realdata-sumo-2d.png");

    await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotNext.click();
    await expect(page.getByText("3D IsoSurface", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(plotArea.first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    await expect(page).toHaveScreenshot("realdata-sumo-3d.png");

    const runtimeErrors = errors.filter(e => !e.includes("Failed to load resource"));
    expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
  },
);

test(
  "real dataset: UQ histogram + Inspect-Model modal for delta_T_nerve (B23 QoI)",
  { timeout: 600_000 },
  async ({ page, request, baseURL }) => {
    const url = baseURL!;
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await setDeployment(request, url, "UQ", "READ-ONLY");
    const health = await request.get(`${url}/flask/deployment/health`);
    expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
    const serviceMode = await request.get(`${url}/flask/deployment/service-mode`);
    expect((await serviceMode.json()).serviceMode).toBe("UQ");

    await resetPersistence(request, url);
    await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
    await page.waitForLoadState("networkidle");

    await uploadCsvViaUi(page, REAL_CSV_PATH, UQ_TITLE);
    const { inputVars } = await getFunctionUidByTitle(request, url, UQ_TITLE);
    await fillRealDistributions(page, computeRealInputRanges(inputVars));

    const nextButton = page.locator('[mmux-testid="next-button"]');
    await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await nextButton.click();

    const creatingModel = page.getByText("Creating AI model...");
    if (await creatingModel.first().isVisible().catch(() => false)) {
      await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_BUILD_TIMEOUT });
    }

    // UQ output setup: QoI selector + Inspect Model button + histogram all share
    // one view (no stepper Next needed to reach the histogram).
    const qoiSelect = page.locator('[mmux-testid="qoi-select"]').first();
    await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
    const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
    await expect(inspectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });

    // Drive the histogram to the B23 QoI.
    await selectQoi(page, QOI);
    await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    await expect(page).toHaveScreenshot("realdata-uq-histogram.png");

    // Inspect Model opens the SuMo cross-validation modal for the same QoI.
    await expect(inspectButton).toBeEnabled({ timeout: MODEL_BUILD_TIMEOUT });
    await inspectButton.click();
    const modal = page.locator('[mmux-testid="sumo-model-modal"]');
    await expect(modal).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(modal.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_BUILD_TIMEOUT });
    await expect(page).toHaveScreenshot("realdata-uq-inspect-modal.png");

    const runtimeErrors = errors.filter(e => !e.includes("Failed to load resource"));
    expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
  },
);
