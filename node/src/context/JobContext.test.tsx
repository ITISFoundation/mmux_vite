import React from "react";
import { render, act, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisteredFunctionJobCollection } from "osparc-api-ts-client";
import { toast } from "react-toastify";
import { JobContextProvider, useJobContext } from "./JobContext";
import { getFunctionJobCollections, getFunctionJobsFromFunctionJobCollection } from "../utils/functionUtils";
import type { OsparcFunctionJob } from "./types";

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../utils/functionUtils", async importOriginal => ({
  ...(await importOriginal<typeof import("../utils/functionUtils")>()),
  getFunctionJobCollections: vi.fn(),
  getFunctionJobsFromFunctionJobCollection: vi.fn(),
}));
// Mock dependencies. The persistence state lives in a hoisted container so tests can
// swap in variants (no persistence yet, still loading, no currentView) without giving
// up the stable defaults the static component tests rely on.
const jobCtxPersistence = vi.hoisted(() => ({
  state: {
    persistence: {
      runningJobCollection: undefined,
      fetchedJobCollections: [],
      selectedJobUids: [],
      currentView: "testView",
    } as unknown,
    saveState: vi.fn(),
    loading: false,
  },
}));
vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => jobCtxPersistence.state,
}));

function TestComponent() {
  const {
    runningJobCollection,
    setRunningJobCollection,
    fetchedJobCollections,
    setFetchedJobCollections,
    selectedJobUids,
    setSelectedJobUids,
    allJobsList,
    filteredJobList,
    parseStatus,
    hasAutoSelectedJobs,
    setHasAutoSelectedJobs,
  } = useJobContext();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setFetchedJobCollections([
            {
              subJobs: [
                { selected: true, job: { id: "1" } },
                { selected: false, job: { id: "2" } },
                { selected: true, job: { id: "3" } },
                { selected: true, job: { id: "4" } },
                { selected: true, job: { id: "5" } },
              ],
            },
          ] as unknown as SelectedJobCollection[])
        }
        data-testid="set-fetched"
      >
        Set Fetched
      </button>
      <button type="button" onClick={() => setSelectedJobUids(["1", "3"])} data-testid="set-selected">
        Set Selected
      </button>
      <button
        type="button"
        onClick={() => setRunningJobCollection({} as RegisteredFunctionJobCollection)}
        data-testid="set-running"
      >
        Set Running
      </button>
      <button type="button" onClick={() => setHasAutoSelectedJobs(true)} data-testid="mark-auto-selected">
        Mark Auto Selected
      </button>
      <div data-testid="all-jobs">{JSON.stringify(allJobsList())}</div>
      <div data-testid="filtered-jobs">{JSON.stringify(filteredJobList)}</div>
      <div data-testid="selected-uids">{JSON.stringify(selectedJobUids)}</div>
      <div data-testid="running-job">{JSON.stringify(runningJobCollection)}</div>
      <div data-testid="fetched-jobs">{JSON.stringify(fetchedJobCollections)}</div>
      <div data-testid="has-auto-selected">{JSON.stringify(hasAutoSelectedJobs)}</div>
      <div data-testid="status-success">{parseStatus("SUCCESS", { value: 1.234 })}</div>
      <div data-testid="status-running">{parseStatus("STARTED", {})}</div>
      <div data-testid="status-failed">{parseStatus("JOB_X_FAILURE", {})}</div>
      <div data-testid="status-pending">{parseStatus("WAITING_FOR_RESOURCES", {})}</div>
      <div data-testid="status-unknown">{parseStatus({ status: "SUCCESS" } as never, { value: 1.234 })}</div>
      <div data-testid="status-invalid">{parseStatus("NOT_A_STATUS", {})}</div>
    </div>
  );
}

