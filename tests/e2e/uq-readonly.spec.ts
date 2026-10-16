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
  downloadAndParseJson,
} from "./helpers";

// The mock function's input schema (mock_osparc/data.py) — the correlation and Sobol payloads
// are keyed by exactly these variables.
const INPUT_VARS = ["x1", "x2", "x3", "x4"];

// 50 bins is the shipped default (uqSettings nHistograms || 50, echoed by the flaskapi ManualUQ
// response validator), so the exported histogram arrays are pinned.
const HISTOGRAM_BINS = 50;

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
 * View-scoped axe scans (§V42rb) run on the views this flow already renders, each one
 * AFTER that view's `toHaveScreenshot` (axe mutates the live document, so a scan must
 * never precede a pixel capture — root §T47mx).
 *
 * Every pixel here is driven by the DEFAULT UQ settings (10 000 samples, node §V49ub) —
 * the same captures develop owns. The out-of-order-response guard that re-runs with two
 * typed budgets (§T47mx, pinning node §V45gd at the HTTP layer) lives in its OWN test at
 * the end of this file, declared AFTER the flow so its typed budgets cannot reach these
 * baselines: this suite runs one worker in declaration order (workers: 1, fullyParallel:
 * false), and each spec's resetPersistence() clears the persisted settings anyway.
 *
 * Pixel baselines are regenerated only in the pinned Playwright docker image
 * (§V12); host-generated baselines must not be committed.
 */

// The endpoint whose response ordering this spec forces (flaskapi
// `POST /flask/dakota/manual_uq_propagation_with_uncertainty`).
const UQ_PROPAGATION_PATTERN = "**/flask/dakota/manual_uq_propagation_with_uncertainty";

// Explicit sample budgets for the race test at the end of this file (§T47mx): powers of
// 2 in the researched range (see ITISFoundation/itis-sumo#76 — surrogate-cheap ⇒ sized by
// statistics), deliberately DISTINCT from the single-sourced 10 000 default (node V49ub)
// so the route guard can tell the typed runs apart from any default-driven one, AND
// distinct from each other at the card's rendered precision — otherwise the clobber check
// would pass vacuously (B37kl control). The modal's SAVE persists them per function and
// puts them on the wire — the V49ub modal→wire agreement and §V36ez "driven, not
// assumed" both ride on typing these through the real control.
const UQ_SAMPLES_STALE = 2048; // run #1 — its HTTP response is HELD until run #2's stats PAINT (then released)
const UQ_SAMPLES_LATEST = 4096; // run #2 — the payload that must stay on screen

/** The four headline stats the UQ card paints, as the UI renders them (Metric: toPrecision(4)). */
type RenderedUQStats = { Mean: string; Std: string; Min: string; Max: string };
const STAT_NAMES = ["Mean", "Std", "Min", "Max"] as const;

const renderNumber = (value: number) => value.toPrecision(4);

/**
 * Open UQ Settings, TYPE the sample count, Save. The real control (§T47mx): saving is
 * what re-fires the propagation, and it is the modal's SAVE that puts the typed number
 * on the wire (V49ub) — the race test drives the control instead of assuming a default.
 */
async function setUQNumSamples(page: Page, numSamples: number): Promise<void> {
  await page.locator('[mmux-testid="uq-settings-button"]').click();
  const modal = page.locator('[mmux-testid="uq-settings-modal"]');
  await expect(modal).toBeVisible({ timeout: VIEW_TIMEOUT });
  await modal.getByLabel("Number of UQ Samples").fill(String(numSamples));
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeHidden({ timeout: VIEW_TIMEOUT });
}

/** Parse the four headline stats out of the stats row's text; null if any metric is absent. */
function parseUQStats(text: string): RenderedUQStats | null {
  const entries = STAT_NAMES.map(name => [name, new RegExp(`${name}:\\s*(\\S+)`).exec(text)?.[1] ?? null] as const);
  if (entries.some(([, value]) => value === null)) return null;
  return Object.fromEntries(entries.map(([name, value]) => [name, value as string])) as RenderedUQStats;
}

/** Read what the UQ card displays right now WITHOUT waiting — null while no stats are painted. */
async function paintedUQStats(page: Page): Promise<RenderedUQStats | null> {
  const text = await page
    .locator('[mmux-testid="uq-histogram-stats"]')
    .innerText({ timeout: 1000 })
    .catch(() => "");
  return parseUQStats(text);
}

