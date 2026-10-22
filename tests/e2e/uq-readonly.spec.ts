import { test, expect } from "./coverage";
// Type-only from the runner itself: ./coverage exports the configured `test`
// and `expect`, not the runner's types (same pattern as helpers.ts).
import type { Page } from "@playwright/test";
import {
  FUNCTION_UID,
  VIEW_TIMEOUT,
  MODEL_READY_TIMEOUT,
  expectNoSeriousViolations,
  fetchJson,
  resetPersistence,
  setDeployment,
  fillNormalDistributions,
  expectModelModalReady,
  expectPlotlyReady,
} from "./helpers";

/**
 * UQ (Uncertainty Quantification) READ-ONLY behavioral + pixel-snapshot suite
 * (§T12 / §V14).
 *
 * Shares the deterministic local stack and the single backend boot with the
 * SuMo/MOGA specs; SERVICE_MODE is switched to UQ up front via the test-only
 * control endpoint (§T13) so the spec is order-independent. UQ inputs use a
 * NORMAL distribution (Mean / Std), and the histogram is driven by the mock
 * jobs' `<qoi>_std_hat` outputs (present on the job payloads but absent from the
 * output schema, so the QoI dropdown stays unchanged).
 *
 * Also exercises the "Inspect Model" SuMo modal, which previously failed to open
 * because the MUI Modal child was a non-ref-forwarding function component, and the
 * "UQ Settings" icon button (§V36 — every interactive element gets its own
 * e2e test + regression screenshot).
 *
 * Two additions landed here with root §T47mx:
 *  1. the view-scoped axe scans (§V42rb) run on the views this flow already renders,
 *     each one AFTER that view's `toHaveScreenshot` (axe mutates the live document, so a
 *     scan must never precede a pixel capture);
 *  2. every propagation the flow triggers uses an EXPLICIT numSamples typed into the
 *     UQ Settings modal (never the 10 000 default), and two of those launches are
 *     deliberately delivered OUT OF ORDER to pin node §V45gd at the HTTP layer.
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed.
 */

// The endpoint whose response ordering this spec forces (flaskapi
// `POST /flask/dakota/manual_uq_propagation_with_uncertainty`).
const UQ_PROPAGATION_PATTERN = "**/flask/dakota/manual_uq_propagation_with_uncertainty";

// Explicit sample budgets (§T47mx): both far below the 10 000 default, so the serialized
// e2e engine (one flask process; Dakota calls queue behind ENGINE_LOCK — flaskapi V49ad,
// irrelevant to this HTTP-layer ordering assertion but real for wall clock) stays quick.
const UQ_SAMPLES_STALE = 800; // run #1 — its HTTP response is HELD until run #2 has landed
const UQ_SAMPLES_LATEST = 1200; // run #2 — the payload that must stay on screen

/** The four headline stats the UQ card paints, as the UI renders them (Metric: toPrecision(4)). */
type RenderedUQStats = { Mean: string; Std: string; Min: string; Max: string };
const STAT_NAMES = ["Mean", "Std", "Min", "Max"] as const;

const renderNumber = (value: number) => value.toPrecision(4);

/**
 * Open UQ Settings, TYPE the sample count, Save. The real control (§T47mx): the flow
 * never trusts the 10 000 default, and saving is what re-fires the propagation.
 */
async function setUQNumSamples(page: Page, numSamples: number): Promise<void> {
  await page.locator('[mmux-testid="uq-settings-button"]').click();
  const modal = page.locator('[mmux-testid="uq-settings-modal"]');
  await expect(modal).toBeVisible({ timeout: VIEW_TIMEOUT });
  await modal.getByLabel("Number of UQ Samples").fill(String(numSamples));
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });
}

/** Read the stats row the UQ card currently displays. */
async function displayedUQStats(page: Page): Promise<RenderedUQStats> {
  const text = await page.locator('[mmux-testid="uq-histogram-stats"]').innerText();
  const read = (name: string) => {
    const match = new RegExp(`${name}:\\s*(\\S+)`).exec(text);
    expect(match, `UQ stats row shows no "${name}" metric in: ${JSON.stringify(text)}`).not.toBeNull();
    return (match as RegExpExecArray)[1];
  };
  return Object.fromEntries(STAT_NAMES.map(name => [name, read(name)])) as RenderedUQStats;
}

