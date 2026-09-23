import { toast } from "react-toastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runSingleJob } from "./samplingUtils";

vi.mock("./functionUtils", () => ({
  createJobStudyCopy: vi.fn(),
  openStudyUid: vi.fn(),
}));

describe("runSingleJob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an attempt without a selected function", async () => {
    const setLaunchingSampling = vi.fn();
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    await runSingleJob(undefined, [], setLaunchingSampling);

    expect(toastError).toHaveBeenCalledWith("No function selected. Please select a function before running the job.");
    expect(setLaunchingSampling).not.toHaveBeenCalled();
  });

  it("stops and warns when the backend rejects the test job", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 502,
          text: () => Promise.resolve("upstream unavailable"),
        }),
      ),
    );
    const setLaunchingSampling = vi.fn();
    const toastWarning = vi.spyOn(toast, "warning").mockImplementation(() => "" as never);

    await runSingleJob({ uid: "function-1", title: "Function" } as never, [], setLaunchingSampling);

    expect(setLaunchingSampling).toHaveBeenNthCalledWith(1, true);
    expect(setLaunchingSampling).toHaveBeenNthCalledWith(2, false);
    expect(toastWarning).toHaveBeenCalledWith("Test Job running failed! Please contact support");
    vi.mocked(console.error).mockClear();
  });
});
