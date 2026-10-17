import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  correlationAbsLogRange,
  correlationLinearRange,
  correlationSymlogRange,
  symlogTicks,
  symlogTransform,
} from "../../utils/plotScale";
import CorrelationIndicesPlot, { CorrelationControls } from "./CorrelationIndicesPlot";
import { jsonResponse, stubFetch } from "../../test/fetchStub";

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
    distribution: {} as { [fnUid: string]: { [varName: string]: { distribution?: string; scale?: string } } },
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

const corrPayload = (pearson: number[], spearman: number[] = pearson) => ({
  correlations: Object.fromEntries(["x1", "x2"].map((v, i) => [v, { pearson: pearson[i], spearman: spearman[i] }])),
});

// x2 entirely absent from the response: the BE may omit a variable it could not
// score, so the panel's ?? guard must fold it to 0.
const sparseCorrPayload = { correlations: { x1: { pearson: 0.5, spearman: 0.25 } } } as unknown as CorrelationIndicesResponse;

// Exact binary fractions keep every trace assertion on exact equality.
const signedCorrPayload = {
  correlations: { x1: { pearson: 0.5, spearman: 0.5 }, x2: { pearson: -0.25, spearman: -0.25 } },
};

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

function traces(): Array<{ [key: string]: unknown }> {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string) as Array<{
    [key: string]: unknown;
  }>;
}

function firstTrace(): { [key: string]: unknown } {
  return traces()[0];
}

function traceY(index = 0): number[] {
  return traces()[index].y as number[];
}

function plotLayout(): { [key: string]: unknown } {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as { [key: string]: unknown };
}

function yaxis(): { [key: string]: unknown } {
  return plotLayout().yaxis as { [key: string]: unknown };
}

type FetchMock = ReturnType<typeof stubFetch>;

function requestBody(fetchMock: FetchMock, call = 0): { [key: string]: unknown } {
  return JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string) as { [key: string]: unknown };
}

describe("CorrelationIndicesPlot fetch freshness (V45gd)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the newest QoI result when an older request resolves last", async () => {
    resetMocks(3);
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(corrPayload([0.6, 0.4])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    mocks.selectedQoI = "z";
    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);

    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));

    await act(async () => resolveStale(jsonResponse(corrPayload([0.1, 0.2]))));
    expect(traceY()).toEqual([0.6, 0.4]);
  });

  it("refetches with the committed scale when an output scale flips under the mounted panel (GH-Copilot #706, B58rs)", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.6, 0.4])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // useAutoDetectQoiScale commits a LOG verdict for the QoI while the panel
    // is still mounted. Before the deps fix the request read the flag but no
    // dep changed → the panel kept painting the all-linear result (⊥ V12).
    mocks.contextValue.outputLogScales = { "fn-1": { y: true } };
    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body.outputLogScales).toEqual({ y: true }); // refetch carries the scale
  });
});

describe("CorrelationControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("reports view-mode and scale changes, null when the active button is re-clicked", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    const onScaleTypeChange = vi.fn();
    render(
      <CorrelationControls
        viewMode="pearson"
        scaleType="linear"
        onViewModeChange={onViewModeChange}
        onScaleTypeChange={onScaleTypeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Spearman" }));
    expect(onViewModeChange).toHaveBeenLastCalledWith(expect.anything(), "spearman");

    // exclusive group: re-clicking the active button means "nothing selected"
    await user.click(screen.getByRole("button", { name: "Pearson" }));
    expect(onViewModeChange).toHaveBeenLastCalledWith(expect.anything(), null);

    await user.click(screen.getByRole("button", { name: "Log" }));
    expect(onScaleTypeChange).toHaveBeenLastCalledWith(expect.anything(), "abslog");
    await user.click(screen.getByRole("button", { name: "Linear" }));
    expect(onScaleTypeChange).toHaveBeenLastCalledWith(expect.anything(), null);
  });
});

