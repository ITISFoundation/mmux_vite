import { test, expect } from "./coverage";
import {
  FUNCTION_UID,
  MODEL_READY_TIMEOUT,
  VIEW_TIMEOUT,
  expectModelModalReady,
  expectPlotlyReady,
  expectMogaPerformanceComputed,
  fillNormalDistributions,
  fillUniformInputRanges,
  resetMockOsparc,
  resetPersistence,
  setDeployment,
  trackPageErrors,
} from "./helpers";

/**
 * V36ez interactive-control coverage (fork issue JavierGOrdonnez/mmux_vite#83).
 *
 * The read-only pixel suites (sumo/uq/moga-readonly) snapshot the FLOW; this
 * spec targets the controls they reach but never TRIGGER: the Sobol'/correlation
 * toggle families, `refresh-job-collections-btn`, `previous-button`, the
 * add/confirm-output modal, the surrogate-scale toggle + provenance chip, the
 * WRITE-mode sampling panel (extend → refresh → new campaign → LHS inputs →
 * Run), the validation modal's disabled stepper + QoI selector, the per-axis
 * Pareto display toggles beyond 1D, and MOGAModal's duplicated `input-block`
 * fields (behind the new `moga-settings-button` testid).
 *
 * Every interactive control asserted here pairs an assertion on its TRIGGERED
 * state (aria-pressed / value / visibility after the click) with a baseline
 * capturing that state (root §V36ez), regenerated ONLY in the pinned Playwright
 * image (§V12, `make test-e2e-update-docker`).
 *
 * Timeout: one backend boot serializes every Dakota computation behind workers:1
 * and each test chains a full setup flow PLUS extra toggled renders (T3
 * additionally runs a 3-objective MOGA optimization) — 2.5× the 120s global.
 */

test.describe.configure({ timeout: 300_000 });

