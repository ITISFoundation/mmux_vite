import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOGAPareto } from "./MOGAPareto";
import { jsonResponse, stubFetch } from "../../test/fetchStub";

const mocks = vi.hoisted(() => ({
  filteredJobList: [] as Array<Record<string, unknown>>,
}));

vi.mock("react-plotly.js", () => import("../../test/plotlyMock"));
vi.mock("../../utils/useAutoDetectQoiScale", () => ({ useAutoDetectQoiScale: () => undefined }));
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock("./MOGAPlotModal", () => ({ MOGAPlotModal: () => null }));
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
});
