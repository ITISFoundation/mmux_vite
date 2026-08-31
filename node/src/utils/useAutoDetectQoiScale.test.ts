import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAutoDetectQoiScale } from "./useAutoDetectQoiScale";

const { useFunctionContextMock, useJobContextMock } = vi.hoisted(() => ({
  useFunctionContextMock: vi.fn(),
  useJobContextMock: vi.fn(),
}));

vi.mock("../context/FunctionContext", () => ({ useFunctionContext: useFunctionContextMock }));
vi.mock("../context/JobContext", () => ({ useJobContext: useJobContextMock }));

const makeJob = (uid: string, qoiValue: number) => ({
  uid,
  status: "SUCCESS",
  outputs: { qoi: qoiValue },
});

function setupContexts(overrides: {
  jobs: ReturnType<typeof makeJob>[];
  outputLogScaleUserSet?: { [uid: string]: { [qoi: string]: boolean } };
  setOutputLogScales?: ReturnType<typeof vi.fn>;
}) {
  const setOutputLogScales = overrides.setOutputLogScales ?? vi.fn();
  useFunctionContextMock.mockReturnValue({
    selectedFunction: { uid: "fn1" },
    inputVars: ["x"],
    setOutputLogScales,
    outputLogScaleUserSet: overrides.outputLogScaleUserSet ?? {},
  });
  useJobContextMock.mockReturnValue({
    filteredJobList: overrides.jobs,
  });
  return { setOutputLogScales };
}

// Mock fetch response for /flask/dakota/sumo_cross_validation: picks linear or log-space
// canned data based on the request body's outputLogScales["qoi"] flag.
function mockCvFetch() {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    const useLog = Boolean(body.outputLogScales?.qoi);
    const data = useLog
      ? { qoi: [1, 2, 3, 4, 5], qoiHat: [1, 2, 3, 4, 5] } // perfect fit -> rmse = 0
      : { qoi: [1, 2, 3, 4, 5], qoiHat: [2, 2, 2, 2, 2] }; // rmse = sqrt(3) ~= 1.73
    return { ok: true, json: async () => data } as Response;
  });
}

describe("useAutoDetectQoiScale", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fire CV requests when fewer than 5 completed jobs carry the QoI output", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setOutputLogScales).not.toHaveBeenCalled();
  });

  it("does not fire CV requests when any completed job output for the QoI is <= 0 (mirrors V41qz)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", -5), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fires both scale variants and applies the lower-RMSE scale as a default", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));

    await waitFor(() => {
      expect(setOutputLogScales).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const updater = setOutputLogScales.mock.calls[0][0];
    // The setter is called with a functional updater (Dispatch<SetStateAction<...>>).
    const result = updater({});
    expect(result).toEqual({ fn1: { qoi: true } }); // log-space had rmse=0 < linear's sqrt(3)
  });

  it("never fires or overrides when the QoI is locked via outputLogScaleUserSet (V27)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
      outputLogScaleUserSet: { fn1: { qoi: true } },
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setOutputLogScales).not.toHaveBeenCalled();
  });

  it("does not re-fire CV requests for an unchanged job-set (cached by uid/QoI/job-set key)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    const { setOutputLogScales } = setupContexts({ jobs });

    const { rerender } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(setOutputLogScales).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Re-setup with the SAME job-set (same uids) and rerender: must not re-fire.
    setupContexts({ jobs, setOutputLogScales });
    rerender();
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
