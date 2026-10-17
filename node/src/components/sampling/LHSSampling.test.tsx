import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LHSSampling from "./LHSSampling";
import { getFunctionJobsFromFunctionJobCollection } from "../../utils/functionUtils";
import { jsonResponse, networkError, stubFetch, textResponse } from "../../test/fetchStub";

const mocks = vi.hoisted(() => ({
  permissions: "WRITE",
  selectedFunction: { uid: "function-1" } as { uid: string } | undefined,
  distribution: {} as Record<string, Record<string, { scale: string } | null> | undefined>,
  lhsSamplingConfig: { inputs: [], points: 20, seed: 7 } as LHSamplingConfig,
  fetchedJobCollections: [] as SelectedJobCollection[] | undefined,
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
    selectedFunction: mocks.selectedFunction,
    inputVars: ["alpha", "beta"],
    distribution: mocks.distribution,
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
  default: ({
    inputVar,
    index,
    handleInputChange,
  }: {
    inputVar: { variable: string };
    index: number;
    handleInputChange: (index: number, field: string, value: string) => void;
  }) => (
    <span>
      {inputVar.variable}
      <button type="button" onClick={() => handleInputChange(index, "start", "7.5")}>{`set-${inputVar.variable}`}</button>
    </span>
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

const jobCollection = { uid: "jc-1", title: "LHS run", jobIds: ["job-1"] };

async function run() {
  render(<LHSSampling />);
  fireEvent.click(await screen.findByRole("button", { name: "Run sampling" }));
  expect(mocks.runResult).toBeDefined();
  return mocks.runResult as Promise<string>;
}

const pointsInput = () => document.querySelector('[mmux-testid="lhs-number-of-sampling-points-input"] input') as HTMLInputElement;
const seedInput = () => document.querySelector('[mmux-testid="lhs-seed-input"] input') as HTMLInputElement;

describe("LHSSampling", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.permissions = "WRITE";
    mocks.selectedFunction = { uid: "function-1" };
    mocks.distribution = {};
    mocks.lhsSamplingConfig = { inputs: [], points: 20, seed: 7 };
    mocks.fetchedJobCollections = [];
    mocks.runResult = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the LHS config and appends the launched collection", async () => {
    const fetchMock = stubFetch(jsonResponse(jobCollection));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([{ uid: "job-1", status: "PENDING" }] as never);

    await expect(await run()).toBe("resolved");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/flask/sampling/lhs");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
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
    stubFetch(textResponse("N must be <= 50", 422));

    expect(await run()).toBe("rejected: POST /flask/sampling/lhs failed with 422: N must be <= 50");
    expect(toast.error).toHaveBeenCalledWith("Error running LHS sampling: 422: N must be <= 50");
    expect(mocks.setLaunchingSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningJobCollection).not.toHaveBeenCalled();
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
  });

  it("reports a network failure and resets sampling flags", async () => {
    stubFetch(networkError());

    expect(await run()).toBe("rejected: POST /flask/sampling/lhs failed: Failed to fetch");
    expect(toast.error).toHaveBeenCalledWith("Error running LHS sampling: POST /flask/sampling/lhs failed: Failed to fetch");
    expect(mocks.setLaunchingSampling).toHaveBeenLastCalledWith(false);
    expect(mocks.setRunningSampling).not.toHaveBeenCalledWith(true);
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
  });

  it("reports a failed job lookup after a successful launch without corrupting the table", async () => {
    stubFetch(jsonResponse(jobCollection));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockRejectedValue(new Error("list failed"));

    expect(await run()).toBe("resolved");
    expect(toast.error).toHaveBeenCalledWith("Failed to fetch jobs for the new sampling run. Please try again.");
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    vi.mocked(console.error).mockClear();
  });

  it("warns when the run stays below the recommended sample count", async () => {
    mocks.fetchedJobCollections = [{ jobCollection, selected: true, subJobs: [{}] }] as never;
    stubFetch(jsonResponse(jobCollection));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([]);

    await run();
    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    const message = vi.mocked(toast.warning).mock.calls[0][0] as string;
    expect(message).toContain("recommend a total of 55 LHS samples");
    expect(message).toContain("You currently have 3 potentially usable samples");
  });

  it("does not nag READ-ONLY users with the sample-count warning", async () => {
    mocks.permissions = "READ-ONLY";
    // a collection without subJobs must not contribute to the usable-sample count
    mocks.fetchedJobCollections = [{ jobCollection, selected: false }] as never;
    stubFetch(jsonResponse(jobCollection));
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

    await waitFor(() => expect(pointsInput()).toHaveValue(Number(shown)));
  });

  it("treats a null job collection from the backend as a no-op for the table", async () => {
    stubFetch(jsonResponse(null));

    expect(await run()).toBe("resolved");
    expect(mocks.setRunningJobCollection).toHaveBeenCalledWith(undefined);
    expect(getFunctionJobsFromFunctionJobCollection).not.toHaveBeenCalled();
    expect(mocks.setFetchedJobCollections).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Job collection is undefined. Cannot add to fetchedJobCollections.");
    vi.mocked(console.error).mockClear();
  });

  it("counts zero usable samples when no job collections were fetched yet", async () => {
    mocks.fetchedJobCollections = undefined;
    mocks.permissions = "READ-ONLY";
    stubFetch(jsonResponse(jobCollection));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([{ uid: "job-9", status: "PENDING" }] as never);

    expect(await run()).toBe("resolved");
    expect(toast.warning).not.toHaveBeenCalled();
    // a missing collection list appends to an empty table instead of spreading undefined
    expect(mocks.setFetchedJobCollections).toHaveBeenCalledWith([
      { jobCollection, selected: true, subJobs: [{ selected: false, job: { uid: "job-9", status: "PENDING" } }] },
    ]);
  });

  it("applies edited seed, points and variable bounds to the launch payload", async () => {
    const fetchMock = stubFetch(jsonResponse(jobCollection));
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockResolvedValue([]);
    render(<LHSSampling />);

    fireEvent.change(seedInput(), { target: { value: "42" } });
    expect(seedInput()).toHaveValue(42);

    fireEvent.change(pointsInput(), { target: { value: "30" } });
    expect(pointsInput()).toHaveValue(30);
    fireEvent.blur(pointsInput());

    // editing a variable bound takes the non-points/seed branch of handleInputChange
    fireEvent.click(screen.getByText("set-alpha"));

    fireEvent.click(screen.getByRole("button", { name: "Run sampling" }));
    await waitFor(() => expect(mocks.setFetchedJobCollections).toHaveBeenCalled());

    expect(mocks.setLhsSamplingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        points: 30,
        seed: 42,
        inputs: [
          { variable: "alpha", start: 7.5, end: 1 },
          { variable: "beta", start: 0, end: 1 },
        ],
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      funUid: "function-1",
      config: [
        { variable: "alpha", start: 7.5, end: 1 },
        { variable: "beta", start: 0, end: 1 },
      ],
      seed: 42,
      N: 30,
    });
  });

  it("guards the points input against empty and unparsable values", async () => {
    render(<LHSSampling />);
    const input = pointsInput();
    expect(input).toHaveValue(20);

    fireEvent.change(input, { target: { value: "30" } });
    expect(input).toHaveValue(30);

    // the number-input value sanitizer would swallow "abc", so relax the type just for the
    // change event to exercise the Number.isNaN guard that mirrors real-browser edge cases
    input.setAttribute("type", "text");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue(0);
    input.setAttribute("type", "number");

    // an empty value parses to 0 locally, and blurring it clamps the config back to the minimum
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(0);
    fireEvent.blur(input);
    await waitFor(() => expect(input).toHaveValue(5));
  });

  it("warns once about log-scale variables", async () => {
    mocks.distribution = { "function-1": { alpha: { scale: "log" } } };
    render(<LHSSampling />);

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining("Log-scale")));
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it("does not warn about linear or unconfigured distributions", async () => {
    mocks.distribution = { "function-1": { alpha: { scale: "linear" }, beta: null } };
    render(<LHSSampling />);

    await waitFor(() => expect(screen.getByText("Latin Hypercube Sampling")).toBeInTheDocument());
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("renders regenerated bounds without warnings when no function is selected", async () => {
    mocks.selectedFunction = undefined;
    render(<LHSSampling />);

    await waitFor(() => expect(screen.getByText("Latin Hypercube Sampling")).toBeInTheDocument());
    expect(toast.warning).not.toHaveBeenCalled();
    // bounds regenerate from inputVars even without a function uid to key the distribution by
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("keeps the persisted sampling config instead of regenerating it", async () => {
    mocks.lhsSamplingConfig = { inputs: [{ variable: "zeta", start: 5, end: 6 }], points: 20, seed: 3 };
    render(<LHSSampling />);

    await waitFor(() => expect(screen.getByText("zeta")).toBeInTheDocument());
    expect(screen.queryByText("alpha")).not.toBeInTheDocument();
  });
});
