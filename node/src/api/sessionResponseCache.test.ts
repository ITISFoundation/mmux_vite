import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRequestCacheKey, clearSessionResponseCacheForTests, getCachedOrFetch } from "./sessionResponseCache";

const jobs = (uids: string[]) => uids.map(uid => ({ uid, extra: { heavy: true } }));

describe("buildRequestCacheKey (V46sc, B37rv)", () => {
  it("is invariant to key insertion order and job-array order", () => {
    const a = buildRequestCacheKey("/flask/x", { seed: 3, numSamples: 100, FunctionJobs: jobs(["b", "a"]) });
    const b = buildRequestCacheKey("/flask/x", { numSamples: 100, FunctionJobs: jobs(["a", "b"]), seed: 3 });
    expect(a).toBe(b);
  });

  it("changes when ANY sent parameter changes", () => {
    const base = {
      url: "/flask/dakota/manual_uq_propagation_with_uncertainty",
      body: {
        output: "y",
        numSamples: 10000,
        seed: 0,
        nHistograms: 50,
        distributions: { x1: { distribution: "uniform", min: 0, max: 1 } },
        FunctionJobs: jobs(["j1", "j2"]),
      },
    };
    const baseKey = buildRequestCacheKey(base.url, base.body);
    expect(buildRequestCacheKey("/flask/dakota/other", base.body)).not.toBe(baseKey);
    expect(buildRequestCacheKey(base.url, { ...base.body, seed: 1 })).not.toBe(baseKey);
    expect(buildRequestCacheKey(base.url, { ...base.body, numSamples: 10001 })).not.toBe(baseKey);
    expect(buildRequestCacheKey(base.url, { ...base.body, nHistograms: 51 })).not.toBe(baseKey);
    expect(
      buildRequestCacheKey(base.url, {
        ...base.body,
        distributions: { x1: { distribution: "uniform", min: 0, max: 2 } },
      }),
    ).not.toBe(baseKey);
    expect(buildRequestCacheKey(base.url, { ...base.body, FunctionJobs: jobs(["j1", "j2", "j3"]) })).not.toBe(baseKey);
  });

  it("distinguishes widened axis ranges carried in the distribution", () => {
    const narrow = buildRequestCacheKey("/flask/x", { distribution: { x1: { min: 0, max: 1 } } });
    const wide = buildRequestCacheKey("/flask/x", { distribution: { x1: { min: -5, max: 1 } } });
    expect(narrow).not.toBe(wide);
  });
});

describe("getCachedOrFetch (V46sc)", () => {
  afterEach(() => {
    clearSessionResponseCacheForTests();
  });

  it("a second identical fetch is served with ZERO network, incl. from a fresh caller", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ value: 1 });
    await expect(getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy)).resolves.toEqual({ value: 1 });
    await expect(getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy)).resolves.toEqual({ value: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("concurrent identical fetches share one request (in-flight dedup)", async () => {
    let release: (v: { done: boolean }) => void = () => undefined;
    const fetchSpy = vi.fn().mockReturnValue(new Promise(resolve => (release = resolve)));
    const first = getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy);
    const second = getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy);
    release({ done: true });
    await expect(first).resolves.toEqual({ done: true });
    await expect(second).resolves.toEqual({ done: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("failures are NOT cached and do not block the next retry", async () => {
    const fetchSpy = vi.fn().mockRejectedValueOnce(new Error("500 boom")).mockResolvedValueOnce({ ok: true });
    await expect(getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy)).rejects.toThrow("500 boom");
    await expect(getCachedOrFetch("/flask/x", { a: 1 }, fetchSpy)).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("mutating a fetched payload cannot poison the cache", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ list: [1, 2, 3] });
    const first = await getCachedOrFetch<{ list: number[] }>("/flask/x", {}, fetchSpy);
    first.list.push(999);
    first.list[0] = 42;
    await expect(getCachedOrFetch("/flask/x", {}, fetchSpy)).resolves.toEqual({ list: [1, 2, 3] });
  });

  it("evicts the least recently used entry beyond the cap", async () => {
    const fetchSpy = vi.fn((n: number) => Promise.resolve({ n }));
    const fill = (keyBody: number) => getCachedOrFetch("/flask/lru", { keyBody }, () => fetchSpy(keyBody));
    // touch keyBody 0 last so it survives as most recently used
    await fill(0);
    for (let n = 1; n <= 70; n += 1) {
      await fill(n);
    }
    await fill(0); // re-hit → recency bump, evicts oldest
    await expect(fill(0)).resolves.toEqual({ n: 0 });
    expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(72);
    // keyBody=1 was the oldest untouched entry: it must have been evicted (refetch)
    const before = fetchSpy.mock.calls.length;
    await fill(1);
    expect(fetchSpy.mock.calls.length).toBe(before + 1);
  });
});
