import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOGAPareto, deriveNonDominatedIndices } from "./MOGAPareto";
import { jsonResponse, stubFetch } from "../../test/fetchStub";
import { captureBlobDownloads } from "../../test/downloadCapture";

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<Record<string, unknown>>,
  modalProps: undefined as Record<string, unknown> | undefined,
  tableProps: undefined as Record<string, unknown> | undefined,
  functionContext: {
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    inputVars: ["x1"] as string[],
    distribution: { "fn-1": { x1: { distribution: "uniform", min: 0, max: 1 } } } as Record<string, unknown>,
    outputTargets: { "fn-1": { y: "minimize", y2: "minimize" } } as Record<string, Record<string, string>>,
    outputLogScales: {} as Record<string, Record<string, boolean>>,
  },
  weights: { y: 1, y2: 1 } as Record<string, number> | undefined,
  mogaSettings: {} as Record<string, unknown>,
}));

const defaults = () => {
  mocks.filteredJobList = [];
  mocks.modalProps = undefined;
  mocks.tableProps = undefined;
  mocks.functionContext.selectedFunction = { uid: "fn-1" };
  mocks.functionContext.inputVars = ["x1"];
  mocks.functionContext.distribution = { "fn-1": { x1: { distribution: "uniform", min: 0, max: 1 } } };
  mocks.functionContext.outputTargets = { "fn-1": { y: "minimize", y2: "minimize" } };
  mocks.functionContext.outputLogScales = {};
  mocks.weights = { y: 1, y2: 1 };
  mocks.mogaSettings = {};
};

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../utils/useAutoDetectQoiScale", () => ({ useAutoDetectQoiScale: () => undefined }));
vi.mock("./MOGAPlotModal", () => ({
  // null-render, but capture LIVE props so a test can drive the modal's apply
  // path (setSelectedOptVars + updatePlot) exactly as the real modal does
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MOGAPlotModal: (props: Record<string, unknown>) => {
    mocks.modalProps = props;
    return null;
  },
}));
vi.mock("./MOGAParetoTable", () => ({
  default: (props: Record<string, unknown>) => {
    mocks.tableProps = props;
    return null;
  },
}));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("../data/JobsLoading", () => ({ JobsLoading: () => <div>jobs-loading</div> }));
vi.mock("../../context/FunctionContext", () => {
  // LIVE holder: identity stays stable (it rides the effect deps), but a test
  // can swap fields between renders (e.g. the V45gd no-function guard).
  return { useFunctionContext: () => mocks.functionContext };
});
vi.mock("../../context/JobContext", () => ({
  // stable identity: filteredJobList rides the effect deps, a fresh object per
  // call would re-trigger the MOGA fetch forever
  useJobContext: () => ({
    get filteredJobList() {
      return mocks.filteredJobList;
    },
    fetchedJobCollections: [{}],
  }),
}));
vi.mock("../../context/MOGATableContext", () => ({
  // LIVE weights holder: the recalculate-performances effect keys on its identity
  useMOGATableContext: () => ({ weights: mocks.weights }),
}));
vi.mock("../../context/MOGASettingsContext", async importOriginal => {
  return {
    ...(await importOriginal<typeof import("../../context/MOGASettingsContext")>()),
    useMOGASettingsContext: () => ({ mogaSettings: mocks.mogaSettings }),
  };
});

// job uids ride the request body → fresh list per test = fresh session-cache key
const jobs = (tag: string, y2: (i: number) => number) =>
  Array.from({ length: 5 }, (_, i) => ({ uid: `job-${tag}-${i}`, outputs: { y: 10 + i, y2: y2(i) } }));

const mogaResults = (y2: number[]) => ({
  // the raw payload carries the INPUT columns too (row builders read results[inputVar][ndi])
  x1: Array.from({ length: 18 }, (_, i) => 0.1 * i),
  y: Array.from({ length: 18 }, (_, i) => 9 + i),
  y2,
  nonDominatedIndices: [0, 1],
});

const props = { loading: false, jobProgress: 1, colsFetched: { current: 0 }, jobsFetched: { current: 0 } };

