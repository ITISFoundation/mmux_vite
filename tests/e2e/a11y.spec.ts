import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  VIEW_TIMEOUT,
  failRoute,
  fillNormalDistributions,
  fillUniformInputRanges,
  expectModelModalReady,
  expectPlotlyReady,
  resetPersistence,
  setDeployment,
} from "./helpers";

/**
 * Accessibility smoke checks (root SPEC §T37 / §V30rb): axe-core runs on the setup, results
 * and error views and fails on serious or critical violations. Plotly's canvas/SVG output
 * is third-party and excluded; everything else the app renders is in scope.
 */

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).exclude(".js-plotly-plot").analyze();
  const serious = violations
    .filter(v => v.impact === "serious" || v.impact === "critical")
    .map(v => `${v.id} (${v.impact}): ${v.nodes.map(n => `${n.html.slice(0, 200)} → ${n.failureSummary}`).join(" | ")}`);
  expect(serious, serious.join("\n")).toEqual([]);
}

test.beforeEach(async ({ page, baseURL }) => {
  await setDeployment(page.request, baseURL!, "SUMO", "READ-ONLY");
  await resetPersistence(page.request, baseURL!);
});

test("setup and validation views have no serious accessibility violations", async ({ page, baseURL }) => {
  await page.goto(baseURL!, { timeout: MODEL_READY_TIMEOUT });
  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectNoSeriousViolations(page);

  await selectButton.click();
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({ timeout: VIEW_TIMEOUT });
  await fillUniformInputRanges(page);
  await expectNoSeriousViolations(page);

  await page.locator('[mmux-testid="next-button"]').click();
  await expect(page.locator('[mmux-testid="sumo-validation-view"]').getByText("MAE:")).toBeVisible({
    timeout: MODEL_READY_TIMEOUT,
  });
  await expectNoSeriousViolations(page);
});

test("the function-list error state has no serious accessibility violations", async ({ page, baseURL }) => {
  await failRoute(page, "**/flask/osparc/list_functions", { status: 500 });
  await page.goto(baseURL!);
  await expect(page.getByText("Error fetching functions from the server.", { exact: false })).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await expectNoSeriousViolations(page);
});

test("UQ setup, histogram and inspect-model modal have no serious violations", async ({ page, baseURL }) => {
  await setDeployment(page.request, baseURL!, "UQ", "READ-ONLY");
  await page.goto(baseURL!, { timeout: MODEL_READY_TIMEOUT });
  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();
  await expect(page.locator('[mmux-testid="input-block-Mean"] input').first()).toBeVisible({ timeout: VIEW_TIMEOUT });
  await fillNormalDistributions(page);
  await expectNoSeriousViolations(page);

  await page.locator('[mmux-testid="next-button"]').click();
  await expectPlotlyReady(page);
  await expectNoSeriousViolations(page);
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();
  await expectModelModalReady(page);
  await expectNoSeriousViolations(page);
});

test("MOGA setup, pareto view and inspect-model modal have no serious violations", async ({ page, baseURL }) => {
  await setDeployment(page.request, baseURL!, "MOGA", "READ-ONLY");
  await page.goto(baseURL!, { timeout: MODEL_READY_TIMEOUT });
  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({ timeout: VIEW_TIMEOUT });
  await fillUniformInputRanges(page);
  const addOutputButton = page.locator('[mmux-testid="add-output-var-btn"]');
  await expect(addOutputButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await addOutputButton.click();
  await page.locator('[mmux-testid="confirm-add-output-btn"]').click();
  await expect(page.locator('[mmux-testid="confirm-add-output-btn"]')).toBeHidden({ timeout: VIEW_TIMEOUT });
  await expectNoSeriousViolations(page);

  await page.locator('[mmux-testid="next-button"]').click();
  const paretoView = page.locator('[mmux-testid="moga-pareto-plot"]');
  await expect(paretoView).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expectPlotlyReady(paretoView);
  await expectNoSeriousViolations(page);
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();
  await expectModelModalReady(page);
  await expectNoSeriousViolations(page);
});
