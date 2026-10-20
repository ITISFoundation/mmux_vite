import { test, expect } from "./coverage";
import type { Page } from "@playwright/test";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  VIEW_TIMEOUT,
  fillUniformInputRanges,
  resetMockOsparc,
  resetPersistence,
  setDeployment,
  setFault,
  trackPageErrors,
} from "./helpers";

/**
 * SuMo WRITE-mode sampling launch (root SPEC §T36). The mock oSPARC `map_function` records
 * a new collection of finished jobs, so the whole launch path is exercised end to end:
 * frontend POST → Flask validation → oSPARC map → job listing → selector table.
 * `resetMockOsparc` drops created data so the read-only pixel baselines stay unchanged.
 */

test.beforeEach(async ({ page, baseURL }) => {
  await resetMockOsparc(page.request, baseURL!);
  await setDeployment(page.request, baseURL!, "SUMO", "WRITE");
  await resetPersistence(page.request, baseURL!);
});

test.afterEach(async ({ page, baseURL }) => {
  await resetMockOsparc(page.request, baseURL!);
});

async function openLhsCampaign(page: Page, baseURL: string) {
  await page.goto(baseURL, { timeout: MODEL_READY_TIMEOUT });
  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);
  await page.locator('[mmux-testid="next-button"]').click();

  // Validation moved into the Inspect Model modal; the WRITE-mode sampling
  // controls (extend campaign → LHS) live at the results view footer.
  await expect(page.getByText("1D Curves", { exact: true }).first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  const extendSampling = page.locator('[mmux-testid="extend-sampling-btn"]');
  await expect(extendSampling).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await extendSampling.click();
  await page.locator('[mmux-testid="new-sampling-campaign-btn"]').click();
  await expect(page.getByText("Latin Hypercube Sampling")).toBeVisible({ timeout: VIEW_TIMEOUT });
  const runButton = page.locator('[mmux-testid="run-sampling-btn"]').first();
  await expect(runButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  // B31rv: visible heading + enabled button ≠ settled panel. Job-collection rows, the
  // sampling-points default and the accordion collapse are still committing re-renders,
  // and an actionability-checked click can dispatch onto a node about to be replaced —
  // the handler never runs and NO POST leaves the page (CI ARIA snapshot at failure:
  // button still "Run"/enabled, zero toasts, zero POSTs in the backend log). Wait out the
  // async arrivals (networkidle, the convention every read-only spec already uses), then
  // re-assert enabled, so the launch click lands on a settled tree.
  await page.waitForLoadState("networkidle");
  await expect(runButton).toBeEnabled();
  return runButton;
}

test("an LHS launch sends JSON and adds the new collection to the job table", async ({ page, baseURL }) => {
  test.slow(); // B31rv: model compute on the serialized e2e backend can eat the default 120s on a busy CI runner
  const pageErrors = trackPageErrors(page);
  const runButton = await openLhsCampaign(page, baseURL!);

  const lhsRequest = page.waitForRequest("**/flask/sampling/lhs");
  const lhsResponse = page.waitForResponse("**/flask/sampling/lhs");
  await runButton.click();

  // §B27ct: without a JSON content type the backend answers 415 and no campaign starts.
  expect((await lhsRequest).headers()["content-type"]).toContain("application/json");
  expect((await lhsResponse).status()).toBe(200);
  await expect(page.getByText("E2E created collection 1")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.getByText("Error running LHS sampling", { exact: false })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("an oSPARC failure during launch reports the error and re-enables Run", async ({ page, baseURL }) => {
  test.slow(); // B31rv
  const pageErrors = trackPageErrors(page);
  const runButton = await openLhsCampaign(page, baseURL!);
  await setFault(page.request, baseURL!, "map_function");

  await runButton.click();

  await expect(page.getByText("Error running LHS sampling: 500", { exact: false })).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(runButton).toBeEnabled();
  await expect(runButton).toHaveText("Run");
  await expect(page.getByText("E2E created collection", { exact: false })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("a double click while launching starts only one campaign", async ({ page, baseURL }) => {
  test.slow(); // B31rv
  const runButton = await openLhsCampaign(page, baseURL!);
  let lhsPosts = 0;
  await page.route("**/flask/sampling/lhs", async route => {
    lhsPosts += 1;
    await new Promise(resolve => setTimeout(resolve, 1_000));
    await route.continue();
  });

  // B31rv: observe the launch POST bounded — a swallowed click must fail HERE with the
  // route/waitForRequest context, not blind 30s later on the job table.
  const launchPost = page.waitForRequest("**/flask/sampling/lhs", { timeout: VIEW_TIMEOUT });
  await runButton.dblclick();
  await launchPost;

  await expect(page.getByText("E2E created collection 1")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.getByText("E2E created collection 2")).toHaveCount(0);
  expect(lhsPosts).toBe(1);
});