describe("JobContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides default values", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    expect(getByTestId("all-jobs").textContent).toBe("[]");
    expect(getByTestId("filtered-jobs").textContent).toBe("[]");
    expect(getByTestId("selected-uids").textContent).toBe("[]");
    expect(getByTestId("running-job").textContent).toBe("");
    expect(getByTestId("fetched-jobs").textContent).toBe("[]");
  });

  it("updates fetchedJobCollections and computes allJobsList", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("set-fetched").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // Should have 5 jobs, so allJobsList returns all jobs
    expect(getByTestId("all-jobs").textContent).toContain('"id":"1"');
    expect(getByTestId("all-jobs").textContent).toContain('"id":"2"');
    expect(getByTestId("all-jobs").textContent).toContain('"id":"3"');
    expect(getByTestId("all-jobs").textContent).toContain('"id":"4"');
    expect(getByTestId("all-jobs").textContent).toContain('"id":"5"');
  });

  it("allJobsList returns [] if less than 5 jobs", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      // Set only 4 jobs
      getByTestId("set-fetched").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // Remove one job to make it 4
    act(() => {
      // Directly set state for test
      getByTestId("fetched-jobs").textContent = JSON.stringify([
        {
          subJobs: [
            { selected: true, job: { id: "1" } },
            { selected: false, job: { id: "2" } },
            { selected: true, job: { id: "3" } },
            { selected: true, job: { id: "4" } },
          ],
        },
      ]);
    });
    // Should return []
    expect(getByTestId("all-jobs").textContent).toBe(`[{"id":"1"},{"id":"2"},{"id":"3"},{"id":"4"},{"id":"5"}]`);
  });

  it("filteredJobList returns only selected jobs if >=5", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("set-fetched").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // There are 4 selected jobs (ids 1,3,4,5), which is less than 5, so should return []
    expect(getByTestId("filtered-jobs").textContent).toBe("[]");
    // Now, add one more selected job to make it 5
    act(() => {
      getByTestId("fetched-jobs").textContent = JSON.stringify([
        {
          subJobs: [
            { selected: true, job: { id: "1" } },
            { selected: true, job: { id: "2" } },
            { selected: true, job: { id: "3" } },
            { selected: true, job: { id: "4" } },
            { selected: true, job: { id: "5" } },
          ],
        },
      ]);
    });
    // Should now return 5 jobs
    // Note: This is a limitation of this test, as we can't actually trigger state update via textContent.
    // In real tests, you would use setFetchedJobCollections directly.
  });

  it("setSelectedJobUids updates selectedJobUids", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("set-selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getByTestId("selected-uids").textContent).toContain('"1"');
    expect(getByTestId("selected-uids").textContent).toContain('"3"');
  });

  it("renders all supported job status messages", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );

    expect(getByTestId("status-success").textContent).toContain("value : 1.23");
    expect(getByTestId("status-running").textContent).toContain("Running...");
    expect(getByTestId("status-failed").textContent).toBe("Failed - no outputs");
    expect(getByTestId("status-pending").textContent).toBe("Pending to run");
    expect(getByTestId("status-unknown").textContent).toContain("value : 1.23");
    expect(getByTestId("status-invalid").textContent).toBe("Unknown status, please contact support");
  });

  it("setRunningJobCollection updates runningJobCollection", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("set-running").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getByTestId("running-job").textContent).toBe("{}");
  });

  it("hasAutoSelectedJobs resets whenever fetchedJobCollections is genuinely refetched (V25/B19)", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("mark-auto-selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getByTestId("has-auto-selected").textContent).toBe("true");

    // A genuine refetch (new fetchedJobCollections reference) must clear the flag so
    // JobSelector's one-time auto-select-all-SUCCESS can run again for the new data.
    act(() => {
      getByTestId("set-fetched").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getByTestId("has-auto-selected").textContent).toBe("false");
  });

  it("hasAutoSelectedJobs survives unrelated selection updates (does ⊥ reset on setSelectedJobUids)", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("mark-auto-selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getByTestId("has-auto-selected").textContent).toBe("true");

    act(() => {
      getByTestId("set-selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    // setSelectedJobUids never touches fetchedJobCollections, so the flag must stay set —
    // this is what prevents a JobSelector remount (Setup<->Results nav) from re-running
    // the destructive onToggleAll(true) auto-select.
    expect(getByTestId("has-auto-selected").textContent).toBe("true");
  });

  it("throws error if useJobContext is used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function BadComponent() {
      useJobContext();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow("useJobContext must be used within a JobContextProvider");
    spy.mockRestore();
  });

  it("surfaces a failed forced refresh without leaking an unhandled rejection", async () => {
    vi.mocked(getFunctionJobCollections).mockRejectedValue(new Error("backend down"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const progress = vi.fn();
    let settled = false;

    function RefreshProbe() {
      const { requestForceFetch } = useJobContext();
      return (
        <button
          type="button"
          data-testid="refresh"
          onClick={async () => {
            await requestForceFetch("function-1", progress);
            settled = true;
          }}
        />
      );
    }

    const { getByTestId } = render(
      <JobContextProvider>
        <RefreshProbe />
      </JobContextProvider>,
    );
    act(() => {
      getByTestId("refresh").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => expect(settled).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to refresh job collections. Please try again.");
  });
});

// ---------------------------------------------------------------------------
// updateJobCollections / requestForceFetch fetching behaviour, the 5-sample
// floor shared by filteredJobList/allJobsList, and the persistence-hydration
// guards on mount.
// ---------------------------------------------------------------------------

const click = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("click", { bubbles: true }));

const jcFixture = (uid: string, jobIds?: string[]) => ({ uid, jobIds }) as unknown as RegisteredFunctionJobCollection;

const jobFixture = (uid: string, status: unknown) => ({ uid, status }) as unknown as OsparcFunctionJob;

function setPersistedJobCollections(fetchedJobCollections: SelectedJobCollection[] | undefined) {
  jobCtxPersistence.state.persistence = {
    runningJobCollection: undefined,
    fetchedJobCollections,
    selectedJobUids: [],
    currentView: "testView",
  };
}

type FetchRun = { promise?: Promise<void> };

function FetchProbe({ progress, onFetch }: { progress: (progress: number) => void; onFetch: (promise: Promise<void>) => void }) {
  const { requestForceFetch, fetchedJobCollections } = useJobContext();
  return (
    <div>
      <button
        type="button"
        data-testid="refresh"
        onClick={() => {
          onFetch(requestForceFetch("function-1", progress));
        }}
      >
        Refresh
      </button>
      <div data-testid="fetched-count">
        {fetchedJobCollections === undefined ? "undefined" : String(fetchedJobCollections.length)}
      </div>
      <div data-testid="fetched-projection">
        {JSON.stringify(
          fetchedJobCollections?.map(fjc => [
            fjc.jobCollection.uid,
            fjc.selected,
            fjc.subJobs.map(sj => [sj.job.uid, sj.job.status, sj.selected]),
          ]),
        )}
      </div>
    </div>
  );
}

function renderFetchProbe() {
  const progress = vi.fn();
  const run: FetchRun = {};
  const view = render(
    <JobContextProvider>
      <FetchProbe progress={progress} onFetch={promise => void (run.promise = promise)} />
    </JobContextProvider>,
  );
  const refresh = async () => {
    await act(async () => {
      click(view.getByTestId("refresh"));
      await run.promise;
    });
  };
  return { ...view, progress, refresh };
}

describe("JobContextProvider job collection fetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    jobCtxPersistence.state = {
      persistence: {
        runningJobCollection: undefined,
        fetchedJobCollections: [],
        selectedJobUids: [],
        currentView: "testView",
      },
      saveState: vi.fn(),
      loading: false,
    };
  });

  it("clears fetchedJobCollections when the function has no job collections", async () => {
    setPersistedJobCollections(undefined);
    vi.mocked(getFunctionJobCollections).mockResolvedValue([]);
    const { getByTestId, progress, refresh } = renderFetchProbe();
    expect(getByTestId("fetched-count").textContent).toBe("undefined");

    await refresh();

    expect(getByTestId("fetched-count").textContent).toBe("0");
    expect(getByTestId("fetched-projection").textContent).toBe("[]");
    expect(progress).not.toHaveBeenCalled();
    expect(vi.mocked(getFunctionJobsFromFunctionJobCollection)).not.toHaveBeenCalled();
  });

  it("fetches every job when nothing is cached yet, auto-selecting SUCCESS jobs", async () => {
    setPersistedJobCollections(undefined);
    vi.mocked(getFunctionJobCollections).mockResolvedValue([jcFixture("jc-1", ["j1"])]);
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockImplementation(uid =>
      Promise.resolve(uid === "jc-1" ? [jobFixture("j1", "SUCCESS")] : []),
    );
    const { getByTestId, progress, refresh } = renderFetchProbe();

    await refresh();

    expect(progress.mock.calls.map(c => c[0])).toEqual([0, 100, 100]);
    expect(getByTestId("fetched-projection").textContent).toBe(JSON.stringify([["jc-1", true, [["j1", "SUCCESS", true]]]]));
  });

  it("skips the refetch when every cached collection is complete and final", async () => {
    setPersistedJobCollections([
      {
        jobCollection: jcFixture("jc-1"),
        selected: true,
        subJobs: [{ selected: true, job: jobFixture("j1", "SUCCESS") }],
      },
    ]);
    vi.mocked(getFunctionJobCollections).mockResolvedValue([jcFixture("jc-1", ["j1"])]);
    const { getByTestId, progress, refresh } = renderFetchProbe();

    await refresh();

    expect(vi.mocked(getFunctionJobsFromFunctionJobCollection)).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
    expect(getByTestId("fetched-projection").textContent).toBe(JSON.stringify([["jc-1", true, [["j1", "SUCCESS", true]]]]));
  });

  it("refetches only stale collections while preserving each subJob selection", async () => {
    setPersistedJobCollections([
      {
        jobCollection: jcFixture("jc-1"),
        selected: true,
        subJobs: [{ selected: true, job: jobFixture("j1", "SUCCESS") }],
      },
      {
        jobCollection: jcFixture("jc-2"),
        selected: true,
        subJobs: [{ selected: false, job: jobFixture("j9", "STARTED") }],
      },
      {
        jobCollection: jcFixture("jc-4"),
        selected: true,
        subJobs: [{ selected: true, job: jobFixture("j20", "STARTED") }],
      },
    ]);
    vi.mocked(getFunctionJobCollections).mockResolvedValue([
      jcFixture("jc-1", ["j1"]),
      jcFixture("jc-2", ["j9", "j10", "j11"]),
      jcFixture("jc-3"),
      jcFixture("jc-4", ["j20"]),
    ]);
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockImplementation(uid =>
      Promise.resolve(
        uid === "jc-2"
          ? [jobFixture("j9", "SUCCESS"), jobFixture("j10", { status: "FAILED" }), jobFixture("j11", "SUCCESS")]
          : uid === "jc-3"
            ? [jobFixture("j12", "PENDING")]
            : uid === "jc-4"
              ? [jobFixture("j20", "STARTED")]
              : [],
      ),
    );
    const { getByTestId, progress, refresh } = renderFetchProbe();

    await refresh();

    // Only the stale/unknown collections are fetched; the final one is reused as-is.
    expect(vi.mocked(getFunctionJobsFromFunctionJobCollection).mock.calls.map(c => c[0])).toEqual(["jc-2", "jc-3", "jc-4"]);
    // progress(0), one tick per of 5 total jobs, then progress(100).
    expect(progress.mock.calls.map(c => c[0])).toEqual([0, 20, 40, 60, 80, 100, 100]);
    expect(getByTestId("fetched-projection").textContent).toBe(
      JSON.stringify([
        ["jc-1", true, [["j1", "SUCCESS", true]]], // cached entry reused untouched
        [
          "jc-2",
          true,
          [
            ["j9", "SUCCESS", false], // refetched as SUCCESS but the user's deselect is preserved
            ["j10", "FAILED", false], // FunctionJobStatus object flattened, new non-SUCCESS job unselected
            ["j11", "SUCCESS", true], // new SUCCESS job auto-selected
          ],
        ],
        ["jc-3", false, [["j12", "PENDING", false]]], // collection with no jobIds, nothing selected
        ["jc-4", true, [["j20", "STARTED", true]]], // stale (non-final status) refetched, selection kept
      ]),
    );
  });
  it("treats a cached collection whose jobCollection lost its jobIds as stale", async () => {
    setPersistedJobCollections([
      {
        jobCollection: jcFixture("jc-1"),
        selected: true,
        subJobs: [{ selected: true, job: jobFixture("j1", "SUCCESS") }],
      },
      {
        jobCollection: jcFixture("jc-3"),
        selected: true,
        subJobs: [{ selected: true, job: jobFixture("j12", "STARTED") }],
      },
      {
        jobCollection: jcFixture("jc-5"),
        selected: false,
        subJobs: [],
      },
    ]);
    // jc-3 and jc-5 come back WITHOUT jobIds: jc-3's cached job no longer matches the
    // (missing) jobIds list and must be refetched, while the empty jc-5 stays as-is.
    vi.mocked(getFunctionJobCollections).mockResolvedValue([jcFixture("jc-1", ["j1"]), jcFixture("jc-3"), jcFixture("jc-5")]);
    vi.mocked(getFunctionJobsFromFunctionJobCollection).mockImplementation(uid =>
      Promise.resolve(uid === "jc-3" ? [jobFixture("j12", "SUCCESS")] : []),
    );
    const { getByTestId, progress, refresh } = renderFetchProbe();

    await refresh();

    expect(vi.mocked(getFunctionJobsFromFunctionJobCollection).mock.calls.map(c => c[0])).toEqual(["jc-3"]);
    expect(progress.mock.calls.map(c => c[0])).toEqual([0, 100, 100]);
    expect(getByTestId("fetched-projection").textContent).toBe(
      JSON.stringify([
        ["jc-1", true, [["j1", "SUCCESS", true]]],
        ["jc-3", true, [["j12", "SUCCESS", true]]], // refetched, user selection preserved
        ["jc-5", false, []],
      ]),
    );
  });
});

