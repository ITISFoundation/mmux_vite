import { toast } from "react-toastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createJobStudyCopy, openStudyUid } from "./functionUtils";
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

  it("sends the test job as JSON so the backend can parse it", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ uid: "job-1" }) }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(createJobStudyCopy).mockResolvedValueOnce("" as never);
    vi.spyOn(toast, "warning").mockImplementation(() => "" as never);

    await runSingleJob({ uid: "function-1", title: "Function" } as never, [{ variable: "x", value: 1 }], vi.fn());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/flask/sampling/test_job");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init?.body as string)).toEqual({ funUid: "function-1", config: [{ variable: "x", value: 1 }] });
  });

  it.each([
    [new Error("copy failed"), "Not possible to open your Job! copy failed Please contact support"],
    ["", "Not possible to open your Job! Please contact support"],
  ])("warns when the job copy cannot be opened", async (copyUid, warning) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ uid: "job-1" }) })),
    );
    vi.mocked(createJobStudyCopy).mockResolvedValueOnce(copyUid as never);
    const toastWarning = vi.spyOn(toast, "warning").mockImplementation(() => "" as never);

    await runSingleJob({ uid: "function-1", title: "Function" } as never, [], vi.fn());

    expect(toastWarning).toHaveBeenCalledWith(warning);
  });

  it("opens project jobs and rejects non-project jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ uid: "job-1", functionClass: "PROJECT" }) })),
    );
    vi.mocked(createJobStudyCopy).mockResolvedValueOnce("copy-1" as never);
    await runSingleJob({ uid: "function-1", title: "Function" } as never, [], vi.fn());
    expect(openStudyUid).toHaveBeenCalledWith("copy-1");

    vi.mocked(createJobStudyCopy).mockResolvedValueOnce("copy-2" as never);
    const toastWarning = vi.spyOn(toast, "warning").mockImplementation(() => "" as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ uid: "job-2", functionClass: "DOCKER" }) })),
    );
    await runSingleJob({ uid: "function-1", title: "Function" } as never, [], vi.fn());
    expect(toastWarning).toHaveBeenCalledWith("Only ProjectFunctionJob can be opened in a new window!");
  });
});
