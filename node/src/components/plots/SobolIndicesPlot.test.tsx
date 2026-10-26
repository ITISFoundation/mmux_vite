import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logColorbarTicks } from "../../utils/plotScale";
import { buildSobolBarData, buildSobolHeatmapData } from "../../utils/sobolIndices";
import SobolIndicesPlot, { SobolControls } from "./SobolIndicesPlot";
import { jsonResponse, stubFetch } from "../../test/fetchStub";
import { defaultUQSettings } from "../../utils/uqSettings";

vi.mock("../../utils/sobolIndices", async importOriginal => {
  const mod = await importOriginal<typeof import("../../utils/sobolIndices")>();
  return mod;
});

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<{ uid: string }>,
  selectedQoI: "y" as string | undefined,
  uqSettings: {} as { [fnUid: string]: { numSamples?: number; seed?: number } },
  fetchedJobCollections: [{}],
  // Mutable so a test can flip the committed output scale under a MOUNTED
  // panel — the B58rs scenario (auto-detect commits while the panel sits).
  contextValue: {
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    inputVars: ["x1", "x2"],
    distribution: {} as { [fnUid: string]: { [varName: string]: { scale?: string } } },
    outputLogScales: {} as { [fnUid: string]: { [qoi: string]: boolean } },
  },
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ uqSettings: mocks.uqSettings, selectedQoI: mocks.selectedQoI }),
}));
vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => mocks.contextValue }));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: mocks.fetchedJobCollections }),
}));

describe("SobolIndicesPlot toggle helpers", () => {
  const getZ = (trace: ReturnType<typeof buildSobolHeatmapData>): number[][] => trace.z as number[][];
  const sobol = {
    x1: { main: 0.5, total: 0.7, mainCiLow: 0.5, mainCiHigh: 0.5, totalCiLow: 0.7, totalCiHigh: 0.7 },
    x2: { main: 0.3, total: 0.5, mainCiLow: 0.3, mainCiHigh: 0.3, totalCiLow: 0.5, totalCiHigh: 0.5 },
  };
  const sobolSecondOrder = {
    x1: { x2: 0.1 },
    x2: { x1: 0.1 },
  };

  it("first-order: buildSobolBarData returns a single Main-effect trace", () => {
    const traces = buildSobolBarData(sobol, ["x1", "x2"], { main: "#aaa", total: "#bbb" });
    expect(traces).toHaveLength(2);
    expect(traces[0]).toMatchObject({ name: "Main effect" });
  });

  it("total-order: buildSobolBarData returns a Total-effect trace", () => {
    const traces = buildSobolBarData(sobol, ["x1", "x2"], { main: "#aaa", total: "#bbb" });
    expect(traces[1]).toMatchObject({ name: "Total effect" });
  });

  it("second-order: buildSobolHeatmapData returns a heatmap trace", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(trace.type).toBe("heatmap");
    expect(trace.z).toHaveLength(2);
  });

  it("second-order: diagonal cells contain first-order values", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(getZ(trace)[0][0]).toBe(0.5);
    expect(getZ(trace)[1][1]).toBe(0.3);
  });

  it("second-order: off-diagonal cells contain pairwise second-order values", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(getZ(trace)[0][1]).toBe(0.1);
    expect(getZ(trace)[1][0]).toBe(0.1);
  });

  it("second-order: heatmap supports any input count (arbitrary-d backend, T31rb) incl. d=8", () => {
    // Regression for the user request: after T31rb the exact pair estimator is
    // valid at any d, so a d=8 second-order matrix must render in full (⊥ gate).
    const vars = ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"];
    const sobol8: SobolIndicesResponse["sobol"] = Object.fromEntries(
      vars.map((v, i) => [
        v,
        { main: 0.1 + i * 0.01, total: 0.4, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.4, totalCiHigh: 0.4 },
      ]),
    );
    // every unordered pair gets a distinct symmetric value for spot-checks
    const pairs: SobolIndicesResponse["sobolSecondOrder"] = {};
    for (let i = 0; i < vars.length; i += 1) {
      pairs[vars[i]] = {};
    }
    for (let i = 0; i < vars.length; i += 1) {
      for (let j = i + 1; j < vars.length; j += 1) {
        const v = i * 0.01 + j * 0.001;
        pairs[vars[i]][vars[j]] = v;
        pairs[vars[j]][vars[i]] = v;
      }
    }

    const trace = buildSobolHeatmapData(sobol8, pairs, vars);
    const z = trace.z as number[][];
    expect(trace.type).toBe("heatmap");
    expect(z).toHaveLength(8);
    expect(z.every(row => row.length === 8)).toBe(true);
    // diagonal = first-order main values
    expect(z[0][0]).toBeCloseTo(0.1);
    expect(z[7][7]).toBeCloseTo(0.1 + 7 * 0.01);
    // off-diagonal symmetric + fully populated (no zero-padding fallback)
    for (let i = 0; i < 8; i += 1) {
      for (let j = 0; j < 8; j += 1) {
        if (i !== j) {
          const lo = Math.min(i, j);
          const hi = Math.max(i, j);
          expect(z[i][j]).toBeCloseTo(lo * 0.01 + hi * 0.001, 5);
        }
      }
    }
  });

  it("log colorbar ticks are back-transformed from log10 exponents to index values", () => {
    const { tickvals, ticktext } = logColorbarTicks();
    expect(tickvals).toEqual([-2, -1, 0]);
    expect(ticktext).toEqual(["0.01", "0.1", "1"]);
  });
});

