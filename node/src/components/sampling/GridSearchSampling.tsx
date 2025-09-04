import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Function as OsparcFunction, RegisteredFunctionJobCollection } from "../../osparc-api-ts-client";
import { getSamplingStartValue, getSamplingEndValue } from "../../utils/sampling";
import { RunSamplingButton } from "./RunSamplingButton";
import VariableConfig from "../setup/VariableConfig";
import { useFunctionContext } from "../../context/FunctionContext";
import { SamplingContextType, useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";

// TODO update Grid Sampling with all the new features from LHS Sampling (error handling; adding JColl to list... Maybe refactor stuff to avoid code duplication)
async function runGridSampling(
  selectedFunction: OsparcFunction | undefined,
  context: SamplingContextType,
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void,
  config: GRIDSamplingConfig,
) {
  const fun = selectedFunction as OsparcFunction;
  // send config to Python backend to create LHS
  context.setLaunchingSampling(true);
  const jc = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/grid_sampling`, {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config,
    }),
  })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running Grid Sampling ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then((localJC: RegisteredFunctionJobCollection) => {
      context.setLaunchingSampling(false);
      context.setRunningSampling(true);
      setRunningJobCollection(localJC || undefined);
      return localJC;
    });
  return jc;
}

function GridSearchSampling() {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const context = useSamplingContext();
  const { setRunningJobCollection } = useJobContext();
  const { gridSamplingConfig, setGridSamplingConfig } = context;

  const [gridSamplingInputs, setGridSamplingInputs] = useState<GRIDSamplingConfig>(gridSamplingConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setGridSamplingConfig(gridSamplingInputs);
    await runGridSampling(selectedFunction, context, setRunningJobCollection, gridSamplingInputs);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    setGridSamplingInputs((prevInputs: GRIDSamplingConfig) => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: parseFloat(value),
      };
      return newInputs;
    });
  };

  useEffect(() => {
    let currentSampling: GRIDSamplingConfig = gridSamplingConfig;
    if (gridSamplingConfig.length === 0) {
      currentSampling = inputVars.map(inputVar => ({
        variable: inputVar,
        start: getSamplingStartValue(inputVar, distribution[selectedFunction?.uid || ""]) as number,
        end: getSamplingEndValue(inputVar, distribution[selectedFunction?.uid || ""]) as number,
      }));
    }
    setGridSamplingInputs(currentSampling);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Typography variant="h5" fontFamily="inherit" fontWeight={300} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="300px" height="32px" sx={{ fontSize: "2rem", marginBottom: "8px" }} />
        ) : (
          "Grid Sampling"
        )}
      </Typography>
      <Typography variant="body1" fontFamily="inherit" fontWeight={200} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="600px" height="24px" />
        ) : (
          "Specify the ranges and number of points per dimension for the grid search sampling."
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
          gridSamplingInputs?.map((inputVar, index) => (
            <VariableConfig
              index={index}
              inputVar={inputVar}
              key={`grid-input-${inputVar.variable}`}
              handleInputChange={handleInputChange}
            />
          ))
        )}
      </Box>
      <Box display="flex" flexDirection="row" justifyContent="space-between" marginTop={2}>
        <RunSamplingButton disabled={loading} handleRunSampling={handleRunSampling} />
      </Box>
    </>
  );
}

export default GridSearchSampling;
