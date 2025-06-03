import { useState } from "react";
import { Box, Button, Input, Typography } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { useMMUXContext, MMUXContextType } from "../context/MMUXContext";
import { Function, RegisteredFunctionJobCollection } from '../osparc-api-ts-client';
import { getSamplingStartValue, getSamplingEndValue } from '../utils/sampling';


async function runGridSampling(context: MMUXContextType, config: any[], seed: number = 0, N: number = 5) {
  const fun = context.selectedFunction as Function;
  // send config to Python backend to create LHS
  console.log("Running LHS Sampling with config: ", config);
  context.setLaunchingSampling(true)
  const jc = await fetch(
    PYTHON_DAKOTA_BACKEND + '/flask/grid_sampling',
    {
      method: "POST",
      body: JSON.stringify(
        {
          funUid: fun.uid,
          config: config,
        }
      ),
    }).then(function (response) {
      return response.json()
    }).then(function (jc: RegisteredFunctionJobCollection) {
      console.log("JobCollection Uid: ", jc.uid);
      return jc
    }).catch(function (error) {
      console.error("Error running Grid Sampling: ", error);
    })
  context.setLaunchingSampling(false)
  context.setRunningSampling(true)
  context.setRunningJobCollection(jc ? jc : undefined)
  return jc
}

function GridSearchSampling() {
  const { inputVars, launchingSampling, runningSampling, distribution } = useMMUXContext();
  const context = useMMUXContext();

  const [gridSamplingInputs, setGridSamplingInputs] = useState<SamplingInputsState[]>(
    inputVars.map((inputVar) => ({
      variable: inputVar,
      start: getSamplingStartValue(inputVar, distribution) as number,
      end: getSamplingEndValue(inputVar, distribution) as number,
      points: 10
    })),
  );


  function CreateSamplingButton() {
    const handleRunSampling = async () => {
      await runGridSampling(context, gridSamplingInputs)
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
        <Button
          onClick={handleRunSampling}
          disabled={(launchingSampling || runningSampling)}
        >
          {launchingSampling ? "Launching..." : runningSampling ? "Running..." : "Run Sampling"}
        </Button>
        {launchingSampling && <Box className="spinner" />}
      </Box>
    );
  }

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
      <Typography variant='h6' marginBottom={1}>Grid Search Sampling</Typography>
      <Typography variant='body1' marginBottom={1}>Specify the ranges and number of points per dimension for the grid
        search sampling.</Typography>
      {gridSamplingInputs?.map((inputVar, index) => (
        <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "16px", }}>
          <Typography variant='h6'>{inputVar.variable}:</Typography>
          <Typography variant='caption'>Start: </Typography>
          <Input
            type="number"
            placeholder="Start"
            value={inputVar.start?.toString()}
            sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}` })}
            onChange={(e) => handleInputChange(index, "start", e.target.value)}
          />
          <Typography variant='caption'>End: </Typography>
          <Input
            type="number"
            placeholder="End"
            value={inputVar.end?.toString()}
            sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}` })}
            onChange={(e) => handleInputChange(index, "end", e.target.value)}
          />
          <Typography variant='caption'>N: </Typography>
          <Input
            type="number"
            placeholder={`Number of grid points in ${inputVar.variable}`}
            value={inputVar.end?.toString()}
            sx={(theme) => ({ width: 400, borderBottom: `1px solid ${theme.palette.background.paper}` })}
            onChange={(e) => handleInputChange(index, "points", e.target.value)}
          />
        </form>
      ))}

      <CreateSamplingButton />
    </>
  );
}

export default GridSearchSampling;
