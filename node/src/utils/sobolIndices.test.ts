import { beforeEach, describe, expect, it, vi } from "vitest";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import { buildSobolBarData, buildSobolHeatmapData, fetchSobolIndices, initialSobolDomain } from "./sobolIndices";

vi.mock("./fetchRetry", () => ({
  fetchWithRetry: vi.fn(),
}));

const mockedFetchWithRetry = vi.mocked(fetchWithRetry);

const mockJobs: OsparcFunctionJob[] = [
  { uid: "job1", functionUid: "func1", inputs: { x1: 1 }, outputs: { y: 2 }, status: "COMPLETED" },
];

beforeEach(() => {
  mockedFetchWithRetry.mockReset();
});

describe("fetchSobolIndices", () => {
  it("posts the expected payload and returns the parsed response on success", async () => {
    const mockResponseBody: SobolIndicesResponse = {
      sobol: {
        x1: { main: 0.7, total: 0.9, mainCiLow: 0.7, mainCiHigh: 0.7, totalCiLow: 0.9, totalCiHigh: 0.9 },
        x2: { main: 0.1, total: 0.2, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.2, totalCiHigh: 0.2 },
      },
      sobolSecondOrder: {
        x1: { x2: 0.05 },
        x2: { x1: 0.05 },
      },
      sobolOrderContributions: {
        firstOrder: 0.8,
        secondOrder: 0.1,
        thirdAndHigher: 0.1,
        firstOrderCiLow: 0.75,
        firstOrderCiHigh: 0.85,
        secondOrderCiLow: 0.0,
        secondOrderCiHigh: 0.2,
        thirdAndHigherCiLow: -0.1,
        thirdAndHigherCiHigh: 0.3,
        heuristicNoiseFloor: 0.02,
      },
    };
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseBody),
    } as Response);

    const result = await fetchSobolIndices({
      inputVars: ["x1", "x2"],
      output: "y",
      domains: { x1: { minimum: 0, maximum: 1 } },
      fixed: { x2: 0.25 },
      inputLogScales: { x1: true },
      outputLogScales: { y: false },
      functionJobs: mockJobs,
      seed: 42,
    });

    expect(result).toEqual(mockResponseBody);
    expect(mockedFetchWithRetry).toHaveBeenCalledWith(
      "/flask/dakota/compute_sobol_indices",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const [, options] = mockedFetchWithRetry.mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    // bounds-editor contract (V26dd): domains + fixed, NO distributions/numSamples
    expect(body).toEqual({
      inputVars: ["x1", "x2"],
      output: "y",
      domains: { x1: { minimum: 0, maximum: 1 } },
      fixed: { x2: 0.25 },
      inputLogScales: { x1: true },
      outputLogScales: { y: false },
      FunctionJobs: mockJobs,
      seed: 42,
    });
  });

  it("defaults seed to 0 and scale maps to {} when not provided", async () => {
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sobol: {}, sobolSecondOrder: {} }),
    } as Response);

    await fetchSobolIndices({
      inputVars: ["x1"],
      output: "y",
      domains: {},
      fixed: {},
      functionJobs: mockJobs,
    });

    const [, options] = mockedFetchWithRetry.mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.seed).toBe(0);
    expect(body.inputLogScales).toEqual({});
    expect(body.outputLogScales).toEqual({});
  });

  it("throws (⊥ resolves) on a non-OK response", async () => {
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ error: "Sobol model failed" }),
      clone: () =>
        ({
          json: () => Promise.resolve({ error: "Sobol model failed" }),
          text: () => Promise.resolve(""),
        }) as Response,
    } as Response);

    await expect(
      fetchSobolIndices({
        inputVars: ["x1"],
        output: "y",
        domains: {},
        fixed: {},
        functionJobs: mockJobs,
      }),
    ).rejects.toThrow("Sobol model failed");
  });
});

describe("initialSobolDomain", () => {
  it("maps uniform selections to explicit boxes", () => {
    const { domains, fixed } = initialSobolDomain(["x1"], {
      x1: { distribution: "uniform", min: -2, max: 4 },
    });
    expect(domains).toEqual({ x1: { minimum: -2, maximum: 4 } });
    expect(fixed).toEqual({});
  });

  it("maps normal selections to the mean ± 3σ box (FE-owned choice, V26dd)", () => {
    const { domains } = initialSobolDomain(["x1"], {
      x1: { distribution: "normal", mean: 0.5, std: 0.1 },
    });
    expect(domains.x1.minimum).toBeCloseTo(0.2);
    expect(domains.x1.maximum).toBeCloseTo(0.8);
  });

  it("maps constant selections to pins (a9; this path used to 422)", () => {
    const { domains, fixed } = initialSobolDomain(["x1"], {
      x1: { distribution: "constant", value: 3.5 },
    });
    expect(domains).toEqual({});
    expect(fixed).toEqual({ x1: 3.5 });
  });

  it("leaves missing/ill-formed entries unspecified (backend auto-infers)", () => {
    const { domains, fixed } = initialSobolDomain(["x1", "x2", "x3"], {
      x1: { distribution: "uniform", min: 1 }, // degenerate: missing max
      x2: { distribution: "normal", mean: 0 }, // no std
      // x3 has no entry at all
    });
    expect(domains).toEqual({});
    expect(fixed).toEqual({});
  });

  it("handles undefined selections entirely", () => {
    expect(initialSobolDomain(["x1"], undefined)).toEqual({ domains: {}, fixed: {} });
  });
});

