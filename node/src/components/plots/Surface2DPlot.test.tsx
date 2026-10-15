import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { captureBlobDownloads } from "../../test/downloadCapture";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Surface2DPlot from "./Surface2DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const jobs = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

// job uids ride the request body → fresh list per test = fresh cache key
const freshJobs = (tag: string) => Array.from({ length: 5 }, (_, i) => ({ uid: `job-${tag}-${i}` }));

type Dist = { distribution?: string; min?: number; max?: number; value?: number; mean?: number; scale?: string };
type DistMap = Record<string, Record<string, Dist>>;

const mocks = vi.hoisted(() => {
  const base = () => ({
    "fn-1": {
      x1: { distribution: "uniform", min: 0, max: 1 },
      x2: { distribution: "uniform", min: 0, max: 1 },
      x3: { distribution: "uniform", min: 5, max: 6 },
    },
  });
  return {
    inputVars: ["x1", "x2", "x3"] as string[],
    // what PlotTools.filterInputVars hands the panel: may be shorter than inputVars
    filteredVars: ["x1", "x2", "x3"] as string[],
    filteredJobList: [] as Array<{ uid: string }>,
    setOtherAxis: undefined as undefined | ((v: Record<string, number>) => void),
    setAxis: {} as Record<number, (axis: string) => void>,
    axes: {} as Record<number, string | undefined>,
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    selectedQoI: "y" as string | null,
    distribution: base() as DistMap,
    baseDistribution: base as () => DistMap,
    outputLogScales: {} as Record<string, Record<string, boolean>>,
  };
});

/** Back to the shape every pre-existing test was written against. */
function resetContext(): void {
  mocks.inputVars = ["x1", "x2", "x3"];
  mocks.filteredVars = ["x1", "x2", "x3"];
  mocks.selectedFunction = { uid: "fn-1" };
  mocks.selectedQoI = "y";
  mocks.distribution = mocks.baseDistribution();
  mocks.outputLogScales = {};
  mocks.setOtherAxis = undefined;
  mocks.setAxis = {};
  mocks.axes = {};
}

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ selectedQoI: mocks.selectedQoI }) }));
vi.mock("../../context/FunctionContext", () => ({
  // #663 replay: FunctionContext now carries the per-function QoI log-scale map.
  useFunctionContext: () => ({
    selectedFunction: mocks.selectedFunction,
    inputVars: mocks.inputVars,
    distribution: mocks.distribution,
    outputLogScales: mocks.outputLogScales,
  }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: [{}] }),
}));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("./PlotTools", () => ({
  plotMarginsNarrow: {},
  filterInputVars: () => mocks.filteredVars,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSelect: ({ idx, axis, setAxis }: { idx: number; axis: string; setAxis: (a: string) => void }) => {
    mocks.setAxis[idx] = setAxis;
    mocks.axes[idx] = axis;
    return null;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSlider: ({ setOtherAxis }: { setOtherAxis: (v: Record<string, number>) => void }) => {
    mocks.setOtherAxis = setOtherAxis;
    return null;
  },
}));

const grid = (z: number[][]) => ({ gridData: { x1: [0, 1, 0, 1], x2: [0, 0, 1, 1], y: z } });

function surface() {
  const traces = JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string);
  return traces[0] as { x: number[]; y: number[]; z: number[][]; type: string };
}

type SceneLayout = { scene?: { xaxis?: { type?: string }; yaxis?: { type?: string }; zaxis?: { type?: string } } };

function layout(): SceneLayout {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as SceneLayout;
}

function body(fetchMock: ReturnType<typeof stubFetch>, idx = 0) {
  return JSON.parse((fetchMock.mock.calls[idx][1] as RequestInit).body as string);
}

