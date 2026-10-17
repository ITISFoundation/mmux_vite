import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const jobs = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

// job uids ride the request body → fresh list per test = fresh cache key
const freshJobs = (tag: string) => Array.from({ length: 5 }, (_, i) => ({ uid: `job-${tag}-${i}` }));

type Dist = { distribution?: string; min?: number; max?: number; value?: number; mean?: number; scale?: string };
type DistMap = Record<string, Record<string, Dist>>;

const mocks = vi.hoisted(() => {
  const u = (min: number) => ({ distribution: "uniform", min, max: min + 1 });
  const base = () => ({ "fn-1": { x1: u(0), x2: u(0), x3: u(0), x4: u(7) } });
  return {
    filteredJobList: [] as Array<{ uid: string }>,
    // what PlotTools.filterInputVars hands the panel: may be shorter than inputVars
    filteredVars: ["x1", "x2", "x3", "x4"] as string[],
    setOtherAxis: undefined as undefined | ((v: Record<string, number>) => void),
    setAxis: {} as Record<number, (axis: string) => void>,
    axes: {} as Record<number, string | undefined>,
    inputVars: ["x1", "x2", "x3", "x4"] as string[],
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    selectedQoI: "y" as string | null,
    distribution: base() as DistMap,
    baseDistribution: base as () => DistMap,
    outputLogScales: {} as Record<string, Record<string, boolean>>,
  };
});

/** Back to the shape every pre-existing test was written against. */
function resetContext(): void {
  mocks.filteredVars = ["x1", "x2", "x3", "x4"];
  mocks.inputVars = ["x1", "x2", "x3", "x4"];
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
vi.mock("../../context/FunctionContext", () => {
  // #663 replay: FunctionContext now carries the per-function QoI log-scale map.
  return {
    useFunctionContext: () => ({
      selectedFunction: mocks.selectedFunction,
      inputVars: mocks.inputVars,
      distribution: mocks.distribution,
      outputLogScales: mocks.outputLogScales,
    }),
  };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: [{}] }),
}));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("./CalculatingWarning", () => ({ default: () => <div>Calculating</div> }));
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

const grid = (value: number[]) => ({ gridData: { x1: [0], x2: [0], x3: [0], x4: [0], y: value } });

function isosurface() {
  const traces = JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string);
  return traces[0] as { type: string; value: number[] };
}

type SceneLayout = { scene?: { xaxis?: { type?: string }; yaxis?: { type?: string }; zaxis?: { type?: string } } };

function layout(): SceneLayout {
  return JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as SceneLayout;
}

function body(fetchMock: ReturnType<typeof stubFetch>, idx = 0) {
  return JSON.parse((fetchMock.mock.calls[idx][1] as RequestInit).body as string);
}

describe("IsoSurface3DPlot", () => {
  beforeEach(() => {
    resetContext();
    mocks.filteredJobList = jobs;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an isosurface for the three grid axes and fixes the remaining input", async () => {
    const fetchMock = stubFetch(jsonResponse(grid([1])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(isosurface()).toMatchObject({ type: "isosurface", value: [1] });
    expect(body(fetchMock)).toMatchObject({ gridVars: ["x1", "x2", "x3"], sliderValues: { x4: 7 } });
  });

  it.each([
    ["HTTP 500", () => textResponse("boom", 500), "failed with 500: boom"],
    ["network failure", () => networkError(), "Failed to fetch"],
    ["malformed JSON", () => malformedJsonResponse(), "JSON"],
  ])("shows the failure reason on %s and retries identical inputs afterwards", async (_label, failure, reason) => {
    const fetchMock = stubFetch(failure(), jsonResponse(grid([2])));
    const { rerender } = render(<IsoSurface3DPlot />);

    expect(await screen.findByText(new RegExp(reason))).toBeInTheDocument();

    mocks.filteredJobList = [...jobs];
    rerender(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the newest slider result when an older request resolves last", async () => {
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(grid([9])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 0, x4: 7.5 }));
    await waitFor(() => expect(isosurface().value).toEqual([9]));

    await act(async () => resolveStale(jsonResponse(grid([1]))));
    expect(isosurface().value).toEqual([9]);
  });

  it("V45gd releases loading when a key reuse supersedes an in-flight request", async () => {
    let resolveSlow: (r: Response) => void = () => undefined;
    const slow = () => new Promise<Response>(resolve => (resolveSlow = resolve));
    const fetchMock = stubFetch(jsonResponse(grid([1])), slow);

    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(isosurface().value).toEqual([1])); // A committed under key K1

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 0, x4: 7.5 })); // B in flight
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/Calculating/)).toBeInTheDocument(); // A's isosurface hidden while computing

    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 0, x4: 7 })); // back to K1: dedup exit must release loading

    await waitFor(() => expect(screen.queryByText(/Calculating/)).toBeNull());
    expect(isosurface().value).toEqual([1]);

    await act(async () => resolveSlow(jsonResponse(grid([9])))); // stale B, gated
    expect(screen.queryByText(/Calculating/)).toBeNull();
    expect(isosurface().value).toEqual([1]);
  });

  it.each([
    [1, "x2", { 1: "x2", 2: "x1", 3: "x3" }],
    [1, "x4", { 1: "x4", 2: "x2", 3: "x3" }],
    [2, "x3", { 1: "x1", 2: "x3", 3: "x2" }],
    [3, "x1", { 1: "x3", 2: "x2", 3: "x1" }],
  ])("keeps the three axes distinct when axis %s is set to %s", async (idx, axis, expected) => {
    stubFetch(jsonResponse(grid([1])));
    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    act(() => mocks.setAxis[idx](axis));
    await waitFor(() => expect(mocks.axes).toEqual(expected));
  });
});

