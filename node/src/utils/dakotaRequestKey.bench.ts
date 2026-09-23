// CodSpeed benchmarks for the Dakota plot request key (V16 / INV-006). The key
// is rebuilt on every render of the 1D/2D/3D surrogate plots to decide whether
// a fetch is needed, so it sits on the interactive path (slider drags).

import { bench, describe } from "vitest";
import { buildDakotaRequestKey, DakotaRequestKeyInput } from "./dakotaRequestKey";

function buildInput(variableCount: number, jobCount: number): DakotaRequestKeyInput {
  const sliderValues: { [key: string]: number } = {};
  for (let index = 0; index < variableCount; index += 1) {
    sliderValues[`input_var_${index}`] = index * 0.125;
  }

  return {
    axes: ["input_var_0", "input_var_1"],
    sliderValues,
    qoi: "activation_threshold",
    fn: "11111111-2222-3333-4444-555555555555",
    jobList: Array.from({ length: jobCount }, (_value, index) => `job-${jobCount - index}`),
    logScale: true,
  };
}

const smallInput = buildInput(8, 50);
const largeInput = buildInput(40, 2000);

describe("buildDakotaRequestKey", () => {
  bench("8 inputs / 50 jobs", () => {
    buildDakotaRequestKey(smallInput);
  });

  bench("40 inputs / 2k jobs", () => {
    buildDakotaRequestKey(largeInput);
  });
});