describe("Surface2DPlot", () => {
  beforeEach(() => {
    resetContext();
    mocks.filteredJobList = jobs;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a de-duplicated surface grid and does not refetch identical inputs", async () => {
    const z = [1, 2].map(row => [row, row * 2]);
    const fetchMock = stubFetch(jsonResponse(grid(z)));
    const { rerender } = render(<Surface2DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(surface()).toMatchObject({ type: "surface", x: [0, 1], y: [0, 1], z });
    const sent = body(fetchMock);
    expect(sent).toMatchObject({ gridVars: ["x1", "x2"], output: "y", sliderValues: { x3: 5 } });

    mocks.filteredJobList = [...jobs];
    rerender(<Surface2DPlot />);
    await act(async () => undefined);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["HTTP 422", () => textResponse("bad grid", 422)],
    ["network failure", () => networkError()],
    ["malformed JSON", () => malformedJsonResponse()],
  ])("shows a calculation error on %s and retries identical inputs afterwards", async (_label, failure) => {
    const fetchMock = stubFetch(failure(), jsonResponse(grid([[1]])));
    const { rerender } = render(<Surface2DPlot />);

    expect(await screen.findByText(/failed|invalid JSON/)).toBeInTheDocument();

    mocks.filteredJobList = [...jobs];
    rerender(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("explains that a single input cannot produce a surface", () => {
    mocks.inputVars = ["x1"];
    stubFetch(jsonResponse(grid([[1]])));
    render(<Surface2DPlot />);
    expect(screen.getByText(/at least two input dimensions are necessary/)).toBeInTheDocument();
  });

  it("keeps the newest slider result when an older request resolves last", async () => {
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(grid([[9]])));
    render(<Surface2DPlot />);

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 5.5 }));
    await waitFor(() => expect(surface().z).toEqual([[9]]));

    await act(async () => resolveStale(jsonResponse(grid([[1]]))));
    expect(surface().z).toEqual([[9]]);
  });
});

