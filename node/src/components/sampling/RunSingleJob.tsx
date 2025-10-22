import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { RunSamplingButton } from "./RunSamplingButton";
import ValueConfig from "../setup/ValueConfig";
import { useFunctionContext } from "../../context/FunctionContext";
import { useSamplingContext } from "../../context/SamplingContext";
import { runSingleJob } from "../../utils/sampling_utils";

function TestJob() {
  const { selectedFunction, inputVars } = useFunctionContext();
  const { singleJobConfig, setSingleJobConfig, setLaunchingSampling } = useSamplingContext();
  const [jobInputs, setJobInputs] = useState<Array<SingleJobConfig>>(singleJobConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    await runSingleJob(selectedFunction, jobInputs, setLaunchingSampling);
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
    let currentSingleJobConfig: SingleJobConfig[] = singleJobConfig;
    if (currentSingleJobConfig.length === 0) {
      currentSingleJobConfig = inputVars.map(inputVar => ({
        variable: inputVar,
        value: 0.0,
      }));
    }
    setJobInputs(currentSingleJobConfig);
    setSingleJobConfig(currentSingleJobConfig);
    setLoading(false);
  }, [inputVars, singleJobConfig, setSingleJobConfig]);

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