describe("IsoSurface3DPlot display-scale toggle (B53kq, V12)", () => {
  beforeEach(() => {
    resetContext();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("log display paints log10(value) with power-of-10 colorbar ticks, never touching the request", async () => {
    mocks.filteredJobList = freshJobs("3d-log");
    const fetchMock = stubFetch(jsonResponse(grid([1, 10, 100])));
    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(isosurface().value).toEqual([1, 10, 100]); // linear default

    const toggle = within(document.querySelector('[mmux-testid="sumo-3d-display-scale"]') as HTMLElement);
    fireEvent.click(toggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(isosurface().value).toEqual([0, 1, 2]));
    expect(isosurface()).toMatchObject({
      colorbar: { tickvals: [0, 1, 2], ticktext: ["1", "10", "100"] },
    });

    // display-only (V12): the request still carries the COMPUTE scale
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body(fetchMock).outputLogScales).toEqual({ y: false });
  });

  it("disables the log view when volume values include zero", async () => {
    mocks.filteredJobList = freshJobs("3d-nonpos");
    stubFetch(jsonResponse(grid([0, 10, 100])));
    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const toggle = within(document.querySelector('[mmux-testid="sumo-3d-display-scale"]') as HTMLElement);
    expect((toggle.getByRole("button", { name: "log" }) as HTMLButtonElement).disabled).toBe(true);
    expect(isosurface().value).toEqual([0, 10, 100]);
  });
});

describe("IsoSurface3DPlot grid scales, degenerate selections and axis dedup", () => {
  beforeEach(() => {
    resetContext();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("types all three scene axes from the input log scales and sends those flags to the backend", async () => {
    mocks.filteredJobList = freshJobs("3d-inputlog");
    mocks.distribution = {
      "fn-1": {
        x1: { distribution: "uniform", min: 1, max: 10, scale: "log" },
        x2: { distribution: "uniform", min: 1, max: 10, scale: "log" },
        x3: { distribution: "uniform", min: 1, max: 10, scale: "log" },
        x4: { distribution: "uniform", min: 7, max: 8 },
      },
    };
    const fetchMock = stubFetch(jsonResponse(grid([1, 10, 100])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // V12: the scene axes ARE input axes here, so they carry the compute scale
    expect(layout().scene?.xaxis?.type).toBe("log");
    expect(layout().scene?.yaxis?.type).toBe("log");
    expect(layout().scene?.zaxis?.type).toBe("log");
    expect(body(fetchMock)).toMatchObject({
      gridVars: ["x1", "x2", "x3"],
      sliderValues: { x4: 7 },
      inputLogScales: { x1: true, x2: true, x3: true, x4: false },
    });
  });

  it("opens a compute-log QoI straight on the log colorbar without a second request", async () => {
    mocks.filteredJobList = freshJobs("3d-computelog");
    mocks.outputLogScales = { "fn-1": { y: true } };
    const fetchMock = stubFetch(jsonResponse(grid([1, 10, 100])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // V12: the panel opens in the space the surrogate lives in — no toggle click needed
    expect(isosurface().value).toEqual([0, 1, 2]);
    expect(isosurface()).toMatchObject({
      colorbar: { tickvals: [0, 1, 2], ticktext: ["1", "10", "100"] },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body(fetchMock).outputLogScales).toEqual({ y: true });
  });

  it("plots nothing while no QoI is selected and asks the backend for no output", async () => {
    mocks.filteredJobList = freshJobs("3d-noqoi");
    mocks.selectedQoI = null;
    const fetchMock = stubFetch(jsonResponse(grid([1, 10])));
    render(<IsoSurface3DPlot />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();
    const sent = body(fetchMock);
    expect(sent.output).toBeNull();
    expect(sent.outputLogScales).toEqual({});
  });

  it("treats a nullish response as no data instead of crashing", async () => {
    mocks.filteredJobList = freshJobs("3d-nogrid");
    stubFetch(jsonResponse(null));
    render(<IsoSurface3DPlot />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();
  });

  it("seeds the fixed variables from the no-function bucket, value before mean before min", async () => {
    mocks.filteredJobList = freshJobs("3d-nofn");
    mocks.selectedFunction = undefined;
    mocks.distribution = { "": { x1: { value: 3 }, x2: { mean: 4 }, x3: { min: 0 }, x4: { min: 7 } } };
    const fetchMock = stubFetch(jsonResponse(grid([1, 10])));
    render(<IsoSurface3DPlot />);

    // a slider exists for the non-grid variable, so the map was found under ""
    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    expect(body(fetchMock)).toMatchObject({ sliderValues: { x1: 3, x2: 4, x3: 0, x4: 7 } });
  });

  it("moves the other axes aside when one takes a variable that is already in use", async () => {
    mocks.filteredJobList = freshJobs("3d-dedup");
    stubFetch(jsonResponse(grid([1])));
    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(mocks.axes).toEqual({ 1: "x1", 2: "x2", 3: "x3" });

    act(() => mocks.setAxis[1]("x3")); // axis 3 steps aside, the free x1 takes its old slot
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x3", 2: "x2", 3: "x1" }));

    act(() => mocks.setAxis[3]("x2")); // axis 2 steps aside and x1 fills the gap
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x3", 2: "x1", 3: "x2" }));

    act(() => mocks.setAxis[2]("x3")); // axis 1 had taken x3, so it moves to x1
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x3", 3: "x2" }));

    act(() => mocks.setAxis[2]("x4")); // free pick: nothing else has to move
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x4", 3: "x2" }));

    act(() => mocks.setAxis[3]("x3")); // free pick again
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x4", 3: "x3" }));
  });

  it("walks the dedup matrix while only two variables can fill the grid", async () => {
    mocks.filteredJobList = freshJobs("3d-two-vars");
    mocks.filteredVars = ["x1", "x2"];
    stubFetch(jsonResponse(grid([1])));
    render(<IsoSurface3DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(mocks.axes).toEqual({ 1: "x1", 2: "x2", 3: undefined });

    act(() => mocks.setAxis[2]("x1")); // nothing free left: axis 1 blanks, axis 3 takes x2
    await waitFor(() => expect(mocks.axes).toEqual({ 1: undefined, 2: "x1", 3: "x2" }));

    act(() => mocks.setAxis[1]("x1")); // x1 was on axis 2: it comes back, axis 2 stays blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "", 3: "x2" }));

    act(() => mocks.setAxis[2]("x2")); // x2 was on axis 3: axis 3 goes blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: "x2", 3: "" }));

    act(() => mocks.setAxis[3]("x1")); // x1 was on axis 1: axis 1 goes blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "", 2: "x2", 3: "x1" }));

    act(() => mocks.setAxis[3]("x2")); // x2 was on axis 2: both free axes collapse onto x1
    await waitFor(() => expect(mocks.axes).toEqual({ 1: undefined, 2: "x1", 3: "x2" }));

    act(() => mocks.setAxis[1]("x2")); // x2 was on axis 3: axis 2 keeps x1, axis 3 goes blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x2", 2: "x1", 3: "" }));

    act(() => mocks.setAxis[3]("x1")); // x1 was on axis 2: axis 2 goes blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x2", 2: "", 3: "x1" }));

    act(() => mocks.setAxis[1]("x1")); // x1 was on axis 3: axis 2 blanks, axis 3 takes x2
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "x1", 2: undefined, 3: "x2" }));

    act(() => mocks.setAxis[2]("x1")); // x1 was on axis 1 and x2 on axis 3: axis 1 goes blank
    await waitFor(() => expect(mocks.axes).toEqual({ 1: "", 2: "x1", 3: "x2" }));
  });

  it("offers no sliders when the function has no input variables to fix", async () => {
    mocks.filteredJobList = freshJobs("3d-novars");
    mocks.inputVars = [];
    mocks.filteredVars = [];
    stubFetch(jsonResponse(grid([1, 10])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(isosurface().value).toEqual([1, 10]);
    expect(mocks.setOtherAxis).toBeUndefined(); // no variable left to fix
    expect(mocks.axes).toEqual({ 1: undefined, 2: undefined, 3: undefined }); // no grid axes either
  });

  it("absorbs a failure that arrives after its request was superseded", async () => {
    mocks.filteredJobList = freshJobs("3d-latefail");
    let rejectStale: (error: Error) => void = () => undefined;
    const slowFailure = () => new Promise<Response>((_resolve, reject) => (rejectStale = reject));
    stubFetch(slowFailure, jsonResponse(grid([9])));
    render(<IsoSurface3DPlot />);

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 0, x4: 7.5 })); // newer key wins the race
    await waitFor(() => expect(isosurface().value).toEqual([9]));

    // V45gd: the older generation is stale by now, so its rejection must stay silent
    await act(async () => rejectStale(new TypeError("Failed to fetch")));
    expect(screen.queryByText(/failed|invalid JSON/)).toBeNull();
    expect(screen.queryByText(/Calculating/)).toBeNull();
    expect(isosurface().value).toEqual([9]);
  });
});
