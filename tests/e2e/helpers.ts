import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

// Real production-shaped dataset (§T33 / B23 / V41): 50 oSPARC jobs, 11 inputs,
// 7 outputs, dropped at repo root as `material_sweep_first50_Osparc.csv` and
// copied here so the e2e can upload it through the real UI flow.
// Resolve without `import.meta` (Playwright loads helpers as CJS): cwd is `node/`
// under the make/CI e2e target (`cd node && npm run test:e2e`), so the fixture is
// `../tests/e2e/fixtures/...`; also try the repo-root cwd and an absolute fallback.
function resolveRealCsv(): string {
  const name = "material_sweep_first50_Osparc.csv";
  const candidates = [
    path.join(process.cwd(), "..", "tests", "e2e", "fixtures", name),
    path.join(process.cwd(), "tests", "e2e", "fixtures", name),
    path.join("/work", "tests", "e2e", "fixtures", name),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[0];
}
export const REAL_CSV_PATH = resolveRealCsv();

export const VIEW_TIMEOUT = 30_000;
export const MODEL_READY_TIMEOUT = 60_000;
// Real Dakota surrogate on 50 oSPARC jobs can take minutes to cross-validate;
// this is the wait budget for model creation + plot render in the real-data spec.
export const MODEL_BUILD_TIMEOUT = 180_000;

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

/**
 * Drive the real CSV-upload UI flow (§T33): click "Upload Data", hand the file
 * to the native chooser, optionally set a unique function title (so the
 * uploaded function can be re-selected after a service-mode switch), then
 * "Import". Returns once the import resolves (the new function is auto-selected
 * by `handleCsvUploadSuccess`, so the input-range blocks appear next).
 */
export async function uploadCsvViaUi(page: Page, csvPath: string, title?: string): Promise<void> {
  const uploadButton = page.getByRole("button", { name: "Upload Data" }).first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    uploadButton.click(),
  ]);
  await fileChooser.setFiles(csvPath);

  if (title !== undefined) {
    const titleInput = page
      .getByRole("dialog")
      .getByRole("textbox", { name: "New function title" });
    await titleInput.fill(title);
    await titleInput.press("Tab");
  }

  await page.getByRole("button", { name: "Import" }).click();
  // The input-range (or distribution) blocks appear once the function is selected.
  await expect(
    page.locator('[mmux-testid="input-block-Min"] input, [mmux-testid="input-block-Mean"] input').first(),
  ).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
}

/**
 * Resolve a locally-uploaded function's uid + ordered input vars by its title
 * (§T33), so the real per-input ranges can be read back in UI order.
 * `/flask/osparc/list_functions` returns a JSON array of function dicts; a local
 * (CSV-uploaded) function exposes `uid`, `title`, and `input_vars` (raw names, in
 * CSV column order).
 */
export async function getFunctionUidByTitle(
  request: APIRequestContext,
  baseURL: string,
  title: string,
): Promise<{ uid: string; inputVars: string[] }> {
  const functions = (await fetchJson(request, `${baseURL}/flask/osparc/list_functions`)) as Array<{
    uid: string;
    title: string;
    input_vars?: string[];
  }>;
  const match = functions.find(fun => fun.title === title);
  expect(match, `uploaded function titled "${title}" not found in list_functions`).toBeDefined();
  return { uid: match!.uid, inputVars: match!.input_vars ?? [] };
}

/**
 * Per-input `[min, max]` ranges read straight from the real dataset, in the
 * function's `input_vars` order (§T33). Keeps UQ/SUMO samples inside the training
 * domain so the surrogate plots render real curves, not far-extrapolation artifacts.
 */
export function computeRealInputRanges(inputVars: ReadonlyArray<string>): Array<[number, number]> {
  const text = readFileSync(REAL_CSV_PATH, "utf8");
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const header = lines[0].split(",");
  const colIndex = new Map<string, number>();
  header.forEach((name, idx) => colIndex.set(name, idx));

  const ranges: Array<[number, number]> = [];
  for (const name of inputVars) {
    const ci = colIndex.get(`input__${name}`);
    if (ci === undefined) {
      ranges.push([0, 1]);
      continue;
    }
    let lo = Infinity;
    let hi = -Infinity;
    for (let r = 1; r < lines.length; r++) {
      const cell = lines[r].split(",")[ci];
      const value = Number.parseFloat(cell);
      if (!Number.isNaN(value)) {
        if (value < lo) lo = value;
        if (value > hi) hi = value;
      }
    }
    ranges.push([Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 1]);
  }
  return ranges;
}

/**
 * Fill the input-distribution blocks from the real per-input `[min, max]` ranges
 * (§T33). A CSV-uploaded function is inferred as a UNIFORM distribution, so the
 * input config renders `input-block-Min` / `input-block-Max` in both SUMO and UQ
 * modes (`InputVariableDist` keeps the upload-prefilled uniform distribution);
 * we fill those. If a normal distribution is ever shown instead, we fall back to
 * Mean=midpoint / Std=(max-min)/6 so the helper stays mode-agnostic.
 */
export async function fillRealDistributions(
  page: Page,
  inputRanges: ReadonlyArray<readonly [number, number]>,
): Promise<void> {
  const minInputs = page.locator('[mmux-testid="input-block-Min"] input');
  const minCount = await minInputs.count();

  if (minCount > 0) {
    const maxInputs = page.locator('[mmux-testid="input-block-Max"] input');
    const maxCount = await maxInputs.count();
    expect(minCount, "expected matching Min/Max input pairs").toBe(maxCount);
    for (let index = 0; index < minCount; index++) {
      const [lo, hi] = inputRanges[index] ?? [0, 1];
      await minInputs.nth(index).fill(String(lo));
      await minInputs.nth(index).press("Tab");
      await maxInputs.nth(index).fill(String(hi));
      await maxInputs.nth(index).press("Tab");
    }
    return;
  }

  const meanInputs = page.locator('[mmux-testid="input-block-Mean"] input');
  const stdInputs = page.locator('[mmux-testid="input-block-Standard Deviation"] input');
  const meanCount = await meanInputs.count();
  const stdCount = await stdInputs.count();
  expect(meanCount, "expected at least one distribution input after selecting a function").toBeGreaterThan(0);
  expect(meanCount, "expected matching Mean/Std input pairs").toBe(stdCount);
  for (let index = 0; index < meanCount; index++) {
    const [lo, hi] = inputRanges[index] ?? [0, 1];
    const mid = (lo + hi) / 2;
    const spread = Math.max((hi - lo) / 6, 1e-6);
    await meanInputs.nth(index).fill(String(mid));
    await meanInputs.nth(index).press("Tab");
    await stdInputs.nth(index).fill(String(spread));
    await stdInputs.nth(index).press("Tab");
  }
}
