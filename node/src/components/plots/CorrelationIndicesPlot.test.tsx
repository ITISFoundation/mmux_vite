import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CorrelationIndicesPlot from "./CorrelationIndicesPlot";
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
  const value = { selectedFunction: { uid: "fn-1" }, inputVars: ["x1", "x2"], distribution: {} };
  return { useFunctionContext: () => value };
});
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: mocks.filteredJobList, fetchedJobCollections: mocks.fetchedJobCollections }),
}));

const corrPayload = (pearson: number[]) => ({
  correlations: Object.fromEntries(["x1", "x2"].map((v, i) => [v, { pearson: pearson[i], spearman: pearson[i] }])),
});

function firstBarY(): number[] {
  const plot = screen.getByTestId("plotly");
  return (JSON.parse(plot.getAttribute("data-traces") as string) as Array<{ y: number[] }>)[0].y;
}

describe("CorrelationIndicesPlot fetch freshness (V45gd)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the newest QoI result when an older request resolves last", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    let resolveStale: (r: Response) => void = () => undefined;
    const stale = () => new Promise<Response>(resolve => (resolveStale = resolve));
    stubFetch(stale, jsonResponse(corrPayload([0.6, 0.4])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    mocks.selectedQoI = "z";
    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);

    await waitFor(() => expect(firstBarY()).toEqual([0.6, 0.4]));

    await act(async () => resolveStale(jsonResponse(corrPayload([0.1, 0.2]))));
    expect(firstBarY()).toEqual([0.6, 0.4]);
  });
});
