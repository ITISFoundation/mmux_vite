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
  inputVars?: string[];
  outputLogScaleUserSet?: { [uid: string]: { [qoi: string]: boolean } };
  setOutputLogScales?: ReturnType<typeof vi.fn>;
  distribution?: { [uid: string]: { [inputVar: string]: { scale?: "linear" | "log" } } };
  evidence?: { [uid: string]: { [qoi: string]: { rmseLinear: number; rmseLog: number; jobs: number; key: string } } };
}) {
  const setOutputLogScales = overrides.setOutputLogScales ?? vi.fn();
  // Evidence behaves like the real state: the setter applies functional
  // updaters into a shared mutable map that context reads expose — so tests
  // can observe receipts AND pre-seed them (cross-mount skip).
  const evidence = overrides.evidence ?? {};
  const setQoiScaleEvidence = vi.fn((updater: unknown) => {
    const next =
      typeof updater === "function"
        ? (updater as (prev: typeof evidence) => typeof evidence)(evidence)
        : (updater as typeof evidence);
    Object.assign(evidence, next);
  });
  useFunctionContextMock.mockReturnValue({
    selectedFunction: { uid: "fn1" },
    inputVars: overrides.inputVars ?? ["x"],
    distribution: overrides.distribution ?? {},
    setOutputLogScales,
    setQoiScaleEvidence,
    outputLogScaleUserSet: overrides.outputLogScaleUserSet ?? {},
    qoiScaleEvidence: evidence,
  });
  useJobContextMock.mockReturnValue({
    filteredJobList: overrides.jobs,
  });
  return { setOutputLogScales, setQoiScaleEvidence, evidence };
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

  it("re-detects after a discarded verdict when the scale flips back A→B→A (GH-Copilot #666 follow-up)", async () => {
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    // A-generations prefer LOG (slow), B prefers LINEAR (fast).
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
        ? { observed: perfect, predicted: useLog ? off : perfect } // B: linear wins
        : { observed: perfect, predicted: useLog ? perfect : off }; // A: log wins
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
      expect(fetchMock).toHaveBeenCalledTimes(2); // pair 1 (A) in flight, slow
    });

    // B starts while A is pending; B's fast verdict lands, A's is discarded mid-B.
    setupContexts({ jobs, setOutputLogScales, distribution: { fn1: { x: { scale: "log" } } } });
    rerender();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
    await waitFor(() => {
      expect(state.fn1?.qoi).toBe(false); // B's verdict applied
    });
    await new Promise(resolve => setTimeout(resolve, 60)); // pair 1 resolves + discarded
    expect(fetchMock).toHaveBeenCalledTimes(4); // discarded verdict stayed silent
    expect(state.fn1?.qoi).toBe(false);

    // Flip back to A: the discarded attempt must NOT have consumed the cache slot.
    setupContexts({ jobs, setOutputLogScales });
    rerender();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(6); // ⊥ permanently silent (B28wx)
    });
    await waitFor(() => {
      expect(state.fn1?.qoi).toBe(true); // fresh A pair's verdict commits
    });
  });

  it("writes a session evidence receipt (both errors + job count + key) alongside a committed verdict", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { setQoiScaleEvidence, evidence } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(setQoiScaleEvidence).toHaveBeenCalled();
    });

    // linear rmse = sqrt(3) (predicted all-2s), log rmse = 0 (perfect fit), 5 jobs,
    // key = uid::qoi::sortedJobUids::inputScaleSignature
    expect(evidence.fn1?.qoi).toEqual({
      rmseLinear: Math.sqrt(3),
      rmseLog: 0,
      jobs: 5,
      key: "fn1::qoi::j1,j2,j3,j4,j5::0",
    });
  });

  it("a superseded (discarded) pair writes NO evidence", async () => {
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    // Same race as the B27vb test: stale A pair (slow, linear inputs) vs
    // current B pair (fast, log inputs). Only B's verdict may leave a receipt.
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
        ? { observed: perfect, predicted: useLog ? off : perfect }
        : { observed: perfect, predicted: useLog ? perfect : off };
      return { ok: true, json: async () => data } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const state: { [uid: string]: { [qoi: string]: boolean } } = {};
    const setOutputLogScales = vi.fn((updater: unknown) => {
      const next =
        typeof updater === "function" ? (updater as (prev: typeof state) => typeof state)(state) : (updater as typeof state);
      Object.assign(state, next);
    });

    const { evidence } = setupContexts({ jobs, setOutputLogScales });
    const { rerender } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const current = setupContexts({ jobs, setOutputLogScales, evidence, distribution: { fn1: { x: { scale: "log" } } } });
    rerender();
    await waitFor(() => {
      expect(state.fn1?.qoi).toBe(false); // B's verdict applied
    });
    await new Promise(resolve => setTimeout(resolve, 80)); // stale A lands + discarded

    // Only the CURRENT generation leaves a receipt (the second setup's setter is
    // the one wired into the context when the verdict commits). The discarded A
    // pair must have written nothing ⊥ overwritten the slot.
    expect(current.setQoiScaleEvidence).toHaveBeenCalledTimes(1);
    expect(evidence.fn1?.qoi?.key).toBe("fn1::qoi::j1,j2,j3,j4,j5::1");
  });

  it("a fresh mount skips the CV pair when the current key already has a receipt (cross-mount dedup)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const jobs = [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)];
    const first = setupContexts({ jobs });
    const { unmount } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await waitFor(() => {
      expect(first.setOutputLogScales).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.evidence.fn1?.qoi).toBeDefined();
    unmount();

    // Second mount (tab switch): fresh resolvedKeys/latestKey refs, SAME
    // context state — the receipt must short-circuit the pair.
    setupContexts({ jobs, evidence: first.evidence });
    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2); // ⊥ re-fired
  });

  it("requires max(5, n_inputs + 1) completed jobs — the backend's CV contract", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const inputVars = ["x1", "x2", "x3", "x4", "x5", "x6"]; // → min is 7, not 5
    const sixJobs = [10, 20, 30, 40, 50, 60].map((v, i) => makeJob(`j${i + 1}`, v));
    setupContexts({ jobs: sixJobs, inputVars });

    const { rerender } = renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(fetchMock).not.toHaveBeenCalled(); // 6 jobs < max(5, 7): ⊥ firing into a 422

    setupContexts({ jobs: [...sixJobs, makeJob("j7", 70)], inputVars });
    rerender();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2); // 7 jobs: fires
    });
  });

  it("invalidates an UNLOCKED auto log-verdict when the job-set turns non-positive", async () => {
    vi.stubGlobal("fetch", mockCvFetch());
    const staleKey = "fn1::qoi::j1,j2,j3,j4::0"; // computed under the OLD 4-job set
    const evidence = { fn1: { qoi: { rmseLinear: 1, rmseLog: 0.5, jobs: 4, key: staleKey } } };
    const scaleUpdates: { [uid: string]: { [qoi: string]: boolean } }[] = [];
    const setOutputLogScales = vi.fn((updater: unknown) => {
      scaleUpdates.push(
        typeof updater === "function"
          ? (updater as (prev: { [uid: string]: { [qoi: string]: boolean } }) => { fn1: { qoi: boolean } })(
              { fn1: { qoi: true } }, // the prior auto verdict in live state
            )
          : (updater as { [uid: string]: { [qoi: string]: boolean } }),
      );
    });
    setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", -5), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
      setOutputLogScales,
      evidence,
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    // the ≤0 output (j2) forces the invalidation branch (current key ≠ stale receipt,
    // so the cross-mount skip cannot shield it)
    expect(setOutputLogScales).toHaveBeenCalled();
    expect(scaleUpdates.at(-1)).toEqual({ fn1: { qoi: false } }); // verdict reset to linear
    expect(evidence.fn1).toEqual({}); // receipt dropped (the harness setter is functional)
  });

  it("never invalidates a MANUALLY LOCKED verdict on non-positive outputs (user data)", async () => {
    const fetchMock = mockCvFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", -5), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
      outputLogScaleUserSet: { fn1: { qoi: true } },
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(setOutputLogScales).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("self-heals a transient CV failure: the retried pair commits its verdict (GH-Copilot #706)", async () => {
    // The FIRST request of the first pair answers malformed (rmse undefined);
    // everything after behaves like the canned good pair.
    const good = mockCvFetch();
    let poisoned = false;
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (!poisoned) {
        poisoned = true;
        return { ok: true, json: async () => ({ error: "transient blip" }) } as unknown as Response;
      }
      return good(url, init);
    });
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));

    // No rerender, no dep change: the failure itself re-fires the effect and
    // the second pair's verdict lands (refund-only, Copilot #696, never did).
    await waitFor(() => {
      expect(setOutputLogScales).toHaveBeenCalled();
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(2); // the pair re-fired
  });

  it("gives up after the retry cap when CV keeps failing — no verdict, no infinite loop (GH-Copilot #706)", async () => {
    // every CV call answers without the observed/predicted arrays → both rmse undefined
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ error: "boom" }) }) as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { setOutputLogScales } = setupContexts({
      jobs: [makeJob("j1", 10), makeJob("j2", 20), makeJob("j3", 30), makeJob("j4", 40), makeJob("j5", 50)],
    });

    renderHook(() => useAutoDetectQoiScale(["qoi"]));

    // The refund alone never re-fired anything (refs don't render — the old
    // contract needed a manual rerender to observe a retry). Now the pair
    // re-fires on its own, bounded per key: 1 initial + MAX_CV_RETRIES=2
    // retries = 3 pairs × 2 CV calls.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalledTimes(6); // bounded: CV traffic stopped
    expect(setOutputLogScales).not.toHaveBeenCalled(); // and nothing was committed
  });
});