test("UQ correlation/sobol toggles, back-navigation and the distribution selector land in their triggered state", async ({
  page,
  baseURL,
}) => {
  const url = baseURL!;
  const pageErrors = trackPageErrors(page);

  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  await page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`).click();
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Mean"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillNormalDistributions(page);

  // Footer previous-button: disabled on the setup view, triggered → enabled after Next.
  const previousButton = page.locator('[mmux-testid="previous-button"]');
  await expect(previousButton).toBeDisabled({ timeout: VIEW_TIMEOUT });

  await page.locator('[mmux-testid="next-button"]').click();
  const creatingModel = page.getByText("Creating AI model...");
  if (
    await creatingModel
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }
  await expect(page.locator('[mmux-testid="uq-plot-qoi-select"]')).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);

  // --- Correlation step: view (Pearson|Spearman) and scale (Linear|abs-Log) groups.
  await page.locator('[mmux-testid="uq-plot-next"]').click();
  await expect(page.getByText("Sensitivity / Correlation Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);

  await expect(page.locator('[mmux-testid="correlation-view-toggle"]')).toBeVisible();
  await expect(page.locator('[mmux-testid="correlation-toggle-pearson"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[mmux-testid="correlation-toggle-spearman"]').click();
  await expect(page.locator('[mmux-testid="correlation-toggle-spearman"]')).toHaveAttribute("aria-pressed", "true");
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("interactive-uq-correlation-spearman.png");
  await page.locator('[mmux-testid="correlation-toggle-pearson"]').click();
  await expect(page.locator('[mmux-testid="correlation-toggle-pearson"]')).toHaveAttribute("aria-pressed", "true");

  // Scale default is abslog; Linear is the triggered state.
  await expect(page.locator('[mmux-testid="correlation-scale-abslog"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[mmux-testid="correlation-scale-linear"]').click();
  await expect(page.locator('[mmux-testid="correlation-scale-linear"]')).toHaveAttribute("aria-pressed", "true");
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("interactive-uq-correlation-linear.png");
  await page.locator('[mmux-testid="correlation-scale-abslog"]').click();

  // --- Sobol' step: order (First|Second|Total) and scale (Linear|Log) groups.
  await page.locator('[mmux-testid="uq-plot-next"]').click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(page);

  await expect(page.locator('[mmux-testid="sobol-view-toggle"]')).toBeVisible();
  await expect(page.locator('[mmux-testid="sobol-toggle-first"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[mmux-testid="sobol-toggle-total"]').click();
  await expect(page.locator('[mmux-testid="sobol-toggle-total"]')).toHaveAttribute("aria-pressed", "true");
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("interactive-uq-sobol-total.png");

  await page.locator('[mmux-testid="sobol-toggle-second"]').click();
  await expect(page.locator('[mmux-testid="sobol-toggle-second"]')).toHaveAttribute("aria-pressed", "true");
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("interactive-uq-sobol-second.png");
  await page.locator('[mmux-testid="sobol-toggle-first"]').click();

  // Scale default is log; Linear is the triggered state.
  await expect(page.locator('[mmux-testid="sobol-scale-log"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[mmux-testid="sobol-scale-linear"]').click();
  await expect(page.locator('[mmux-testid="sobol-scale-linear"]')).toHaveAttribute("aria-pressed", "true");
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("interactive-uq-sobol-linear.png");
  await page.locator('[mmux-testid="sobol-scale-log"]').click();

  // --- Back-navigation (uq-plot-back ×2) returns to the histogram view.
  const plotBack = page.locator('[mmux-testid="uq-plot-back"]');
  for (let step = 0; step < 2; step += 1) {
    await expect(plotBack).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotBack.click();
  }
  await expect(page.getByText("Uncertainty Quantification Histogram")).toBeVisible({ timeout: VIEW_TIMEOUT });

  // --- Footer previous-button triggered state: results → setup view.
  await expect(previousButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await previousButton.click();
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Mean"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  // Let the async QoI scale auto-detect settle before pixel-locking: mounting the
  // setup view commits the surrogate cards' `auto` provenance chips (+ the y4 LOG
  // pick, y4 being strictly positive) in a late pass — capturing before that
  // commits pixel-locks a stale frame whose later re-render the verifier counts
  // as a real diff (observed 2026-10-15 as a regen↔verify flake on this shot).
  await expect(page.locator('[mmux-testid="surrogate-scale-provenance-y4"]')).toHaveText("auto", {
    timeout: VIEW_TIMEOUT,
  });
  await expect(page).toHaveScreenshot("interactive-uq-setup-returned.png");

  // --- Distribution-form selector triggered state: Normal → Uniform on x1 swaps
  // Mean/Std for Min/Max blocks (the selector switch the pixel suites never perform).
  const x1Box = page.locator('[mmux-testid="input-var-box-0"]');
  const x1Selector = x1Box.locator('[mmux-testid="input-var-x1-distribution-selector"]');
  await expect(x1Selector).toBeVisible({ timeout: VIEW_TIMEOUT });
  await x1Selector.click();
  await page.getByRole("option", { name: "Uniform", exact: true }).click();
  await expect(x1Box.locator('[mmux-testid="input-block-x1-Min"] input')).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(x1Box.locator('[mmux-testid="input-block-x1-Mean"]')).toHaveCount(0);
  await expect(x1Selector).toContainText("Uniform");
  await expect(x1Box).toHaveScreenshot("interactive-dist-x1-uniform.png");

  // Restore Normal so a later run starting from this persisted state is unchanged.
  await x1Selector.click();
  await page.getByRole("option", { name: "Normal (Gaussian)", exact: true }).click();
  await expect(x1Box.locator('[mmux-testid="input-block-x1-Mean"] input')).toBeVisible({ timeout: VIEW_TIMEOUT });

  expect(pageErrors, `JavaScript errors captured: ${pageErrors.join("\n")}`).toEqual([]);
});

test("WRITE-mode sampling controls: extend panel, refresh, campaign, LHS inputs and Run reach their triggered state", async ({
  page,
  baseURL,
}) => {
  const url = baseURL!;
  const pageErrors = trackPageErrors(page);

  await resetMockOsparc(page.request, url);
  await setDeployment(page.request, url, "SUMO", "WRITE");
  await resetPersistence(page.request, url);
  try {
    await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
    await page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`).click();
    await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Min"] input').first()).toBeVisible({
      timeout: VIEW_TIMEOUT,
    });
    await fillUniformInputRanges(page);
    await page.locator('[mmux-testid="next-button"]').click();
    await expect(page.getByText("1D Curves", { exact: true }).first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
    await expectPlotlyReady(page);

    // --- Validation modal: single-step stepper + QoI selector.
    const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
    await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
    await inspectButton.click();
    const modal = await expectModelModalReady(page);

    // The modal is one step today ⇒ both stepper buttons render DISABLED. Pin the
    // contract (a future step must consciously change these assertions).
    await expect(page.locator('[mmux-testid="validation-plot-next"]')).toBeDisabled();
    await expect(page.locator('[mmux-testid="validation-plot-back"]')).toBeDisabled();

    // QoI selector triggered state: dropdown open over the four mock outputs,
    // selection untouched (Escape closes the menu, not the modal).
    const validationQoi = page.locator('[mmux-testid="validation-qoi-select"]');
    await expect(validationQoi).toContainText("y");
    await validationQoi.click();
    await expect(page.getByRole("option", { name: "y2", exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.getByRole("option", { name: "y4", exact: true })).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page).toHaveScreenshot("interactive-validation-qoi-open.png");
    await page.keyboard.press("Escape");
    await expect(validationQoi).toContainText("y");

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });

    // --- Extend-sampling panel opened (WRITE gate): refresh + new-campaign visible.
    const extendSampling = page.locator('[mmux-testid="extend-sampling-btn"]');
    await expect(extendSampling).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
    await extendSampling.click();
    const refreshButton = page.locator('[mmux-testid="refresh-job-collections-btn"]');
    await expect(refreshButton).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.locator('[mmux-testid="new-sampling-campaign-btn"]')).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.getByText("E2E SuMo job collection")).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page).toHaveScreenshot("interactive-sampling-panel-open.png");

    // Refresh icon-button triggered state: a forced refetch completes and the
    // table still holds the mock collection.
    const refetched = page.waitForResponse(response => response.url().includes("list_function_job_collections_for_functionid"));
    await refreshButton.click();
    expect((await refetched).ok(), "forced job-collection refetch succeeded").toBeTruthy();
    await expect(page.getByText("E2E SuMo job collection")).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.locator('[role="grid"]').first()).toHaveScreenshot("interactive-job-collections-refreshed.png");

    // --- New sampling campaign accordion → LHS form.
    await page.locator('[mmux-testid="new-sampling-campaign-btn"]').click();
    await expect(page.getByText("Latin Hypercube Sampling")).toBeVisible({ timeout: VIEW_TIMEOUT });

    const lhsPoints = page.locator('[mmux-testid="lhs-number-of-sampling-points-input"] input');
    await lhsPoints.fill("12");
    await lhsPoints.press("Tab");
    await expect(lhsPoints).toHaveValue("12");
    const lhsSeed = page.locator('[mmux-testid="lhs-seed-input"] input');
    await lhsSeed.fill("7");
    await lhsSeed.press("Tab");
    await expect(lhsSeed).toHaveValue("7");
    // Deterministic pixel-lock: this panel sits deep in a page whose async plot
    // re-layouts + skeleton remounts keep moving the viewport (page shots here
    // raced regen↔verify on 2026-10-15). An ELEMENT shot of the LHS tab panel
    // scrolls itself into view — page scroll offset and the plots above can no
    // longer shift the frame — and the configured 12/7 inputs + Run button all
    // sit INSIDE the captured element.
    await expect(page.locator("#simple-tabpanel-0")).toHaveScreenshot("interactive-lhs-configured.png");

    // Run triggered state: campaign completes, its collection appears, Run is a
    // plain enabled "Run" again (no stuck spinner).
    const runButton = page.locator('[mmux-testid="run-sampling-btn"]').first();
    await expect(runButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
    const runResponse = page.waitForResponse(response => response.url().includes("/flask/sampling/lhs"));
    await runButton.click();
    expect((await runResponse).status()).toBe(200);
    await expect(page.getByText("E2E created collection 1")).toBeVisible({ timeout: VIEW_TIMEOUT });
    await expect(page.getByText("Error running LHS sampling", { exact: false })).toHaveCount(0);
    await expect(runButton).toHaveText("Run");
    await expect(runButton).toBeEnabled();
    // New jobs make the response-surface plots recompute — let that settle so the
    // baseline captures a stable table+plot, never a spinner or mid-refetch frame.
    const jobsLoading = page.locator('[mmux-testid="jobs-loading"]');
    if (
      await jobsLoading
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await jobsLoading.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
    }
    await expectPlotlyReady(page);
    // Element-scoped like the refreshed grid above: the run-complete state IS the
    // collections table gaining its second row — page-level scroll here is moved
    // by the async recompute and cannot be pixel-locked.
    await expect(page.locator('[role="grid"]').first()).toHaveScreenshot("interactive-sampling-run-complete.png");

    expect(pageErrors, `JavaScript errors captured: ${pageErrors.join("\n")}`).toEqual([]);
  } finally {
    await resetMockOsparc(page.request, url);
  }
});

