import { test, expect, type Page } from "@playwright/test";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  fetchJson,
  resetPersistence,
  setDeployment,
  fillUniformInputRanges,
  downloadAndParseJson,
} from "./helpers";

// addFirstOutputTarget always adds the mock function's first output var ("y",
// minimize) with the default MOGA settings (MOGASettingsContext.tsx: populationSize
// 50, maxIterations 100, seed 42, numberSeeds 1), which is empirically reproducible
// as a fixed-length (4107) population dump against the deterministic mock backend.
const MOGA_POPULATION_SIZE = 4107;
// Mock function formula (mock_osparc/data.py): y = 2*x1 + 0.3*x1^2 + 0.5*x2. The
// GP surrogate fits this near-exactly (empirically <1e-6 abs error), so the
// downloaded y values must match the closed-form formula within a loose tolerance.
const mockY = (x1: number, x2: number) => 2 * x1 + 0.3 * x1 * x1 + 0.5 * x2;

/**
 * MOGA (Multi-Objective Genetic Algorithm) READ-ONLY behavioral + pixel-snapshot
 * suite (§T12 / §V14).
 *
 * Shares the deterministic local stack and the single backend boot with the
 * SuMo/UQ specs; SERVICE_MODE is switched to MOGA up front via the test-only
 * control endpoint (§T13) so the spec is order-independent. MOGA inputs use a
 * UNIFORM range (Min / Max) like SuMo, plus at least one optimization objective
 * (output target) so the next-button enables and the Pareto front can be
 * computed over the deterministic mock jobs.
 *
 * Also exercises the "Inspect Model" SuMo modal (regression guard for the MUI
 * Modal ref-forwarding fix).
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed.
 */

async function addFirstOutputTarget(page: Page): Promise<void> {
  const addButton = page.locator('[mmux-testid="add-output-var-btn"]');
  await expect(addButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await addButton.click();
  const confirmButton = page.locator('[mmux-testid="confirm-add-output-btn"]');
  await expect(confirmButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await confirmButton.click();
  await expect(confirmButton).toBeHidden({ timeout: VIEW_TIMEOUT });
}

test("MOGA read-only optimization flow renders pareto front and inspect-model modal", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: MOGA service in READ-ONLY mode, served by the test-double.
  await setDeployment(page.request, url, "MOGA", "READ-ONLY");
  const health = await page.request.get(`${url}/flask/deployment/health`);
  expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
  const serviceMode = await fetchJson(page.request, `${url}/flask/deployment/service-mode`);
  expect(serviceMode.serviceMode).toBe("MOGA");
  const permissions = await fetchJson(page.request, `${url}/flask/deployment/permissions`);
  expect(permissions.permissions).toBe("READ-ONLY");

  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  // Pixel baseline: the function-selection setup grid (full 1920x1080 viewport).
  await expect(page).toHaveScreenshot("moga-readonly-setup.png");

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // MOGA uses uniform parameter ranges (Min/Max) like SuMo.
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);

  // MOGA also needs at least one optimization objective for the next-button to enable.
  await addFirstOutputTarget(page);

  // Pixel baseline: function selected, ranges configured and one objective added.
  await expect(page).toHaveScreenshot("moga-readonly-inputs.png");

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }

  // MOGA output setup: QoI selector + Inspect Model button + the Pareto view.
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  const paretoView = page.locator('[mmux-testid="moga-pareto-plot"]');
  await expect(paretoView).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The Pareto front renders once the optimization over the mock jobs completes.
  await expect(paretoView.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Pixel baseline: the MOGA Pareto front with the real (deterministic) Plotly render.
  await expect(page).toHaveScreenshot("moga-readonly-pareto.png");

  // Download button: the mock backend + fixed default MOGA settings (seed 42)
  // make the optimization population fully deterministic.
  const mogaDownload = (await downloadAndParseJson(page, "download-moga-data-btn")) as {
    optimizationResults: Record<string, number[]>;
  };
  const opt = mogaDownload.optimizationResults;
  expect(opt, "optimizationResults present").toBeTruthy();
  for (const key of ["x1", "x2", "x3", "x4", "y"]) {
    expect(opt[key], `${key} present`).toBeTruthy();
    expect(opt[key], `${key} length`).toHaveLength(MOGA_POPULATION_SIZE);
  }
  for (let i = 0; i < opt.y.length; i++) {
    expect(opt.y[i], `y[${i}] matches formula within tolerance`).toBeCloseTo(mockY(opt.x1[i], opt.x2[i]), 2);
  }

  // Inspect Model opens the SuMo cross-validation modal (regression guard for
  // the MUI Modal ref-forwarding fix; the MOGA-mode button now carries a testid).
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();

  const modal = page.locator('[mmux-testid="sumo-model-modal"]');
  await expect(modal).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(modal.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Pixel baseline: the Inspect Model modal (cross-validation view).
  await expect(page).toHaveScreenshot("moga-readonly-inspect-modal.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