describe("CorrelationIndicesPlot gates, warnings and errors", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("paints Calculating only while a request is pending", async () => {
    resetMocks(3);
    let resolvePending: (r: Response) => void = () => undefined;
    stubFetch(() => new Promise<Response>(resolve => (resolvePending = resolve)));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    expect(screen.getByText("Calculating...")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();

    await act(async () => resolvePending(jsonResponse(corrPayload([0.6, 0.4]))));
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));
    expect(screen.queryByText("Calculating...")).toBeNull();
  });

  it("does not call the backend without jobs and asks for samples", async () => {
    resetMocks(0);
    mocks.fetchedJobCollections = [];
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.6, 0.4])));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(screen.getByText("No data available. Please create more Samples.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("does not call the backend when no QoI is selected", async () => {
    resetMocks(6);
    mocks.selectedQoI = undefined; // explicit: the resetMocks default would restore "y"
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.6, 0.4])));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    // 6 completed jobs ≥ max(5, 2 inputs + 1), so the warning blames the
    // calculation, not the sample count (InsufficientDataWarning's split).
    await waitFor(() => expect(screen.getByText("Error during calculation, please contact support.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend error message verbatim when the compute fails", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse({ error: "correlation matrix unavailable" }, 400));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(screen.getByText("correlation matrix unavailable")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1); // 400 is not retryable: no retry storm
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("ignores a late rejection from a superseded request (V45gd error gate)", async () => {
    resetMocks(3);
    let resolveFirst: (r: Response) => void = () => undefined;
    stubFetch(() => new Promise<Response>(resolve => (resolveFirst = resolve)), jsonResponse(corrPayload([0.6, 0.4])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    mocks.selectedQoI = "z";
    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.6, 0.4]));

    // the QoI-y request fails AFTER the QoI-z result already painted:
    // stale generation → the catch must not surface the error.
    await act(async () => resolveFirst(jsonResponse({ error: "late failure" }, 400)));
    expect(traceY()).toEqual([0.6, 0.4]);
    expect(screen.queryByText("late failure")).toBeNull();
  });
});

describe("CorrelationIndicesPlot request payload", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends numSamples/seed from uqSettings and per-variable input log scales", async () => {
    resetMocks(3);
    mocks.uqSettings = { "fn-1": { numSamples: 4321, seed: 9 } };
    mocks.contextValue.distribution = {
      "fn-1": { x1: { distribution: "uniform", scale: "log" }, x2: { distribution: "normal", scale: "linear" } },
    };
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.5, 0.25])));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0.25]));

    const body = requestBody(fetchMock);
    expect(body.numSamples).toBe(4321); // from uqSettings, not the 10000 default
    expect(body.seed).toBe(9);
    expect(body.output).toBe("y");
    expect(body.inputVars).toEqual(["x1", "x2"]);
    expect(body.distributions).toEqual({
      x1: { distribution: "uniform", scale: "log" },
      x2: { distribution: "normal", scale: "linear" },
    });
    expect(body.inputLogScales).toEqual({ x1: true, x2: false }); // scale === "log" drives the flag
    expect(body.outputLogScales).toEqual({ y: false });
  });

  it("keeps constant factors off the wire (GH-Copilot #714, B50ef)", async () => {
    resetMocks(3);
    // `constant` is FE-only preset state: the request schema knows normal|uniform
    // only, so a constant leaves BOTH the variable list and the map.
    mocks.contextValue.distribution = {
      "fn-1": { x1: { distribution: "uniform", scale: "linear" }, x2: { distribution: "constant" } },
    };
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.5, 0])));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0]));

    const body = requestBody(fetchMock);
    expect(body.inputVars).toEqual(["x1"]); // the constant dimension leaves the surrogate
    expect(body.distributions).toEqual({ x1: { distribution: "uniform", scale: "linear" } });
    expect(body.inputLogScales).toEqual({ x1: false });
  });

  it("falls back to empty-uid lookups and defaults when no function is selected", async () => {
    resetMocks(3);
    mocks.contextValue.selectedFunction = undefined; // selectedFunction?.uid || "" path
    mocks.contextValue.distribution = { "fn-1": { x1: { distribution: "uniform", scale: "log" } } }; // keyed under a DIFFERENT uid
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.5, 0.5])));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0.5]));

    const body = requestBody(fetchMock);
    expect(body.distributions).toBeUndefined(); // "" lookup misses the fn-1-only map
    expect(body.inputLogScales).toEqual({ x1: false, x2: false });
    expect(body.numSamples).toBe(10000); // uqSettings[""] missing → default
    expect(body.seed).toBe(0);
    expect(body.outputLogScales).toEqual({ y: false }); // no committed scale → linear
  });
});

