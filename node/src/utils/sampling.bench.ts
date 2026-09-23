// CodSpeed benchmarks for the sampling bound helpers. They are called for every
// input variable on each re-render of the sampling/distribution forms, so a
// study with many inputs runs them thousands of times per interaction.

import { bench, describe } from "vitest";
import { getSamplingStartValue, getSamplingEndValue } from "./sampling";

const distributionTypes: Distribution[] = ["constant", "normal", "uniform", "log-normal", "exponential"];

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
      location: 0.25 * index,
      scale: 0.75,
    };
  }

  return { variables, distribution };
}

const { variables, distribution } = buildDistribution(100);

describe("sampling bounds", () => {
  bench("start values for 100 inputs", () => {
    for (const variable of variables) {
      getSamplingStartValue(variable, distribution);
    }
  });

  bench("end values for 100 inputs", () => {
    for (const variable of variables) {
      getSamplingEndValue(variable, distribution);
    }
  });
});
