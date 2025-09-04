import { useCallback, useEffect, useState } from "react";
import { Box, Input, Skeleton, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Function, FunctionJob, RegisteredFunctionJobCollection } from "../../osparc-api-ts-client";
import { getSamplingStartValue, getSamplingEndValue } from "../../utils/sampling";
import { RunSamplingButton } from "./RunSamplingButton";
import VariableConfig from "../setup/VariableConfig";
import { getFunctionJob } from "../../utils/function_utils";
import { useFunctionContext } from "../../context/FunctionContext";
import { useServiceContext } from "../../context/ServiceContext";
import { filterInputVars } from "../plots/PlotTools";
import { SamplingContextType, useSamplingContext } from "../../context/SamplingContext";
import { useJobContext } from "../../context/JobContext";

async function runLhsSampling(
  selectedFunction: Function | undefined,
  context: SamplingContextType,
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void,
  config: LHSamplingConfig,
) {
  const fun = selectedFunction as Function;
  // send config to Python backend to create LHS
  context.setLaunchingSampling(true);
  const jc = await fetch(`${PYTHON_DAKOTA_BACKEND}/flask/lhs_sampling`, {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config.inputs,
      seed: config.seed,
      N: config.points,
    }),
  })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running LHS sampling: ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then((jc: RegisteredFunctionJobCollection) => {
      context.setLaunchingSampling(false);
      context.setRunningSampling(true);
      setRunningJobCollection(jc || undefined);
      return jc;
    });
  return jc;
}

function LHSSampling() {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const jobContext = useJobContext();
  const SamplingContext = useSamplingContext();
  const functionContext = useFunctionContext();
  const { setLhsSamplingConfig, lhsSamplingConfig } = SamplingContext;
  const { fetchedJobCollections, setFetchedJobCollections, setRunningJobCollection } = jobContext;
  const { permissions } = useServiceContext();

  const [lhsInputs, setLhsInputs] = useState<LHSamplingConfig>(lhsSamplingConfig);
  const [loading, setLoading] = useState<boolean>(true);

  const handleRunSampling = async () => {
    setLhsSamplingConfig(lhsInputs);
    const nPoints = recommendedLHSSamples();
    // TODO should check how many jobs already have; and current launched number
    if (nPoints > 50 && permissions === "WRITE") {
      toast.warning(
        `For your number of non-constant input variables, we would recommend a total of ${nPoints} LHS samples. \n\n ` +
          "However, currently the maximum supported number of samples per run is 50. Therefore, we encourage you to run additional campaigns with different seeds.",
      );
    }
    const jc = await runLhsSampling(selectedFunction, SamplingContext, setRunningJobCollection, lhsInputs);
    // New - include this job collection in the fetchedJobCollections
    if (!jc) {
      console.error("Job collection is undefined. Cannot add to fetchedJobCollections.");
      return;
    }
    const newJobs: SelectedJobCollection[] = await Promise.all(
      [jc].map(async jc => {
        const subJobs = await Promise.all(
          jc.jobIds.map(async id => {
            const job = (await getFunctionJob(id)) as FunctionJob;
            return {
              selected: false,
              job,
            };
          }),
        );
        return {
          jobCollection: jc,
          selected: true,
          subJobs,
        };
      }),
    );
    setFetchedJobCollections([...fetchedJobCollections, ...newJobs]);
    // TODO Alex: how do I update the table without need to reload everything else?
  };

  function handleInputChange(index: number, field: string, value: string) {
    setLhsInputs(prevInputs => {
      const newInputs: LHSamplingConfig = { ...prevInputs };
      if (["points", "seed"].includes(field)) {
        newInputs[field as "seed" | "points"] = field === "seed" ? parseFloat(value) : parseInt(value);
      } else {
        newInputs.inputs[index] = {
          ...newInputs.inputs[index],
          [field]: parseFloat(value),
        };
      }
      return newInputs;
    });
  }

  const recommendedLHSSamples = useCallback(() => {
    let nPoints: number = Math.sqrt(filterInputVars({ ...jobContext, ...functionContext, ...SamplingContext }).length) * 30 * 1.2;
    nPoints = Math.ceil(nPoints / 5) * 5;
    return nPoints;
  }, [functionContext, jobContext, SamplingContext]);

  const generateInputsList = useCallback(
    (inputVar: string) => ({
      variable: inputVar,
      start: getSamplingStartValue(inputVar, distribution[selectedFunction?.uid || ""]) as number,
      end: getSamplingEndValue(inputVar, distribution[selectedFunction?.uid || ""]) as number,
    }),
    [distribution, selectedFunction],
  );

  useEffect(() => {
    const currentSampling: LHSamplingConfig = { ...lhsSamplingConfig };
    if (lhsSamplingConfig.inputs.length === 0) {
      currentSampling.inputs = inputVars.map(generateInputsList);
    }
    setLhsInputs(currentSampling);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lhsInputs.points >= 5 && lhsInputs.points <= 50) return;
    setLhsInputs(prevInputs => {
      const nPoints = recommendedLHSSamples();
      const lhsPoints = Math.min(Math.max(nPoints, 5), 50); // hardcoded max points limit in backedn
      const newInputs = { ...prevInputs, inputs: inputVars.map(generateInputsList), points: lhsPoints };
      return newInputs;
    });
  }, [generateInputsList, inputVars, lhsInputs.points, recommendedLHSSamples, selectedFunction]);

  return (
    <>
      <Typography variant="h5" fontFamily="inherit" fontWeight={300} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="300px" height="32px" sx={{ fontSize: "2rem", marginBottom: "8px" }} />
        ) : (
          "Latin Hypercube Sampling"
        )}
      </Typography>
      <Typography variant="body1" fontFamily="inherit" fontWeight={200} marginBottom={1}>
        {loading ? (
          <Skeleton variant="text" width="600px" height="24px" />
        ) : (
          "Specify total number of sample points that will be computed, as well as the ranges of each parameter."
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
          lhsInputs.inputs.map((inputVar, index) => (
            <VariableConfig index={index} inputVar={inputVar} key={index} handleInputChange={handleInputChange} />
          ))
        )}
      </Box>

      {loading ? (
        <Skeleton variant="rounded" width="500px" height="28px" sx={{ fontSize: "1.5rem", marginBottom: "8px" }} />
      ) : (
        <form style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <Typography variant="body1">Number of sampling points: </Typography>
          <Input
            type="number"
            placeholder="Number of sampling points"
            value={lhsInputs.points.toString()}
            sx={theme => ({
              width: 100,
              borderBottom: `1px solid ${theme.palette.background.paper}`,
            })}
            onChange={e => handleInputChange(0, "points", e.target.value)}
          />
          <Typography variant="body1">Seed: </Typography>
          <Input
            type="number"
            placeholder="seed"
            value={lhsInputs.seed.toString()}
            sx={theme => ({
              width: 100,
              borderBottom: `1px solid ${theme.palette.background.paper}`,
            })}
            onChange={e => handleInputChange(0, "seed", e.target.value)}
          />
        </form>
      )}
      <Box display="flex" flexDirection="row" justifyContent="space-between" marginTop={2}>
        <RunSamplingButton disabled={loading} handleRunSampling={handleRunSampling} />
      </Box>
    </>
  );
}

export default LHSSampling;
