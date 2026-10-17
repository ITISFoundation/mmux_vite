import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Surface2DPlot from "./Surface2DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";
import { captureBlobDownloads } from "../../test/downloadCapture";

const jobs = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

const mocks = vi.hoisted(() => ({
  inputVars: ["x1", "x2", "x3"],
  filteredJobList: [] as Array<{ uid: string }>,
  setOtherAxis: undefined as undefined | ((v: Record<string, number>) => void),
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ selectedQoI: "y" }) }));
vi.mock("../../context/FunctionContext", () => {
  const distribution = {
    "fn-1": {
      x1: { distribution: "uniform", min: 0, max: 1 },
      x2: { distribution: "uniform", min: 0, max: 1 },
      x3: { distribution: "uniform", min: 5, max: 6 },
    },
  };
  const selectedFunction = { uid: "fn-1" };
  return {
    // #663 replay: FunctionContext now carries the per-function QoI log-scale map.
    useFunctionContext: () => ({ selectedFunction, inputVars: mocks.inputVars, distribution, outputLogScales: {} }),
  };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: [{}] }),
}));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("./PlotTools", () => ({
  plotMarginsNarrow: {},
  filterInputVars: () => mocks.inputVars,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSelect: () => null,
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

describe("Surface2DPlot", () => {
  beforeEach(() => {
    mocks.inputVars = ["x1", "x2", "x3"];
    mocks.filteredJobList = jobs;
    mocks.setOtherAxis = undefined;
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
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ gridVars: ["x1", "x2"], output: "y", sliderValues: { x3: 5 } });

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
    mocks.inputVars = ["x1", "x2", "x3"];
    mocks.setOtherAxis = undefined;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // job uids ride the request body → fresh list per test = fresh cache key
  const freshJobs = (tag: string) => Array.from({ length: 5 }, (_, i) => ({ uid: `job-${tag}-${i}` }));

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
    const layout = JSON.parse(screen.getByTestId("plotly").getAttribute("data-layout") as string) as {
      scene?: { zaxis?: { type?: string } };
    };
    expect(layout.scene?.zaxis?.type).toBeUndefined();

    // display-only (V12): the request still carries the COMPUTE scale
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.outputLogScales).toEqual({ y: false });
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

  it("hides the download while a selection change is still propagating (payload↔filename agreement)", async () => {
    mocks.filteredJobList = freshJobs("2d-dl-pending");
    let resolveNext: (r: Response) => void = () => undefined;
    const fetchMock = stubFetch(
      jsonResponse(
        grid([
          [1, 2],
          [3, 4],
        ]),
      ),
      () => new Promise<Response>(resolve => (resolveNext = resolve)),
    );
    render(<Surface2DPlot />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(document.querySelector('[mmux-testid="download-surface2d-data-btn"]')).toBeInTheDocument();

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 0, x3: 5.5 })); // refetch starts; the stale surface stays
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    // Copilot #741: an axis swap renamed the export (…-x1-x3.json) while the OLD x1/x2
    // grid was still the only payload — while pending, the export is gone
    expect(screen.getByTestId("plotly")).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-surface2d-data-btn"]')).toBeNull();

    await act(async () =>
      resolveNext(
        jsonResponse(
          grid([
            [5, 6],
            [7, 8],
          ]),
        ),
      ),
    );
    await waitFor(() => expect(document.querySelector('[mmux-testid="download-surface2d-data-btn"]')).toBeInTheDocument());
  });

  it("offers no download after a failed fetch", async () => {
    mocks.filteredJobList = freshJobs("2d-dl-fail");
    stubFetch(textResponse("bad grid", 422));
    render(<Surface2DPlot />);
    expect(await screen.findByText(/failed/)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="download-surface2d-data-btn"]')).toBeNull();
  });
});
