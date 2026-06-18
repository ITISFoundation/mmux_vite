import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

/**
 * SuMo READ-ONLY behavioral + pixel-snapshot suite (§T11 / §V10,§V13).
 *
 * Exercises the deterministic local stack: the live Flask backend with the
 * in-backend oSPARC test-double (§T9, gated by MMUX_E2E_MOCK_OSPARC) behind the
 * vite /flask proxy (§T10). The mock exposes exactly one function
 * (`func-sumo-readonly-e2e`) with six SUCCESS jobs, so the flow is fully
 * deterministic and needs no grid pagination search.
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed. Screenshots capture
 * the full 1920x1080 viewport with the real (unmasked) Plotly render: the mock
 * data and surrogate are fully deterministic, so the plot is reproducible in
 * the pinned image and a masked-out plot would defeat the pixel comparison.
 */

const FUNCTION_UID = "func-sumo-readonly-e2e";

const VIEW_TIMEOUT = 30_000;
const MODEL_READY_TIMEOUT = 60_000;

// Mirror of the frontend persistence shape so each run starts from a clean slate.
const DEFAULT_PERSISTENCE = {
  currentView: 0,
  numSamples: {},
  selectedQoI: null,
  isSuMoGenerated: false,
  selectedFunction: null,
  inputVars: [],
  outputVars: [],
  distribution: {},
  lhsSamplingConfig: { inputs: [], points: 0, seed: 0 },
  gridSamplingConfig: [],
  singleJobConfig: [],
  runningJobCollection: null,
  fetchedJobCollections: [],
  selectedJobUids: [],
  outputTargets: {},
  mogaSettings: {},
  weights: {},
  sortModel: [],
};

async function fetchJson(request: APIRequestContext, url: string): Promise<Record<string, unknown>> {
  const response = await request.get(url);
  expect(response.ok(), `GET ${url} → ${response.status()}`).toBeTruthy();
  return (await response.json()) as Record<string, unknown>;
}

async function resetPersistence(request: APIRequestContext, baseURL: string): Promise<void> {
  const response = await request.post(`${baseURL}/flask/text-file`, {
    data: { filename: "persistence.json", content: JSON.stringify(DEFAULT_PERSISTENCE) },
  });
  expect(response.ok(), `reset persistence → ${response.status()}`).toBeTruthy();
}

async function fillUniformInputRanges(page: Page): Promise<void> {
  const minInputs = page.locator('[mmux-testid="input-block-Min"] input');
  const maxInputs = page.locator('[mmux-testid="input-block-Max"] input');

  const minCount = await minInputs.count();
  const maxCount = await maxInputs.count();
  expect(minCount, "expected at least one SuMo Min input after selecting a function").toBeGreaterThan(0);
  expect(minCount, "expected matching Min/Max input pairs").toBe(maxCount);

  for (let index = 0; index < minCount; index++) {
    await minInputs.nth(index).fill(String(index + 1));
    await minInputs.nth(index).press("Tab");
    await maxInputs.nth(index).fill(String((index + 1) * 10));
    await maxInputs.nth(index).press("Tab");
  }
}

test("SuMo read-only response-surface flow renders validation view", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: SuMo service in READ-ONLY mode, served by the test-double.
  const health = await page.request.get(`${url}/flask/deployment/health`);
  expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
  const serviceMode = await fetchJson(page.request, `${url}/flask/deployment/service-mode`);
  expect(serviceMode.serviceMode).toBe("SUMO");
  const permissions = await fetchJson(page.request, `${url}/flask/deployment/permissions`);
  expect(permissions.permissions).toBe("READ-ONLY");

  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  // Pixel baseline: the function-selection setup grid (full 1920x1080 viewport).
  await expect(page).toHaveScreenshot("sumo-readonly-setup.png");

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // The input-range configuration opens once a function is selected.
  await expect(page.locator('[mmux-testid="input-block-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);

  // Pixel baseline: function selected, input ranges configured and open.
  await expect(page).toHaveScreenshot("sumo-readonly-inputs.png");

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const jobsLoading = page.locator('[mmux-testid="jobs-loading"]');
  if (await jobsLoading.first().isVisible().catch(() => false)) {
    await jobsLoading.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }
  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }

  const validationView = page.locator('[mmux-testid="sumo-validation-view"]');
  await expect(validationView).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator('[mmux-testid="qoi-select"]')).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(validationView.locator(".js-plotly-plot")).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(validationView.getByText("MAE:")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(validationView.getByText("RMSE:")).toBeVisible({ timeout: VIEW_TIMEOUT });

  // READ-ONLY invariant (§V13): the extend-sampling control stays disabled.
  const extendSampling = page.locator('[mmux-testid="extend-sampling-btn"]');
  await expect(extendSampling).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(extendSampling).toBeDisabled();

  // Pixel baseline: the cross-validation view with the real Plotly render
  // (full 1920x1080 viewport, unmasked — deterministic in the pinned image).
  await expect(page).toHaveScreenshot("sumo-readonly-validation.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});

test("backend endpoints return camelCase keys", async ({ page, baseURL }) => {
  const url = baseURL!;
  const endpoints: Array<[string, string]> = [
    ["/flask/deployment/service-mode", "serviceMode"],
    ["/flask/deployment/permissions", "permissions"],
    ["/flask/deployment/mode", "deploymentMode"],
  ];

  for (const [path, expectedKey] of endpoints) {
    const data = await fetchJson(page.request, `${url}${path}`);
    expect(Object.keys(data), `expected camelCase key '${expectedKey}' in ${path}`).toContain(expectedKey);
  }
});
