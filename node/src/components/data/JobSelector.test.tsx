import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JobsSelector from "./JobSelector";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "function-1" } as { uid: string } | undefined,
  launchingSampling: false,
  runningSampling: false,
  fetchedJobCollections: undefined as SelectedJobCollection[] | undefined,
  hasAutoSelectedJobs: false,
  setRunningSampling: vi.fn(),
  setSelectedJobUids: vi.fn(),
  requestForceFetch: vi.fn().mockResolvedValue(undefined),
  setHasAutoSelectedJobs: vi.fn(),
  setIsSuMoGenerated: vi.fn(),
}));

vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction }) }));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    launchingSampling: mocks.launchingSampling,
    runningSampling: mocks.runningSampling,
    setRunningSampling: mocks.setRunningSampling,
  }),
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
  // Buttons let the tests drive the setSelected -> onSelectJob callback chain.
  default: ({ jobUid, setSelected }: { jobUid: string; setSelected: (selected: boolean, subJob: string) => void }) => (
    <tr>
      <td>Job row</td>
      <td>
        <button type="button" onClick={() => setSelected(true, jobUid)}>
          {`select-${jobUid}`}
        </button>
        <button type="button" onClick={() => setSelected(false, jobUid)}>
          {`deselect-${jobUid}`}
        </button>
      </td>
    </tr>
  ),
}));
vi.mock("../minmax", () => ({ default: () => "0 - 1" }));
vi.mock("../../utils/functionUtils", () => ({ getJobCollectionStatus: () => "SUCCESS" }));

interface DataGridStubProps {
  rows: SelectedJobCollection[];
  columns: Array<{
    renderHeader?: () => React.ReactNode;
    renderCell?: (params: { row: SelectedJobCollection }) => React.ReactNode;
  }>;
  sx?: (theme: unknown) => unknown;
  getRowId?: (row: SelectedJobCollection) => string;
}

