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
  // Canonical trailing slash: the route is registered as `/` under the `/flask/text-file`
  // prefix, so posting to `/flask/text-file` triggers a strict_slashes 308 redirect (node §B13).
  const response = await request.post(`${baseURL}/flask/text-file/`, {
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
 *
 * Ranges mirror the mock data domain (mock_osparc/data.py): x1 ∈ [0.5, 3.0],
 * x2 ∈ [0.5, 2.5], x3/x4 ∈ [1.0, 2.0]. Matching the training domain keeps the
 * 1D/2D/3D surrogate evaluations (and their slider cut-values) inside the
 * fitted region so the response-surface plots render real curves instead of
 * far-extrapolation artifacts. Any extra inputs fall back to [i+1, (i+1)*10].
 */
const DATA_DOMAIN_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0.5, 3.0], // x1
  [0.5, 2.5], // x2
  [1.0, 2.0], // x3
  [1.0, 2.0], // x4
];

export async function fillUniformInputRanges(page: Page): Promise<void> {
  const minInputs = page.locator('[mmux-testid="input-block-Min"] input');
  const maxInputs = page.locator('[mmux-testid="input-block-Max"] input');

  const minCount = await minInputs.count();
  const maxCount = await maxInputs.count();
  expect(minCount, "expected at least one Min input after selecting a function").toBeGreaterThan(0);
  expect(minCount, "expected matching Min/Max input pairs").toBe(maxCount);

  for (let index = 0; index < minCount; index++) {
    const [min, max] = DATA_DOMAIN_RANGES[index] ?? [index + 1, (index + 1) * 10];
    await minInputs.nth(index).fill(String(min));
    await minInputs.nth(index).press("Tab");
    await maxInputs.nth(index).fill(String(max));
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
