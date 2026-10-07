import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UncertainUQ from "./UncertainUQ";
import { jsonResponse, stubFetch } from "../../test/fetchStub";

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<{ uid: string }>,
  selectedQoI: "y" as string | undefined,
  uqSettings: {},
  fetchedJobCollections: [{}],
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ uqSettings: mocks.uqSettings, selectedQoI: mocks.selectedQoI }),
}));
vi.mock("../../context/FunctionContext", () => {
  const value = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1", "x2"],
    distribution: {},
    // #663 replay: context contract grows the log-scale maps + setter consumed
    // by the auto-detect hook (stub jobs carry no outputs, so it stays inert).
    outputLogScales: {},
    outputLogScaleUserSet: {},
    setOutputLogScales: () => undefined,
    qoiScaleEvidence: {},
    setQoiScaleEvidence: () => undefined,
  };
  return { useFunctionContext: () => value };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: mocks.fetchedJobCollections }),
}));

const histogramPayload = (binMeans: number[]) => ({
  binsStart: 0,
  binsEnd: 2,
  binMeans,
  binStds: [0.1, 0.1],
  q1: 0.5,
  median: 1,
  q3: 1.5,
  whiskerMin: 0,
  whiskerMax: 2,
  outliers: [],
  mean: 1,
  std: 0.5,
  min: 0,
  max: 2,
});

function firstBarY(): number[] {
  const plot = screen.getByTestId("plotly");
  return (JSON.parse(plot.getAttribute("data-traces") as string) as Array<{ y: number[] }>)[0].y;
}

describe("UncertainUQ fetch freshness (V45gd)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the newest QoI histogram when an older request resolves last", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(histogramPayload([5, 6])));

    const props = {
      loading: false,
      jobProgress: 0,
      colsFetched: { current: 1 },
      jobsFetched: { current: 3 },
    } as const;
    const { rerender } = render(<UncertainUQ {...props} />);
    mocks.selectedQoI = "z";
    rerender(<UncertainUQ {...props} />);

    await waitFor(() => expect(firstBarY()).toEqual([5, 6]));

    await act(async () => resolveStale(jsonResponse(histogramPayload([1, 2]))));
    expect(firstBarY()).toEqual([5, 6]);
  });

  it("V46sc serves a remount from the session cache with ZERO network", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    const fetchMock = stubFetch(jsonResponse(histogramPayload([5, 6])));

    const props = {
      loading: false,
      jobProgress: 0,
      colsFetched: { current: 1 },
      jobsFetched: { current: 3 },
    };
    const { unmount } = render(<UncertainUQ {...props} />);
    await waitFor(() => expect(firstBarY()).toEqual([5, 6]));

    unmount();
    render(<UncertainUQ {...props} />);

    // cached success answers synchronously: same histogram, no second request
    await waitFor(() => expect(firstBarY()).toEqual([5, 6]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("V46sc misses when numSamples changes (every sent parameter keys the entry)", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    const fetchMock = stubFetch(jsonResponse(histogramPayload([5, 6])), jsonResponse(histogramPayload([7, 8])));

    const props = {
      loading: false,
      jobProgress: 0,
      colsFetched: { current: 1 },
      jobsFetched: { current: 3 },
    };
    const { rerender } = render(<UncertainUQ {...props} />);
    await waitFor(() => expect(firstBarY()).toEqual([5, 6]));

    mocks.uqSettings = { "fn-1": { numSamples: 101 } };
    rerender(<UncertainUQ {...props} />);

    await waitFor(() => expect(firstBarY()).toEqual([7, 8]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    mocks.uqSettings = {};
  });
});