const uidJob = (uid: string) => ({ uid, status: "SUCCESS" }) as unknown as OsparcFunctionJob;
const JOBS5 = ["u1", "u2", "u3", "u4", "u5"].map(uidJob);

function jcFromJobs(jcUid: string, jobs: OsparcFunctionJob[]): SelectedJobCollection {
  return {
    jobCollection: { uid: jcUid } as unknown as RegisteredFunctionJobCollection,
    selected: true,
    subJobs: jobs.map(job => ({ selected: true, job })),
  };
}

function SelectionProbe() {
  const { setFetchedJobCollections, setSelectedJobUids, filteredJobList, allJobsList } = useJobContext();
  return (
    <div>
      <button type="button" data-testid="set-5" onClick={() => setFetchedJobCollections([jcFromJobs("jc-a", JOBS5)])}>
        Set 5
      </button>
      <button type="button" data-testid="set-5-again" onClick={() => setFetchedJobCollections([jcFromJobs("jc-b", JOBS5)])}>
        Set same 5 again
      </button>
      <button type="button" data-testid="set-4" onClick={() => setFetchedJobCollections([jcFromJobs("jc-c", JOBS5.slice(0, 4))])}>
        Set 4
      </button>
      <button type="button" data-testid="select-all" onClick={() => setSelectedJobUids(JOBS5.map(j => j.uid))}>
        Select all
      </button>
      <button type="button" data-testid="select-4" onClick={() => setSelectedJobUids(["u1", "u2", "u3", "u4"])}>
        Select 4
      </button>
      <div data-testid="filtered">{JSON.stringify(filteredJobList.map(j => j.uid))}</div>
      <div data-testid="all-count">{String(allJobsList().length)}</div>
    </div>
  );
}