const layout = () =>
  JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as {
    xaxis?: { type?: string };
    yaxis?: { type?: string };
    scene?: { xaxis?: { type?: string }; yaxis?: { type?: string }; zaxis?: { type?: string } };
  };

const traces = () =>
  JSON.parse(screen.getByTestId("plotly").getAttribute("data-traces") as string) as Array<
    Record<string, unknown> & { name?: string; type?: string }
  >;

const bodyOf = (fetchMock: { mock: { calls: unknown[][] } }, index = 0) =>
  JSON.parse((fetchMock.mock.calls[index][1] as RequestInit).body as string) as Record<string, unknown>;

// drives the modal exactly as the real one applies a view: selection + updatePlot
const applyModal = (extPlotType: Record<string, string> | undefined, vars: string[]) =>
  act(async () => {
    const m = mocks.modalProps as unknown as {
      setSelectedOptVars: (v: string[]) => void;
      updatePlot: (...args: unknown[]) => Promise<void>;
      tableData: unknown;
    };
    m.setSelectedOptVars(vars);
    await m.updatePlot(mocks.filteredJobList, m.tableData, extPlotType, vars);
  });

const setHovered = (value: number | null) =>
  act(() => {
    (mocks.tableProps as unknown as { setHovered: (v: number | null) => void }).setHovered(value);
  });

