import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  VIEW_TIMEOUT,
  failRoute,
  fillUniformInputRanges,
  resetPersistence,
  setDeployment,
  trackPageErrors,
} from "./helpers";

/**
 * Browser-side failure injection (root SPEC §V29qa / §T35): `page.route` answers selected
 * `/flask/*` calls with HTTP errors, network aborts or malformed JSON, and each spec asserts
 * a visible recovery state and no uncaught page exceptions. No pixel baselines here.
 */

test.beforeEach(async ({ page, baseURL }) => {
  await setDeployment(page.request, baseURL!, "SUMO", "READ-ONLY");
  await resetPersistence(page.request, baseURL!);
});

test("a failed persistence load still opens the app with a warning", async ({ page, baseURL }) => {
  const pageErrors = trackPageErrors(page);
  await failRoute(page, "**/flask/text-file/persistence.json", { status: 500 });

  await page.goto(baseURL!);

  await expect(page.getByText("Failed to fetch user state, contact support.")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`)).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  expect(pageErrors).toEqual([]);
});

test("a failed service configuration falls back to read-only with a visible warning", async ({ page, baseURL }) => {
  const pageErrors = trackPageErrors(page);
  await failRoute(page, "**/flask/deployment/permissions", { status: 503 });

  await page.goto(baseURL!);

  await expect(
    page.getByText("Could not load the service configuration from the backend. Running read-only; please reload or contact support."),
  ).toBeVisible({ timeout: VIEW_TIMEOUT });
  expect(pageErrors).toEqual([]);
});

for (const [label, fault] of [
  ["a network failure", "abort"],
  ["malformed JSON", "malformed"],
] as const) {
  test(`the function list reports ${label} instead of crashing`, async ({ page, baseURL }) => {
    const pageErrors = trackPageErrors(page);
    await failRoute(page, "**/flask/osparc/list_functions", fault);

    await page.goto(baseURL!);

    await expect(page.getByText("Error fetching functions from the server.", { exact: false })).toBeVisible({
      timeout: VIEW_TIMEOUT,
    });
    expect(pageErrors).toEqual([]);
  });
}

test("a failed surrogate cross-validation shows an error instead of a blank view", async ({ page, baseURL }) => {
  const pageErrors = trackPageErrors(page);
  await failRoute(page, "**/flask/dakota/sumo_cross_validation", { status: 500, body: "dakota crashed" });

  await page.goto(baseURL!, { timeout: MODEL_READY_TIMEOUT });
  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({ timeout: VIEW_TIMEOUT });
  await fillUniformInputRanges(page);
  await page.locator('[mmux-testid="next-button"]').click();

  const validationView = page.locator('[mmux-testid="sumo-validation-view"]');
  await expect(validationView).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(validationView.getByText("Error during calculation, please contact support.")).toBeVisible({
    timeout: MODEL_READY_TIMEOUT,
  });
  await expect(validationView.locator(".js-plotly-plot")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
