import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { useMMUXContext, MMUXContextType } from "../context/MMUXContext";
import {
  Function,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";
import { getSamplingStartValue, getSamplingEndValue } from "../utils/sampling";
import { RunSamplingButton } from "./SamplingButton";
import VariableConfig from "./VariableConfig";

async function runGridSampling(
  context: MMUXContextType,
  config: SamplingInputsState[]
) {
  const fun = context.selectedFunction as Function;
  // send config to Python backend to create LHS
  console.log("Running Grid Sampling with config: ", config);
  context.setLaunchingSampling(true);
  const jc = await fetch(PYTHON_DAKOTA_BACKEND + "/flask/grid_sampling", {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config,
    }),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (jc: RegisteredFunctionJobCollection) {
      console.log("JobCollection Uid: ", jc.uid);
      return jc;
    })
    .catch(function (error) {
      console.error("Error running Grid Sampling: ", error);
    });
  context.setLaunchingSampling(false);
  context.setRunningSampling(true);
  context.setRunningJobCollection(jc ? jc : undefined);
  return jc;
}

function GridSearchSampling() {
  const context = useMMUXContext();
  const { inputVars, distribution, selectedFunction } = context;

  const [gridSamplingInputs, setGridSamplingInputs] = useState<
    SamplingInputsState[]
  >(
    inputVars.map((inputVar) => ({
      variable: inputVar,
      start: getSamplingStartValue(inputVar, distribution[selectedFunction?.uid || '']) as number,
      end: getSamplingEndValue(inputVar, distribution[selectedFunction?.uid || '']) as number,
      points: 10,
    }))
  );

  const handleRunSampling = async () => {
    await runGridSampling(context, gridSamplingInputs);
  };

  function handleInputChange(index: number, field: string, value: string) {
    setGridSamplingInputs((prevInputs: SamplingInputsState[]) => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: field === "points" ? parseInt(value) : parseFloat(value),
      };
      return newInputs;
    });
  }

  return (
    <>
      <Typography
        variant="h5"
        fontFamily="inherit"
        fontWeight={300}
        marginBottom={1}
      >
        Grid Sampling
      </Typography>
      <Typography
        variant="body1"
        fontFamily="inherit"
        fontWeight={200}
        marginBottom={1}
      >
        Specify the ranges and number of points per dimension for the grid
        search sampling.
      </Typography>
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "16px",
        padding: "8px 0",
      }}>
        {gridSamplingInputs?.map((inputVar, index) => (
          <VariableConfig index={index} inputVar={inputVar} key={index} handleInputChange={handleInputChange}/>
        ))}
      </Box>
      <RunSamplingButton handleRunSampling={handleRunSampling} />
    </>
  );
}

export default GridSearchSampling;
