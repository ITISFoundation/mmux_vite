// CodSpeed benchmarks for the V46sc request-cache key. getCachedOrFetch derives
// the (url, body) key on every surrogate plot fetch decision (slider drags):
// canonicalize() walks the whole request body — sorting every object's entries
// and reducing job arrays to sorted uids — before JSON.stringify. This is the
// successor of the old hand-curated buildDakotaRequestKey, on the interactive
// hot path.

import { test } from "vitest";
import { buildRequestCacheKey } from "./sessionResponseCache";

// Bound once: calling through the vitest module-runner export getter inside a
// tight loop adds overhead and skews results.
const buildKey = buildRequestCacheKey;

const irregularVars = [
  "sigma blood",
  "TissueConduc",
  "electrode radius (mm)",
  "pulse width [us]",
  "Amplitude*Gain",
  "fiber diameter",
  "myelin thickness",
  "node length",
];

function buildVars(count: number): string[] {
  return irregularVars.slice(0, Math.min(count, irregularVars.length)).concat(
    Array.from({ length: Math.max(0, count - irregularVars.length) }, (_value, index) => {
      const suffix = index + irregularVars.length;
      return `input_var_${suffix}`;
    }),
  );
}

// Deterministic uuid-shaped job ids: uid sort cost depends on string length.
function buildUid(index: number): string {
  const hex = (index * 2654435761).toString(16).padStart(8, "0").repeat(4).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

interface BenchFunctionJob {
  uid: string;
  status: string;
  jobId: string;
  jobName: string;
  jobStartedAt: string;
  jobFinishedAt: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
}

function buildBody(variableCount: number, jobCount: number): Record<string, unknown> {
  const variables = buildVars(variableCount);
  const sliderValues: { [key: string]: number } = {};
  const distribution: InputVarSelection = {};
  for (let index = 0; index < variables.length; index += 1) {
    sliderValues[variables[index]] = index * 0.125;
    distribution[variables[index]] = { distribution: "uniform", min: index, max: index + 10 };
  }

  const functionJobs: BenchFunctionJob[] = Array.from({ length: jobCount }, (_value, index) => {
    const inputs: Record<string, number> = {};
    const outputs: Record<string, number> = {};
    for (let variable = 0; variable < variables.length; variable += 1) {
      inputs[variables[variable]] = 0.001 * (variable + 1) * (index + 1);
    }
    for (let output = 0; output < 3; output += 1) {
      outputs[`qoi_${output}`] = 1.5 * (output + 1) * (index + 1);
    }
    return {
      uid: buildUid(index),
      status: index % 9 === 0 ? "failed" : "completed",
      jobId: `${index}`,
      jobName: `job ${index}`,
      jobStartedAt: "2026-01-01T00:00:00.000Z",
      jobFinishedAt: "2026-01-01T00:00:42.000Z",
      inputs,
      outputs,
    };
  });

  // Same shape as Curves1DPlot's requestBody.
  return {
    inputs: variables,
    distribution,
    output: "activation_threshold",
    sliderValues,
    FunctionJobs: functionJobs,
    inputLogScales: {},
    outputLogScales: {},
  };
}

const smallBody = buildBody(8, 50);
const typicalBody = buildBody(8, 300);
const largeBody = buildBody(40, 2000);

const url = "/flask/dakota/sumo_along_axes";

// Vitest 5 declares benchmarks through the `bench` test fixture; CodSpeed
// reports each bench() as its own benchmark.
test("buildRequestCacheKey", async ({ bench }) => {
  await bench("8 vars / 50 jobs", () => {
    buildKey(url, smallBody);
  }).run();

  await bench("8 vars / 300 jobs", () => {
    buildKey(url, typicalBody);
  }).run();

  await bench("40 vars / 2k jobs", () => {
    buildKey(url, largeBody);
  }).run();
});