/** Read the stats row the UQ card currently displays (it must be complete). */
async function displayedUQStats(page: Page): Promise<RenderedUQStats> {
  const text = await page.locator('[mmux-testid="uq-histogram-stats"]').innerText();
  const stats = parseUQStats(text);
  expect(stats, `UQ stats row shows no complete Mean/Std/Min/Max set in: ${JSON.stringify(text)}`).not.toBeNull();
  return stats as RenderedUQStats;
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

  // The UQ histogram renders once the mount-time propagation completes — the untouched
  // default (fresh persistence carries no uqSettings; 10 000 via node V49ub), so every
  // capture downstream of here is the default-driven state and matches develop's
  // baselines. Pixel FIRST, then the scan: axe injects script and measurement nodes into
  // the live document, so a scan must never precede a capture sharing its view (§V10 —
  // an ordering the fold had inverted for this view; repaired here).
  await expectPlotlyReady(page);
  await expect(page).toHaveScreenshot("uq-readonly-histogram.png");
  // Accessibility: the UQ histogram results view (§V42rb "results views").
  await expectNoSeriousViolations(page);

  // Raw-data download (T53st sweep, fork issue #79; root V36ez): mock backend + default
  // nHistograms/seed make the propagation deterministic, so replay the legacy shape +
  // five-number-summary ordering assertions on the exported JSON.
  const uqDownload = (await downloadAndParseJson(page, "download-uq-data-btn", "uq-histogram-y.json")) as {
    binMeans: number[];
    binStds: number[];
    binsStart: number;
    binsEnd: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    std: number;
    whiskerMin: number;
    whiskerMax: number;
    outliers: number[];
  };
  expect(uqDownload.binMeans, "binMeans length").toHaveLength(HISTOGRAM_BINS);
  expect(uqDownload.binStds, "binStds length").toHaveLength(HISTOGRAM_BINS);
  expect(Array.isArray(uqDownload.outliers), "outliers is an array").toBe(true);
  expect(uqDownload.binsStart, "binsStart < binsEnd").toBeLessThan(uqDownload.binsEnd);
  // Five-number-summary ordering must hold regardless of the exact sampled values.
  expect(uqDownload.min, "min <= whiskerMin").toBeLessThanOrEqual(uqDownload.whiskerMin);
  expect(uqDownload.whiskerMin, "whiskerMin <= q1").toBeLessThanOrEqual(uqDownload.q1);
  expect(uqDownload.q1, "q1 <= median").toBeLessThanOrEqual(uqDownload.median);
  expect(uqDownload.median, "median <= q3").toBeLessThanOrEqual(uqDownload.q3);
  expect(uqDownload.q3, "q3 <= whiskerMax").toBeLessThanOrEqual(uqDownload.whiskerMax);
  expect(uqDownload.whiskerMax, "whiskerMax <= max").toBeLessThanOrEqual(uqDownload.max);
  expect(uqDownload.mean, "min <= mean <= max").toBeGreaterThanOrEqual(uqDownload.min);
  expect(uqDownload.mean, "min <= mean <= max").toBeLessThanOrEqual(uqDownload.max);
  expect(uqDownload.std, "std >= 0").toBeGreaterThanOrEqual(0);
  await expect(page.locator('[mmux-testid="download-uq-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-histogram-btn.png",
  );

  // UQ Settings opens the sample/histogram/seed config modal (§V36 — every button
  // gets an e2e test + regression screenshot). It shows the default 10 000 here: this
  // flow never touches it — typed budgets belong to the race test below (§T47mx).
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

  // Raw-data download (root V36ez witness): the export carries the FULL
  // {correlations:{<var>:{pearson,spearman}}} response — wrapper included — one finite [-1,1]
  // coefficient pair per mock input variable.
  const corrDownload = (await downloadAndParseJson(
    page,
    "download-correlation-data-btn",
    "correlation-y.json",
  )) as { correlations: Record<string, { pearson: number; spearman: number }> };
  expect(Object.keys(corrDownload.correlations).sort()).toEqual([...INPUT_VARS].sort());
  for (const varName of INPUT_VARS) {
    const { pearson, spearman } = corrDownload.correlations[varName];
    expect(Number.isFinite(pearson), `${varName} pearson finite`).toBe(true);
    expect(Number.isFinite(spearman), `${varName} spearman finite`).toBe(true);
    expect(Math.abs(pearson), `${varName} pearson in [-1,1]`).toBeLessThanOrEqual(1.000001);
    expect(Math.abs(spearman), `${varName} spearman in [-1,1]`).toBeLessThanOrEqual(1.000001);
  }
  await expect(page.locator('[mmux-testid="download-correlation-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-correlation-btn.png",
  );

  await expect(plotNext).toBeEnabled({ timeout: VIEW_TIMEOUT });
  await plotNext.click();
  await expect(page.getByText("Sobol' Indices")).toBeVisible({ timeout: VIEW_TIMEOUT });
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible({ timeout: MODEL_READY_TIMEOUT });
  await expect(page).toHaveScreenshot("uq-readonly-sobol-indices.png");

  // Raw-data download (root V36ez witness): main/total + CI bounds per mock input, exactly the
  // response that feeds the first/total/second-order views.
  const sobolDownload = (await downloadAndParseJson(page, "download-sobol-data-btn", "sobol-y.json")) as {
    sobol: Record<string, { main: number; total: number; mainCiLow: number; mainCiHigh: number }>;
    sobolSecondOrder: Record<string, unknown>;
  };
  expect(Object.keys(sobolDownload.sobol).sort()).toEqual([...INPUT_VARS].sort());
  for (const varName of INPUT_VARS) {
    const entry = sobolDownload.sobol[varName];
    expect(Number.isFinite(entry.main) && entry.main >= 0, `${varName} main >= 0`).toBe(true);
    expect(Number.isFinite(entry.total) && entry.total >= 0, `${varName} total >= 0`).toBe(true);
    expect(entry.mainCiLow, `${varName} CI ordering`).toBeLessThanOrEqual(entry.mainCiHigh);
  }
  expect(typeof sobolDownload.sobolSecondOrder, "second-order matrix present").toBe("object");
  await expect(page.locator('[mmux-testid="download-sobol-data-btn"]')).toHaveScreenshot(
    "uq-readonly-download-sobol-btn.png",
  );

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

/**
 * Dedicated race guard (root §T47mx, pinning node §V45gd) — declared AFTER the flow test
 * on purpose so its typed budgets touch no pixel baseline: this file runs serially in
 * declaration order (playwright.config: workers 1, fullyParallel false, retries 0), the
 * budgets persist per function in the backend store, and every spec resetPersistence()s
 * at its start — the flow's default-driven captures cannot be disturbed by what runs here.
 * Navigation is duplicated from the flow rather than factored into a shared helper: the
 * flow's pixel sequence is CI-verified and stays byte-for-byte untouched.
 */
test("out-of-order UQ responses do not clobber the newest generation", async ({ page, baseURL }) => {
  const url = baseURL!;

  // Backend contract check lives in the flow test; here only the mode switch + a clean
  // store are needed (§T13 keeps this test order-independent).
  await setDeployment(page.request, url, "UQ", "READ-ONLY");
  await resetPersistence(page.request, url);
  await page.goto(url, { timeout: MODEL_READY_TIMEOUT });
  await page.waitForLoadState("networkidle");

  const functionGrid = page.locator('[role="grid"]').first();
  await functionGrid.waitFor({ state: "visible", timeout: VIEW_TIMEOUT });

  const selectButton = page.locator(`[mmux-testid="select-function-btn-${FUNCTION_UID}"]`);
  await expect(selectButton).toBeVisible({ timeout: VIEW_TIMEOUT });
  await selectButton.click();

  await expect(page.locator('[mmux-testid^="input-block-"][mmux-testid$="-Mean"] input').first()).toBeVisible({
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

  await expect(page.locator('[mmux-testid="uq-plot-qoi-select"]')).toBeVisible({ timeout: VIEW_TIMEOUT });

  // The mount-time DEFAULT propagation (10 000, node V49ub) must have PAINTED before the
  // route is registered: the guard intercepts exactly the two typed runs below.
  await expectPlotlyReady(page);

  // ── Out-of-order response guard (root §T47mx, pinning node §V45gd) ──────────────
  //
  // Contract under test: when the endpoint answers an OLD request AFTER a newer one has
  // already painted, the stale payload must NOT clobber the newer plot — UncertainUQ
  // commits state only from its newest generation (useGuardedAsyncEffect). Removing that
  // guard must redden this test, not slip through.
  //
  // The ordering is forced at the HTTP layer, so it is deterministic by construction and
  // ⊥ dependent on engine timing: the handler holds run #1's response until the TEST BODY
  // sees run #2's answer PAINTED on the card (a `route.fulfill` alone completes the
  // interception, not the page's parse + React commit — releasing on the wire would let
  // both continuations race in the page, where arrival order alone could make even an
  // unguarded app end on run #2's stats ⇒ the oracle could pass WITHOUT the guard;
  // GH-Copilot r4346159117). (The backend itself serializes Dakota runs on ENGINE_LOCK
  // — flaskapi V49ad — so run #1's COMPUTE really does finish first; this test is about
  // the HTTP/FE layer on top of that.)
  //
  // B37kl ("a test that can only pass is worthless"): the handler records both response
  // payloads, and the test first PROVES they differ at the precision the card renders —
  // only then does comparing the painted stats against run #2's payload have the power to
  // fail. It releases the hold only on a card that PAINTED run #2, then awaits run #1's
  // late landing BEFORE watching for a clobber, so the assertion cannot pass merely
  // because the stale response never arrived nor because run #2 never committed.
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
      // Should not happen: this test registers the route only AFTER the mount-time default
      // run has painted and never changes the QoI afterwards — pass through defensively.
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
      // Deliver the NEW answer first. The held one is released by the TEST BODY once the
      // card has painted this payload — NOT here: `fulfill` says nothing about the page
      // having parsed/committed it (see the paint gate below).
      await route.fulfill({ status: response.status(), contentType: "application/json", body });
      landed.add(numSamples);
      return;
    }

    await staleResponseMayLand;
    await route.fulfill({ status: response.status(), contentType: "application/json", body });
    landed.add(numSamples);
  });

  // Run #1, then run #2 while #1 is still in flight (its response is held, so it is).
  await setUQNumSamples(page, UQ_SAMPLES_STALE);
  await setUQNumSamples(page, UQ_SAMPLES_LATEST);

  // Run #2's answer must really have reached the PAGE (not just the handler): `landed` is
  // written after `route.fulfill`, so a hang here means the launches never overlapped
  // (or the app cancelled the superseded request) — a failure to see, not a silent one.
  await expect
    .poll(() => landed.has(UQ_SAMPLES_LATEST), {
      timeout: MODEL_READY_TIMEOUT,
      message: `run #2 (numSamples=${UQ_SAMPLES_LATEST}) never reached the backend`,
    })
    .toBe(true);

  // Run #1's handler records its payload BEFORE parking on the release promise, so this
  // poll only waits for its request to have entered the intercepted route.
  await expect
    .poll(() => delivered.has(UQ_SAMPLES_STALE), {
      timeout: MODEL_READY_TIMEOUT,
      message: `run #1 (numSamples=${UQ_SAMPLES_STALE}) never issued a request through the intercepted route`,
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

  // PAINT GATE: release the hold only once the card DISPLAYS run #2's stats — the
  // page-side commit that a wire-level `fulfill` cannot prove. The effect clears the card
  // while a generation is pending, so stats equal to run #2's can only be run #2's commit
  // (run #1's generation is already superseded — node V45gd).
  await expect
    .poll(() => paintedUQStats(page), {
      timeout: MODEL_READY_TIMEOUT,
      message: `the UQ card never painted run #2 (numSamples=${UQ_SAMPLES_LATEST}) — the stale response stayed held`,
    })
    .toEqual(latestStats);

  // A clobber now has something to clobber: let run #1's held answer arrive LAST...
  letStaleResponseLand();
  // ...and await its landing before watching (B37kl: a pass must not mean "the stale
  // response never arrived").
  await expect
    .poll(() => landed.has(UQ_SAMPLES_STALE), {
      timeout: MODEL_READY_TIMEOUT,
      message: `run #1 (numSamples=${UQ_SAMPLES_STALE}) never received its held response — the out-of-order delivery never happened`,
    })
    .toBe(true);

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
});
