import { describe, expect, it } from "vitest";
import { scaleSpanWarningFactor, scaleSpanAdvice } from "./logScaleAdvice";

// B52ij (owner 2026-10-08): the factor-10 span rule is an ADVISORY warning at
// the Scale toggle, never an inference gate — advisory-only semantics pinned here.
describe("scaleSpanAdvice (factor-10 scale/span advisory)", () => {
  it("warns when LINEAR is selected but the data spans more than the factor", () => {
    const advice = scaleSpanAdvice([1, 5, 200], "linear");
    expect(advice).toBeDefined();
    expect(advice).toContain("factor of 200");
    expect(advice).toMatch(/log scale usually reads better/);
  });

  it("stays silent for LINEAR within the factor (max/min <= 10, not 'bigger than')", () => {
    expect(scaleSpanAdvice([1, 10], "linear")).toBeUndefined(); // exactly 10: NOT "bigger"
    expect(scaleSpanAdvice([2, 3], "linear")).toBeUndefined();
  });

  it("warns when LOG is selected but the data spans at most the factor (vice versa)", () => {
    const advice = scaleSpanAdvice([1, 3], "log");
    expect(advice).toBeDefined();
    expect(advice).toMatch(/barely differs from linear/);
    expect(scaleSpanAdvice([1, 10], "log")).toBeDefined(); // exactly 10 is the log side's silence bound
  });

  it("stays silent for LOG when the data genuinely spans more than the factor", () => {
    expect(scaleSpanAdvice([0.001, 1, 4000], "log")).toBeUndefined();
  });

  it("no ratio without positive support (min ≤ 0): ⊥ advice, log is ineligible there anyway", () => {
    expect(scaleSpanAdvice([-1, 50], "linear")).toBeUndefined();
    expect(scaleSpanAdvice([0, 50], "linear")).toBeUndefined();
    expect(scaleSpanAdvice([-1, 50], "log")).toBeUndefined();
  });

  it("no data → no advice", () => {
    expect(scaleSpanAdvice([], "linear")).toBeUndefined();
    expect(scaleSpanAdvice([], "log")).toBeUndefined();
  });

  it("constant data never advises on LINEAR (factor 1); the mismatched LOG combo warns honestly", () => {
    // (the UI can't actually reach scale:"log" for a constant column — the
    // toggle is disabled there — but the advisory stays truthful ⊥ special-cased)
    expect(scaleSpanAdvice([7, 7, 7], "linear")).toBeUndefined();
    expect(scaleSpanAdvice([7, 7, 7], "log")).toBeDefined();
  });

  it("advisory-only: the threshold constant is the documented factor, ⊥ any gate import", () => {
    expect(scaleSpanWarningFactor).toBe(10);
  });

  it("large collections never spread into Math.min/max (B25 RangeError class)", () => {
    const values = Array.from({ length: 200000 }, (_, i) => 1 + i);
    expect(() => scaleSpanAdvice(values, "linear")).not.toThrow();
    expect(scaleSpanAdvice(values, "linear")).toBeDefined();
  });
});
