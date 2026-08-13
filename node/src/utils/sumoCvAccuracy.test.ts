import { describe, expect, it } from "vitest";
import { computeCvStatistics } from "./sumoCvAccuracy";

describe("computeCvStatistics", () => {
  it("computes error and goodness-of-fit metrics", () => {
    const metrics = computeCvStatistics([1, 2, 3], [1, 2, 4]);

    expect(metrics.mae).toBeCloseTo(1 / 3);
    expect(metrics.rmse).toBeCloseTo(Math.sqrt(1 / 3));
    expect(metrics.r2).toBeCloseTo(0.5);
    expect(metrics.stdY).toBeCloseTo(1);
  });

  it("returns finite zero metrics for empty samples", () => {
    const metrics = computeCvStatistics([], []);

    expect(metrics).toEqual({ meanY: 0, stdY: 0, meanYHat: 0, stdYHat: 0, mae: 0, rmse: 0, r2: 0 });
  });

  it("uses zero spread for a single sample", () => {
    const metrics = computeCvStatistics([2], [3]);

    expect(metrics.stdY).toBe(0);
    expect(metrics.stdYHat).toBe(0);
    expect(Number.isFinite(metrics.rmse)).toBe(true);
  });
});
