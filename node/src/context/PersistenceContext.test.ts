import { describe, it, expect } from "vitest";
import { isValidPersistenceFile } from "./PersistenceContext";

// Minimal structurally valid persistence file (subset of defaultPersistence):
// everything the validator requires, minus the optional fields under test.
const validFile = () => ({
  currentView: 0,
  numSamples: {},
  inputVars: [],
  outputVars: [],
  distribution: {},
  lhsSamplingConfig: { inputs: [], points: 0, seed: 0 },
  gridSamplingConfig: [],
  singleJobConfig: [],
  fetchedJobCollections: [],
  selectedJobUids: [],
  isSuMoGenerated: false,
  outputTargets: {},
  mogaSettings: {},
});

describe("isValidPersistenceFile log-scale map guards (V26/V27 fields)", () => {
  it("accepts LEGACY files that predate the log-scale maps (absence is valid)", () => {
    expect(isValidPersistenceFile(validFile())).toBe(true);
  });

  it("accepts well-formed nested scale maps (uid -> varName -> boolean)", () => {
    expect(
      isValidPersistenceFile({
        ...validFile(),
        outputLogScales: { "fn-uid": { y: true, z: false } },
        outputLogScaleUserSet: { "fn-uid": { y: true } },
      }),
    ).toBe(true);
  });

  it.each([
    ["a string", "nope"],
    ["an array", []],
    ["a number", 7],
    ["a non-boolean leaf", { "fn-uid": { y: "log" } }],
    ["a non-object inner map", { "fn-uid": true }],
  ])("rejects either scale map carrying %s", (_label, malformed) => {
    expect(isValidPersistenceFile({ ...validFile(), outputLogScales: malformed })).toBe(false);
    expect(isValidPersistenceFile({ ...validFile(), outputLogScaleUserSet: malformed })).toBe(false);
  });
});
