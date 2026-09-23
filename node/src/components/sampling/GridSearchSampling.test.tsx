import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GridSearchSampling from "./GridSearchSampling";
import { jsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const mocks = vi.hoisted(() => ({
  gridSamplingConfig: [] as GridSamplingConfig,
  setGridSamplingConfig: vi.fn(),
  setLaunchingSampling: vi.fn(),
  setRunningSampling: vi.fn(),
  setRunningJobCollection: vi.fn(),
  runResult: undefined as Promise<string> | undefined,
}));

vi.mock("../../context/FunctionContext", () => {
  const value = {
    selectedFunction: { uid: "fn-1" },
    inputVars: ["x1"],
    distribution: { "fn-1": { x1: { distribution: "uniform", min: 1, max: 3 } } },
  };
  return { useFunctionContext: () => value };
});
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    gridSamplingConfig: mocks.gridSamplingConfig,
    setGridSamplingConfig: mocks.setGridSamplingConfig,
    setLaunchingSampling: mocks.setLaunchingSampling,
    setRunningSampling: mocks.setRunningSampling,
  }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ setRunningJobCollection: mocks.setRunningJobCollection }),
}));
vi.mock("../setup/VariableConfig", () => ({
  default: ({ inputVar }: { inputVar: { variable: string; start: number; end: number } }) => (
    <span>{`${inputVar.variable}:${inputVar.start}-${inputVar.end}`}</span>
  ),
}));
vi.mock("./RunSamplingButton", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RunSamplingButton: ({ handleRunSampling }: { handleRunSampling: () => Promise<void> }) => (
    <button
      type="button"
      onClick={() => {
        mocks.runResult = handleRunSampling().then(
          () => "resolved",
          (error: Error) => `rejected: ${error.message}`,
        );
      }}
    >
      Run sampling
    </button>
  ),
}));

async function run() {
  render(<GridSearchSampling />);
  fireEvent.click(await screen.findByRole("button", { name: "Run sampling" }));
  return mocks.runResult as Promise<string>;
}

describe("GridSearchSampling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.gridSamplingConfig = [];
    mocks.runResult = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("seeds the grid from the parameter ranges and launches it", async () => {
    const collection = { uid: "jc-grid" };
    const fetchMock = stubFetch(jsonResponse(collection));

    expect(await run()).toBe("resolved");
    expect(screen.getByText("x1:1-3")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/flask/sampling/grid");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ funUid: "fn-1", config: [{ variable: "x1", start: 1, end: 3 }] });
    expect(mocks.setGridSamplingConfig).toHaveBeenCalledWith([{ variable: "x1", start: 1, end: 3 }]);
    expect(mocks.setRunningSampling).toHaveBeenCalledWith(true);
    expect(mocks.setRunningJobCollection).toHaveBeenCalledWith(collection);
  });

  it("keeps a persisted grid configuration", async () => {
    mocks.gridSamplingConfig = [{ variable: "x1", start: 0, end: 9, points: 4 }] as never;
    render(<GridSearchSampling />);
    expect(await screen.findByText("x1:0-9")).toBeInTheDocument();
  });

  it("rejects with the backend's status and text so the run button can report it", async () => {
    stubFetch(textResponse("too many points", 422));

    expect(await run()).toBe("rejected: POST /flask/sampling/grid failed with 422: too many points");
    expect(mocks.setRunningSampling).not.toHaveBeenCalled();
    expect(mocks.setRunningJobCollection).not.toHaveBeenCalled();
  });

  it("rejects on a network failure", async () => {
    stubFetch(networkError());
    expect(await run()).toBe("rejected: POST /flask/sampling/grid failed: Failed to fetch");
    expect(mocks.setRunningSampling).not.toHaveBeenCalled();
  });
});
