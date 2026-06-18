import { expect, type Page, type APIRequestContext } from "@playwright/test";

/**
 * Shared helpers for the MMUX e2e specs (SuMo / UQ / MOGA).
 *
 * The deterministic local stack is a single live Flask backend with the
 * in-backend oSPARC test-double (gated by MMUX_E2E_MOCK_OSPARC) behind the vite
 * /flask proxy. The backend reads SERVICE_MODE/PERMISSIONS from the environment
 * on every request, and the frontend re-fetches the service mode on each full
 * page load, so a spec selects its mode via `setDeployment()` before navigating.
 * See root SPEC.md §T9-§T13.
 */

export const FUNCTION_UID = "func-sumo-readonly-e2e";

export const VIEW_TIMEOUT = 30_000;
export const MODEL_READY_TIMEOUT = 60_000;

// Mirror of the frontend persistence shape so each run starts from a clean slate.
export const DEFAULT_PERSISTENCE = {
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

export async function fetchJson(
  request: APIRequestContext,
  url: string,
): Promise<Record<string, unknown>> {
  const response = await request.get(url);
  expect(response.ok(), `GET ${url} → ${response.status()}`).toBeTruthy();
  return (await response.json()) as Record<string, unknown>;
}

export async function resetPersistence(request: APIRequestContext, baseURL: string): Promise<void> {
  const response = await request.post(`${baseURL}/flask/text-file`, {
    data: { filename: "persistence.json", content: JSON.stringify(DEFAULT_PERSISTENCE) },
  });
  expect(response.ok(), `reset persistence → ${response.status()}`).toBeTruthy();
}

export type ServiceMode = "SUMO" | "UQ" | "MOGA";
export type Permissions = "READ-ONLY" | "WRITE";

/**
 * Pin the backend's service mode + permissions for the page loads that follow.
 * Hits the test-only control endpoint (registered only under MMUX_E2E_MOCK_OSPARC).
 */
export async function setDeployment(
  request: APIRequestContext,
  baseURL: string,
  serviceMode: ServiceMode,
  permissions: Permissions = "READ-ONLY",
): Promise<void> {
  const response = await request.post(`${baseURL}/flask/e2e/deployment`, {
    data: { serviceMode, permissions, deploymentMode: "LOCAL" },
  });
  expect(response.ok(), `set deployment ${serviceMode}/${permissions} → ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as Record<string, unknown>;
  expect(body.serviceMode, "backend echoed serviceMode").toBe(serviceMode);
  expect(body.permissions, "backend echoed permissions").toBe(permissions);
}

/**
 * Fill the uniform Min/Max parameter-range blocks (SuMo / MOGA setup).
 * Each input i gets Min=i+1, Max=(i+1)*10.
 */
export async function fillUniformInputRanges(page: Page): Promise<void> {
  const minInputs = page.locator('[mmux-testid="input-block-Min"] input');
  const maxInputs = page.locator('[mmux-testid="input-block-Max"] input');

  const minCount = await minInputs.count();
  const maxCount = await maxInputs.count();
  expect(minCount, "expected at least one Min input after selecting a function").toBeGreaterThan(0);
  expect(minCount, "expected matching Min/Max input pairs").toBe(maxCount);

  for (let index = 0; index < minCount; index++) {
    await minInputs.nth(index).fill(String(index + 1));
    await minInputs.nth(index).press("Tab");
    await maxInputs.nth(index).fill(String((index + 1) * 10));
    await maxInputs.nth(index).press("Tab");
  }
}

/**
 * Fill the normal-distribution Mean / Standard Deviation blocks (UQ setup).
 * Each input gets Mean=1, Std=1 — finite and strictly positive so the surrogate
 * and UQ propagation stay well-conditioned and the next-button enables.
 */
export async function fillNormalDistributions(page: Page): Promise<void> {
  const meanInputs = page.locator('[mmux-testid="input-block-Mean"] input');
  const stdInputs = page.locator('[mmux-testid="input-block-Standard Deviation"] input');

  const meanCount = await meanInputs.count();
  const stdCount = await stdInputs.count();
  expect(meanCount, "expected at least one Mean input after selecting a function").toBeGreaterThan(0);
  expect(meanCount, "expected matching Mean/Std input pairs").toBe(stdCount);

  for (let index = 0; index < meanCount; index++) {
    await meanInputs.nth(index).fill("1");
    await meanInputs.nth(index).press("Tab");
    await stdInputs.nth(index).fill("1");
    await stdInputs.nth(index).press("Tab");
  }
}
