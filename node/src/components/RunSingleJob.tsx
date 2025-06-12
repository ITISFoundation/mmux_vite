import { useEffect, useState } from "react";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { Function, FunctionJob } from "../osparc-api-ts-client";
import { useMMUXContext, MMUXContextType } from "../context/MMUXContext";
import { RunSamplingButton } from "./SamplingButton";
import ValueConfig from "./ValueConfig";

async function runTestJob(context: MMUXContextType, config: SingleJobConfig[]) {
  const fun = context?.selectedFunction as Function;
  // send config to Python backend to create LHS
  console.log("Running single job with config: ", config);
  context.setLaunchingSampling(true);
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
  context.setLaunchingSampling(false);
  return j;
}

const TestJob = () => {
  const context = useMMUXContext();
  const { inputVars, singleJobConfig, setSingleJobConfig } = context;
  const [jobInputs, setJobInputs] =
    useState<Array<SingleJobConfig>>(singleJobConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setSingleJobConfig(jobInputs);
    await runTestJob(context, jobInputs);
  };

  function handleInputChange(index: number, field: string, value: string) {
    setJobInputs((prevInputs) => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: parseFloat(value),
      };
      return newInputs;
    });
  }

  useEffect(() => {
    let currentSampling: SingleJobConfig[] = singleJobConfig;
    if (currentSampling.length === 0) {
      currentSampling = inputVars.map((inputVar) => ({
        variable: inputVar,
        value: 0.0,
      }));
    }
    setJobInputs(currentSampling);
    setLoading(false);
  }, [inputVars, singleJobConfig]);

  return (
    <>
      <Typography
        variant="h5"
        fontFamily="inherit"
        fontWeight={300}
        marginBottom={1}
      >
        {loading ? (
          <Skeleton
            variant="text"
            width={"300px"}
            height={"32px"}
            sx={{ fontSize: "2rem", marginBottom: "8px" }}
          />
        ) : (
          "Single Test Run"
        )}
      </Typography>
      <Typography
        variant="body1"
        fontFamily="inherit"
        fontWeight={200}
        marginBottom={1}
      >
        {loading ? (
          <Skeleton variant="text" width={"600px"} height={"24px"} />
        ) : (
          "Run a single parameter combination"
        )}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
          padding: "8px 0",
        }}
      >
        {loading ? (
          <Skeleton variant="rounded" width={"800px"} height={"232px"} />
        ) : (
          jobInputs?.map((inputVar, index) => (
            <ValueConfig
              index={index}
              inputVar={inputVar}
              handleInputChange={handleInputChange}
            />
          ))
        )}
      </Box>
      <Box display={"flex"} flexDirection="row" justifyContent={'space-between'} marginTop={2}>
        <Button
          size="small"
          variant="contained"
          disabled={loading}
          onClick={() => setSingleJobConfig(jobInputs)}
        >
          Save Sampling config
        </Button>
        <RunSamplingButton
          disabled={loading}
          handleRunSampling={handleRunSampling}
        />
      </Box>
    </>
  );
};

export default TestJob;
