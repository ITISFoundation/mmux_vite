import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  expectNoSeriousViolations,
  fetchJson,
  resetPersistence,
  setDeployment,
  expectModelModalReady,
  fillUniformInputRanges,
  expectPlotlyReady,
  downloadAndParseJson,
} from "./helpers";

// The mock function's input schema (mock_osparc/data.py) — the download payload
// keys are asserted against it without hard-coding which QoI is selected.
const INPUT_VARS = ["x1", "x2", "x3", "x4"];

// 21 points per swept variable is the itis_sumo default (points_per_variable in
// api/workflows.py, carried through evaluate/funs_evaluate.py as NSAMPLESPERVAR),
// so these point counts are guaranteed by backend code, not by static mock data.
const CURVE_POINTS = 21;
const GRID_2D_POINTS = CURVE_POINTS * CURVE_POINTS; // 441
const GRID_3D_POINTS = CURVE_POINTS * CURVE_POINTS * CURVE_POINTS; // 9261

/**
 * SuMo READ-ONLY behavioral + pixel-snapshot suite (§T11 / §V10,§V13).
 *
 * Exercises the deterministic local stack: the live Flask backend with the
 * in-backend oSPARC test-double (§T9, gated by MMUX_E2E_MOCK_OSPARC) behind the
 * vite /flask proxy (§T10). The mock exposes exactly one function
 * (`func-sumo-readonly-e2e`) with deterministic SUCCESS jobs, so the flow is
 * fully deterministic and needs no grid pagination search.
 *
 * The whole suite (SuMo/UQ/MOGA) shares one backend boot whose SERVICE_MODE is
 * switched per-spec via the test-only control endpoint (§T13), so each spec
 * pins its own mode up front to stay order-independent.
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed. Screenshots capture
 * the full 1920x1080 viewport with the real (unmasked) Plotly render: the mock
 * data and surrogate are fully deterministic, so the plot is reproducible in
 * the pinned image and a masked-out plot would defeat the pixel comparison.
 *
 * The view-scoped accessibility scans (root §V42rb) run INSIDE this flow (§T47mx):
 * each scanned view is the one the flow already rendered, so one navigation serves
 * both the pixel baseline and the axe scan instead of a second spec driving the
 * same flow from scratch. Every scan sits AFTER that view's `toHaveScreenshot`
 * (axe mutates the live document; a scan must never precede a pixel capture).
 */

