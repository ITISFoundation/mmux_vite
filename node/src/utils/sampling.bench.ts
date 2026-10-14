// CodSpeed benchmarks for the sampling bound helpers. They are called for every
// input variable on each re-render of the sampling/distribution forms, so a
// study with many inputs runs them thousands of times per interaction.

import { test } from "vitest";
import { getSamplingEndValue, getSamplingStartValue } from "./sampling";

// Resolve the module-runner export getters once; calling them from a tight
// loop through the getter would add overhead and make results noisy.
const getStartValue = getSamplingStartValue;
const getEndValue = getSamplingEndValue;

const distributionTypes: Distribution[] = ["constant", "normal", "uniform"];

function buildDistribution(variableCount: number): { variables: string[]; distribution: InputVarSelection } {
  const variables: string[] = [];
  const distribution: InputVarSelection = {};

  for (let index = 0; index < variableCount; index += 1) {
    const variable = `input_var_${index}`;
    variables.push(variable);
    distribution[variable] = {
      distribution: distributionTypes[index % distributionTypes.length],
      value: 1 + index,
      mean: 2 + index,
      std: 0.5,
      min: index,
      max: index + 10,
      scale: index % 4 === 3 ? "log" : "linear",
    };
  }

  return { variables, distribution };
}

const { variables, distribution } = buildDistribution(100);

// Vitest 5 declares benchmarks through the `bench` test fixture; CodSpeed
// reports each bench() as its own benchmark.
test("sampling bounds", async ({ bench }) => {
  await bench("start values for 100 inputs", () => {
    for (const variable of variables) {
      getStartValue(variable, distribution);
    }
  }).run();

  await bench("end values for 100 inputs", () => {
    for (const variable of variables) {
      getEndValue(variable, distribution);
    }
  }).run();
});
