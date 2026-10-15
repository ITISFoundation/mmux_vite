import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOGAPareto } from "./MOGAPareto";
import { jsonResponse, stubFetch } from "../../test/fetchStub";
import { captureBlobDownloads } from "../../test/downloadCapture";

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<Record<string, unknown>>,
  modalProps: undefined as Record<string, unknown> | undefined,
}));

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
vi.mock("./MOGAParetoTable", () => ({ default: () => null }));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("../data/JobsLoading", () => ({ JobsLoading: () => null }));
vi.mock("../../context/FunctionContext", () => {
  const value = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1"],
    distribution: { "fn-1": { x1: { distribution: "uniform", min: 0, max: 1 } } },
    outputTargets: { "fn-1": { y: "minimize", y2: "minimize" } },
    outputLogScales: {},
  };
  return { useFunctionContext: () => value };
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
vi.mock("../../context/MOGATableContext", () => {
  const value = { weights: { y: 1, y2: 1 } };
  return { useMOGATableContext: () => value };
});
vi.mock("../../context/MOGASettingsContext", async importOriginal => {
  const value = { mogaSettings: {} };
  return {
    ...(await importOriginal<typeof import("../../context/MOGASettingsContext")>()),
    useMOGASettingsContext: () => value,
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
  };

describe("MOGAPareto display-scale toggles (B53kq, V12)", () => {
  beforeEach(() => {
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
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
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

    // drive the modal exactly as the real one applies a view: selection + updatePlot
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
