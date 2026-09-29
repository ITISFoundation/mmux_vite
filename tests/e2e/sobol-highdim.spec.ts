import { test, expect } from "@playwright/test";
import {
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  resetPersistence,
  setDeployment,
  fillNormalDistributions,
  expectPlotlyReady,
} from "./helpers";

/**
 * High-dimensional Sobol' regression (flaskapi/SPEC.md T31rb, V42qa): the exact
 * arbitrary-d pair estimator must power the SECOND-ORDER view for ANY input
 * count — previously the frontend gated this view to ≤3 inputs because the old
 * identity was provably degenerate beyond d=3.
 *
 * Follows the case-preservation.spec.ts precedent (node/SPEC.md §T18): the
 * shared mock_osparc fixture stays untouched (its 4-input function and pixel
 * baselines keep their meaning), and this spec fabricates an 8-input function
 * plus 64 deterministic SUCCESS jobs at the network layer with page.route().
 * The real Flask backend still fits the surrogate and computes Sobol' indices
 * end-to-end over the request payload — only the oSPARC listing is intercepted.
 *
 * Behavioral assertions only (Plotly trace shape + response contract), so this
 * spec carries no pixel baseline and can run on a host (§V12 untouched).
 */

const HIGHDIM_FUNCTION_UID = "func-sobol-highdim-e2e";
const HIGHDIM_COLLECTION_UID = "jc-sobol-highdim-e2e";
const NUM_JOBS = 64;

const HIGHDIM_FUNCTION = {
  uid: HIGHDIM_FUNCTION_UID,
  title: "Sobol' High-Dim E2E Function",
  description: "Synthetic 8-input function exercising the arbitrary-d second-order view.",
  functionClass: "PROJECT",
  projectId: "22222222-2222-2222-2222-222222222222",
  defaultInputs: { x1: 1, x2: 1, x3: 1, x4: 1, x5: 1, x6: 1, x7: 1, x8: 1 },
  inputSchema: {
    schemaClass: "application/schema+json",
    schemaContent: {
      type: "object",
      properties: Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [`x${i + 1}`, { type: "number" }]),
      ),
      required: Array.from({ length: 8 }, (_, i) => `x${i + 1}`),
    },
  },
  outputSchema: {
    schemaClass: "application/schema+json",
    schemaContent: {
      type: "object",
      properties: { y: { type: "number" } },
      required: ["y"],
    },
  },
};

/**
 * Deterministic 8-input jobs (no RNG): an 8x8 factorial over (x1, x2) with
 * x3..x8 cycling through {1.0, 1.5, 2.0}. The output carries a genuine
 * x1*x2 interaction so the d=8 second-order heatmap has non-trivial off-
 * diagonal mass, and every job ships a y_std_hat (job-payload only, absent
 * from the output schema, same trick as mock_osparc/data.py) so the UQ
 * histogram step stays functional and the flow can navigate to plot 3.
 */
function highdimJobs(): unknown[] {
  const jobs: unknown[] = [];
  for (let i = 0; i < 8; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      const x: Record<string, number> = {
        x1: 0.5 + (2.5 * i) / 7,
        x2: 0.5 + (2.0 * j) / 7,
        x3: 1.0 + 0.5 * ((i + j) % 3),
        x4: 1.0 + 0.5 * ((i + 2 * j) % 3),
        x5: 1.0 + 0.5 * ((2 * i + j) % 3),
        x6: 1.0 + 0.5 * ((i + j + 1) % 3),
        x7: 1.0 + 0.5 * ((2 * i + 2 * j) % 3),
        x8: 1.0 + 0.5 * ((3 * i + j) % 3),
      };
      const round = (v: number) => Math.round(v * 1e6) / 1e6;
      const y = round(
        2 * x.x1 +
          0.5 * x.x1 * x.x2 +
          0.3 * x.x1 * x.x1 +
          0.4 * x.x3 +
          0.3 * x.x4 +
          0.2 * x.x5 +
          0.15 * x.x6 +
          0.1 * x.x7 +
          0.05 * x.x8,
      );
      jobs.push({
        uid: `job-sobol-highdim-e2e-${(i * 8 + j + 1).toString().padStart(2, "0")}`,
        functionUid: HIGHDIM_FUNCTION_UID,
        title: `E2E high-dim job ${i * 8 + j + 1}`,
        description: "Deterministic 8-input e2e job",
        createdAt: "2025-02-01T12:00:00Z",
        inputs: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, round(v)])),
        outputs: { y, y_std_hat: round(0.1 + 0.05 * x.x1) },
        status: "SUCCESS",
      });
    }
  }
  return jobs;
}

const HIGHDIM_JOBS = highdimJobs();
const HIGHDIM_JOB_IDS = (HIGHDIM_JOBS as { uid: string }[]).map(job => job.uid);

