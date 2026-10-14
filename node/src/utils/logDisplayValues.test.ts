import { describe, expect, it } from "vitest";
import { allPositive, logColorbarTicks, toLogDisplay } from "./logDisplayValues";

describe("allPositive (painted-value gate, B54rz reading)", () => {
  it("ignores gaps but fails on ANY finite number <= 0, nested or flat", () => {
    expect(
      allPositive([
        [1, 2],
        [3, null],
      ]),
    ).toBe(true);
    expect(allPositive([1, Number.NaN, 10])).toBe(true); // holes pass — Plotly leaves gaps
    expect(
      allPositive([
        [1, 0],
        [3, 4],
      ]),
    ).toBe(false);
    expect(allPositive([-0.5])).toBe(false);
  });
});

describe("toLogDisplay", () => {
  it("log10s the finite numbers recursively and passes gaps through", () => {
    expect(
      toLogDisplay([
        [1, 10],
        [100, null],
      ]),
    ).toEqual([
      [0, 1],
      [2, null],
    ]);
    expect(toLogDisplay([2, Number.NaN])).toEqual([Math.log10(2), Number.NaN]);
  });
});

describe("logColorbarTicks (B55tm: a log colorbar is never left bare)", () => {
  it("labels whole decades when >= 2 fit inside the span", () => {
    expect(logColorbarTicks([1, 10, 100, 1000])).toEqual({
      tickvals: [0, 1, 2, 3],
      ticktext: ["1", "10", "100", "1000"],
    });
  });

  it("falls back to the 1..9 mantissa grid when the span holds no two decades", () => {
    // The e2e SuMo QoI range: 1.325..9.95 spans 0.88 decades — the OLD
    // endpoint-only fallback shipped a colorbar with just "1.32"/"9.95" and
    // nothing in between (B55tm, owner review of the 2D/3D -log shots).
    const { tickvals, ticktext } = logColorbarTicks([
      [1.325, 5],
      [9.95, 2],
    ]);
    expect(ticktext).toEqual(["2", "3", "4", "5", "6", "7", "8", "9"]);
    expect(tickvals.map(v => Math.round(Math.pow(10, v)))).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("only a span too narrow for ANY mantissa tick falls back to the endpoints", () => {
    const { tickvals, ticktext } = logColorbarTicks([0.11, 0.115]);
    expect(ticktext).toEqual(["0.11", "0.115"]);
    expect(tickvals.every(Number.isFinite)).toBe(true);
  });

  it("yields no ticks when non-positive values sneak into the painted set", () => {
    expect(logColorbarTicks([0, 5])).toEqual({ tickvals: [], ticktext: [] });
    expect(logColorbarTicks([-2, 10])).toEqual({ tickvals: [], ticktext: [] });
  });
});
