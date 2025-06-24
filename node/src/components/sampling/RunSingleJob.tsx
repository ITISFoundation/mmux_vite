import { useEffect, useState } from "react";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Box, Skeleton, Typography } from "@mui/material";
import { Function, FunctionJob, ProjectFunctionJob } from "../../osparc-api-ts-client";
import { useMMUXContext, MMUXContextType } from "../../context/MMUXContext";
import { RunSamplingButton } from "./RunSamplingButton";
import ValueConfig from "../setup/ValueConfig";
import { toast } from "react-toastify";
import { createJobStudyCopy, openStudyUid } from "../../utils/function_utils";

async function runTestJob(context: MMUXContextType, config: SingleJobConfig[]) {
  const fun = context?.selectedFunction as Function;
  // send config to Python backend to create LHS
  context.setLaunchingSampling(true);
  const j = await fetch(PYTHON_DAKOTA_BACKEND + "/flask/test_job", {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config,
    }),
  })
    .then(async function (response) {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running Single Job ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then(function (j: FunctionJob) {
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
  const { selectedFunction, inputVars, singleJobConfig, setSingleJobConfig } = context;
  const [jobInputs, setJobInputs] =
    useState<Array<SingleJobConfig>>(singleJobConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setSingleJobConfig(jobInputs);
    const job = await runTestJob(context, jobInputs);
    // necessary to make a copy of the test job bcs as of now, the run-job always generates a hidden copy
    // thus, the copy allows the user to see their test run in their dashboard
    // WOuld be nice to be able to abort/delete the TestJob or simply update the run-job endpoint to accept a "hidden" boolean parameter
    const copy_uid = await createJobStudyCopy(selectedFunction?.title as string, job as ProjectFunctionJob);
    if (!job) toast.warning("Test Job running failed! Please contact support");
    else if (!copy_uid) toast.warning("Not possible to open your test copy! Please contact support")
    else if (job.functionClass && job.functionClass === "PROJECT") openStudyUid(copy_uid)
    else toast.warning("Only ProjectFunctionJob can be opened in a new window!");
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
          "Run a single parameter combination. The generated study will be opened in a new window for user inspection."
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
        <RunSamplingButton
          disabled={loading}
          handleRunSampling={handleRunSampling}
        />
      </Box>
    </>
  );
};

export default TestJob;
