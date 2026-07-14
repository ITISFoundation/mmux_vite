import { describe, expect, it, vi } from "vitest";
import { buildSobolBarData, buildSobolHeatmapData } from "../../utils/sobolIndices";

vi.mock("../../utils/sobolIndices", async importOriginal => {
  const mod = await importOriginal<typeof import("../../utils/sobolIndices")>();
  return mod;
});

describe("SobolIndicesPlot toggle helpers", () => {
  const getZ = (trace: ReturnType<typeof buildSobolHeatmapData>): number[][] => trace.z as number[][];
  const sobol = {
    x1: { main: 0.5, total: 0.7 },
    x2: { main: 0.3, total: 0.5 },
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
});