const sobolPayload = (main: number[], total: number[]) => ({
  sobol: Object.fromEntries(
    ["x1", "x2"].map((v, i) => [
      v,
      { main: main[i], total: total[i], mainCiLow: main[i], mainCiHigh: main[i], totalCiLow: total[i], totalCiHigh: total[i] },
    ]),
  ),
  sobolSecondOrder: {},
});

function firstOrderY(): number[] {
  const plot = screen.getByTestId("plotly");
  return (JSON.parse(plot.getAttribute("data-traces") as string) as Array<{ y: number[] }>)[0].y;
}

describe("SobolIndicesPlot fetch freshness (V45gd)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the newest QoI result when an older request resolves last", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])));

    const { rerender } = render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    mocks.selectedQoI = "z";
    rerender(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);

    await waitFor(() => expect(firstOrderY()).toEqual([0.6, 0.4]));

    await act(async () => resolveStale(jsonResponse(sobolPayload([0.1, 0.2], [0.3, 0.4]))));
    expect(firstOrderY()).toEqual([0.6, 0.4]);
  });

  it("refetches with the committed scale when an output scale flips under the mounted panel (GH-Copilot #706, B58rs)", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    mocks.contextValue.outputLogScales = {};
    const fetchMock = stubFetch(jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])));

    const { rerender } = render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(firstOrderY()).toEqual([0.6, 0.4]));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // useAutoDetectQoiScale commits a LOG verdict for the QoI while the panel
    // is still mounted. Before the deps fix the request read the flag but no
    // dep changed → the panel kept painting the all-linear result (⊥ V12).
    mocks.contextValue.outputLogScales = { "fn-1": { y: true } };
    rerender(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body.outputLogScales).toEqual({ y: true }); // refetch carries the scale
  });
});

// ---------------------------------------------------------------------------
// Coverage extension: controls, fetch gates, error surfacing and the
// total-order / second-order / log-scale plot-shaping branches.
// ---------------------------------------------------------------------------

/** Restores every mock to the state the component-level tests assume. */
function resetMocks(numJobs: number) {
  mocks.filteredJobList = Array.from({ length: numJobs }, (_, i) => ({ uid: `job-${i}` }));
  mocks.selectedQoI = "y";
  mocks.uqSettings = {};
  mocks.fetchedJobCollections = [{}];
  mocks.contextValue = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1", "x2"],
    distribution: {},
    outputLogScales: {},
  };
}

function firstTrace(): { [key: string]: unknown } {
  return (JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string) as Array<{ [key: string]: unknown }>)[0];
}

function traceY(): number[] {
  return firstTrace().y as number[];
}

function plotLayout(): { [key: string]: unknown } {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as { [key: string]: unknown };
}

// x2 entirely absent + x1 missing CI fields: the BE may omit them, so the
// panel's ?? guards must fold to 0 / CI=value. Values are exact binary
// fractions (0.25/0.5/0.75) so trace assertions can use exact equality.
const sparseSobolPayload = {
  sobol: { x1: { main: 0.5, total: 0.75, mainCiHigh: 0.75, totalCiLow: 0.25 } } as unknown as SobolIndicesResponse["sobol"],
  sobolSecondOrder: { x1: { x2: 0.02 } },
};

const heatSobolPayload = {
  sobol: {
    x1: { main: 0.5, total: 0.7, mainCiLow: 0.5, mainCiHigh: 0.5, totalCiLow: 0.7, totalCiHigh: 0.7 },
    x2: { main: 0.3, total: 0.5, mainCiLow: 0.3, mainCiHigh: 0.3, totalCiLow: 0.5, totalCiHigh: 0.5 },
  },
  sobolSecondOrder: { x1: { x2: 0.02 } },
};