describe("CorrelationIndicesPlot plot-data shaping", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("linear scale paints one bar per input in fixed category order and folds missing values to 0", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(sparseCorrPayload));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0])); // x2 absent from the payload → ?? 0
    const trace = firstTrace();
    expect(trace.type).toBe("bar");
    expect(trace.width).toBe(0.45);
    expect(trace.name).toBe("Pearson");
    expect(trace.customdata).toEqual([0.5, 0]); // raw values stay on the hover
    expect(trace.hovertemplate).toContain("%{customdata:");
    expect(plotLayout().barmode).toBe("group");
    expect((plotLayout().xaxis as { categoryarray: string[] }).categoryarray).toEqual(["x1", "x2"]);
    expect(yaxis().title).toEqual({ text: "Correlation coefficient" });
    expect(yaxis().range).toEqual(correlationLinearRange);
    expect(yaxis().type).toBeUndefined(); // linear is Plotly's default axis type
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("spearman switches the trace name and its marker color", async () => {
    resetMocks(3);
    stubFetch(jsonResponse(corrPayload([0.5, 0.25], [0.75, -0.5])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, 0.25]));
    const pearsonColor = (firstTrace().marker as { color: string }).color;

    rerender(<CorrelationIndicesPlot viewMode="spearman" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.75, -0.5]));
    expect(firstTrace().name).toBe("Spearman");
    // the two coefficients stay visually distinct (theme-driven, so compare only)
    expect((firstTrace().marker as { color: string }).color).not.toBe(pearsonColor);
  });

  it("symlog transforms signed values and labels the axis with back-transformed ticks", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.5, -0.25])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, -0.25])); // raw on linear
    expect(yaxis().type).toBeUndefined();

    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="symlog" />);
    await waitFor(() => expect(traceY()).toEqual([symlogTransform(0.5), symlogTransform(-0.25)]));
    expect(firstTrace().customdata).toEqual([0.5, -0.25]); // hover keeps the coefficient
    expect(yaxis().title).toEqual({ text: "Correlation coefficient (symlog)" });
    expect(yaxis().range).toEqual(correlationSymlogRange);
    expect(yaxis().tickvals).toEqual(symlogTicks().tickvals);
    expect(yaxis().ticktext).toEqual(symlogTicks().ticktext); // labels are values, not symlog positions
    // V46sc: a scale toggle re-paints the CACHED payload — the request body did
    // not change, so the cache key did not either (zero extra network).
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("abslog splits the bars into sign-colored traces and floors magnitudes at the log floor", async () => {
    resetMocks(3);
    const fetchMock = stubFetch(jsonResponse(signedCorrPayload));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(traceY()).toEqual([0.5, -0.25]));

    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="abslog" />);
    await waitFor(() => expect(traces()).toHaveLength(2));
    const [positive, negative] = traces();
    // sign leaves the axis (log cannot carry it) and comes back as color + legend
    expect(positive.name).toBe("Positive");
    expect(positive.x).toEqual(["x1"]);
    expect(positive.y).toEqual([0.5]);
    expect(positive.customdata).toEqual([0.5]);
    expect(negative.name).toBe("Negative");
    expect(negative.x).toEqual(["x2"]);
    expect(negative.y).toEqual([0.25]); // |value|, not log10(|value|): Plotly's axis is log
    expect(negative.customdata).toEqual([-0.25]); // the hover still shows the signed coefficient
    expect(negative.hovertemplate).toContain("%{customdata:");
    expect((negative.marker as { color: string }).color).not.toBe((positive.marker as { color: string }).color);
    expect(yaxis().title).toEqual({ text: "|Correlation coefficient| (log)" });
    expect(yaxis().type).toBe("log");
    expect(yaxis().range).toEqual(correlationAbsLogRange);
    expect(fetchMock).toHaveBeenCalledTimes(1); // sign-splitting is pure re-shaping of the cached result
  });

  it("clamps a zero magnitude to the log floor instead of -Infinity", async () => {
    resetMocks(3);
    stubFetch(jsonResponse({ correlations: { x1: { pearson: 0, spearman: 0 }, x2: { pearson: -0.25, spearman: -0.25 } } }));

    render(<CorrelationIndicesPlot viewMode="pearson" scaleType="abslog" />);
    await waitFor(() => expect(traces()).toHaveLength(2));
    // 0 >= 0 → the positive bucket, and log(0) would drop the bar entirely
    expect(traceY(0)).toEqual([0.01]);
    expect(firstTrace().customdata).toEqual([0]);
    expect(traceY(1)).toEqual([0.25]);
  });
});