test("UQ read-only propagation flow renders histogram and inspect-model modal", async ({ page, baseURL }) => {
  const url = baseURL!;
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Backend contract: UQ service in READ-ONLY mode, served by the test-double.
  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  const health = await page.request.get(`${url}/flask/deployment/health`);
  expect(health.ok(), `health → ${health.status()}`).toBeTruthy();
  const serviceMode = await fetchJson(page.request, `${url}/flask/deployment/service-mode`);
  expect(serviceMode.serviceMode).toBe("UQ");
  const permissions = await fetchJson(page.request, `${url}/flask/deployment/permissions`);
  expect(permissions.permissions).toBe("READ-ONLY");

  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  // Pixel baseline: the function-selection setup grid (full 1920x1080 viewport).
  await expect(page).toHaveScreenshot("uq-readonly-setup.png");
  // Accessibility: function-list/setup view (§V42rb — folded in from a11y.spec.ts, §T47mx).
  await expectNoSeriousViolations(page);

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  // UQ uses a normal distribution: Mean / Standard Deviation blocks open once a
  // function is selected.
  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Mean"] input').first()).toBeVisible({
    timeout: VIEW_TIMEOUT,
  });
  await fillNormalDistributions(page);

  // Pixel baseline: function selected, parameter distributions configured.
  await expect(page).toHaveScreenshot("uq-readonly-inputs.png");
  // Accessibility: configured Mean/Std distribution blocks (the state the old standalone
  // scan reached after fillNormalDistributions — identical DOM, one navigation cheaper).
  await expectNoSeriousViolations(page);

  const nextButton = page.locator('[mmux-testid="next-button"]');
  await expect(nextButton).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await nextButton.click();

  const creatingModel = page.getByText("Creating AI model...");
  if (await creatingModel.first().isVisible().catch(() => false)) {
    await creatingModel.first().waitFor({ state: "hidden", timeout: MODEL_READY_TIMEOUT });
  }

  // UQ output setup: QoI selector + Inspect Model button.
  const qoiSelect = page.locator('[mmux-testid="uq-plot-qoi-select"]');
  await expect(qoiSelect).toBeVisible({ timeout: VIEW_TIMEOUT });
  const inspectButton = page.locator('[mmux-testid="inspect-model-button"]');
  await expect(inspectButton).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The UQ histogram renders once propagation over the mock jobs completes. This first
  // propagation is the untouched default (fresh persistence carries no uqSettings) — the
  // flow keeps it (it is the state the results-view scan sees) and then re-runs with
  // counts typed into the settings modal, so nothing downstream trusts the default.
  await expectPlotlyReady(page);
  // Accessibility: the UQ histogram results view (§V42rb "results views").
  await expectNoSeriousViolations(page);

  // ── Out-of-order response guard (root §T47mx, pinning node §V45gd) ──────────────
  //
  // Contract under test: when the endpoint answers an OLD request AFTER a newer one has
  // already painted, the stale payload must NOT clobber the newer plot — UncertainUQ
  // commits state only from its newest generation (useGuardedAsyncEffect). Removing that
  // guard must redden this test, not slip through.
  //
  // The ordering is forced at the HTTP layer, so it is deterministic by construction and
  // ⊥ dependent on engine timing: the handler holds run #1's response until run #2's has
  // been delivered to the page. (The backend itself serializes Dakota runs on ENGINE_LOCK
  // — flaskapi V49ad — so run #1's COMPUTE really does finish first; this test is about
  // the HTTP/FE layer on top of that.)
  //
  // B37kl ("a test that can only pass is worthless"): the handler records both response
  // payloads, and the test first PROVES they differ at the precision the card renders —
  // only then does comparing the painted stats against run #2's payload have the power to
  // fail. It also awaits run #1's late landing BEFORE reading the card, so the assertion
  // cannot pass merely because the stale response never arrived.
  //
  // Forward-compat note: with the single-flight dedupe planned in PR #754 the two
  // launches must DIFFER, else run #2 would join run #1's request instead of issuing its
  // own — they do, because the payloads carry different numSamples (node V46sc puts the
  // whole body in the cache key). If a future change instead ABORTS the superseded
  // request, this test must be re-designed at that point: it pins "a late response is
  // discarded", which is a different property from "no late response is ever sent".
  const delivered = new Map<number, RenderedUQStats>();
  const landed = new Set<number>();
  let letStaleResponseLand = () => {};
  const staleResponseMayLand = new Promise<void>(resolve => {
    letStaleResponseLand = resolve;
  });

  await page.route(UQ_PROPAGATION_PATTERN, async route => {
    const requested = JSON.parse(route.request().postData() ?? "{}") as { numSamples?: number };
    const numSamples = requested.numSamples;
    if (numSamples !== UQ_SAMPLES_STALE && numSamples !== UQ_SAMPLES_LATEST) {
      // Every other propagation in this spec (the default one, the y4 re-run) passes through.
      return route.continue();
    }

    const response = await route.fetch();
    const body = await response.text();
    const payload = JSON.parse(body) as Record<string, number>;
    delivered.set(numSamples, {
      Mean: renderNumber(payload.mean),
      Std: renderNumber(payload.std),
      Min: renderNumber(payload.min),
      Max: renderNumber(payload.max),
    });

    if (numSamples === UQ_SAMPLES_LATEST) {
      // Deliver the NEW answer first, then release the held one so it arrives last.
      await route.fulfill({ status: response.status(), contentType: "application/json", body });
      landed.add(numSamples);
      letStaleResponseLand();
      return;
    }

    await staleResponseMayLand;
    await route.fulfill({ status: response.status(), contentType: "application/json", body });
    landed.add(numSamples);
  });

  // Run #1, then run #2 while #1 is still in flight (its response is held, so it is).
  await setUQNumSamples(page, UQ_SAMPLES_STALE);
  await setUQNumSamples(page, UQ_SAMPLES_LATEST);

  // Both payloads must really have reached the PAGE (not just the handler): `landed` is
  // written after `route.fulfill`, so a hang here means the launches never overlapped
  // (or the app cancelled the superseded request) — a failure to see, not a silent one.
  await expect
    .poll(() => landed.has(UQ_SAMPLES_LATEST), {
      timeout: MODEL_READY_TIMEOUT,
      message: `run #2 (numSamples=${UQ_SAMPLES_LATEST}) never reached the backend`,
    })
    .toBe(true);
  await expect
    .poll(() => landed.has(UQ_SAMPLES_STALE), {
      timeout: MODEL_READY_TIMEOUT,
      message: `run #1 (numSamples=${UQ_SAMPLES_STALE}) never received its held response — the out-of-order delivery never happened`,
    })
    .toBe(true);

  const staleStats = delivered.get(UQ_SAMPLES_STALE)!;
  const latestStats = delivered.get(UQ_SAMPLES_LATEST)!;
  // The control (B37kl): if these two ever render identically, the assertion below is
  // vacuous — pick sample counts that do not collide at 4 significant digits.
  expect(
    staleStats,
    `runs #1/#2 render the same stats (${JSON.stringify(staleStats)}) — the oracle cannot discriminate`,
  ).not.toEqual(latestStats);

  // Wait for run #2 to COMMIT before watching for a clobber: the effect clears the card
  // while a generation is pending, so the stats row coming back can only be run #2's —
  // run #1's generation is already superseded (node V45gd).
  await expect(page.locator('[mmux-testid="uq-histogram-stats"]')).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expectPlotlyReady(page);

  // The late response is now in the page's hands. Node §V45gd discards it BEFORE any
  // setState, so the card cannot move; a guard regression repaints it within one React
  // commit (≈ one frame). Grant a hypothetical regression three consecutive
  // double-animation-frame windows and re-read the card in each (the same frame-stability
  // idiom expectLaunchPanelSettled uses, §V47rv) — no polling for a good state, which
  // could hide a clobber that lands later.
  for (let check = 1; check <= 3; check += 1) {
    await page.evaluate(
      () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    const painted = await displayedUQStats(page);
    expect(
      painted,
      `after run #1's late response landed (check ${check}/3) the UQ card must still show ` +
        `run #2 (numSamples=${UQ_SAMPLES_LATEST}); stale payload was ${JSON.stringify(staleStats)}`,
    ).toEqual(latestStats);
  }

  // Interception done: the rest of the spec must run against the untouched backend.
  await page.unroute(UQ_PROPAGATION_PATTERN);

  // Pixel baseline: the UQ histogram with the real (deterministic) Plotly render,
  // computed over the explicit numSamples the flow just typed.
  await expect(page).toHaveScreenshot("uq-readonly-histogram.png");

  // UQ Settings opens the sample/histogram/seed config modal (§V36 — every button
  // gets an e2e test + regression screenshot). It now shows the TYPED budget, not the
  // default, which is the point of the explicit-samples change (§T47mx).
  const settingsButton = page.locator('[mmux-testid="uq-settings-button"]');
  await expect(settingsButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await settingsButton.click();

  const settingsModal = page.locator('[mmux-testid="uq-settings-modal"]');
  await expect(settingsModal).toBeVisible({ timeout: VIEW_TIMEOUT });

  // Pixel baseline: the UQ Settings modal.
  await expect(page).toHaveScreenshot("uq-readonly-settings-modal.png");
  await page.keyboard.press("Escape");
  await expect(settingsModal).toBeHidden({ timeout: VIEW_TIMEOUT });

  // Inspect Model opens the SuMo cross-validation modal (regression guard: the
  // MUI Modal child must forward a ref, otherwise the modal never renders).
  await expect(inspectButton).toBeEnabled({ timeout: MODEL_READY_TIMEOUT });
  await inspectButton.click();

  const modal = await expectModelModalReady(page);

  // Pixel baseline: the Inspect Model modal (cross-validation view).
  await expect(page).toHaveScreenshot("uq-readonly-inspect-modal.png");
  // Accessibility: the Inspect Model modal over the histogram view (§V42rb).
  await expectNoSeriousViolations(page);

  // Pixel baseline: the same modal on the log DISPLAY scale. The modal's violins
  // plot the raw mock job values (strictly positive), so LOG is enabled; toggle
  // back to linear afterwards so later baselines keep the default display.
  // (The histogram itself has NO -log baseline: its synthesized bins span negative
  // values for QoI y, which disables its LOG toggle by design.)
  const validationScale = modal.locator('[mmux-testid="sumo-validation-display-scale"]');
  await validationScale.getByRole("button", { name: "log" }).click();
  await expect(page).toHaveScreenshot("uq-readonly-inspect-modal-log.png");
  await validationScale.getByRole("button", { name: "linear" }).click();

  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });

  const plotNext = page.locator('[mmux-testid="uq-plot-next"]');
  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sensitivity / Correlation Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-correlation-indices.png");

  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-sobol-indices.png");

  // The histogram's log display gets TWO witness baselines:
  // (a) DISABLED on QoI y — its linearized-Gaussian spread (σ = √(Σg²σ²), √2 over
  //     the N(1,1) inputs) reaches negative bin centers, so the ≤0 gate (B54rz
  //     reading) kills the LOG option — element baseline pins exactly that state.
  // (b) LIVE on QoI y4 = 2 + 0.5·(x3+x4)² — its convexity makes the QoI card's
  //     auto-detect COMMIT LOG as compute scale (visible on the inputs shots),
  //     and log-space prediction exp's back STRICTLY positive samples
  //     (≈ 0.14 .. 49 ⇒ > 2 decades) so the log histogram is renderable AND
  //     worth seeing. The display DEFAULT is log here — click linear first,
  //     then log, so the shot always captures an actual toggle action.
  const plotBack = page.locator('[mmux-testid="uq-plot-back"]');
  for (let step = 0; step < 2; step += 1) {
    await expect(plotBack).toBeEnabled({ timeout: VIEW_TIMEOUT });
    await plotBack.click();
  }
  await expect(page.getByText("Uncertainty Quantification Histogram")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator('[mmux-testid="uq-display-scale"]')).toHaveScreenshot("uq-readonly-histogram-log-disabled.png");

  await page.locator('[mmux-testid="uq-plot-qoi-select"]').click();
  await page.getByRole("option", { name: "y4", exact: true }).click();
  // ANY positive Min proves the y4 histogram replaced the y one (y's is "Min: -3.145")
  await expect(page.getByText(/Min: \d/)).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  const histogramScale = page.locator('[mmux-testid="uq-display-scale"]');
  await histogramScale.getByRole("button", { name: "linear" }).click({ timeout: MODEL_READY_TIMEOUT });
  await histogramScale.getByRole("button", { name: "log" }).click({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-histogram-log-y4.png");

  const runtimeErrors = errors.filter(error => !error.includes("Failed to load resource"));
  expect(runtimeErrors, `JavaScript errors captured: ${runtimeErrors.join("\n")}`).toEqual([]);
});