vi.mock("@mui/x-data-grid", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DataGrid: (props: DataGridStubProps) => {
    // The real DataGrid evaluates sx through the MUI theme engine; the stub applies it for
    // both palettes so the light/dark branches of the styling callback are exercised.
    const theme = (mode: "light" | "dark") => ({
      palette: { mode, primary: { main: "#000000", contrastText: "#ffffff" }, background: { paper: "#ffffff" } },
      spacing: (value: number) => value,
    });
    props.sx?.(theme("light"));
    props.sx?.(theme("dark"));
    return (
      <div>
        {props.columns.map((column, index) => (
          <div key={index}>
            {column.renderHeader?.()}
            {props.rows.map(row => (
              <React.Fragment key={props.getRowId?.(row) ?? row.jobCollection.uid}>{column.renderCell?.({ row })}</React.Fragment>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const collection = {
  selected: false,
  jobCollection: { uid: "collection-1", title: "First run", jobIds: ["job-success", "job-failed"] },
  subJobs: [
    { selected: false, job: { uid: "job-success", status: "SUCCESS", input: {}, output: {} } },
    { selected: false, job: { uid: "job-failed", status: "FAILED", input: {}, output: {} } },
  ],
} as never as SelectedJobCollection;

function makeCollection(
  uid: string,
  jobIds: string[] | undefined,
  jobs: Array<{ uid: string; status: string }>,
): SelectedJobCollection {
  return {
    selected: false,
    jobCollection: { uid, title: `Run ${uid}`, ...(jobIds ? { jobIds } : {}) },
    subJobs: jobs.map(job => ({ selected: false, job: { ...job, input: {}, output: {} } })),
  } as never as SelectedJobCollection;
}

const bigJobUids = Array.from({ length: 15 }, (_, index) => `job-${index}`);
const makeSuccessfulCollection = () =>
  makeCollection(
    "collection-ok",
    ["job-a1", "job-a2"],
    [
      { uid: "job-a1", status: "SUCCESS" },
      { uid: "job-a2", status: "SUCCESS" },
    ],
  );
const makeAllFailedCollection = () =>
  makeCollection(
    "collection-failed",
    ["job-f1", "job-f2"],
    [
      { uid: "job-f1", status: "FAILED" },
      { uid: "job-f2", status: "ABORTED" },
    ],
  );
const makeBigCollection = () =>
  makeCollection(
    "collection-big",
    bigJobUids,
    bigJobUids.map(uid => ({ uid, status: "SUCCESS" })),
  );
const makeNoJobIdsCollection = () =>
  makeCollection("collection-no-jobids", undefined, [
    { uid: "job-pending", status: "PENDING" },
    { uid: "job-aborted", status: "ABORTED" },
  ]);
const makeTwoJobCollection = () =>
  makeCollection(
    "collection-1",
    ["job-success", "job-failed"],
    [
      { uid: "job-success", status: "SUCCESS" },
      { uid: "job-failed", status: "FAILED" },
    ],
  );

const expandRow = (index: number) => fireEvent.click(screen.getAllByRole("button", { name: "expand row" })[index]);
const popperTable = () => document.querySelector('table[aria-label="jobs"]');
const visibleJobRows = () => screen.queryAllByText("Job row").length;
const popperSelectAllCheckbox = () =>
  document.querySelector('table[aria-label="jobs"] thead input[type="checkbox"]') as HTMLInputElement;
// ClickAwayListener activates on a setTimeout(0) after mount; let it elapse before
// relying on click-away behaviour.
const flushTimers = () => new Promise<void>(resolve => void setTimeout(resolve, 0));

describe("JobsSelector", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.selectedFunction = { uid: "function-1" };
    mocks.fetchedJobCollections = undefined;
    mocks.hasAutoSelectedJobs = false;
    mocks.runningSampling = false;
    mocks.requestForceFetch.mockResolvedValue(undefined);
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

  it("clears runningSampling after refreshing collections for a launched sampling", async () => {
    mocks.runningSampling = true;
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(mocks.setRunningSampling).toHaveBeenCalledWith(false));
    expect(mocks.requestForceFetch).toHaveBeenCalledWith("function-1", expect.any(Function));
  });

  it("clears loading and flags SuMo generated when the function has no job collections", async () => {
    mocks.fetchedJobCollections = [];
    const setLoading = vi.fn();
    render(<JobsSelector loading setLoading={setLoading} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(setLoading).toHaveBeenCalledWith(false));
    expect(mocks.setIsSuMoGenerated).toHaveBeenCalledWith(true);
    expect(mocks.setSelectedJobUids).not.toHaveBeenCalled();
  });

  it("skips every refresh path when no function is selected", () => {
    mocks.selectedFunction = undefined;
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);

    expect(mocks.requestForceFetch).not.toHaveBeenCalled();
    expect(mocks.setRunningSampling).not.toHaveBeenCalled();
  });

  it("falls back to an empty uid when refreshing a selected function without uid", async () => {
    mocks.selectedFunction = {} as { uid: string };
    mocks.runningSampling = true;
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(mocks.setRunningSampling).toHaveBeenCalledWith(false));
    expect(mocks.requestForceFetch).toHaveBeenCalledWith("", expect.any(Function));

    fireEvent.click(document.querySelector('[mmux-testid="refresh-job-collections-btn"]') as Element);
    await waitFor(() => expect(mocks.requestForceFetch).toHaveBeenCalledTimes(3));
    const refreshCalls = mocks.requestForceFetch.mock.calls.map(call => call[0]);
    expect(refreshCalls).toContain("");
  });

  it("toggles main-job checkboxes, disables all-failed rows, and skips identical context pushes", async () => {
    mocks.fetchedJobCollections = [makeSuccessfulCollection(), makeAllFailedCollection()];
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);

    await waitFor(() => expect(screen.getAllByRole("button", { name: "expand row" })).toHaveLength(2));
    const rowCheckboxes = () => screen.getAllByRole("checkbox", { name: "Select job collection" });
    expect(rowCheckboxes()[1]).toBeDisabled();

    // selectMainJob(uid, true): both SUCCESS subJobs get selected
    fireEvent.click(rowCheckboxes()[0]);
    expect(mocks.setSelectedJobUids).toHaveBeenNthCalledWith(1, ["job-a1", "job-a2"]);

    // selectMainJob(uid, false): the row is fully selected, so the second click clears it
    fireEvent.click(rowCheckboxes()[0]);
    expect(mocks.setSelectedJobUids).toHaveBeenNthCalledWith(2, []);

    // header checkbox: onToggleAll(true) then a second identical click must not re-push
    const headerCheckbox = screen.getByRole("checkbox", { name: "Select all jobs" });
    fireEvent.click(headerCheckbox);
    expect(mocks.setSelectedJobUids).toHaveBeenNthCalledWith(3, ["job-a1", "job-a2"]);
    fireEvent.click(headerCheckbox);
    expect(mocks.setSelectedJobUids).toHaveBeenCalledTimes(3);

    // bottom buttons: onToggleAll(false) then an identical repeat hits the dedup guard
    fireEvent.click(screen.getByRole("button", { name: "De-select all Jobs" }));
    expect(mocks.setSelectedJobUids).toHaveBeenNthCalledWith(4, []);
    fireEvent.click(screen.getByRole("button", { name: "De-select all Jobs" }));
    expect(mocks.setSelectedJobUids).toHaveBeenCalledTimes(4);
  });

  it("runs the popper selection, pagination and click-away flows", async () => {
    mocks.fetchedJobCollections = [makeBigCollection(), makeSuccessfulCollection()];
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "expand row" })).toHaveLength(2));
    await flushTimers();

    expandRow(0);
    expect(popperTable()).not.toBeNull();
    expect(visibleJobRows()).toBe(10);
    expect(document.querySelector('[data-testid="KeyboardArrowDownIcon"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="KeyboardArrowUpIcon"]')).toBeInTheDocument();

    // the popper select-all checkbox selects and then clears every subJob
    const selectAll = popperSelectAllCheckbox();
    fireEvent.click(selectAll);
    expect(screen.getAllByRole("checkbox", { name: "Select job collection" })[0]).toBeChecked();
    expect(mocks.setSelectedJobUids).toHaveBeenLastCalledWith(bigJobUids);
    fireEvent.click(selectAll);
    expect(screen.getAllByRole("checkbox", { name: "Select job collection" })[0]).not.toBeChecked();
    expect(mocks.setSelectedJobUids).toHaveBeenLastCalledWith([]);

    // pagination controls live inside the popper, so their clicks keep it open
    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(visibleJobRows()).toBe(5);
    expect(screen.getByRole("button", { name: "select-job-10" })).toBeInTheDocument();

    // MUI v7 Select opens on mouseDown; its option lives in a Modal portal that stops the
    // click, so it does NOT reach the click-away guard.
    fireEvent.mouseDown(document.querySelector("#job-collection-pagination .MuiSelect-select") as Element);
    fireEvent.click(await screen.findByRole("option", { name: "20" }));
    expect(popperTable()).not.toBeNull();
    // page was reset to 0 and 20 rows-per-page shows the whole collection
    expect(visibleJobRows()).toBe(15);
    expect(screen.getByRole("button", { name: "select-job-0" })).toBeInTheDocument();

    // a body click returns early (never arms, never closes)
    fireEvent.click(document.body);
    expect(popperTable()).not.toBeNull();
    // an outside element click arms the guard but keeps it open...
    fireEvent.click(screen.getByRole("button", { name: "De-select all Jobs" }));
    expect(popperTable()).not.toBeNull();
    // ...and the next non-element click-away closes it
    fireEvent.click(document);
    expect(popperTable()).toBeNull();

    // selecting a subJob picks the mixed-state branch and closes the popper
    expandRow(0);
    fireEvent.click(screen.getByRole("button", { name: "select-job-0" }));
    expect(popperTable()).toBeNull();

    // re-open and clear it again: the fully-unselected state takes the every-false branch
    expandRow(0);
    fireEvent.click(screen.getByRole("button", { name: "deselect-job-0" }));
    expect(popperTable()).toBeNull();

    // expanding the open row again collapses the popper
    expandRow(0);
    expect(popperTable()).not.toBeNull();
    expandRow(0);
    expect(popperTable()).toBeNull();
  });

  it("selects subJobs individually and renders a collection without jobIds", async () => {
    mocks.fetchedJobCollections = [makeTwoJobCollection(), makeNoJobIdsCollection()];
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "expand row" })).toHaveLength(2));

    expandRow(0);
    expect(visibleJobRows()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "select-job-success" }));
    expect(mocks.setSelectedJobUids).toHaveBeenLastCalledWith(["job-success"]);
    expect(popperTable()).toBeNull();

    // selecting the last remaining subJob flips the collection into the fully-selected state
    expandRow(0);
    fireEvent.click(screen.getByRole("button", { name: "select-job-failed" }));
    expect(mocks.setSelectedJobUids).toHaveBeenLastCalledWith(["job-success", "job-failed"]);
    expect(screen.getAllByRole("checkbox", { name: "Select job collection" })[0]).toBeChecked();

    // the second collection has no jobIds: the popper still opens and paginates an empty list
    expandRow(1);
    expect(popperTable()).not.toBeNull();
    expect(visibleJobRows()).toBe(0);
    expect(screen.getByText(/0 of 0/)).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid="KeyboardArrowDownIcon"]')).toHaveLength(1);
  });
});
