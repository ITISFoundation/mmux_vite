import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Surface2DPlot from "./Surface2DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

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
    useFunctionContext: () => ({ selectedFunction, inputVars: mocks.inputVars, distribution }),
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

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();

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
