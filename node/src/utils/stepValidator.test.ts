import { describe, expect, it } from "vitest";
import { stepValidator } from "./stepValidator";
import type { FunctionContextType } from "../context/FunctionContext";
import type { JobContextType } from "../context/JobContext";

const uid = "fn-1";

function functionContext(
  dists: Record<string, Record<string, unknown>> | undefined,
  outputTargets: Record<string, Record<string, unknown>> = {},
): FunctionContextType {
  return {
    selectedFunction: { uid },
    distribution: dists === undefined ? {} : { [uid]: dists },
    outputTargets,
  } as never as FunctionContextType;
}

const jobContext = (selectedJobUids: string[]) => ({ selectedJobUids }) as never as JobContextType;

describe("stepValidator step 0", () => {
  it("rejects when no function or no distribution is selected", () => {
    expect(stepValidator(undefined, jobContext([]), "SUMO", 0)).toBe(false);
    expect(stepValidator(functionContext(undefined), jobContext([]), "SUMO", 0)).toBe(false);
  });

  it.each([
    ["constant", { distribution: "constant", value: 1 }, true],
    ["constant NaN", { distribution: "constant", value: Number.NaN }, false],
    ["constant missing", { distribution: "constant" }, false],
    ["normal", { distribution: "normal", mean: 0, std: 1 }, true],
    ["normal zero std", { distribution: "normal", mean: 0, std: 0 }, false],
    ["normal negative std", { distribution: "normal", mean: 0, std: -1 }, false],
    ["normal infinite mean", { distribution: "normal", mean: Number.POSITIVE_INFINITY, std: 1 }, false],
    ["normal NaN std", { distribution: "normal", mean: 0, std: Number.NaN }, false],
    ["uniform", { distribution: "uniform", min: 0, max: 1 }, true],
    ["uniform inverted", { distribution: "uniform", min: 2, max: 1 }, false],
    ["uniform equal bounds", { distribution: "uniform", min: 1, max: 1 }, false],
    ["uniform missing max", { distribution: "uniform", min: 0 }, false],
    ["uniform infinite max", { distribution: "uniform", min: 0, max: Number.POSITIVE_INFINITY }, false],
    ["log-normal", { distribution: "log-normal", location: 0, scale: 1 }, true],
    ["log-normal zero scale", { distribution: "log-normal", location: 0, scale: 0 }, false],
    ["log-normal NaN location", { distribution: "log-normal", location: Number.NaN, scale: 1 }, false],
    ["exponential", { distribution: "exponential", mean: 2 }, true],
    ["exponential non-positive mean", { distribution: "exponential", mean: 0 }, false],
    ["unknown distribution", { distribution: "beta", alpha: 1 }, false],
  ])("%s → %s", (_label, dist, expected) => {
    expect(stepValidator(functionContext({ x: dist }), jobContext([]), "UQ", 0)).toBe(expected);
  });

  it("rejects when any one of several inputs is invalid", () => {
    const dists = {
      x: { distribution: "uniform", min: 0, max: 1 },
      y: { distribution: "normal", mean: 0, std: -1 },
    };
    expect(stepValidator(functionContext(dists), jobContext([]), "SUMO", 0)).toBe(false);
  });

  describe("MOGA output targets", () => {
    const dists = { x: { distribution: "uniform", min: 0, max: 1 } };

    it("rejects when no targets exist for any function", () => {
      expect(stepValidator(functionContext(dists, {}), jobContext([]), "MOGA", 0)).toBe(false);
    });

    it("rejects when targets exist only for another function", () => {
      expect(stepValidator(functionContext(dists, { other: { y: {} } }), jobContext([]), "MOGA", 0)).toBe(false);
    });

    it("rejects when the selected function has an empty target set", () => {
      expect(stepValidator(functionContext(dists, { [uid]: {} }), jobContext([]), "MOGA", 0)).toBe(false);
    });

    it("accepts at least one target for the selected function", () => {
      expect(stepValidator(functionContext(dists, { [uid]: { y: {} } }), jobContext([]), "MOGA", 0)).toBe(true);
    });
  });
});

describe("stepValidator later steps", () => {
  it("step 1 requires at least one selected job", () => {
    expect(stepValidator(undefined, jobContext([]), "SUMO", 1)).toBe(false);
    expect(stepValidator(undefined, jobContext(["job-1"]), "SUMO", 1)).toBe(true);
    expect(stepValidator(undefined, undefined as never as JobContextType, "SUMO", 1)).toBe(false);
  });

  it("step 2 is always valid and unknown steps are rejected", () => {
    expect(stepValidator(undefined, jobContext([]), "SUMO", 2)).toBe(true);
    expect(stepValidator(undefined, jobContext([]), "SUMO", 3)).toBe(false);
    expect(stepValidator(undefined, jobContext([]), "SUMO", -1)).toBe(false);
  });
});