describe("buildSobolBarData", () => {
  it("builds one Main-effect trace and one Total-effect trace, ordered by inputVars", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.7, total: 0.9, mainCiLow: 0.7, mainCiHigh: 0.7, totalCiLow: 0.9, totalCiHigh: 0.9 },
      x2: { main: 0.1, total: 0.2, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.2, totalCiHigh: 0.2 },
    };

    const traces = buildSobolBarData(sobol, ["x1", "x2"], {
      main: "#111111",
      total: "#222222",
    });

    expect(traces).toHaveLength(2);
    expect(traces[0]).toMatchObject({ x: ["x1", "x2"], y: [0.7, 0.1], name: "Main effect", type: "bar" });
    expect(traces[1]).toMatchObject({ x: ["x1", "x2"], y: [0.9, 0.2], name: "Total effect", type: "bar" });
  });

  it("falls back to 0 for input variables missing from the sobol map", () => {
    const traces = buildSobolBarData(
      { x1: { main: 0.5, total: 0.6, mainCiLow: 0.5, mainCiHigh: 0.5, totalCiLow: 0.6, totalCiHigh: 0.6 } },
      ["x1", "x2"],
      {
        main: "#111111",
        total: "#222222",
      },
    );

    expect(traces[0]).toMatchObject({ y: [0.5, 0] });
    expect(traces[1]).toMatchObject({ y: [0.6, 0] });
  });
});

describe("buildSobolHeatmapData", () => {
  const getZ = (trace: ReturnType<typeof buildSobolHeatmapData>): number[][] => trace.z as number[][];

  it("returns a heatmap trace with correct shape", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.7, total: 0.9, mainCiLow: 0.7, mainCiHigh: 0.7, totalCiLow: 0.9, totalCiHigh: 0.9 },
      x2: { main: 0.1, total: 0.2, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.2, totalCiHigh: 0.2 },
    };
    const sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"] = {
      x1: { x2: 0.05 },
      x2: { x1: 0.05 },
    };

    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);

    expect(trace.type).toBe("heatmap");
    expect(trace.x).toEqual(["x1", "x2"]);
    expect(trace.y).toEqual(["x1", "x2"]);
    expect(trace.z).toHaveLength(2);
    expect(getZ(trace)[0]).toHaveLength(2);
    expect(getZ(trace)[1]).toHaveLength(2);
  });

  it("fills diagonal cells with first-order (main) index", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.7, total: 0.9, mainCiLow: 0.7, mainCiHigh: 0.7, totalCiLow: 0.9, totalCiHigh: 0.9 },
      x2: { main: 0.1, total: 0.2, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.2, totalCiHigh: 0.2 },
    };
    const sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"] = {
      x1: { x2: 0.05 },
      x2: { x1: 0.05 },
    };

    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);

    expect(getZ(trace)[0][0]).toBe(0.7);
    expect(getZ(trace)[1][1]).toBe(0.1);
  });

  it("places symmetric pairwise second-order values correctly", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.5, total: 0.7, mainCiLow: 0.5, mainCiHigh: 0.5, totalCiLow: 0.7, totalCiHigh: 0.7 },
      x2: { main: 0.3, total: 0.5, mainCiLow: 0.3, mainCiHigh: 0.3, totalCiLow: 0.5, totalCiHigh: 0.5 },
      x3: { main: 0.1, total: 0.2, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.2, totalCiHigh: 0.2 },
    };
    const sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"] = {
      x1: { x2: 0.08, x3: 0.03 },
      x2: { x1: 0.08, x3: 0.02 },
      x3: { x1: 0.03, x2: 0.02 },
    };

    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2", "x3"]);

    // off-diagonal: x1↔x2
    expect(getZ(trace)[0][1]).toBe(0.08);
    expect(getZ(trace)[1][0]).toBe(0.08);
    // off-diagonal: x1↔x3
    expect(getZ(trace)[0][2]).toBe(0.03);
    expect(getZ(trace)[2][0]).toBe(0.03);
    // off-diagonal: x2↔x3
    expect(getZ(trace)[1][2]).toBe(0.02);
    expect(getZ(trace)[2][1]).toBe(0.02);
  });

  it("handles missing second-order entries by falling back to 0", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.4, total: 0.6, mainCiLow: 0.4, mainCiHigh: 0.4, totalCiLow: 0.6, totalCiHigh: 0.6 },
      x2: { main: 0.2, total: 0.3, mainCiLow: 0.2, mainCiHigh: 0.2, totalCiLow: 0.3, totalCiHigh: 0.3 },
    };
    const sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"] = {};

    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);

    // diagonal should still have first-order values
    expect(getZ(trace)[0][0]).toBe(0.4);
    expect(getZ(trace)[1][1]).toBe(0.2);
    // off-diagonal should be 0
    expect(getZ(trace)[0][1]).toBe(0);
    expect(getZ(trace)[1][0]).toBe(0);
  });

  it("handles missing first-order entries by falling back to 0 on diagonal", () => {
    const sobol: SobolIndicesResponse["sobol"] = {};
    const sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"] = {};

    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);

    expect(getZ(trace)[0][0]).toBe(0);
    expect(getZ(trace)[1][1]).toBe(0);
  });
});