describe("Surface2DPlot display-scale toggle (B53kq, V12)", () => {
  beforeEach(() => {
    resetContext();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("log display paints log10(z) with power-of-10 colorbar ticks, never touching the request", async () => {
    mocks.filteredJobList = freshJobs("2d-log");
    const z = [
      [1, 10],
      [100, 1000],
    ];
    const fetchMock = stubFetch(jsonResponse(grid(z)));
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect((surface() as { colorbar?: unknown }).colorbar).toBeUndefined(); // linear default

    const toggle = within(document.querySelector('[mmux-testid="sumo-2d-display-scale"]') as HTMLElement);
    fireEvent.click(toggle.getByRole("button", { name: "log" }));
    await waitFor(() =>
      expect((surface() as { z: number[][] }).z).toEqual([
        [0, 1],
        [2, 3],
      ]),
    );
    expect(surface()).toMatchObject({
      colorbar: { tickvals: [0, 1, 2, 3], ticktext: ["1", "10", "100", "1000"] },
    });
    // the scene z-axis keeps no type — the paint IS the log, no double transform
    expect(layout().scene?.zaxis?.type).toBeUndefined();

    // display-only (V12): the request still carries the COMPUTE scale
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body(fetchMock).outputLogScales).toEqual({ y: false });
  });

  it("disables the log view when surface values include zero", async () => {
    mocks.filteredJobList = freshJobs("2d-nonpos");
    stubFetch(
      jsonResponse(
        grid([
          [0, 10],
          [100, 1000],
        ]),
      ),
    );
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const toggle = within(document.querySelector('[mmux-testid="sumo-2d-display-scale"]') as HTMLElement);
    expect((toggle.getByRole("button", { name: "log" }) as HTMLButtonElement).disabled).toBe(true);
    expect((surface() as { z: number[][] }).z).toEqual([
      [0, 10],
      [100, 1000],
    ]);
  });
});

describe("Surface2DPlot grid scales, degenerate selections and superseded failures", () => {
  beforeEach(() => {
    resetContext();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("types both grid axes from the input log scales and sends those flags to the backend", async () => {
    mocks.filteredJobList = freshJobs("2d-inputlog");
    mocks.distribution = {
      "fn-1": {
        x1: { distribution: "uniform", min: 1, max: 10, scale: "log" },
        x2: { distribution: "uniform", min: 1, max: 10, scale: "log" },
        x3: { distribution: "uniform", min: 5, max: 6 },
      },
    };
    const fetchMock = stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    render(<Surface2DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // V12: the INPUT axes carry the compute scale; the QoI z-axis never does
    expect(layout().scene?.xaxis?.type).toBe("log");
    expect(layout().scene?.yaxis?.type).toBe("log");
    expect(layout().scene?.zaxis?.type).toBeUndefined();
    expect(body(fetchMock).inputLogScales).toEqual({ x1: true, x2: true, x3: false });
  });

  it("opens a compute-log QoI straight on the log colorbar without a second request", async () => {
    mocks.filteredJobList = freshJobs("2d-computelog");
    mocks.outputLogScales = { "fn-1": { y: true } };
    const fetchMock = stubFetch(
      jsonResponse(
        grid([
          [1, 10],
          [100, 1000],
        ]),
      ),
    );
    render(<Surface2DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // V12: the panel opens in the space the surrogate lives in — no toggle click needed
    expect(surface().z).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(surface()).toMatchObject({
      colorbar: { tickvals: [0, 1, 2, 3], ticktext: ["1", "10", "100", "1000"] },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body(fetchMock).outputLogScales).toEqual({ y: true });
  });

  it("treats a nullish response as empty data instead of crashing", async () => {
    mocks.filteredJobList = freshJobs("2d-nogrid");
    stubFetch(jsonResponse(null));
    render(<Surface2DPlot />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith("Empty plotData");
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("plots nothing while no QoI is selected and asks the backend for no output", async () => {
    mocks.filteredJobList = freshJobs("2d-noqoi");
    mocks.selectedQoI = null;
    const fetchMock = stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    render(<Surface2DPlot />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();
    const sent = body(fetchMock);
    expect(sent.output).toBeNull();
    expect(sent.outputLogScales).toEqual({});
  });

  it("seeds the fixed variable from the no-function bucket, value before mean before min", async () => {
    mocks.filteredJobList = freshJobs("2d-nofn");
    mocks.selectedFunction = undefined;
    mocks.distribution = { "": { x1: { value: 3 }, x2: { mean: 4 }, x3: { min: 2 } } };
    const fetchMock = stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    render(<Surface2DPlot />);

    // a slider exists for the third variable, so the distribution map was found under ""
    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    expect(body(fetchMock)).toMatchObject({ sliderValues: { x1: 3, x2: 4, x3: 2 } });
  });

  it("keeps the two axes distinct while a third variable is still free", async () => {
    mocks.filteredJobList = freshJobs("2d-axes");
    stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(mocks.axes).toEqual({ 1: "x1", 2: "x2" });

    act(() => mocks.setAxis[1]("x2")); // x2 already sits on axis 2, so it steps aside
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x2", 2: "x1" }));

    act(() => mocks.setAxis[1]("x3")); // free pick: only axis 1 moves
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x3", 2: "x1" }));

    act(() => mocks.setAxis[2]("x3")); // x3 now sits on axis 1, so it steps aside
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x3" }));

    act(() => mocks.setAxis[2]("x2")); // free pick again
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x2" }));
  });

  it("leaves an axis blank when a single variable can fill the grid", async () => {
    mocks.filteredJobList = freshJobs("2d-blank");
    mocks.filteredVars = ["x1"];
    stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(mocks.axes).toEqual({ 1: "x1", 2: undefined });

    act(() => mocks.setAxis[2]("x1")); // axis 1 has nowhere else to go
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "", 2: "x1" }));

    act(() => mocks.setAxis[1]("x1")); // and now axis 2 is the one left empty
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "" }));
  });

  it("absorbs a failure that arrives after its request was superseded", async () => {
    mocks.filteredJobList = freshJobs("2d-latefail");
    let rejectStale: (error: Error) => void = () => undefined;
    const slowFailure = () => new Promise<Response>((_resolve, reject) => (rejectStale = reject));
    stubFetch(
      slowFailure,
      jsonResponse(
        grid([
          [7, 8],
          [9, 10],
        ]),
      ),
    );
    render(<Surface2DPlot />);

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 5.5 })); // newer key wins the race
    await waitFor(() =>
      expect(surface().z).toEqual([
        [7, 8],
        [9, 10],
      ]),
    );

    // V45gd: the older generation is stale by now, so its rejection must stay silent
    await act(async () => rejectStale(new TypeError("Failed to fetch")));
    expect(screen.queryByText(/failed|invalid JSON/)).toBeNull();
    expect(surface().z).toEqual([
      [7, 8],
      [9, 10],
    ]);
  });
});

describe("Surface2DPlot raw-data download (T30ln(b) replay, fork issue #79)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const freshJobs = (tag: string) => Array.from({ length: 5 }, (_, i) => ({ uid: `job-${tag}-${i}` }));

  it("exports the plot's own committed grid response without any refetch", async () => {
    mocks.filteredJobList = freshJobs("2d-dl");
    const payload = grid([
      [1, 2],
      [3, 4],
    ]);
    const fetchMock = stubFetch(jsonResponse(payload));
    const downloads = captureBlobDownloads();
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const button = (document.querySelector('[mmux-testid="download-surface2d-data-btn"]') as HTMLElement).querySelector(
      "button",
    ) as HTMLElement;
    fireEvent.click(button);

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("surface2d-y-x1-x2.json");
    expect(JSON.parse(await downloads[0].text())).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1); // ⊥ refetch on download (V46sc cache-read-only)
  });

  it("offers no download after a failed fetch", async () => {
    mocks.filteredJobList = freshJobs("2d-dl-fail");
    stubFetch(textResponse("bad grid", 422));
    render(<Surface2DPlot />);
    expect(await screen.findByText(/failed/)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-surface2d-data-btn"]')).toBeNull();
  });
});
