import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IsoSurface3DPlot from "./IsoSurface3DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const jobs = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<{ uid: string }>,
  setOtherAxis: undefined as undefined | ((v: Record<string, number>) => void),
  setAxis: {} as Record<number, (axis: string) => void>,
  axes: {} as Record<number, string>,
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ selectedQoI: "y" }) }));
vi.mock("../../context/FunctionContext", () => {
  const u = (min: number) => ({ distribution: "uniform", min, max: min + 1 });
  const value = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1", "x2", "x3", "x4"],
    distribution: { "fn-1": { x1: u(0), x2: u(0), x3: u(0), x4: u(7) } },
  };
  return { useFunctionContext: () => value };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: [{}] }),
}));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("./CalculatingWarning", () => ({ default: () => <div>Calculating</div> }));
vi.mock("./PlotTools", () => ({
  plotMarginsNarrow: {},
  filterInputVars: () => ["x1", "x2", "x3", "x4"],
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

describe("IsoSurface3DPlot", () => {
  beforeEach(() => {
    mocks.filteredJobList = jobs;
    mocks.setOtherAxis = undefined;
    mocks.setAxis = {};
    mocks.axes = {};
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
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ gridVars: ["x1", "x2", "x3"], sliderValues: { x4: 7 } });
  });

  it.each([
    ["HTTP 500", () => textResponse("boom", 500), "Error running SuMo 3D plot: .* failed with 500: boom"],
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
