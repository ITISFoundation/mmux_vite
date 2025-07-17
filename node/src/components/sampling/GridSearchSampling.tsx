import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { useMMUXContext, MMUXContextType } from "../../context/MMUXContext";
import {
  Function,
  RegisteredFunctionJobCollection,
} from "../../osparc-api-ts-client";
import { getSamplingStartValue, getSamplingEndValue } from "../../utils/sampling";
import { RunSamplingButton } from "./RunSamplingButton";
import VariableConfig from "./../setup/VariableConfig";
import { useFunctionContext } from "../../context/FunctionContext";

// TODO update Grid Sampling with all the new features from LHS Sampling (error handling; adding JColl to list... Maybe refactor stuff to avoid code duplication)
async function runGridSampling(
  selectedFunction: Function | undefined,
  context: MMUXContextType,
  config: GRIDSamplingConfig
) {
  const fun = selectedFunction as Function;
  // send config to Python backend to create LHS
  context.setLaunchingSampling(true);
  const jc = await fetch(PYTHON_DAKOTA_BACKEND + "/flask/grid_sampling", {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config,
    }),
  })
    .then(async function (response) {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running Grid Sampling ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then(function (jc: RegisteredFunctionJobCollection) {
      return jc;
    })
  context.setLaunchingSampling(false);
  context.setRunningSampling(true);
  context.setRunningJobCollection(jc ? jc : undefined);
  return jc;
}

const GridSearchSampling = () => {
  const { selectedFunction, inputVars } = useFunctionContext();
  const context = useMMUXContext();
  const {
    distribution,
    gridSamplingConfig,
    setGridSamplingConfig,
  } = context;

  const [gridSamplingInputs, setGridSamplingInputs] =
    useState<GRIDSamplingConfig>(gridSamplingConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setGridSamplingConfig(gridSamplingInputs);
    await runGridSampling(selectedFunction, context, gridSamplingInputs);
  };

  function handleInputChange(index: number, field: string, value: string) {
    setGridSamplingInputs((prevInputs: GRIDSamplingConfig) => {
      const newInputs = [...prevInputs];
      newInputs[index] = {
        ...newInputs[index],
        [field]: parseFloat(value),
      };
      return newInputs;
    });
  }

  useEffect(() => {
    let currentSampling: GRIDSamplingConfig = gridSamplingConfig;
    if (gridSamplingConfig.length === 0) {
      currentSampling = inputVars.map((inputVar) => ({
        variable: inputVar,
        start: getSamplingStartValue(
          inputVar,
          distribution[selectedFunction?.uid || ""]
        ) as number,
        end: getSamplingEndValue(
          inputVar,
          distribution[selectedFunction?.uid || ""]
        ) as number,
      }));
    }
    setGridSamplingInputs(currentSampling);
    setLoading(false);
  }, []);

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
          "Grid Sampling"
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
          <Skeleton variant="rounded" width={"800px"} height={"232px"} />
        ) : (
          gridSamplingInputs?.map((inputVar, index) => (
            <VariableConfig
              index={index}
              inputVar={inputVar}
              key={index}
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

export default GridSearchSampling;