test("MOGA confirm controls, surrogate-scale lock, 3-objective x/z log toggles and Optimization Settings land in their triggered state", async ({
  page,
  baseURL,
}) => {
  const url = baseURL!;
  const pageErrors = trackPageErrors(page);

  await setDeployment(page.request, url, "MOGA", "READ-ONLY");
  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });

  await page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`).click();
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Min"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillUniformInputRanges(page);

  // Add-output → confirm modal (the triggered state of the + icon button).
  const addOutputButton = page.locator('[mmux-testid="add-output-var-btn"]');
  await expect(addOutputButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await addOutputButton.click();
  await expect(page.getByText("Add Output Variable")).toBeVisible({ timeout: VIEW_TIMEOUT });
  const confirmButton = page.locator('[mmux-testid="confirm-add-output-btn"]');
  await expect(confirmButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page).toHaveScreenshot("interactive-add-output-modal.png");
  await confirmButton.click();
  await expect(confirmButton).toBeHidden({ timeout: VIEW_TIMEOUT });
  // Default pick is the first unconfigured output → y.
  await expect(page.locator('[mmux-testid="surrogate-scale-y"]')).toBeVisible({ timeout: VIEW_TIMEOUT });

  // Surrogate-scale toggle triggered state: LOG locks the compute scale and the
  // provenance chip flips to "manual".
  const surrogateScaleY = page.locator('[mmux-testid="surrogate-scale-y"]');
  await surrogateScaleY.getByRole("button", { name: "log" }).click();
  await expect(page.locator('[mmux-testid="surrogate-scale-provenance-y"]')).toHaveText("manual");
  await expect(surrogateScaleY).toHaveScreenshot("interactive-surrogate-scale-manual.png");
  await surrogateScaleY.getByRole("button", { name: "linear" }).click();

  // Two more objectives: y2 (modal default) and y4 (explicit pick — y3 = sin+cos
  // dips negative and its LOG gate must stay CLOSED, so the 3rd target is the
  // strictly-positive y4). 3 targets ⇒ the 3D Pareto view, the ONLY place the
  // x and z per-objective display toggles render.
  await addOutputButton.click();
  await confirmButton.click();
  await expect(page.locator('[mmux-testid="surrogate-scale-y2"]')).toBeVisible({ timeout: VIEW_TIMEOUT });
  await addOutputButton.click();
  // The modal's single Select (scoped to the one open MUI Modal): pick y4 over y3.
  const addModalSelect = page.locator(".MuiModal-root .MuiSelect-select");
  await expect(addModalSelect).toHaveCount(1);
  await addModalSelect.click();
  await page.getByRole("option", { name: "y4", exact: true }).click();
  await confirmButton.click();
  await expect(page.locator('[mmux-testid="surrogate-scale-y4"]')).toBeVisible({ timeout: VIEW_TIMEOUT });

  await page.locator('[mmux-testid="next-button"]').click();
  const creatingModel = page.getByText("Creating AI model...");
  if (
    await creatingModel
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }
  const paretoView = page.locator('[mmux-testid="moga-pareto-plot"]');
  await expect(paretoView).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(paretoView, 300_000);
  // B62wp guard: the table only has rows once the {optimizationResults} envelope
  // is unwrapped (V53wp) — the pre-fix wire shape left it silently empty.
  await expect(page.getByText("No rows")).toHaveCount(0);
  // Rows existing ≠ settled: the Performance column re-renders once weights are
  // synthesized and the parent recomputes the score (B63px) — gate before the
  // full-page baselines (§V10 zero diff).
  await expectMogaPerformanceComputed(page);
  await expect(page).toHaveScreenshot("interactive-moga-pareto-2d.png");

  // Row-level Run buttons exist in the Pareto table and are permission-gated OFF
  // in READ-ONLY (§V13).
  const rowRunButtons = page.locator('[mmux-testid^="run-sampling-btn-"]');
  expect(await rowRunButtons.count(), "Pareto table renders row Run buttons").toBeGreaterThan(0);
  await expect(rowRunButtons.first()).toBeDisabled();

  // 3D view via the PLOT SETTINGS modal — the only path that raises the
  // dimension (updatePlot never self-promotes past 2D) and thereby renders the
  // per-objective z toggle. Axis selects keep their defaults (X=y, Y=y2, Z=y4).
  await page.getByRole("button", { name: "Plot Settings" }).click();
  const plotModal = page.locator(".MuiModal-root");
  // NOTE: exact:true — the toggle options live inside a labeled group, so the
  // FIRST option's accessible name is "Plot Dimension Type: 2D 3D" and a
  // substring match on "3D" resolves to 2 buttons in strict mode.
  await plotModal.getByRole("button", { name: "3D", exact: true }).click();
  await plotModal.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(plotModal).toHaveCount(0, { timeout: VIEW_TIMEOUT });
  await expectPlotlyReady(paretoView, 300_000);
  await expect(page).toHaveScreenshot("interactive-moga-pareto-3d.png");

  // x-axis log (objective y) and z-axis log (objective y4) — both axes strictly
  // positive ⇒ the gates open; toggle back after each baseline.
  const paretoX = page.locator('[mmux-testid="moga-pareto-display-scale-x"]');
  await expect(paretoX).toBeVisible({ timeout: VIEW_TIMEOUT });
  await paretoX.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("interactive-moga-pareto-x-log.png");
  await paretoX.getByRole("button", { name: "linear" }).click();

  const paretoZ = page.locator('[mmux-testid="moga-pareto-display-scale-z"]');
  await expect(paretoZ).toBeVisible({ timeout: VIEW_TIMEOUT });
  await paretoZ.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("interactive-moga-pareto-z-log.png");
  await paretoZ.getByRole("button", { name: "linear" }).click();

  // Optimization Settings modal (new `moga-settings-button` testid): the four
  // duplicated `input-block` fields become assertable/screenshot-able.
  const settingsButton = page.locator('[mmux-testid="moga-settings-button"]');
  await expect(settingsButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await settingsButton.click();
  await expect(page.getByText("Optimization Configuration")).toBeVisible({ timeout: VIEW_TIMEOUT });
  expect(
    await page.locator('[mmux-testid="input-block"]').count(),
    "MOGAModal renders its four settings fields under the shared input-block testid",
  ).toBe(4);
  await expect(page.getByRole("button", { name: "Apply" })).toBeEnabled();
  await expect(page).toHaveScreenshot("interactive-moga-settings-modal.png");
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.locator('[mmux-testid="input-block"]')).toHaveCount(0, { timeout: VIEW_TIMEOUT });

  expect(pageErrors, `JavaScript errors captured: ${pageErrors.join("\n")}`).toEqual([]);
});
