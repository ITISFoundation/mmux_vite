import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LHSSampling from "./LHSSampling";
import { getFunctionJobsFromFunctionJobCollection } from "../../utils/functionUtils";

const mocks = vi.hoisted(() => ({
  permissions: "WRITE",
  lhsSamplingConfig: { inputs: [], points: 20, seed: 7 } as LHSamplingConfig,
  fetchedJobCollections: [] as SelectedJobCollection[],
  setLhsSamplingConfig: vi.fn(),
  setLaunchingSampling: vi.fn(),
  setRunningSampling: vi.fn(),
  setRunningJobCollection: vi.fn(),
  setFetchedJobCollections: vi.fn(),
  runResult: undefined as Promise<string> | undefined,
}));

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() } }));
vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: { uid: "function-1" },
    inputVars: ["alpha", "beta"],
    distribution: {},
  }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    fetchedJobCollections: mocks.fetchedJobCollections,
    setFetchedJobCollections: mocks.setFetchedJobCollections,
    setRunningJobCollection: mocks.setRunningJobCollection,
  }),
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    lhsSamplingConfig: mocks.lhsSamplingConfig,
    setLhsSamplingConfig: mocks.setLhsSamplingConfig,
    setLaunchingSampling: mocks.setLaunchingSampling,
    setRunningSampling: mocks.setRunningSampling,
  }),
}));
vi.mock("../../context/ServiceContext", () => ({ useServiceContext: () => ({ permissions: mocks.permissions }) }));
vi.mock("../../utils/functionUtils", () => ({
  getFunctionJobsFromFunctionJobCollection: vi.fn(),
  getJobStatusCounts: () => ({ success: 3, running: 0, pending: 0, failed: 1 }),
}));
vi.mock("../../utils/sampling", () => ({ getSamplingStartValue: () => 0, getSamplingEndValue: () => 1 }));
vi.mock("../plots/PlotTools", () => ({ filterInputVars: () => ["alpha", "beta"] }));
vi.mock("../setup/VariableConfig", () => ({
  default: ({ inputVar }: { inputVar: { variable: string } }) => <span>{inputVar.variable}</span>,
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

const jobCollection = { uid: "jc-1", title: "LHS run", jobIds: ["job-1"] };

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function run() {
  render(<LHSSampling />);
  fireEvent.click(await screen.findByRole("button", { name: "Run sampling" }));
  expect(mocks.runResult).toBeDefined();
  return mocks.runResult as Promise<string>;
}

describe("LHSSampling", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.permissions = "WRITE";
    mocks.lhsSamplingConfig = { inputs: [], points: 20, seed: 7 };
    mocks.fetchedJobCollections = [];
    mocks.runResult = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the LHS config and appends the launched collection", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(jobCollection), { status: 200 }));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([{ uid: "job-1", status: "PENDING" }] as never);

    await expect(await run()).toBe("resolved");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/flask/sampling/lhs");
    expect(JSON.parse(init.body as string)).toEqual({
      funUid: "function-1",
      config: [
        { variable: "alpha", start: 0, end: 1 },
        { variable: "beta", start: 0, end: 1 },
      ],
      seed: 7,
      N: 20,
    });
    expect(mocks.setLaunchingSampling).toHaveBeenNthCalledWith(1, true);
    expect(mocks.setLaunchingSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningSampling).toHaveBeenCalledWith(true);
    expect(mocks.setRunningJobCollection).toHaveBeenCalledWith(jobCollection);
    expect(mocks.setFetchedJobCollections).toHaveBeenCalledWith([
      { jobCollection, selected: true, subJobs: [{ selected: false, job: { uid: "job-1", status: "PENDING" } }] },
    ]);
  });

  it("surfaces the backend's error text and resets sampling flags on a non-OK response", async () => {
    stubFetch(new Response("N must be <= 50", { status: 422 }));

    expect(await run()).toBe("rejected: Error running LHS sampling: 422: N must be <= 50");
    expect(toast.error).toHaveBeenCalledWith("Error running LHS sampling: 422: N must be <= 50");
    expect(mocks.setLaunchingSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningJobCollection).not.toHaveBeenCalled();
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
  });

  it("propagates a network failure so the run button can recover", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    expect(await run()).toBe("rejected: Failed to fetch");
    expect(mocks.setRunningSampling).not.toHaveBeenCalledWith(true);
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
  });

  it("reports a failed job lookup after a successful launch without corrupting the table", async () => {
    stubFetch(new Response(JSON.stringify(jobCollection), { status: 200 }));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockRejectedValue(new Error("list failed"));

    expect(await run()).toBe("resolved");
    expect(toast.error).toHaveBeenCalledWith("Failed to fetch jobs for the new sampling run. Please try again.");
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    vi.mocked(console.error).mockClear();
  });

  it("warns when the run stays below the recommended sample count", async () => {
    mocks.fetchedJobCollections = [{ jobCollection, selected: true, subJobs: [{}] }] as never;
    stubFetch(new Response(JSON.stringify(jobCollection), { status: 200 }));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([]);

    await run();
    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    const message = vi.mocked(toast.warning).mock.calls[0][0] as string;
    expect(message).toContain("recommend a total of 55 LHS samples");
    expect(message).toContain("You currently have 3 potentially usable samples");
  });

  it("does not nag READ-ONLY users with the sample-count warning", async () => {
    mocks.permissions = "READ-ONLY";
    stubFetch(new Response(JSON.stringify(jobCollection), { status: 200 }));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([]);

    await run();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it.each([
    [500, "50"],
    [0, "5"],
  ])("clamps an out-of-range persisted point count %s into the backend limits", async (points, shown) => {
    mocks.lhsSamplingConfig = { inputs: [], points, seed: 0 };
    render(<LHSSampling />);

    await waitFor(() =>
      expect(document.querySelector('[mmux-testid="lhs-number-of-sampling-points-input"] input')).toHaveValue(Number(shown)),
    );
  });
});
