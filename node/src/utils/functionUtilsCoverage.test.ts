import { describe, expect, it, vi } from "vitest";
import {
  aggregateInputValues,
  aggregateOutputValues,
  createJobStudyCopy,
  filterForFinalStatus,
  getJobCollectionStatus,
  getJobStatusCounts,
} from "./functionUtils";

const toastMocks = vi.hoisted(() => ({ error: vi.fn(), warning: vi.fn() }));
vi.mock("react-toastify", () => ({ toast: toastMocks }));

const subJob = (status: unknown, inputs: Record<string, unknown> = {}, outputs: Record<string, unknown> = {}) => ({
  selected: false,
  job: { uid: String(status), status, inputs, outputs },
});

describe("function utility status and failure branches", () => {
  it("counts success, failure, running, pending, unknown, and malformed statuses", () => {
    const counts = getJobStatusCounts([
      subJob("SUCCESS"),
      subJob("FAILED"),
      subJob("STARTED"),
      subJob("PENDING"),
      subJob("WAITING_FOR_RESOURCES"),
      subJob("PUBLISHED"),
      subJob("UNEXPECTED"),
      subJob({ status: "SUCCESS" }),
      { selected: false, job: undefined },
    ] as never);

    expect(counts).toEqual({ success: 2, running: 1, failed: 1, pending: 3, unknown: 1 });
  });

  it("summarizes every job collection status", () => {
    expect(getJobCollectionStatus([])).toBe("NO JOBS");
    expect(getJobCollectionStatus([subJob("SUCCESS")] as never)).toBe("COMPLETE");
    expect(getJobCollectionStatus([subJob("FAILED")] as never)).toBe("FAILED");
    expect(getJobCollectionStatus([subJob("RUNNING")] as never)).toBe("RUNNING");
    expect(getJobCollectionStatus([subJob("PENDING")] as never)).toBe("PENDING");
    expect(getJobCollectionStatus([subJob("SUCCESS"), subJob("FAILED")] as never)).toBe("FAILED PARTIALLY");
    expect(getJobCollectionStatus([subJob("UNKNOWN")] as never)).toBe("UNKNOWN");
  });

  it("filters final statuses and aggregates numeric values only", () => {
    expect(filterForFinalStatus("SUCCESS")).toBe(true);
    expect(filterForFinalStatus("JOB_FAILURE")).toBe(true);
    expect(filterForFinalStatus("RUNNING")).toBe(false);

    const jobs = [
      { inputs: { alpha: 1, ignored: "x" }, outputs: { result: 2 } },
      { inputs: { alpha: 3 }, outputs: { result: "x" } },
    ] as never;
    expect(aggregateInputValues(jobs)).toEqual({ alpha: [1, 3] });
    expect(aggregateOutputValues(jobs)).toEqual({ result: [2] });
  });

  it("returns errors for failed or malformed job-copy responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, statusText: "Bad Request" }));
    const failed = await createJobStudyCopy("Demo", { projectJobId: "job-1", inputs: {} } as never);
    expect(failed).toBeInstanceOf(Error);
    expect(toastMocks.error).toHaveBeenCalledWith("Error creating Job Copy for inspection");
    vi.mocked(console.error).mockClear();

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as Response);
    const missingUid = await createJobStudyCopy("Demo", { projectJobId: "job-2", inputs: {} } as never);
    expect(missingUid).toBeInstanceOf(Error);
    expect(toastMocks.error).toHaveBeenCalledWith("Failed to open job copy: No UID returned");
  });
});
