import { useState } from "react";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { Input, Typography } from "@mui/material";
import { Function, FunctionJob } from "../osparc-api-ts-client";
import { useMMUXContext, MMUXContextType } from "../context/MMUXContext";
import { RunSamplingButton } from "./SamplingButton";

async function runTestJob(context: MMUXContextType | undefined, config: SamplingInputsState[]) {
  const fun = context?.selectedFunction as Function;
  // send config to Python backend to create LHS
  console.log("Running single job with config: ", config);
  context?.setLaunchingSampling(true);
  const j = await fetch(PYTHON_DAKOTA_BACKEND + "/flask/test_job", {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config,
    }),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (j: FunctionJob) {
      console.log("Job Uid: ", j.uid);
      return j;
    })
    .catch(function (error) {
      console.error("Error running single job: ", error);
    });
  context?.setLaunchingSampling(false);
  return j;
}

const TestJob = () => {
  const context = useMMUXContext();
  const { inputVars } = context;
  const [jobInputs, setJobInputs] = useState<Array<SamplingInputsState>>(
    inputVars.map((inputVar) => ({
      variable: inputVar,
      value: 0.0,
      start: 0.0, // Not used in this case, but kept for consistency
      end: 1.0, // Not used in this case, but kept for consistency
      points: 1, // Not used in this case, but kept for consistency
      seed: 0, // Not used in this case, but kept for consistency
    }))
  );

  const handleRunSampling = () => {
    runTestJob(context, jobInputs);
    setTimeout(() => {
      context?.setLaunchingSampling(false);
    }, 3000);
    // TODO have some way to detect that it finished running; and set the corresponding context variable to False
  };

  function handleInputChange(index: number, field: string, value: string) {
    setJobInputs((prevInputs) => {
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
        Single Test Run{" "}
      </Typography>
      <Typography
        variant="body1"
        fontFamily="inherit"
        fontWeight={200}
        marginBottom={1}
      >
        Run a single parameter combination
      </Typography>
      {jobInputs?.map((inputVar, index) => (
        <form
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
            gap: "16px",
          }}
        >
          <Typography variant="h6">{inputVar.variable}:</Typography>
          <Typography variant="caption">Value: </Typography>
          <Input
            type="number"
            placeholder="Value"
            value={inputVar.value?.toString()}
            sx={(theme) => ({
              width: 100,
              borderBottom: `1px solid ${theme.palette.background.paper}`,
            })}
            onChange={(e) => handleInputChange(index, "start", e.target.value)}
          />
        </form>
      ))}

      <RunSamplingButton handleRunSampling={handleRunSampling}/>
    </>
  );
};

export default TestJob;