const HIGHDIM_COLLECTION = [
  {
    uid: HIGHDIM_COLLECTION_UID,
    title: "E2E high-dim job collection",
    description: `Deterministic collection of ${NUM_JOBS} SUCCESS jobs (8 inputs)`,
    functionUid: HIGHDIM_FUNCTION_UID,
    jobIds: HIGHDIM_JOB_IDS,
  },
];

test("second-order Sobol' heatmap works for 8 inputs (T31rb, arbitrary-d pairs)", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  await resetPersistence(page.request, url);

  // Fabricate the 8-input function + jobs at the browser layer only; every
  // /flask/dakota/* computation still runs against the real backend.
  await page.route("**/flask/osparc/list_functions*", async route => {
    await route.fulfill({ json: [HIGHDIM_FUNCTION] });
  });
  await page.route("**/flask/osparc/list_function_job_collections_for_functionid*", async route => {
    await route.fulfill({ json: HIGHDIM_COLLECTION });
  });
  await page.route("**/flask/osparc/list_function_jobs_for_jobcollectionid*", async route => {
    await route.fulfill({ json: HIGHDIM_JOBS });
  });
  await page.route("**/flask/osparc/list_function_jobs_for_functionid*", async route => {
    await route.fulfill({ json: HIGHDIM_JOBS });
  });

  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${HIGHDIM_FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  await expect(page.locator('[mmux-testid="input-block-Mean"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillNormalDistributions(page);

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }
  await expect(page.locator('[mmux-testid="qoi-select"]').first()).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page); // UQ histogram over the 8-input jobs

  // Plot 2: correlation indices; Plot 3: Sobol' indices.
  const plotNext = page.locator('[mmux-testid="uq-plot-next"]');
  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sensitivity / Correlation Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The Sobol' fetch fires when plot 3 mounts (view-independent); capture its
  // contract before navigating so waitForResponse cannot race past it.
  const sobolResponse = page
    .waitForResponse(r => r.url().includes("/flask/dakota/compute_sobol_indices"), { timeout: MODEL_READY_TIMEOUT })
    .then(async response => {
      expect(response.status(), "compute_sobol_indices → 200").toBe(200);
      return (await response.json()) as {
        sobol: Record<string, Record<string, number>>;
        sobolSecondOrder: Record<string, Record<string, number>>;
        sobolOrderContributions: Record<string, number>;
      };
    });

  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  // Backend contract for d=8 (V42qa + the user's "8 inputs don't break it"):
  const data = await sobolResponse;
  const vars = Array.from({ length: 8 }, (_, i) => `x${i + 1}`);
  expect(Object.keys(data.sobol).sort()).toEqual([...vars].sort());
  expect(Object.keys(data.sobolSecondOrder).sort()).toEqual([...vars].sort());
  let entries = 0;
  for (const varA of vars) {
    const row = data.sobolSecondOrder[varA];
    expect(Object.keys(row).sort()).toEqual([...vars].filter(v => v !== varA).sort());
    for (const [varB, value] of Object.entries(row)) {
      expect(Number.isFinite(value), `S(${varA},${varB}) finite`).toBe(true);
      expect(row[varB]).toBe(data.sobolSecondOrder[varB][varA]); // symmetric
      entries += 1;
    }
  }
  expect(entries, "28 unordered pairs stored symmetrically").toBe(2 * 28);
  const c = data.sobolOrderContributions;
  expect(c.firstOrder + c.secondOrder + c.thirdAndHigher).toBeCloseTo(1, 9); // V43pt
  expect(c.heuristicNoiseFloor).toBeGreaterThanOrEqual(0);
  for (const key of ["firstOrder", "secondOrder", "thirdAndHigher"]) {
    expect(c[`${key}CiLow`]).toBeLessThanOrEqual(c[`${key}CiHigh`]); // V44vw
  }

  // UI contract: the second-order view renders the FULL 8x8 heatmap — the
  // retired ≤3-input gate (and its explanatory message) must be gone.
  await page.locator('[mmux-testid="sobol-toggle-second"]').click();
  await expect(page.getByText(/are not shown/i)).toHaveCount(0);
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });

  const trace = await page.evaluate(() => {
    const el = document.querySelector(".js-plotly-plot") as (HTMLElement & { data?: unknown[] }) | null;
    const t = el?.data?.[0] as { type?: string; z?: number[][]; x?: string[]; y?: string[] } | undefined;
    return { type: t?.type, zLen: t?.z?.length ?? -1, rowLens: (t?.z ?? []).map(r => r.length), x: t?.x, y: t?.y };
  });
  expect(trace.type).toBe("heatmap");
  expect(trace.zLen, "8 heatmap rows").toBe(8);
  expect(trace.rowLens, "every row spans all 8 columns").toEqual(Array(8).fill(8));
  expect(trace.x, "x ticks are the 8 inputs").toEqual([...vars]);
  expect(trace.y, "y ticks are the 8 inputs").toEqual([...vars]);

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