describe("MOGAPareto display-scale toggles (B53kq, V12)", () => {
  beforeEach(() => {
    defaults();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("re-types ONE objective axis at a time and never feeds the display choice into the request", async () => {
    mocks.filteredJobList = jobs("moga-log", i => 100 + 10 * i);
    const fetchMock = stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(layout().xaxis?.type).toBeUndefined();
    expect(layout().yaxis?.type).toBeUndefined();

    const xToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-x"]') as HTMLElement);
    fireEvent.click(xToggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(layout().xaxis?.type).toBe("log"));
    // the OTHER objective stays linear — per-axis truth, ⊥ plane-wide coupling
    expect(layout().yaxis?.type).toBeUndefined();

    const yToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-y"]') as HTMLElement);
    fireEvent.click(yToggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(layout().yaxis?.type).toBe("log"));

    // display-only (V12): one request, still carrying the COMPUTE scales
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = bodyOf(fetchMock);
    expect(body.outputLogScales).toEqual({ y: false, y2: false });
  });

  it("disables the log view for the axis whose painted objective values include zero", async () => {
    mocks.filteredJobList = jobs("moga-nonpos", i => (i === 0 ? 0 : 100 + 10 * i));
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const yToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-y"]') as HTMLElement);
    expect((yToggle.getByRole("button", { name: "log" }) as HTMLButtonElement).disabled).toBe(true);
    expect(layout().yaxis?.type).toBeUndefined();
    // the x axis is unaffected — canLog is per axis
    const xToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-x"]') as HTMLElement);
    expect((xToggle.getByRole("button", { name: "log" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("re-seeds the 1D value-axis override when the displayed objective changes", async () => {
    // B56yz (V12): the 1D single-objective view paints selectedOptVars[0]; the
    // y-hook key must follow the DISPLAYED objective, ⊥ freeze on
    // `${uid}|undefined` and strand a manual override onto the next objective.
    mocks.filteredJobList = jobs("moga-1d", i => 100 + 10 * i);
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    await applyModal({ dimensionType: "1D", scaleType: "linear" }, ["y"]);
    let yToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-y"]') as HTMLElement);
    expect(yToggle.getByText("y")).toBeInTheDocument();
    fireEvent.click(yToggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(layout().yaxis?.type).toBe("log"));

    // switch the single displayed objective (same function); y2 computes linear,
    // so the stale manual log MUST drop — not paint y2 on a log axis
    await applyModal(undefined, ["y2"]);
    yToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-y"]') as HTMLElement);
    expect(yToggle.getByText("y2")).toBeInTheDocument();
    expect(layout().yaxis?.type).toBeUndefined();
  });

  it("paints 1D iteration boxes, drops the x toggle and never highlights a hover in 1D", async () => {
    // defaultMogaValues: maxIterations=100 over 18 samples → samplesPerIteration=1,
    // so 18 iteration boxes paint and the empty tail iterations are skipped.
    mocks.filteredJobList = jobs("moga-1d-boxes", i => 100 + 10 * i);
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    await applyModal({ dimensionType: "1D", scaleType: "linear" }, ["y"]);
    expect(document.querySelector('[mmux-testid="moga-pareto-display-scale-x"]')).toBeNull();
    const boxes = traces().filter(t => t.name === "MOGA Evaluations");
    expect(boxes).toHaveLength(18);
    expect(boxes[0].showlegend).toBe(true);
    expect(boxes[1].showlegend).toBe(false);
    // 1D has no Pareto point to highlight: hovering must never add a Selected trace
    setHovered(0);
    expect(traces().filter(t => t.name === "Selected")).toHaveLength(0);
  });

  it("seeds every axis and the modal bulk state from all-log compute scales (V12)", async () => {
    mocks.filteredJobList = jobs("moga-all-log", i => 100 + 10 * i);
    mocks.functionContext.outputLogScales = { "fn-1": { y: true, y2: true } };
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // both objectives compute log → the modal's single control opens on "log"...
    expect(mocks.modalProps?.plotType).toEqual({ dimensionType: "2D", scaleType: "log" });
    // ...and both axes open in log, driven by the per-axis compute defaults
    expect(layout().xaxis?.type).toBe("log");
    expect(layout().yaxis?.type).toBe("log");
  });

  it("applies the modal's linear/log control as a SET-BOTH shortcut onto the axes", async () => {
    mocks.filteredJobList = jobs("moga-setboth", i => 100 + 10 * i);
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    await applyModal({ dimensionType: "2D", scaleType: "log" }, ["y", "y2"]);
    await waitFor(() => expect(layout().xaxis?.type).toBe("log"));
    expect(layout().yaxis?.type).toBe("log");
  });

  it("renders the 3D view with scatter3d traces, a z toggle and a 3D hover highlight", async () => {
    mocks.filteredJobList = Array.from({ length: 5 }, (_, i) => ({
      uid: `job-moga-3d-${i}`,
      outputs: { y: 10 + i, y2: 100 + 10 * i, y3: 1000 + i },
    }));
    mocks.functionContext.outputTargets = { "fn-1": { y: "minimize", y2: "minimize", y3: "minimize" } };
    const payload = {
      ...mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i)),
      y3: Array.from({ length: 18 }, (_, i) => 1000 + i),
    };
    stubFetch(jsonResponse(payload));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    await applyModal({ dimensionType: "3D", scaleType: "linear" }, ["y", "y2", "y3"]);
    expect(mocks.modalProps?.plotType).toEqual({ dimensionType: "3D", scaleType: "linear" });
    expect(
      traces()
        .filter(t => t.name !== "Sample Points")
        .every(t => t.type === "scatter3d" || t.type === "box"),
    ).toBe(true);
    expect(traces().find(t => t.name === "Pareto Front")?.type).toBe("scatter3d");
    // the third axis gets its own toggle only in 3D
    const zToggle = within(document.querySelector('[mmux-testid="moga-pareto-display-scale-z"]') as HTMLElement);
    fireEvent.click(zToggle.getByRole("button", { name: "log" }));
    await waitFor(() => expect(layout().scene?.zaxis?.type).toBe("log"));
    expect(layout().scene?.xaxis?.type).toBeUndefined();

    setHovered(0);
    const selected = traces().find(t => t.name === "Selected");
    expect(selected?.x).toEqual([9]);
    expect(selected?.z).toEqual([1000]);
  });
});

describe("MOGAPareto request lifecycle", () => {
  beforeEach(() => {
    defaults();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the JobsLoading view while the parent reports loading", async () => {
    // empty selection: the effect takes its no-jobs branch, so loading is the
    // ONLY thing on screen — no warning card, no plot, no request
    const fetchMock = stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} loading />);
    await waitFor(() => expect(screen.getByText("jobs-loading")).toBeInTheDocument());
    expect(screen.queryByTestId("plotly")).toBeNull();
    expect(screen.queryByText("You need at least 5 samples.")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("releases loading and warns when no function is selected", async () => {
    mocks.functionContext.selectedFunction = undefined;
    mocks.filteredJobList = [{ uid: "job-moga-nofn-1" }];
    const fetchMock = stubFetch(jsonResponse(mogaResults([])));
    const setCalculating = vi.fn();
    render(<MOGAPareto {...props} setCalculating={setCalculating} />);

    expect(await screen.findByText("You need at least 5 samples.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("No function selected!!");
    expect(setCalculating).toHaveBeenCalledWith(false);
  });

  it("releases loading when no jobs are selected for the plot", async () => {
    mocks.filteredJobList = [];
    const fetchMock = stubFetch(jsonResponse(mogaResults([])));
    const setCalculating = vi.fn();
    render(<MOGAPareto {...props} setCalculating={setCalculating} />);

    expect(await screen.findByText("You need at least 5 samples.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("No jobs selected for MOGA Pareto plot.");
    expect(setCalculating).toHaveBeenCalledWith(false);
  });

  it("flags every objective's compute log scale and the log inputs in the payload (V12)", async () => {
    mocks.filteredJobList = jobs("moga-compute", i => 100 + 10 * i);
    mocks.functionContext.outputLogScales = { "fn-1": { y: true } };
    mocks.functionContext.distribution = { "fn-1": { x1: { distribution: "uniform", min: 0, max: 1, scale: "log" } } };
    const setCalculating = vi.fn();
    const fetchMock = stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} setCalculating={setCalculating} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const body = bodyOf(fetchMock);
    expect(body.inputLogScales).toEqual({ x1: true });
    expect(body.outputLogScales).toEqual({ y: true, y2: false });
    // the x objective computes log → its axis opens in log; the other does not
    expect(layout().xaxis?.type).toBe("log");
    expect(layout().yaxis?.type).toBeUndefined();
    // the success path drives the parent's calculating flag true → false
    expect(setCalculating).toHaveBeenCalledWith(true);
    expect(setCalculating).toHaveBeenLastCalledWith(false);
  });

  it("falls back to an empty objective set when the function has no targets entry", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.filteredJobList = jobs("moga-notargets", i => 100 + 10 * i);
    mocks.functionContext.outputTargets = {}; // persistence restored without this function
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);

    // the scale-detection key falls back to {} and the run fails the OVS read
    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("Error fetching MOGA Pareto data:", expect.any(TypeError));
    errorSpy.mockRestore();
  });

  it("drops constant factors from the optimization payload and the table rows (B50ef)", async () => {
    mocks.filteredJobList = jobs("moga-const", i => 100 + 10 * i);
    mocks.functionContext.inputVars = ["x1", "x2"];
    mocks.functionContext.distribution = {
      "fn-1": { x1: { distribution: "uniform", min: 0, max: 1 }, x2: { distribution: "constant", value: 0.5 } },
    };
    const fetchMock = stubFetch(
      jsonResponse({ ...mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i)), x2: Array(18).fill(0.5) }),
    );
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    const body = bodyOf(fetchMock);
    expect(body.inputVars).toEqual(["x1"]);
    expect(body.distributions).toEqual({ x1: { distribution: "uniform", min: 0, max: 1 } });
    const tableData = mocks.tableProps?.tableData as { inputs: string[]; rows: Array<Record<string, number>> };
    expect(tableData.inputs).toEqual(["x1"]);
    expect(tableData.rows[0]).not.toHaveProperty("x2");
  });

  it("keeps the per-function MOGA settings and slices the post-warmup samples with them", async () => {
    mocks.filteredJobList = jobs("moga-settings", i => 100 + 10 * i);
    mocks.mogaSettings = { "fn-1": { populationSize: 2, maxIterations: 4 } };
    const fetchMock = stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    expect(bodyOf(fetchMock).mogaSettings).toEqual({ populationSize: 2, maxIterations: 4 });
    // 2D: MOGA samples skip populationSize*3 = 6 warmup points
    expect(traces()[1].x).toHaveLength(12);
  });

  it("derives the Pareto front when the payload carries no nonDominatedIndices (V53wp)", async () => {
    mocks.filteredJobList = jobs("moga-ndi", i => 100 + 10 * i);
    const { nonDominatedIndices: _dropped, ...payload } = mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i));
    stubFetch(jsonResponse(payload));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    // both objectives strictly increase → point 0 dominates every other: the front is
    // derived in the FE (V53wp), where the pre-fix code degraded to empty rows (B62wp).
    const tableData = mocks.tableProps?.tableData as { rows: unknown[] };
    expect(tableData.rows).toEqual([{ x1: 0, y: 9, y2: 100, ndi: 0, performance: 1 }]);
    // the Pareto Front trace maps over the single derived index instead of crashing
    expect(traces().find(t => t.name === "Pareto Front")?.x).toEqual([9]);
  });

  it("reports an HTTP error, releases loading and falls back to the no-data warning", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.filteredJobList = jobs("moga-error", i => 100 + 10 * i);
    const setCalculating = vi.fn();
    stubFetch(jsonResponse({ error: "dakota exploded" }, 400));
    render(<MOGAPareto {...props} setCalculating={setCalculating} />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith("Error fetching MOGA Pareto data:", expect.any(Error));
    expect(setCalculating).toHaveBeenLastCalledWith(false);
    errorSpy.mockRestore();
  });

  it("surfaces results missing an objective column through the error path", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.filteredJobList = jobs("moga-missing-col", i => 100 + 10 * i);
    const payload = mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i)) as Record<string, unknown>;
    delete payload.y2; // optimizer returned fewer columns than the requested objectives
    stubFetch(jsonResponse(payload));
    render(<MOGAPareto {...props} />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("Error fetching MOGA Pareto data:", expect.any(TypeError));
    errorSpy.mockRestore();
  });

  it("keeps the newest generation when an older MOGA request resolves last (V45gd)", async () => {
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(
      stale,
      jsonResponse({
        ...mogaResults(Array.from({ length: 18 }, (_, i) => 200 + i)),
        y: Array.from({ length: 18 }, (_, i) => 109 + i),
      }),
    );
    mocks.filteredJobList = jobs("moga-stale-a", i => 100 + 10 * i);
    const { rerender } = render(<MOGAPareto {...props} />);
    // gen 1 stays in flight: only the "Calculating..." card is on screen
    expect(await screen.findByText("Calculating...")).toBeInTheDocument();

    // a newer selection supersedes the pending request while it is in flight
    mocks.filteredJobList = jobs("moga-stale-b", i => 100 + 10 * i);
    rerender(<MOGAPareto {...props} />);
    await waitFor(() => expect((mocks.tableProps?.tableData as { raw: { y: number[] } }).raw.y[0]).toBe(109));

    // the superseded generation lands late: it must not overwrite the newer table
    await act(async () => {
      resolveStale(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
    expect((mocks.tableProps?.tableData as { raw: { y: number[] } }).raw.y[0]).toBe(109);
  });

  it("absorbs a late failure that lands after unmount (V45gd)", async () => {
    let settleLate: (r: Response) => void = () => undefined;
    const late = () => new Promise<Response>(resolve => (settleLate = resolve));
    stubFetch(late);
    mocks.filteredJobList = jobs("moga-unmount", i => 100 + 10 * i);
    const { unmount } = render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByText("Calculating...")).toBeInTheDocument());

    unmount();
    await act(async () => {
      settleLate(jsonResponse({ error: "gone" }, 400));
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
    // the superseded generation's error is absorbed at the seam: no commit, no console.error
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("MOGAPareto performance calculation", () => {
  beforeEach(() => {
    defaults();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("zeroes the normalized difference when an objective's min equals its max", async () => {
    mocks.filteredJobList = jobs("moga-equal", i => 100 + 10 * i);
    const payload = mogaResults(Array.from({ length: 18 }, (_, i) => 100 + (i % 2) * 10));
    payload.y = Array(18).fill(9); // identical values → minMax collapses to one point
    stubFetch(jsonResponse(payload));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    expect(console.warn).toHaveBeenCalledWith("Normalized difference setting to zero bcs MinMax is identical");
    const tableData = mocks.tableProps?.tableData as { rows: Array<Record<string, number>> };
    // y contributes 0, y2 minimizes normally → the weighted mean stays in [0,1]
    expect(tableData.rows[0].performance).toBeCloseTo(0.5, 5);
  });

  it("walks the whole weight/performance branch matrix when weights change", async () => {
    mocks.filteredJobList = jobs("moga-weights", i => 100 + 10 * i);
    mocks.functionContext.outputTargets = { "fn-1": { y: "minimize", y2: "maximize" } };
    const payload = mogaResults([90, 100, ...Array.from({ length: 16 }, (_, i) => 90 + (i % 2) * 10)]);
    const fetchMock = stubFetch(jsonResponse(payload));
    const { rerender } = render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    // maximize travels into the request payload too
    expect(bodyOf(fetchMock).outputVarSelection).toEqual({ y: "minimize", y2: "maximize" });

    // {y:2, y2:-1}: row 0 = 2*1 - 1*0 = 2 (>1, out of bounds), row 1 = 2*(16/17) - 1*1
    mocks.weights = { y: 2, y2: -1 };
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[0].performance).toBe(2),
    );
    expect(console.warn).toHaveBeenCalledWith("Performance calculation out of bounds:", 2, expect.anything());

    // {y:-1, y2:2}: row 0 = -1*1 + 2*0 = -1 (<0, out of bounds)
    mocks.weights = { y: -1, y2: 2 };
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[0].performance).toBe(-1),
    );
    expect(console.warn).toHaveBeenCalledWith("Performance calculation out of bounds:", -1, expect.anything());

    // a weight key the optimizer never explored → all weights resolve to 0 via `|| 0`
    mocks.weights = { z: 5 };
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[0].performance).toBeNaN(),
    );
    expect(console.warn).toHaveBeenCalledWith("weightSum is equal to zero! Setting performance to NaN ");

    // all-zero weights are rejected up front
    mocks.weights = { y: 0, y2: 0 };
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[1].performance).toBeNaN(),
    );

    // weights not hydrated yet (undefined) → the early bail-out warns and yields NaN
    mocks.weights = undefined;
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[0].performance).toBeNaN(),
    );
    expect(console.warn).toHaveBeenCalledWith("Weights passed to calculate performance are empty! ", undefined);

    // negative total weight → NaN via the "smaller than zero" arm
    mocks.weights = { y: -1, y2: -2 };
    rerender(<MOGAPareto {...props} />);
    await waitFor(() =>
      expect((mocks.tableProps?.tableData as { rows: Array<Record<string, number>> }).rows[0].performance).toBeNaN(),
    );
    expect(console.warn).toHaveBeenCalledWith("weightedSum is smaller than zero! Setting performance to NaN");

    // recalculation without a selected function is a silent no-op
    const before = mocks.tableProps?.tableData;
    mocks.functionContext.selectedFunction = undefined;
    mocks.weights = { y: 1, y2: 1 };
    rerender(<MOGAPareto {...props} />);
    await act(async () => undefined);
    expect(mocks.tableProps?.tableData).toBe(before);
  });

  it("warns and falls back to the error path when no objective is selected", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.filteredJobList = jobs("moga-novars", i => 100 + 10 * i);
    mocks.functionContext.outputTargets = { "fn-1": {} };
    const fetchMock = stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(bodyOf(fetchMock).outputVarSelection).toEqual({});
    expect(console.warn).toHaveBeenCalledWith("OutputVarSelection passed to performance calculation is empty!");
    expect(errorSpy).toHaveBeenCalledWith("Error fetching MOGA Pareto data:", expect.any(TypeError));
    errorSpy.mockRestore();
  });

  it("recalculates the Pareto highlight: hover a row, hover a stale id, then leave", async () => {
    mocks.filteredJobList = jobs("moga-hover", i => 100 + 10 * i);
    stubFetch(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i))));
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());

    setHovered(1);
    const selected = traces().filter(t => t.name === "Selected");
    expect(selected).toHaveLength(1);
    expect(selected[0].x).toEqual([10]);
    expect(selected[0].y).toEqual([101]);
    expect(selected[0].z).toBeUndefined();

    // an id no row owns: the highlight cannot be rebuilt — the previous one stays
    setHovered(999);
    expect(traces().filter(t => t.name === "Selected")).toHaveLength(1);

    setHovered(null);
    expect(traces().filter(t => t.name === "Selected")).toHaveLength(0);

    // leaving again (nothing selected) must not churn the trace list
    setHovered(null);
    expect(traces().filter(t => t.name === "Selected")).toHaveLength(0);

    // an updatePlot without an explicit selection falls back to the tracked vars
    await act(async () => {
      const m = mocks.modalProps as unknown as { updatePlot: (...args: unknown[]) => void; tableData: unknown };
      m.updatePlot(mocks.filteredJobList, m.tableData, undefined, undefined);
    });
    expect(traces().find(t => t.name === "Pareto Front")?.x).toEqual([9, 10]);
  });
});

