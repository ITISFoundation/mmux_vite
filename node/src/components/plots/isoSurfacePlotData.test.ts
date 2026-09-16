import { describe, expect, it } from "vitest";
import { buildIsoSurfacePlotData } from "./isoSurfacePlotData";

describe("V29rt: isosurface plot data", () => {
  it("keeps coordinate and prediction arrays flat and aligned", () => {
    const plotData = buildIsoSurfacePlotData({ x1: [0, 1], x2: [2, 3], x3: [4, 5], y: [6, 7] }, "x1", "x2", "x3", "y");

    expect(plotData).toMatchObject({
      x: [0, 1],
      y: [2, 3],
      z: [4, 5],
      value: [6, 7],
    });
    expect(Array.isArray(plotData.value?.[0])).toBe(false);
  });
});
