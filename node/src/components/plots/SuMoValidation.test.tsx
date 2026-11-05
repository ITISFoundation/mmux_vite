import { act, fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SuMoValidation from "./SuMoValidation";
import { jsonResponse, stubFetch } from "../../test/fetchStub";
import { captureBlobDownloads } from "../../test/downloadCapture";

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));

const mocks = vi.hoisted(() => ({
  validationQoI: "y" as string | undefined,
  filteredJobList: [] as Array<{ uid: string }>,
  fetchedJobCollections: [] as unknown[],
  // Mutable holders so a test can flip the validated QoI, the job set or the
  // committed output scale under a MOUNTED panel (V12/V46sc scenarios).
  // The stub jobs carry no outputs, so useAutoDetectQoiScale stays inert.
  contextValue: {
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    inputVars: ["x1"] as string[],
    distribution: {} as { [fnUid: string]: { [varName: string]: { scale?: string } } },
    outputLogScales: {} as { [fnUid: string]: { [qoi: string]: boolean } },
    outputLogScaleUserSet: {} as { [fnUid: string]: { [qoi: string]: boolean } },
    setOutputLogScales: () => undefined,
    qoiScaleEvidence: {} as { [fnUid: string]: { [qoi: string]: { key: string } } },
    setQoiScaleEvidence: () => undefined,
  },
}));

vi.mock("../../context/FunctionContext", () => ({
  // #663 replay: context contract grows the log-scale maps + setter consumed
  // by the auto-detect hook.
  ["useFunctionContext"]: () => mocks.contextValue,
}));

vi.mock("../../context/JobContext", () => ({
  ["useJobContext"]: () => ({ fetchedJobCollections: mocks.fetchedJobCollections, filteredJobList: mocks.filteredJobList }),
}));

vi.mock("../../context/MMUXContext", () => ({
  ["useMMUXContext"]: () => ({ validationQoI: mocks.validationQoI }),
}));

/** Restores every mock to the state the component-level tests assume. */
function resetMocks(numJobs: number) {
  mocks.validationQoI = "y";
  mocks.filteredJobList = Array.from({ length: numJobs }, (_, i) => ({ uid: `job-${i}` }));
  mocks.fetchedJobCollections = [];
  mocks.contextValue = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1"],
    distribution: {},
    outputLogScales: {},
    outputLogScaleUserSet: {},
    setOutputLogScales: () => undefined,
    qoiScaleEvidence: {},
    setQoiScaleEvidence: () => undefined,
  };
}

const cvPayload = (observed: number[], predicted: number[]) => ({ observed, predicted });

/** The CV endpoint's request body for call `call` (POST via requestJson). */
function cvBody(fetchMock: ReturnType<typeof stubFetch>, call = 0): { [key: string]: unknown } {
  return JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string) as { [key: string]: unknown };
}

function traces(): Array<{ [key: string]: unknown }> {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string) as Array<{ [key: string]: unknown }>;
}

function plotLayout(): { [key: string]: unknown } {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as { [key: string]: unknown };
}

function axisType(): string | undefined {
  return (plotLayout().xaxis as { type?: string } | undefined)?.type;
}

function displayScale() {
  return within(document.querySelector('[mmux-testid="sumo-validation-display-scale"]') as HTMLElement);
}

let observedCallback: ResizeObserverCallback | undefined;

