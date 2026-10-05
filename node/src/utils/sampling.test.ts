import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSamplingEndValue, getSamplingStartValue } from "./sampling";

const ERROR = "Error. Please contact support";

describe("sampling range helpers", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it.each([
    ["constant", { distribution: "constant", value: 3 }, 3, 3],
    ["normal", { distribution: "normal", mean: 10, std: 2 }, 5, 15],
    ["uniform", { distribution: "uniform", min: -1, max: 4 }, -1, 4],
    ["log-normal", { distribution: "log-normal", location: 0, scale: 1 }, Math.exp(-2.5), Math.exp(2.5)],
    ["exponential", { distribution: "exponential", scale: 0.5 }, 0, 10],
  ])("derives the %s sampling range", (_label, dist, start, end) => {
    const distribution = { x: dist } as never as InputVarSelection;
    expect(getSamplingStartValue("x", distribution)).toBeCloseTo(start as number);
    expect(getSamplingEndValue("x", distribution)).toBeCloseTo(end as number);
  });

  it.each([
    ["missing distribution object", undefined],
    ["missing variable", {}],
    ["normal without std", { x: { distribution: "normal", mean: 1 } }],
    ["log-normal without scale", { x: { distribution: "log-normal", location: 1 } }],
    ["unknown form", { x: { distribution: "beta" } }],
  ])("returns a visible error marker and warns for %s", (_label, distribution) => {
    expect(getSamplingStartValue("x", distribution as never)).toBe(ERROR);
    expect(getSamplingEndValue("x", distribution as never)).toBe(ERROR);
    expect(console.warn).toHaveBeenCalled();
  });

  it("cannot bound an exponential without a scale", () => {
    const distribution = { x: { distribution: "exponential" } } as never as InputVarSelection;
    expect(getSamplingStartValue("x", distribution)).toBe(0);
    expect(getSamplingEndValue("x", distribution)).toBe(ERROR);
  });
});
