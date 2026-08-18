import { beforeEach, describe, expect, it, vi } from "vitest";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import { buildCorrelationBarData, fetchCorrelationIndices } from "./correlationIndices";

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

describe("fetchCorrelationIndices", () => {
  it("posts the expected payload and returns the parsed response on success", async () => {
    const mockResponseBody: CorrelationIndicesResponse = {
      correlations: {
        x1: { pearson: 0.9, spearman: 0.85 },
        x2: { pearson: -0.1, spearman: -0.05 },
      },
    };
    mockedFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseBody),
    } as Response);

    const result = await fetchCorrelationIndices({
      inputVars: ["x1", "x2"],
      output: "y",
      distributions: { x1: { distribution: "uniform", min: 0, max: 1 } },
      functionJobs: mockJobs,
      numSamples: 500,
      seed: 42,
    });

    expect(result).toEqual(mockResponseBody);
    expect(mockedFetchWithRetry).toHaveBeenCalledWith(
      "/flask/dakota/compute_correlation_indices",
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
      json: () => Promise.resolve({ correlations: {} }),
    } as Response);

    await fetchCorrelationIndices({
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
      fetchCorrelationIndices({
        inputVars: ["x1"],
        output: "y",
        distributions: {},
        functionJobs: mockJobs,
        numSamples: 100,
      }),
    ).rejects.toThrow(/500/);
  });
});

describe("buildCorrelationBarData", () => {
  it("builds one Pearson trace and one Spearman trace, ordered by inputVars", () => {
    const correlations: CorrelationIndicesResponse["correlations"] = {
      x1: { pearson: 0.9, spearman: 0.8 },
      x2: { pearson: -0.4, spearman: -0.3 },
    };

    const traces = buildCorrelationBarData(correlations, ["x1", "x2"], {
      pearson: "#111111",
      spearman: "#222222",
    });

    expect(traces).toHaveLength(2);
    expect(traces[0]).toMatchObject({ x: ["x1", "x2"], y: [0.9, -0.4], name: "Pearson", type: "bar" });
    expect(traces[1]).toMatchObject({ x: ["x1", "x2"], y: [0.8, -0.3], name: "Spearman", type: "bar" });
  });

  it("falls back to 0 for input variables missing from the correlations map", () => {
    const traces = buildCorrelationBarData({ x1: { pearson: 0.5, spearman: 0.4 } }, ["x1", "x2"], {
      pearson: "#111111",
      spearman: "#222222",
    });

    expect(traces[0]).toMatchObject({ y: [0.5, 0] });
    expect(traces[1]).toMatchObject({ y: [0.4, 0] });
  });
});