/** jsdom has no ResizeObserver; capture the callback so a test can drive a resize. */
function stubResizeObserver() {
  observedCallback = undefined;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        observedCallback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

// Branch note for the coverage ratchet: four arms of this panel stay uncovered
// because the component cannot reach them — the `data && validationQoI` else in
// createDataAndMetrics and the `validationQoI ? … : {}` in cvBody are both behind
// the effect's own `!validationQoI` gate, `boxRef.current` is always attached by
// the time its effect runs, and every violin trace carries an `x` array. Leave
// them as defensive guards rather than contriving a context that breaks them.
describe("SuMoValidation", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("V30ab renders CV metrics from the fixed {observed,predicted} response contract", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse(cvPayload([1, 2, 3], [1.1, 1.9, 3.2])));

    render(<SuMoValidation />);

    // observed=[1,2,3], predicted=[1.1,1.9,3.2] -> MAE = mean(|diffs|) = 0.1333
    await waitFor(() => expect(screen.getByText("0.1333")).toBeDefined());
    expect(screen.getByTestId("plotly")).toBeDefined();
    // the whole computeStatisticsCv surface: observed mean/std, predicted pair,
    // and MAE/RMSE (each toPrecision(4) inside the value element).
    expect(screen.getByText("2.000")).toBeDefined(); // meanY
    expect(screen.getByText("1.000")).toBeDefined(); // stdY
    expect(screen.getByText("2.067")).toBeDefined(); // meanYHat
    expect(screen.getByText("1.060")).toBeDefined(); // stdYHat
    expect(screen.getByText("0.1414")).toBeDefined(); // rmse
  });

  it("V45gd ignores a stale CV response that resolves after a newer QoI request", async () => {
    resetMocks(5);
    stubResizeObserver();
    let resolveStale: (r: Response) => void = () => undefined;
    stubFetch(() => new Promise<Response>(resolve => (resolveStale = resolve)), jsonResponse(cvPayload([1, 2, 3], [1, 2.5, 5])));

    const { rerender } = render(<SuMoValidation />);
    mocks.validationQoI = "z";
    rerender(<SuMoValidation />);

    // newest request (diffs [0, 0.5, 2]) commits first: MAE = 0.8333 (toPrecision(4))
    await waitFor(() => expect(screen.getByText("0.8333")).toBeDefined());

    await act(async () => resolveStale(jsonResponse(cvPayload([1, 2, 3], [1.1, 1.9, 3.2]))));
    await act(async () => new Promise(resolve => setTimeout(resolve, 0)));

    // the stale generation's MAE (0.1333) must never overwrite the newest result
    expect(screen.queryByText("0.1333")).toBeNull();
    expect(screen.getByText("0.8333")).toBeDefined();
  });

  it("C5: display-scale toggle drives the x-axis type (view-only) and defaults linear", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse(cvPayload([1, 2, 3], [1.1, 1.9, 3.2])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());
    expect(axisType()).toBe("linear");

    const toggle = displayScale();
    fireEvent.click(toggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(axisType()).toBe("log"));

    // positive-only samples: the toggle is enabled (contrast the UQ non-positive case)
    expect(toggle.getByRole("button", { name: "log" })).toBeEnabled();
  });

  it("B54rz: violin density is restricted to the data support (spanmode hard) so log display never rasterizes x<=0 spill", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse(cvPayload([1, 2, 3], [1.1, 1.9, 3.2])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());

    // The canLog gate checks RAW sample values (all > 0 here). Under the default
    // soft spanmode, Plotly extends the KDE curve beyond the data into x<=0, and a
    // log x-axis rasterizes that spill as a NaN SVG path (e2e console-error catch).
    // spanmode hard keeps the rendered geometry inside the samples, making the
    // gate's premise true for EVERYTHING Plotly paints.
    const violinTraces = traces();
    expect(violinTraces).toHaveLength(2);
    for (const trace of violinTraces) {
      expect(trace.type).toBe("violin");
      expect(trace.spanmode).toBe("hard");
    }
    // observations on top, predictions mirrored below the shared axis
    expect(violinTraces[0]).toMatchObject({ name: "Observations", side: "positive", pointpos: 1 });
    expect(violinTraces[1]).toMatchObject({ name: "Predictions", side: "negative", pointpos: -1 });
    expect((plotLayout().title as { text: string }).text).toBe("y Sample Distribution");
  });

  it("validates the modal-selected QoI when an override is supplied (#681)", async () => {
    resetMocks(5);
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    render(<SuMoValidation validationQoIOverride="w" />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());

    // the scale/card QoI ("y") must NOT be the validated one: the override wins
    expect(cvBody(fetchMock).output).toBe("w");
    expect((plotLayout().title as { text: string }).text).toBe("w Sample Distribution");
    expect(screen.getAllByText("0.000")).toHaveLength(2); // perfect fit: MAE and RMSE both 0
  });

  it("runs no CV request while no QoI is validated", async () => {
    resetMocks(5);
    mocks.validationQoI = undefined; // explicit: the resetMocks default would restore "y"
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByText("No data available. Please create more Samples.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("plotly")).toBeNull();
    expect(screen.queryByText(/MAE/)).toBeNull(); // cvMetrics stay unset → the metric rows are absent
  });

  it("scores an all-linear surrogate when no function is selected (empty-uid lookups)", async () => {
    resetMocks(5);
    mocks.contextValue.selectedFunction = undefined; // a freshly restored session with no function
    mocks.contextValue.distribution = { "fn-1": { x1: { scale: "log" } } }; // keyed under a DIFFERENT uid
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());

    const body = cvBody(fetchMock);
    // "" lookups miss the fn-1-only maps: the flags fold to false, so the panel
    // never trains a log surrogate the user never asked for (V12).
    expect(body.inputLogScales).toEqual({ x1: false });
    expect(body.outputLogScales).toEqual({ y: false });
    expect(body.output).toBe("y");
  });

  it("runs no CV request for a job set the surrogate cannot fit (fewer than 5 completed jobs)", async () => {
    resetMocks(4);
    mocks.fetchedJobCollections = [{}]; // enough collections that the warning blames the sample count
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByText("You need at least 5 samples.")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("surfaces the backend error verbatim when the CV call fails", async () => {
    resetMocks(5);
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse({ error: "surrogate fit failed" }, 400));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByText("surrogate fit failed")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1); // 400 is not retryable: no retry storm
    expect(screen.queryByTestId("plotly")).toBeNull();
    expect(screen.queryByText(/MAE/)).toBeNull();
  });

  it("folds an HTTP-200 error envelope into the error surface (the flaskapi error dialect)", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse({ error: "cross validation degenerate" }));

    render(<SuMoValidation />);
    await waitFor(() =>
      expect(screen.getByText("Error running SuMo Validation: cross validation degenerate")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("surfaces the panel's own message when the CV response has no observed/predicted series", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse({ observed: "not-an-array", predicted: [1, 2, 3] }));

    render(<SuMoValidation />);
    await waitFor(() =>
      expect(screen.getByText("Validation response did not include observed and predicted series.")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("plotly")).toBeNull();
    expect(screen.queryByText(/MAE/)).toBeNull();
  });

  it("ignores a late CV rejection from a superseded request (V45gd error gate)", async () => {
    resetMocks(5);
    stubResizeObserver();
    let rejectFirst: (reason: unknown) => void = () => undefined;
    stubFetch(
      () => new Promise<Response>((_resolve, reject) => (rejectFirst = reject)),
      jsonResponse(cvPayload([1, 2, 3], [1, 2.5, 5])),
    );

    const { rerender } = render(<SuMoValidation />);
    mocks.validationQoI = "z";
    rerender(<SuMoValidation />);
    await waitFor(() => expect(screen.getByText("0.8333")).toBeDefined());

    // the QoI-y request fails AFTER the QoI-z result already painted:
    // stale generation → the catch must not surface the error or clear the plot.
    await act(async () => rejectFirst(new TypeError("Failed to fetch")));
    await act(async () => new Promise(resolve => setTimeout(resolve, 0)));

    expect(screen.getByText("0.8333")).toBeDefined();
    expect(screen.queryByText(/Failed to fetch/)).toBeNull();
    expect(screen.getByTestId("plotly")).toBeDefined();
  });

  it("refetches with the committed scale when the validated QoI's scale flips under the panel (V12/V46sc)", async () => {
    resetMocks(5);
    stubResizeObserver();
    const fetchMock = stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    const { rerender } = render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cvBody(fetchMock).outputLogScales).toEqual({ y: false });

    // useAutoDetectQoiScale commits a LOG verdict while the panel is mounted:
    // the scale is part of the request body, so the cache key changes (V46sc)
    // and the panel must re-score the surrogate in log space (V12).
    mocks.contextValue.outputLogScales = { "fn-1": { y: true } };
    rerender(<SuMoValidation />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(cvBody(fetchMock, 1).outputLogScales).toEqual({ y: true });
  });

  it("keeps the axis linear and disables the log toggle when samples are not all positive", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse(cvPayload([1, -2, 3], [1, 2, 3])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());

    // B54rz canLog gate: a log x-axis cannot render x<=0, so the verdict is
    // linear AND the toggle is locked with a reason (not silently wrong).
    expect(axisType()).toBe("linear");
    expect(displayScale().getByRole("button", { name: "log" })).toBeDisabled();
    expect(traces()[0].x).toEqual([1, -2, 3]); // raw samples still reach the plot
  });

  it("tracks the container width from the ResizeObserver so plot and metrics stay aligned", async () => {
    resetMocks(5);
    stubResizeObserver();
    stubFetch(jsonResponse(cvPayload([1, 2, 3], [1, 2, 3])));

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());
    expect(plotLayout().width).toBe(1080); // the unobserved default

    await act(async () => {
      const entry = { contentBoxSize: [{ inlineSize: 640, blockSize: 400 }] };
      observedCallback?.([entry] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
    });

    await waitFor(() => expect(plotLayout().width).toBe(640));
  });
});

