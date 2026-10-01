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
  distribution?: { [uid: string]: { [inputVar: string]: { scale?: "linear" | "log" } } };
}) {
  const setOutputLogScales = overrides.setOutputLogScales ?? vi.fn();
  useFunctionContextMock.mockReturnValue({
    selectedFunction: { uid: "fn1" },
    inputVars: ["x"],
    distribution: overrides.distribution ?? {},
    setOutputLogScales,
    outputLogScaleUserSet: overrides.outputLogScaleUserSet ?? {},
  });
  useJobContextMock.mockReturnValue({
    filteredJobList: overrides.jobs,
  });
  return { setOutputLogScales };
}

// Mock response for /flask/dakota/sumo_cross_validation (fixed observed/predicted
// contract, flaskapi SPEC V46jk): picks linear or log variant canned data based on
// the request body's outputLogScales["qoi"] flag.
function mockCvFetch() {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    const useLog = Boolean(body.outputLogScales?.qoi);
    const data = useLog
      ? { observed: [1, 2, 3, 4, 5], predicted: [1, 2, 3, 4, 5] } // perfect fit -> rmse = 0
      : { observed: [1, 2, 3, 4, 5], predicted: [2, 2, 2, 2, 2] }; // rmse = sqrt(3) ~= 1.73
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

  it("does not fire CV requests when any job output for the QoI is <= 0 (mirrors flaskapi V16)", async () => {
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
    expect(setOutputLogScales).toHaveBeenCalledTimes(1);
  });

  it("scores the CV pair under the CURRENT input log-scales (GH-Copilot #663 audit)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
      distribution: { fn1: { x: { scale: "log" } } },
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    for (const [, init] of fetchMock.mock.calls) {
      const body = JSON.parse(init.body as string);
      expect(body.inputLogScales).toEqual({ x: true }); // not an all-linear strawman
    }
  });

  it("re-detects when an input's scale flag changes (cache key carries scale identity)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    setupContexts({ jobs });

    const { rerender } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    setupContexts({ jobs, distribution: { fn1: { x: { scale: "log" } } } });
    rerender();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  it("discards a superseded CV pair that resolves LAST (GH-Copilot #665 stale verdict)", async () => {
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    // pair 1 (linear inputs, SLOW) prefers LOG; pair 2 (log inputs, FAST) prefers
    // LINEAR. If the stale pair 1 could still commit after pair 2 applied, the
    // final state would flip to log=true.
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const logInputs = Boolean(body.inputLogScales?.x);
      const useLog = Boolean(body.outputLogScales?.qoi);
      if (!logInputs) {
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      const perfect = [1, 2, 3, 4, 5];
      const off = [2, 2, 2, 2, 2];
      const data = logInputs
        ? { observed: perfect, predicted: useLog ? off : perfect } // newer generation: linear wins
        : { observed: perfect, predicted: useLog ? perfect : off }; // superseded: log wins
      return { ok: true, json: async () => data } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const state: { [uid: string]: { [qoi: string]: boolean } } = {};
    const setOutputLogScales = vi.fn((updater: unknown) => {
      const next =
        typeof updater === "function" ? (updater as (prev: typeof state) => typeof state)(state) : (updater as typeof state);
      Object.assign(state, next);
    });

    setupContexts({ jobs, setOutputLogScales });
    const { rerender } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2); // pair 1 in flight (slow)
    });

    setupContexts({ jobs, setOutputLogScales, distribution: { fn1: { x: { scale: "log" } } } });
    rerender();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
    await waitFor(() => {
      expect(state.fn1?.qoi).toBe(false); // pair 2's verdict applied
    });

    // let the stale pair 1 land AFTER the newer verdict, then confirm it stuck
    await new Promise(resolve => setTimeout(resolve, 80));
    expect(state.fn1?.qoi).toBe(false); // ⊥ flipped back by the superseded pair
  });
});
