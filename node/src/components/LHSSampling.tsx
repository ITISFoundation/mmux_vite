import { useState } from "react";
import { MMUXContextType, useMMUXContext } from "../context/MMUXContext";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { Box, Input, Typography } from "@mui/material";
import {
  Function,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";
import { getSamplingStartValue, getSamplingEndValue } from "../utils/sampling";
import { RunSamplingButton } from "./SamplingButton";
import VariableConfig from "./VariableConfig";

async function runLhsSampling(context: MMUXContextType, config: SamplingInputsState[]) {
  const fun = context.selectedFunction as Function;
  // send config to Python backend to create LHS
  console.log("Running LHS Sampling with config: ", config);
  context.setLaunchingSampling(true);
  const jc = await fetch(PYTHON_DAKOTA_BACKEND + "/flask/lhs_sampling", {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config,
      seed: config[0].seed, // TODO should be kept somewhere else in the state
      N: config[0].points, // TODO should be kept somewhere else in the state
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
      console.error("Error running LHS sampling: ", error);
    });
  context.setLaunchingSampling(false);
  context.setRunningSampling(true);
  context.setRunningJobCollection(jc ? jc : undefined);
  return jc;
}

const LHSSampling = () => {
  const context = useMMUXContext();
  const { inputVars, distribution, selectedFunction } = useMMUXContext();

  const [lhsInputs, setLhsInputs] = useState<SamplingInputsState[]>(
    inputVars.map((inputVar) => ({
      variable: inputVar,
      start: getSamplingStartValue(inputVar, distribution[selectedFunction?.uid || '']) as number,
      end: getSamplingEndValue(inputVar, distribution[selectedFunction?.uid || '']) as number,
      points: 50, // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
      seed: 0, // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
    }))
  );

  const handleRunSampling = async () => {
    await runLhsSampling(context, lhsInputs);
  };

  function handleInputChange(index: number, field: string, value: string) {
    setLhsInputs((prevInputs) => {
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
        Latin Hypercube Sampling
      </Typography>
      <Typography
        variant="body1"
        fontFamily="inherit"
        fontWeight={200}
        marginBottom={1}
      >
        Specify total number of sample points that will be computed, as well as
        the ranges of each parameter.
      </Typography>
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "16px",
        padding: "8px 0",
      }}>
      {lhsInputs?.map((inputVar, index) => (
        <VariableConfig index={index} inputVar={inputVar} key={index} handleInputChange={handleInputChange}/>
      ))}
      </Box>

      <form style={{ display: "flex", alignItems: "center", gap: "40px" }}>
        <Typography variant="body1">Number of sampling points: </Typography>
        <Input
          type="number"
          placeholder="Number of sampling points"
          value={lhsInputs[0].points.toString()}
          sx={(theme) => ({
            width: 100,
            borderBottom: `1px solid ${theme.palette.background.paper}`,
          })}
          onChange={(e) => handleInputChange(0, "points", e.target.value)}
        />
        <Typography variant="body1">Seed: </Typography>
        <Input
          type="number"
          placeholder="seed"
          value={lhsInputs[0].seed?.toString()}
          sx={(theme) => ({
            width: 100,
            borderBottom: `1px solid ${theme.palette.background.paper}`,
          })}
          onChange={(e) => handleInputChange(0, "seed", e.target.value)}
        />
      </form>
      <RunSamplingButton handleRunSampling={handleRunSampling} />
    </>
  );
};

export default LHSSampling;