describe("SuMoValidation raw-data download (T30ln(b) sweep, fork issue #79)", () => {
  const stubResizeObserver = () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  };

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.validationQoI = "y";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exports the CV response verbatim without any refetch (violin source data)", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-y";
    const payload = { observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    const downloads = captureBlobDownloads();

    render(<SuMoValidation />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeDefined());

    const button = (document.querySelector('[mmux-testid="download-validation-data-btn"]') as HTMLElement).querySelector(
      "button",
    ) as HTMLElement;
    fireEvent.click(button);

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("sumo-validation-dl-y.json");
    // verbatim {observed,predicted}: users can re-derive MAE/RMSE or re-plot the violins
    expect(JSON.parse(await downloads[0].text())).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1); // ⊥ refetch on click (V46sc cache-read)
  });

  it("offers no download when the response lacks the observed/predicted series", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-missing";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) }));

    render(<SuMoValidation />);
    // getValidationSeries finds no series → createDataAndMetrics throws → the
    // ApiError-free generic warning; either way no raw response was committed
    expect(await screen.findByText(/did not include observed and predicted series/i)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-validation-data-btn"]')).toBeNull();
  });

  it("offers no download after a failed fetch", async () => {
    stubResizeObserver();
    mocks.validationQoI = "dl-fail";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "cv boom" }));

    render(<SuMoValidation />);
    expect(await screen.findByText(/failed|cv boom/i)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-validation-data-btn"]')).toBeNull();
  });
});