describe("MOGAPareto raw-data download (T30ln(b) replay, fork issue #79)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const downloadButton = () =>
    (document.querySelector('[mmux-testid="download-moga-data-btn"]') as HTMLElement).querySelector("button") as HTMLElement;
  it("exports the optimization response the front was computed from, without any refetch", async () => {
    mocks.filteredJobList = jobs("moga-dl", i => 100 + 10 * i);
    const payload = mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i));
    const fetchMock = stubFetch(jsonResponse(payload));
    const downloads = captureBlobDownloads();
    render(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    fireEvent.click(downloadButton());
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("moga-pareto-fn-1.json");
    // verbatim: the raw backend payload, wrapper shape included — no client-side reshape
    expect(JSON.parse(await downloads[0].text())).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1); // ⊥ refetch on download
  });
  it("keeps a late-resolving older optimization out of the download (V45gd commit)", async () => {
    mocks.filteredJobList = jobs("moga-dl-stale-a", i => 100 + 10 * i);
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    const newest = mogaResults(Array.from({ length: 18 }, (_, i) => 100 + i));
    const fetchMock = stubFetch(stale, jsonResponse(newest));
    const { rerender } = render(<MOGAPareto {...props} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // a fresh job selection supersedes generation 1; generation 2 resolves first
    mocks.filteredJobList = jobs("moga-dl-stale-b", i => 200 + 10 * i);
    rerender(<MOGAPareto {...props} />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    await act(async () => resolveStale(jsonResponse(mogaResults(Array.from({ length: 18 }, (_, i) => 999 + i)))));
    const downloads = captureBlobDownloads();
    fireEvent.click(downloadButton());
    expect(JSON.parse(await downloads[0].text())).toEqual(newest); // only the committed generation
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// B62wp (V53wp): the itis-sumo port dropped non_dominated_indices from the wire
// (ParetoFrontResult.data carries value columns only), so the front is derived
// in FE from the result arrays + each objective's direction. Pure function —
// unit-tested directly, no render needed.
describe("deriveNonDominatedIndices (B62wp, V53wp)", () => {
  it("keeps mutually non-dominated ties and drops strictly dominated rows (minimize)", () => {
    // i=2 (3,2) is dominated by i=1 (2,1); i=4 (5,1) by i=1. i=0/i=3 tie at
    // (1,4) — ties are never dominated, both stay on the front.
    expect(
      deriveNonDominatedIndices({ y: [1, 2, 3, 1, 5], y2: [4, 1, 2, 4, 1] }, ["y", "y2"], {
        y: "minimize",
        y2: "minimize",
      }),
    ).toEqual([0, 1, 3]);
  });
  it("reads the direction per objective: maximize keeps the max, minimize the min (ties kept)", () => {
    const results = { y: [3, 1, 1] };
    expect(deriveNonDominatedIndices(results, ["y"], { y: "maximize" })).toEqual([0]);
    expect(deriveNonDominatedIndices(results, ["y"], { y: "minimize" })).toEqual([1, 2]);
  });
  it("returns [] without objectives or without rows (and a missing direction defaults to minimize)", () => {
    expect(deriveNonDominatedIndices({ y: [3, 1, 2] }, [], {})).toEqual([]);
    expect(deriveNonDominatedIndices({ y: [] }, ["y"], { y: "minimize" })).toEqual([]);
    // unlisted direction == minimize, like calculatePerformance's reading
    expect(deriveNonDominatedIndices({ y: [3, 1, 2] }, ["y"], {})).toEqual([1]);
  });
});
