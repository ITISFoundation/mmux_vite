import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CorrelationIndicesPlot from "./CorrelationIndicesPlot";
import { jsonResponse, stubFetch } from "../../test/fetchStub";

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<{ uid: string }>,
  selectedQoI: "y" as string | undefined,
  uqSettings: {},
  fetchedJobCollections: [{}],
  // Mutable so a test can flip the committed output scale under a MOUNTED
  // panel — the B58rs scenario (auto-detect commits while the panel sits).
  contextValue: {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1", "x2"],
    distribution: {},
    outputLogScales: {} as { [fnUid: string]: { [qoi: string]: boolean } },
  },
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ uqSettings: mocks.uqSettings, selectedQoI: mocks.selectedQoI }),
}));
vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => mocks.contextValue }));
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

  it("refetches with the committed scale when an output scale flips under the mounted panel (GH-Copilot #706, B58rs)", async () => {
    mocks.filteredJobList = Array.from({ length: 3 }, (_, i) => ({ uid: `job-${i}` }));
    mocks.selectedQoI = "y";
    mocks.contextValue.outputLogScales = {};
    const fetchMock = stubFetch(jsonResponse(corrPayload([0.6, 0.4])));

    const { rerender } = render(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);
    await waitFor(() => expect(firstBarY()).toEqual([0.6, 0.4]));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // useAutoDetectQoiScale commits a LOG verdict for the QoI while the panel
    // is still mounted. Before the deps fix the request read the flag but no
    // dep changed → the panel kept painting the all-linear result (⊥ V12).
    mocks.contextValue.outputLogScales = { "fn-1": { y: true } };
    rerender(<CorrelationIndicesPlot viewMode="pearson" scaleType="linear" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body.outputLogScales).toEqual({ y: true }); // refetch carries the scale
  });
});
