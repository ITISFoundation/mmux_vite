import { describe, expect, it, vi } from "vitest";
import { logColorbarTicks } from "../../utils/plotScale";
import { buildSobolBarData, buildSobolHeatmapData } from "../../utils/sobolIndices";

vi.mock("../../utils/sobolIndices", async importOriginal => {
  const mod = await importOriginal<typeof import("../../utils/sobolIndices")>();
  return mod;
});

describe("SobolIndicesPlot toggle helpers", () => {
  const getZ = (trace: ReturnType<typeof buildSobolHeatmapData>): number[][] => trace.z as number[][];
  const sobol = {
    x1: { main: 0.5, total: 0.7, mainCiLow: 0.5, mainCiHigh: 0.5, totalCiLow: 0.7, totalCiHigh: 0.7 },
    x2: { main: 0.3, total: 0.5, mainCiLow: 0.3, mainCiHigh: 0.3, totalCiLow: 0.5, totalCiHigh: 0.5 },
  };
  const sobolSecondOrder = {
    x1: { x2: 0.1 },
    x2: { x1: 0.1 },
  };

  it("first-order: buildSobolBarData returns a single Main-effect trace", () => {
    const traces = buildSobolBarData(sobol, ["x1", "x2"], { main: "#aaa", total: "#bbb" });
    expect(traces).toHaveLength(2);
    expect(traces[0]).toMatchObject({ name: "Main effect" });
  });

  it("total-order: buildSobolBarData returns a Total-effect trace", () => {
    const traces = buildSobolBarData(sobol, ["x1", "x2"], { main: "#aaa", total: "#bbb" });
    expect(traces[1]).toMatchObject({ name: "Total effect" });
  });

  it("second-order: buildSobolHeatmapData returns a heatmap trace", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(trace.type).toBe("heatmap");
    expect(trace.z).toHaveLength(2);
  });

  it("second-order: diagonal cells contain first-order values", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(getZ(trace)[0][0]).toBe(0.5);
    expect(getZ(trace)[1][1]).toBe(0.3);
  });

  it("second-order: off-diagonal cells contain pairwise second-order values", () => {
    const trace = buildSobolHeatmapData(sobol, sobolSecondOrder, ["x1", "x2"]);
    expect(getZ(trace)[0][1]).toBe(0.1);
    expect(getZ(trace)[1][0]).toBe(0.1);
  });

  it("second-order: heatmap supports any input count (arbitrary-d backend, T31rb) incl. d=8", () => {
    // Regression for the user request: after T31rb the exact pair estimator is
    // valid at any d, so a d=8 second-order matrix must render in full (⊥ gate).
    const vars = ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"];
    const sobol8: SobolIndicesResponse["sobol"] = Object.fromEntries(
      vars.map((v, i) => [
        v,
        { main: 0.1 + i * 0.01, total: 0.4, mainCiLow: 0.1, mainCiHigh: 0.1, totalCiLow: 0.4, totalCiHigh: 0.4 },
      ]),
    );
    // every unordered pair gets a distinct symmetric value for spot-checks
    const pairs: SobolIndicesResponse["sobolSecondOrder"] = {};
    for (let i = 0; i < vars.length; i += 1) {
      pairs[vars[i]] = {};
    }
    for (let i = 0; i < vars.length; i += 1) {
      for (let j = i + 1; j < vars.length; j += 1) {
        const v = i * 0.01 + j * 0.001;
        pairs[vars[i]][vars[j]] = v;
        pairs[vars[j]][vars[i]] = v;
      }
    }

    const trace = buildSobolHeatmapData(sobol8, pairs, vars);
    const z = trace.z as number[][];
    expect(trace.type).toBe("heatmap");
    expect(z).toHaveLength(8);
    expect(z.every(row => row.length === 8)).toBe(true);
    // diagonal = first-order main values
    expect(z[0][0]).toBeCloseTo(0.1);
    expect(z[7][7]).toBeCloseTo(0.1 + 7 * 0.01);
    // off-diagonal symmetric + fully populated (no zero-padding fallback)
    for (let i = 0; i < 8; i += 1) {
      for (let j = 0; j < 8; j += 1) {
        if (i !== j) {
          const lo = Math.min(i, j);
          const hi = Math.max(i, j);
          expect(z[i][j]).toBeCloseTo(lo * 0.01 + hi * 0.001, 5);
        }
      }
    }
  });

  it("log colorbar ticks are back-transformed from log10 exponents to index values", () => {
    const { tickvals, ticktext } = logColorbarTicks();
    expect(tickvals).toEqual([-2, -1, 0]);
    expect(ticktext).toEqual(["0.01", "0.1", "1"]);
  });
});