describe("SobolControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("reports view-mode and scale changes, null when the active button is re-clicked", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    const onScaleTypeChange = vi.fn();
    render(
      <SobolControls
        viewMode="first-order"
        scaleType="linear"
        onViewModeChange={onViewModeChange}
        onScaleTypeChange={onScaleTypeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Second order" }));
    expect(onViewModeChange).toHaveBeenLastCalledWith(expect.anything(), "second-order");
    await user.click(screen.getByRole("button", { name: "Total order" }));
    expect(onViewModeChange).toHaveBeenLastCalledWith(expect.anything(), "total-order");

    // exclusive group: re-clicking the active button means "nothing selected"
    await user.click(screen.getByRole("button", { name: "First order" }));
    expect(onViewModeChange).toHaveBeenLastCalledWith(expect.anything(), null);

    await user.click(screen.getByRole("button", { name: "Log" }));
    expect(onScaleTypeChange).toHaveBeenLastCalledWith(expect.anything(), "log");
    await user.click(screen.getByRole("button", { name: "Linear" }));
    expect(onScaleTypeChange).toHaveBeenLastCalledWith(expect.anything(), null);
  });
});

describe("SobolIndicesPlot gates, warnings and errors", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("paints Calculating only while a request is pending", async () => {
    resetMocks(3);
    let resolvePending: (r: Response) => void = () => undefined;
    stubFetch(() => new Promise<Response>(resolve => (resolvePending = resolve)));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    expect(screen.getByText("Calculating...")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();

    await act(async () => resolvePending(jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7]))));
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));
    expect(screen.queryByText("Calculating...")).toBeNull();
  });

  it("does not call the backend without jobs and asks for samples", async () => {
    resetMocks(0);
    mocks.fetchedJobCollections = [];
    const fetchMock = stubFetch(jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(screen.getByText("No data available. Please create more Samples.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("does not call the backend when no QoI is selected", async () => {
    resetMocks(6);
    mocks.selectedQoI = undefined; // explicit: the resetMocks default would restore "y"
    const fetchMock = stubFetch(jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    // 6 completed jobs ≥ max(5, 2 inputs + 1), so the warning blames the
    // calculation, not the sample count (InsufficientDataWarning's split).
    await waitFor(() => expect(screen.getByText("Error during calculation, please contact support.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend error message verbatim when the compute fails", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse({ error: "surrogate fit failed" }, 400));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(screen.getByText("surrogate fit failed")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1); // 400 is not retryable: no retry storm
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("ignores a late rejection from a superseded request (V45gd error gate)", async () => {
    resetMocks(3);
    let resolveFirst: (r: Response) => void = () => undefined;
    stubFetch(
      () => new Promise<Response>(resolve => (resolveFirst = resolve)),
      jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])),
    );

    const { rerender } = render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    mocks.selectedQoI = "z";
    rerender(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));

    // the QoI-y request fails AFTER the QoI-z result already painted:
    // stale generation → the catch must not surface the error (line 112 gate).
    await act(async () => resolveFirst(jsonResponse({ error: "late failure" }, 400)));
    expect(traceY()).toEqual([0.6, 0.4]);
    expect(screen.queryByText("late failure")).toBeNull();
  });
});

describe("SobolIndicesPlot request payload", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends seed from uqSettings and per-variable input log scales", async () => {
    resetMocks(3);
    mocks.uqSettings = { "fn-1": { numSamples: 4321, seed: 9 } };
    mocks.contextValue.distribution = { "fn-1": { x1: { scale: "log" }, x2: { scale: "linear" } } };
    const fetchMock = stubFetch(jsonResponse(sobolPayload([0.6, 0.4], [0.9, 0.7])));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.seed).toBe(9); // the stored numSamples (4321) ⊥ reaches this wire — see the fresh-state guard
    expect(body.distributions).toEqual({ x1: { scale: "log" }, x2: { scale: "linear" } });
    expect(body.inputLogScales).toEqual({ x1: true, x2: false }); // scale === "log" drives the flag
    expect(body.outputLogScales).toEqual({ y: false });
  });

  it("falls back to empty-uid lookups and defaults when no function is selected", async () => {
    resetMocks(3);
    mocks.contextValue.selectedFunction = undefined; // selectedFunction?.uid || "" path
    mocks.contextValue.distribution = { "fn-1": { x1: { scale: "log" } } }; // keyed under a DIFFERENT uid
    const fetchMock = stubFetch(jsonResponse(sobolPayload([0.5, 0.5], [0.5, 0.5])));

    render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0.5]));

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.distributions).toBeUndefined(); // "" lookup misses the fn-1-only map
    expect(body.inputLogScales).toEqual({ x1: false, x2: false });
    expect(body.numSamples).toBeUndefined(); // ⊥ dead knob: engine V36 fixes the design base
    expect(body.seed).toBe(defaultUQSettings.seed); // uqSettings[""] missing → shared default
  });
});