test("SuMo read-only response-surface flow renders validation view", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: SuMo service in READ-ONLY mode, served by the test-double.
  await setDeployment(page.request, url, "SUMO", "READ-ONLY");
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
  // Accessibility: function-list/setup view (§V42rb — folded in from a11y.spec.ts, §T47mx).
  await expectNoSeriousViolations(page);

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // The input-range configuration opens once a function is selected.
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);

  // Pixel baseline: function selected, input ranges configured and open.
  await expect(page).toHaveScreenshot("sumo-readonly-inputs.png");
  // Accessibility: configured input-range blocks (the state the old standalone scan
  // reached after fillUniformInputRanges — identical DOM, one navigation cheaper).
  await expectNoSeriousViolations(page);

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

  // Post-QoI-refactor flow: the response-surface stepper starts at 1D Curves,
  // validation lives in the Inspect Model modal, and the adapt/extend sampling
  // control sits at the view footer.
  const qoiSelect = page.locator('[mmux-testid="sumo-plot-qoi-select"]');
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.getByText("1D Curves", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);

  // Pixel baseline: the 1D Curves plot with the real Plotly render (deterministic
  // mock surrogate, unmasked).
  await expect(page).toHaveScreenshot("sumo-readonly-plot-1d.png");
  // Accessibility: the results view itself (V42rb "results views"; the standalone
  // a11y spec only ever reached this view for UQ/MOGA).
  await expectNoSeriousViolations(page);

  // Pixel baseline: the same 1D curves on the log DISPLAY scale (per-panel toggle,
  // B53kq; all mock predictions are strictly positive ⇒ LOG enabled). Toggle back
  // so later baselines keep the default display.
  const scale1d = page.locator('[mmux-testid="sumo-1d-display-scale"]');
  await scale1d.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("sumo-readonly-plot-1d-log.png");
  await scale1d.getByRole("button", { name: "linear" }).click();

  // Raw-data download button (T30ln(b) replay, fork issue #79; root V36ez):
  // behavioral witness via the mmux-testid + exact payload shape below, pixel
  // witness via the dedicated element baseline. The mock backend is
  // deterministic, so every swept axis carries exactly CURVE_POINTS samples.
  const curveDownload = (await downloadAndParseJson(
    page,
    "download-curves1d-data-btn",
    "curves1d-y-vs-x1.json",
  )) as {
    predictions: Record<string, { x: number[]; yHat: number[]; stdHat: number[] }>;
  };
  expect(Object.keys(curveDownload.predictions).sort()).toEqual([...INPUT_VARS].sort());
  for (const varName of INPUT_VARS) {
    const axisData = curveDownload.predictions[varName];
    expect(axisData.x, `${varName}.x length`).toHaveLength(CURVE_POINTS);
    expect(axisData.yHat, `${varName}.yHat length`).toHaveLength(CURVE_POINTS);
    expect(axisData.stdHat, `${varName}.stdHat length`).toHaveLength(CURVE_POINTS);
  }
  await expect(page.locator('[mmux-testid="download-curves1d-data-btn"]')).toHaveScreenshot(
    "sumo-readonly-download-1d-btn.png",
  );

  // Inspect Model opens the cross-validation modal. Pixel baseline captures the
  // modal over the results view (full viewport, unmasked).
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();
  const modal = await expectModelModalReady(page);
  const validationView = page.locator('[mmux-testid="sumo-validation-view"]');
  await expect(validationView.getByText("MAE:")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(validationView.getByText("RMSE:")).toBeVisible({ timeout: VIEW_TIMEOUT });

  // READ-ONLY invariant (§V13): the extend-sampling control stays disabled.
  const extendSampling = page.locator('[mmux-testid="extend-sampling-btn"]');
  await expect(extendSampling).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(extendSampling).toBeDisabled();

  await expect(page).toHaveScreenshot("sumo-readonly-validation.png");
  // Accessibility: the cross-validation modal over the results view (the state the old
  // standalone scan asserted — MAE visible — then scanned).
  await expectNoSeriousViolations(page);

  // Pixel baseline: the SAME validation view on the log DISPLAY scale (display-only
  // toggle). Every mock job value is strictly positive (y ∈ [1.325, 9.95]), so LOG
  // is enabled here — unlike the UQ histogram, whose synthesized bins span negative
  // values and where the toggle is disabled by the V-invariant unit test.
  const validationScale = validationView.locator('[mmux-testid="sumo-validation-display-scale"]');
  await validationScale.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("sumo-readonly-validation-log.png");
  await validationScale.getByRole("button", { name: "linear" }).click();

  // Raw-data download inside the validation modal (T53st sweep, fork issue #79; root V36ez):
  // {observed, predicted} is the CV response behind BOTH the violins and the MAE/RMSE metrics —
  // the chip lives bottom-right because the in-plot legend pins the top-right corner here.
  const cvDownload = (await downloadAndParseJson(
    page,
    "download-validation-data-btn",
    "sumo-validation-y.json",
  )) as { observed: number[]; predicted: number[] };
  expect(cvDownload.observed.length, "observed samples present").toBeGreaterThan(0);
  expect(cvDownload.predicted, "predicted length mirrors observed").toHaveLength(cvDownload.observed.length);
  cvDownload.observed.forEach((value, i) => {
    expect(Number.isFinite(value), `observed[${i}] finite`).toBe(true);
    expect(Number.isFinite(cvDownload.predicted[i]), `predicted[${i}] finite`).toBe(true);
    // The surrogate interpolates the deterministic mock samples almost exactly (the metrics row
    // shows MAE ~1e-10), so predictions must track observations.
    expect(cvDownload.predicted[i], `predicted[${i}] tracks observed[${i}]`).toBeCloseTo(value, 1);
  });
  await expect(page.locator('[mmux-testid="download-validation-data-btn"]')).toHaveScreenshot(
    "sumo-readonly-download-validation-btn.png",
  );

  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });

  // Walk the remaining SuMo response-surface stepper (1D → 2D → 3D). The
  // MobileStepper's Next button carries mmux-testid="sumo-plot-next".
  // The mock exposes 4 inputs, so the 2D (≥2 inputs) and 3D (≥3 inputs) steps are
  // both reachable, and the input ranges match the training domain so each surrogate
  // renders a real (deterministic) Plotly figure rather than an extrapolation artifact.
  const plotNext = page.locator('[mmux-testid="sumo-plot-next"]');

  // Step 2 — 2D Surface.
  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("2D Surface", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("sumo-readonly-plot-2d.png");

  // Pixel baseline: log DISPLAY on the SURFACE COLORBAR — the 3D `surface` trace
  // scales color linearly in z, so the log view paints log10(z) with power-of-10
  // ticks (B53kq). Toggle back afterwards.
  const scale2d = page.locator('[mmux-testid="sumo-2d-display-scale"]');
  await scale2d.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("sumo-readonly-plot-2d-log.png");
  await scale2d.getByRole("button", { name: "linear" }).click();

  // 2D raw-data download (root V36ez witness): every input array is broadcast
  // to the full flattened grid (held vars at their slider values), while the
  // selected QoI "y" comes back as the nested 21x21 z-grid (Surface2DPaint
  // reshapes it as z[y][x]).
  const surface2dDownload = (await downloadAndParseJson(
    page,
    "download-surface2d-data-btn",
    "surface2d-y-x1-x2.json",
  )) as { gridData: Record<string, number[] | number[][]> };
  for (const varName of INPUT_VARS) {
    expect(surface2dDownload.gridData[varName], `${varName} length`).toHaveLength(GRID_2D_POINTS);
  }
  const qoiGrid2d = surface2dDownload.gridData["y"] as number[][];
  expect(qoiGrid2d, "QoI grid is a nested 21x21 array").toHaveLength(CURVE_POINTS);
  expect(qoiGrid2d[0], "QoI grid row length").toHaveLength(CURVE_POINTS);
  await expect(page.locator('[mmux-testid="download-surface2d-data-btn"]')).toHaveScreenshot(
    "sumo-readonly-download-2d-btn.png",
  );

  // Step 3 — 3D IsoSurface.
  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("3D IsoSurface", { exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("sumo-readonly-plot-3d.png");

  // Pixel baseline: log DISPLAY on the ISOSURFACE value/colorbar (B53kq).
  const scale3d = page.locator('[mmux-testid="sumo-3d-display-scale"]');
  await scale3d.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("sumo-readonly-plot-3d-log.png");
  await scale3d.getByRole("button", { name: "linear" }).click();

  // 3D raw-data download (root V36ez witness): flat 21³ = 9261-point volume
  // grids for every input AND for the selected QoI "y".
  const surface3dDownload = (await downloadAndParseJson(
    page,
    "download-isosurface3d-data-btn",
    "isosurface3d-y-x1-x2-x3.json",
  )) as { gridData: Record<string, number[]> };
  for (const varName of [...INPUT_VARS, "y"]) {
    expect(surface3dDownload.gridData[varName], `${varName} length`).toHaveLength(GRID_3D_POINTS);
  }
  await expect(page.locator('[mmux-testid="download-isosurface3d-data-btn"]')).toHaveScreenshot(
    "sumo-readonly-download-3d-btn.png",
  );

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
