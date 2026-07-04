import { beforeEach, describe, expect, it, vi } from "vitest";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import { buildSobolBarData, fetchSobolIndices } from "./sobolIndices";

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
        x1: { main: 0.7, total: 0.9 },
        x2: { main: 0.1, total: 0.2 },
      },
    };
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseBody),
    } as Response);

    const result = await fetchSobolIndices({
      inputVars: ["x1", "x2"],
      output: "y",
      distributions: { x1: { distribution: "uniform", min: 0, max: 1 } },
      functionJobs: mockJobs,
      numSamples: 500,
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
    expect(body).toEqual({
      inputVars: ["x1", "x2"],
      output: "y",
      distributions: { x1: { distribution: "uniform", min: 0, max: 1 } },
      numSamples: 500,
      FunctionJobs: mockJobs,
      seed: 42,
    });
  });

  it("defaults seed to 0 when not provided", async () => {
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sobol: {} }),
    } as Response);

    await fetchSobolIndices({
      inputVars: ["x1"],
      output: "y",
      distributions: {},
      functionJobs: mockJobs,
      numSamples: 100,
    });

    const [, options] = mockedFetchWithRetry.mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.seed).toBe(0);
  });

  it("throws (⊥ resolves) on a non-OK response", async () => {
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
    } as Response);

    await expect(
      fetchSobolIndices({
        inputVars: ["x1"],
        output: "y",
        distributions: {},
        functionJobs: mockJobs,
        numSamples: 100,
      }),
    ).rejects.toThrow(/500/);
  });
});

describe("buildSobolBarData", () => {
  it("builds one Main-effect trace and one Total-effect trace, ordered by inputVars", () => {
    const sobol: SobolIndicesResponse["sobol"] = {
      x1: { main: 0.7, total: 0.9 },
      x2: { main: 0.1, total: 0.2 },
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
    const traces = buildSobolBarData({ x1: { main: 0.5, total: 0.6 } }, ["x1", "x2"], {
      main: "#111111",
      total: "#222222",
    });

    expect(traces[0]).toMatchObject({ y: [0.5, 0] });
    expect(traces[1]).toMatchObject({ y: [0.6, 0] });
  });
});