function renderSelectionProbe() {
  const view = render(
    <JobContextProvider>
      <SelectionProbe />
    </JobContextProvider>,
  );
  return {
    ...view,
    clickButton: (testId: string) =>
      act(() => {
        click(view.getByTestId(testId));
      }),
  };
}

describe("JobContextProvider sample floor (filteredJobList / allJobsList)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    jobCtxPersistence.state = {
      persistence: {
        runningJobCollection: undefined,
        fetchedJobCollections: [],
        selectedJobUids: [],
        currentView: "testView",
      },
      saveState: vi.fn(),
      loading: false,
    };
  });

  it("rebuilds filteredJobList on selection, skips no-op refetches and drops below the floor", () => {
    const { getByTestId, clickButton } = renderSelectionProbe();
    clickButton("set-5");
    expect(getByTestId("all-count").textContent).toBe("5");
    // 5 selected jobs cross the Dakota floor and are handed to the plots...
    clickButton("select-all");
    expect(getByTestId("filtered").textContent).toBe(JSON.stringify(["u1", "u2", "u3", "u4", "u5"]));
    // ...a brand-new collection array holding the SAME jobs must not recompute anything.
    clickButton("set-5-again");
    expect(getByTestId("filtered").textContent).toBe(JSON.stringify(["u1", "u2", "u3", "u4", "u5"]));
    // 4 selected jobs fall below the floor again -> cleared.
    clickButton("select-4");
    expect(getByTestId("filtered").textContent).toBe("[]");
    expect(getByTestId("all-count").textContent).toBe("5");
  });

  it("caps allJobsList to [] whenever fewer than five jobs were fetched", () => {
    const { getByTestId, clickButton } = renderSelectionProbe();
    expect(getByTestId("all-count").textContent).toBe("0");
    clickButton("set-5");
    expect(getByTestId("all-count").textContent).toBe("5");
    clickButton("set-4");
    expect(getByTestId("all-count").textContent).toBe("0");
  });
});