describe("SobolIndicesPlot plot-data shaping", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("first-order folds missing CIs into the value and clamps bars on log scale", async () => {
    resetMocks(3);
    stubFetch(jsonResponse(sparseSobolPayload));

    const { rerender } = render(<SobolIndicesPlot viewMode="first-order" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0])); // x2 absent from the payload → 0
    const trace = firstTrace();
    expect(trace.name).toBe("First order");
    expect(trace.customdata).toEqual([
      [0.5, 0.5, 0.75],
      [0, 0, 0],
    ]); // missing mainCiLow folds to main
    expect((trace.error_y as { array: number[] }).array).toEqual([0.25, 0]);
    expect((trace.error_y as { arrayminus: number[] }).arrayminus).toEqual([0, 0]);
    expect((plotLayout().yaxis as { type: string }).type).toBe("linear");
    expect((plotLayout().yaxis as { range: number[] }).range).toEqual([0, 1]);

    rerender(<SobolIndicesPlot viewMode="first-order" scaleType="log" />);
    expect(traceY()).toEqual([0.5, 0.01]); // below-floor values clamp to logFloor, not -Infinity
    expect((firstTrace().error_y as { array: number[] }).array).toEqual([0.25, 0]); // logErrorDeltas on floored values
    expect((plotLayout().yaxis as { type: string }).type).toBe("log");
    expect((plotLayout().yaxis as { range: number[] }).range).toEqual([-2, 0]); // sobolLogRange in log10 units
  });

  it("total-order folds missing CIs the same way and mirrors the log clamp", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(sparseSobolPayload));

    const { rerender } = render(<SobolIndicesPlot viewMode="total-order" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.75, 0]));
    const trace = firstTrace();
    expect(trace.name).toBe("Total order");
    expect(trace.customdata).toEqual([
      [0.75, 0.25, 0.75],
      [0, 0, 0],
    ]); // missing totalCiHigh folds to total
    expect((trace.error_y as { array: number[] }).array).toEqual([0, 0]);
    expect((trace.error_y as { arrayminus: number[] }).arrayminus).toEqual([0.5, 0]);

    rerender(<SobolIndicesPlot viewMode="total-order" scaleType="log" />);
    expect(traceY()).toEqual([0.75, 0.01]);
    // view/scale toggles only re-shape the cached payload — no refetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("second-order heatmap toggles between fixed linear and log color ranges", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(heatSobolPayload));

    const { rerender } = render(<SobolIndicesPlot viewMode="second-order" scaleType="linear" />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(firstTrace().type).toBe("heatmap");
    expect(firstTrace().z).toEqual([
      [0.5, 0.02],
      [0.02, 0.3],
    ]); // diagonal = main, off-diagonal = pairwise
    expect(firstTrace().zmin).toBe(0);
    expect(firstTrace().zmax).toBe(1);
    expect(firstTrace().hovertemplate).toContain("%{z:");
    const heatmapLayout = plotLayout();
    expect((heatmapLayout.xaxis as { title: { text: string } }).title.text).toBe("Variable");
    expect((heatmapLayout.yaxis as { autorange: string }).autorange).toBe("reversed");

    rerender(<SobolIndicesPlot viewMode="second-order" scaleType="log" />);
    const logTrace = firstTrace();
    // z folds through toLogSafe; raw indices stay in customdata for the hover
    expect(logTrace.z).toEqual([
      [Math.log10(0.5), Math.log10(0.02)],
      [Math.log10(0.02), Math.log10(0.3)],
    ]);
    expect(logTrace.customdata).toEqual([
      [0.5, 0.02],
      [0.02, 0.3],
    ]);
    expect(logTrace.zmin).toBe(-2);
    expect(logTrace.zmax).toBe(0);
    const colorbar = logTrace.colorbar as { title: { text: string }; tickvals: number[]; ticktext: string[] };
    expect(colorbar.title.text).toBe("Sobol' index"); // heatmap colorbar title survives the merge
    expect(colorbar.tickvals).toEqual([-2, -1, 0]);
    expect(colorbar.ticktext).toEqual(["0.01", "0.1", "1"]); // labels back-transformed, not exponents
    expect(logTrace.hovertemplate).toContain("%{customdata:");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
