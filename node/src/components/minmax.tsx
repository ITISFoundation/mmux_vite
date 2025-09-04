import { Box } from "@mui/material";
import React from "react";

type MinMaxType = {
  inputs: { [key: string]: { min: number; max: number } };
  outputs: { [key: string]: { min: number; max: number } };
};

const getMinMax = (subJobs: SubJob[]) => {
  const inputs = Object.entries(subJobs).map(([_key, value], _idx) => value.job.inputs as { [key: string]: number });
  const outputs = Object.entries(subJobs).map(([_key, value], _idx) => value.job.outputs as { [key: string]: number });

  const minMax: MinMaxType = {
    inputs: {},
    outputs: {},
  };
  const inputKeys = Object.keys(inputs[0]);
  const outputKeys = Object.keys(outputs[0]);
  inputKeys.forEach(key => {
    const values = inputs.map(input => input[key]);
    minMax.inputs[key] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
  outputKeys.forEach(key => {
    const values = outputs.map(output => output[key]);
    minMax.outputs[key] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
  return (
    <Box>
      <Box>
        <strong>Inputs:</strong>
        {Object.entries(minMax.inputs).map(([key, value]) => (
          <Box key={key}>
            {key}:{" "}
            {value.min.toPrecision(3) === value.max.toPrecision(3)
              ? `[ ${value.max.toPrecision(3)} ]`
              : `[ ${value.min.toPrecision(3)} – ${value.max.toPrecision(3)} ]`}
          </Box>
        ))}
      </Box>
      <Box>
        <strong>Outputs:</strong>
        {Object.entries(minMax.outputs).map(([key, value]) => (
          <Box key={key}>
            {key}:{" "}
            {value.min.toPrecision(3) === value.max.toPrecision(3)
              ? `[ ${value.max.toPrecision(3)} ]`
              : `[ ${value.min.toPrecision(3)} – ${value.max.toPrecision(3)} ]`}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default getMinMax;
