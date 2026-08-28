import { test, expect } from "@playwright/test";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  resetPersistence,
  setDeployment,
  fillUniformInputRanges,
} from "./helpers";

/**
 * Reproduction for GitHub issue #499: "Plots not updating / reloading the right
 * QoI". In SuMo mode the plot steps (Validation / 1D / 2D / 3D) consume the
 * global `selectedQoI`, but `SuMoPlotsSteps` only renders the QoI selector for
 * UQ/MOGA (node/src/components/plots/SuMoPlotsSteps.tsx). The stepped "back"
 * button cannot return to OutputSetup, so once in the validation view a SuMo
 * user has no way to change the QoI — the plot stays on the originally selected
 * output (the "stale QoI" reported in #499).
 */

async function readMae(page: import("@playwright/test").Page): Promise<string> {
  const maeLabel = page.getByText(/MAE/i).first();
  await maeLabel.waitFor({ state: "visible", timeout: MODEL_READY_TIMEOUT });
  const view = page.locator('[mmux-testid="sumo-validation-view"]');
  const text = await view.innerText();
  const maeMatch = text.match(/MAE[:\s]+([-\d.eE]+)/);
  if (!maeMatch) {
    throw new Error(`MAE label visible but value not parseable in:\n${text}`);
  }
  return maeMatch[1];
}

test("SuMo validation view exposes a QoI selector that updates the metrics", async ({ page, baseURL }) => {
  const url = baseURL!;
  await setDeployment(page.request, url, "SUMO", "READ-ONLY");
  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  await page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`).click();
  await fillUniformInputRanges(page);
  await page.locator('[mmux-testid="next-button"]').click();

  // The QoI selector must be reachable from the validation view in SuMo mode.
  const qoiSelect = page.locator('[mmux-testid="sumo-validation-view"]').locator('[mmux-testid="qoi-select"]').first();
  await expect(qoiSelect, "QoI selector must be present in the SuMo plot header").toBeVisible();

  const first = await readMae(page);

  // Switch to a different QoI and confirm the metrics recompute.
  await qoiSelect.click();
  await page.getByRole("option", { name: /y2/i }).first().click();
  const second = await readMae(page);

  expect(second, `MAE did not change after switching QoI (first=${first})`).not.toEqual(first);
});
