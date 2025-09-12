import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Function as OsparcFunction, FunctionJob as OsparcFunctionJob, ProjectFunctionJob } from "osparc-api-ts-client";
import { RunSamplingButton } from "./RunSamplingButton";
import ValueConfig from "../setup/ValueConfig";
import { createJobStudyCopy, openStudyUid } from "../../utils/function_utils";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";

async function runTestJob(
  selectedFunction: OsparcFunction | undefined,
  setLaunchingSampling: (value: boolean) => void,
  config: SingleJobConfig[],
) {
  const fun = selectedFunction as OsparcFunction;
  // send config to Python backend to create LHS
  setLaunchingSampling(true);
  const j = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/test_job`, {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config,
    }),
  })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running Single Job ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then((k: OsparcFunctionJob) => k)
    .catch(error => {
      console.error("Error running single job: ", error);
    });
  setLaunchingSampling(false);
  return j;
}

function TestJob() {
  const { selectedFunction, inputVars } = useFunctionContext();
  const { singleJobConfig, setSingleJobConfig, setLaunchingSampling } = useSamplingContext();
  const [jobInputs, setJobInputs] = useState<Array<SingleJobConfig>>(singleJobConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setSingleJobConfig(jobInputs);
    const job = await runTestJob(selectedFunction, setLaunchingSampling, jobInputs);
    // necessary to make a copy of the test job bcs as of now, the run-job always generates a hidden copy
    // thus, the copy allows the user to see their test run in their dashboard
    // WOuld be nice to be able to abort/delete the TestJob or simply update the run-job endpoint to accept a "hidden" boolean parameter
    const copyUid: string = (await createJobStudyCopy(selectedFunction?.title as string, job as ProjectFunctionJob)) as string;
    if (!job) toast.warning("Test Job running failed! Please contact support");
    else if (!copyUid) toast.warning("Not possible to open your test copy! Please contact support");
    else if (job.functionClass && job.functionClass === "PROJECT") openStudyUid(copyUid);
    else toast.warning("Only ProjectFunctionJob can be opened in a new window!");
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    setJobInputs(prevInputs => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: parseFloat(value),
      };
      return newInputs;
    });
  };

  useEffect(() => {
    let currentSampling: SingleJobConfig[] = singleJobConfig;
    if (currentSampling.length === 0) {
      currentSampling = inputVars.map(inputVar => ({
        variable: inputVar,
        value: 0.0,
      }));
    }
    setJobInputs(currentSampling);
    setLoading(false);
  }, [inputVars, singleJobConfig]);

  return (
    <>
      <Typography variant="h5" fontFamily="inherit" fontWeight={300} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="300px" height="32px" sx={{ fontSize: "2rem", marginBottom: "8px" }} />
        ) : (
          "Single Test Run"
        )}
      </Typography>
      <Typography variant="body1" fontFamily="inherit" fontWeight={200} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="600px" height="24px" />
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
          <Skeleton variant="rounded" width="800px" height="232px" />
        ) : (
          jobInputs?.map((inputVar, index) => (
            <ValueConfig index={index} inputVar={inputVar} handleInputChange={handleInputChange} />
          ))
        )}
      </Box>
      <Box display="flex" flexDirection="row" justifyContent="space-between" marginTop={2}>
        <RunSamplingButton disabled={loading} handleRunSampling={handleRunSampling} />
      </Box>
    </>
  );
}

export default TestJob;