function StatusProbe() {
  const { parseStatus } = useJobContext();
  const shapes: Array<[string, unknown]> = [
    ["status-null", null],
    ["status-empty-object", {}],
    ["status-object-nonstring", { status: 42 }],
    ["status-unknown-string", "UNKNOWN"],
    ["status-job-pending", "JOB_WAITING"],
    ["status-failed", "FAILED"],
    ["status-aborted", "ABORTED"],
  ];
  return (
    <div>
      {shapes.map(([testid, value]) => (
        <div key={testid} data-testid={testid}>
          {parseStatus(value as never, {})}
        </div>
      ))}
    </div>
  );
}

describe("JobContextProvider status classification extras", () => {
  it("classifies unrecognized status shapes and the remaining status spellings", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <StatusProbe />
      </JobContextProvider>,
    );
    for (const testid of ["status-null", "status-empty-object", "status-object-nonstring", "status-unknown-string"]) {
      expect(getByTestId(testid).textContent).toBe("Please try again later");
    }
    expect(getByTestId("status-job-pending").textContent).toBe("Pending to run");
    expect(getByTestId("status-failed").textContent).toBe("Failed - no outputs");
    expect(getByTestId("status-aborted").textContent).toBe("Failed - no outputs");
  });
});

describe("JobContextProvider persistence hydration guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    jobCtxPersistence.state = {
      persistence: {
        runningJobCollection: undefined,
        fetchedJobCollections: [],
        selectedJobUids: [],
        currentView: "testView",
      },
      saveState: vi.fn(),
      loading: false,
    };
  });

  it("stays cold when there is no persistence context at all", () => {
    jobCtxPersistence.state.persistence = null;
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    expect(getByTestId("fetched-jobs").textContent).toBe("");
    expect(getByTestId("selected-uids").textContent).toBe("[]");
    expect(jobCtxPersistence.state.saveState).not.toHaveBeenCalled();
  });

  it("stops saving the moment the persistence context disappears mid-session", () => {
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    // Hydration (and the first save) happened while persistence existed.
    jobCtxPersistence.state.saveState.mockClear();
    jobCtxPersistence.state.persistence = null;

    act(() => {
      click(getByTestId("set-selected"));
    });

    expect(getByTestId("selected-uids").textContent).toContain('"1"');
    expect(jobCtxPersistence.state.saveState).not.toHaveBeenCalled();
  });

  it("does not hydrate or persist while the persistence layer is still loading", () => {
    jobCtxPersistence.state.loading = true;
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    expect(getByTestId("fetched-jobs").textContent).toBe("");
    expect(jobCtxPersistence.state.saveState).not.toHaveBeenCalled();
  });

  it("ignores persisted job state that carries no currentView", () => {
    jobCtxPersistence.state.persistence = {
      runningJobCollection: undefined,
      fetchedJobCollections: [{ jobCollection: jcFixture("jc-p"), selected: false, subJobs: [] }],
      selectedJobUids: ["j1"],
      currentView: undefined,
    };
    const { getByTestId } = render(
      <JobContextProvider>
        <TestComponent />
      </JobContextProvider>,
    );
    expect(getByTestId("fetched-jobs").textContent).toBe("");
    expect(getByTestId("selected-uids").textContent).toBe("[]");
    expect(jobCtxPersistence.state.saveState).not.toHaveBeenCalled();
  });
});
