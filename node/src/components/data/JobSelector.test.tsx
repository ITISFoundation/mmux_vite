import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JobsSelector from "./JobSelector";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "function-1" },
  launchingSampling: false,
  runningSampling: false,
  fetchedJobCollections: undefined as SelectedJobCollection[] | undefined,
  hasAutoSelectedJobs: false,
  setSelectedJobUids: vi.fn(),
  requestForceFetch: vi.fn().mockResolvedValue(undefined),
  setHasAutoSelectedJobs: vi.fn(),
  setIsSuMoGenerated: vi.fn(),
}));

vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction }) }));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({ launchingSampling: mocks.launchingSampling, runningSampling: mocks.runningSampling }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    setSelectedJobUids: mocks.setSelectedJobUids,
    fetchedJobCollections: mocks.fetchedJobCollections,
    requestForceFetch: mocks.requestForceFetch,
    hasAutoSelectedJobs: mocks.hasAutoSelectedJobs,
    setHasAutoSelectedJobs: mocks.setHasAutoSelectedJobs,
  }),
}));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ setIsSuMoGenerated: mocks.setIsSuMoGenerated }) }));
vi.mock("../utils/CustomTooltip", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./JobRow", () => ({
  default: () => (
    <tr>
      <td>Job row</td>
    </tr>
  ),
}));
vi.mock("../minmax", () => ({ default: () => "0 - 1" }));
vi.mock("../../utils/functionUtils", () => ({ getJobCollectionStatus: () => "SUCCESS" }));
vi.mock("@mui/x-data-grid", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DataGrid: (props: {
    rows: SelectedJobCollection[];
    columns: Array<{
      renderHeader?: () => React.ReactNode;
      renderCell?: (params: { row: SelectedJobCollection }) => React.ReactNode;
    }>;
  }) => (
    <div>
      {props.columns.map((column, index) => (
        <div key={index}>
          {column.renderHeader?.()}
          {props.rows.map(row => (
            <React.Fragment key={row.jobCollection.uid}>{column.renderCell?.({ row })}</React.Fragment>
          ))}
        </div>
      ))}
    </div>
  ),
}));

const collection = {
  selected: false,
  jobCollection: { uid: "collection-1", title: "First run", jobIds: ["job-success", "job-failed"] },
  subJobs: [
    { selected: false, job: { uid: "job-success", status: "SUCCESS", input: {}, output: {} } },
    { selected: false, job: { uid: "job-failed", status: "FAILED", input: {}, output: {} } },
  ],
} as never as SelectedJobCollection;

describe("JobsSelector", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.fetchedJobCollections = undefined;
    mocks.hasAutoSelectedJobs = false;
    mocks.setHasAutoSelectedJobs.mockImplementation(value => {
      mocks.hasAutoSelectedJobs = value;
    });
  });

  it("hydrates collections, auto-selects successful jobs, and clears loading", async () => {
    mocks.fetchedJobCollections = [collection];
    const setLoading = vi.fn();
    render(<JobsSelector loading setLoading={setLoading} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(setLoading).toHaveBeenCalledWith(false));
    expect(mocks.setSelectedJobUids).toHaveBeenCalledWith(["job-success"]);
    expect(mocks.setHasAutoSelectedJobs).toHaveBeenCalledWith(true);
    expect(mocks.setIsSuMoGenerated).toHaveBeenCalledWith(true);
  });

  it("refreshes jobs and selects or clears all successful jobs", async () => {
    mocks.fetchedJobCollections = [collection];
    const setLoading = vi.fn();
    render(<JobsSelector loading={false} setLoading={setLoading} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Select all successful Jobs" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Select all successful Jobs" }));
    expect(mocks.setSelectedJobUids).toHaveBeenCalledWith(["job-success"]);

    fireEvent.click(screen.getByRole("button", { name: "De-select all Jobs" }));
    expect(mocks.setSelectedJobUids).toHaveBeenCalledWith([]);

    const refreshButton = document.querySelector('[mmux-testid="refresh-job-collections-btn"]');
    expect(refreshButton).not.toBeNull();
    fireEvent.click(refreshButton as Element);
    await waitFor(() => expect(mocks.requestForceFetch).toHaveBeenCalledWith("function-1", expect.any(Function)));
  });
});
