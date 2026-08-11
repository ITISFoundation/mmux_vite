import { describe, expect, it } from "vitest";
import { correlationSymlogRange, logFloor, sobolLogRange, symlogTicks, symlogTransform, toLogSafe } from "./plotScale";

describe("toLogSafe", () => {
  it("returns log10 of the value when above the floor", () => {
    expect(toLogSafe(1)).toBeCloseTo(0);
    expect(toLogSafe(0.01)).toBeCloseTo(-2);
  });

  it("clamps values below the floor instead of returning -Infinity", () => {
    expect(toLogSafe(0)).toBeCloseTo(Math.log10(logFloor));
    expect(toLogSafe(-5)).toBeCloseTo(Math.log10(logFloor));
  });
});

describe("symlogTransform", () => {
  it("is continuous and zero at the origin", () => {
    expect(symlogTransform(0)).toBe(0);
  });

  it("is antisymmetric", () => {
    expect(symlogTransform(0.5)).toBeCloseTo(-symlogTransform(-0.5));
  });

  it("collapses all values inside the floor band to exactly 0 (⊥ linear ramp, T39)", () => {
    expect(symlogTransform(logFloor * 0.999999)).toBe(0);
    expect(symlogTransform(-logFloor * 0.999999)).toBe(0);
    expect(symlogTransform(logFloor / 2)).toBe(0);
    expect(symlogTransform(-logFloor / 2)).toBe(0);
  });

  it("jumps only a small fraction of a decade at the floor boundary (collapsed zero band, T40)", () => {
    expect(symlogTransform(logFloor)).toBeCloseTo(0.3, 6);
    expect(symlogTransform(-logFloor)).toBeCloseTo(-0.3, 6);
    // the jump must stay far narrower than the width of a real decade (1 unit)
    expect(Math.abs(symlogTransform(logFloor))).toBeLessThan(0.5);
  });

  it("maps 1 and -1 to the ends of the fixed correlation symlog range", () => {
    expect(symlogTransform(1)).toBeCloseTo(correlationSymlogRange[1]);
    expect(symlogTransform(-1)).toBeCloseTo(correlationSymlogRange[0]);
  });

  it("is monotonically non-decreasing (flat 0 inside the collapsed floor band)", () => {
    const xs = [-1, -0.5, -0.01, -0.0001, 0, 0.0001, 0.01, 0.5, 1];
    const ys = xs.map(symlogTransform);
    for (let i = 1; i < ys.length; i += 1) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    }
  });
});

describe("symlogTicks", () => {
  it("returns matching tickvals/ticktext arrays covering -1..1", () => {
    const { tickvals, ticktext } = symlogTicks();
    expect(tickvals).toHaveLength(ticktext.length);
    expect(ticktext).toContain("0");
    expect(ticktext).toContain("1");
    expect(ticktext).toContain("-1");
  });
});

describe("sobolLogRange", () => {
  it("spans 1e-2 to 1 in log10 units", () => {
    expect(sobolLogRange).toEqual([-2, 0]);
  });
});
