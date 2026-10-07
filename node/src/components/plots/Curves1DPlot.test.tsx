import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Curves1DPlots from "./Curves1DPlot";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const jobs = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<{ uid: string }>,
  setOtherAxis: undefined as undefined | ((v: Record<string, number>) => void),
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ selectedQoI: "y" }) }));
vi.mock("../../context/FunctionContext", () => {
  const value = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1", "x2"],
    distribution: {
      "fn-1": { x1: { distribution: "uniform", min: 0, max: 1 }, x2: { distribution: "uniform", min: 2, max: 3 } },
    },
    // #663 replay: FunctionContext now carries the per-function QoI log-scale map.
    outputLogScales: {},
  };
  return { useFunctionContext: () => value };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: [{}] }),
}));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("./PlotTools", () => ({
  filterInputVars: () => ["x1", "x2"],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSelect: () => null,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSlider: ({ setOtherAxis }: { setOtherAxis: (v: Record<string, number>) => void }) => {
    mocks.setOtherAxis = setOtherAxis;
    return null;
  },
}));

const predictions = (y: number[]) => ({ predictions: { x1: { x: [0, 1], yHat: y, stdHat: [0.1, 0.1] } } });

function traces() {
  const plot = screen.getByTestId("plotly");
  return JSON.parse(plot.getAttribute("data-traces") as string) as Array<{ y: number[]; name: string }>;
}

describe("Curves1DPlot", () => {
  beforeEach(() => {
    mocks.filteredJobList = jobs;
    mocks.setOtherAxis = undefined;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("plots the prediction with a 95% band and does not refetch identical inputs", async () => {
    const fetchMock = stubFetch(jsonResponse(predictions([1, 2])));
    const { rerender } = render(<Curves1DPlots />);

    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(traces().map(t => t.name)).toEqual(["Model prediction", "x1+2σ", "x1+/-2σ (95% Confidence Interval)"]);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    // #663 replay: the legacy single `log` flag is replaced by the per-variable
    // maps (all-false defaults here; the session-cache key rides the body).
    expect(body).toMatchObject({
      inputs: ["x1", "x2"],
      output: "y",
      sliderValues: { x1: 0, x2: 2 },
      inputLogScales: { x1: false, x2: false },
      outputLogScales: { y: false },
    });

    mocks.filteredJobList = [...jobs];
    rerender(<Curves1DPlots />);
    await act(async () => undefined);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["HTTP 500", () => textResponse("dakota crashed", 500)],
    ["network failure", () => networkError()],
    ["malformed JSON", () => malformedJsonResponse()],
  ])("shows a calculation error on %s and retries identical inputs afterwards", async (_label, failure) => {
    const fetchMock = stubFetch(failure(), jsonResponse(predictions([1, 2])));
    const { rerender } = render(<Curves1DPlots />);

    expect(await screen.findByText(/failed|invalid JSON/)).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull();

    mocks.filteredJobList = [...jobs];
    rerender(<Curves1DPlots />);
    await waitFor(() => expect(screen.getByTestId("plotly")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a response without predictions as no data instead of crashing", async () => {
    stubFetch(jsonResponse({ unexpected: true }));
    render(<Curves1DPlots />);

    expect(await screen.findByText("Error during calculation, please contact support.")).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith("No data available for plotting.");
  });

  it("does not request a surrogate without enough selected jobs", async () => {
    mocks.filteredJobList = [];
    const fetchMock = stubFetch(jsonResponse(predictions([1, 2])));
    render(<Curves1DPlots />);

    expect(await screen.findByText(/You need at least 5 samples/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the newest slider result when an older request resolves last", async () => {
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(predictions([7, 8])));
    render(<Curves1DPlots />);

    await waitFor(() => expect(mocks.setOtherAxis).toBeDefined());
    act(() => mocks.setOtherAxis?.({ x1: 0, x2: 2.5 }));
    await waitFor(() => expect(traces()[0].y).toEqual([7, 8]));

    await act(async () => resolveStale(jsonResponse(predictions([1, 2]))));
    expect(traces()[0].y).toEqual([7, 8]);
  });

  it("V45gd releases loading when jobs are deselected during a pending request", async () => {
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    const fetchMock = stubFetch(stale);

    const { rerender } = render(<Curves1DPlots />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/You need at least 5 samples/)).toBeNull(); // blank while computing

    act(() => {
      mocks.filteredJobList = [];
    });
    rerender(<Curves1DPlots />);

    // the deselection supersedes the pending request; the new (empty) generation
    // must release loading so the sample-count explanation replaces the blank plot
    expect(await screen.findByText(/You need at least 5 samples/)).toBeInTheDocument();
    await act(async () => resolveStale(jsonResponse(predictions([1, 2]))));
    expect(screen.getByText(/You need at least 5 samples/)).toBeInTheDocument();
    expect(screen.queryByTestId("plotly")).toBeNull(); // stale result gated
  });
});
