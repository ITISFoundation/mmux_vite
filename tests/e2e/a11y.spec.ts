import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  VIEW_TIMEOUT,
  failRoute,
  fillUniformInputRanges,
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
