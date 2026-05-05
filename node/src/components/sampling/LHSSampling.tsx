import { Box, Input, Skeleton, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { SamplingContextType, useSamplingContext } from "../../context/SamplingContext";
import { useServiceContext } from "../../context/ServiceContext";
import { Function as OsparcFunction, RegisteredFunctionJobCollection } from "../../osparc-api-ts-client";
import { getFunctionJobsFromFunctionJobCollection, getJobStatusCounts } from "../../utils/functionUtils";
import { getSamplingEndValue, getSamplingStartValue } from "../../utils/sampling";
import { filterInputVars } from "../plots/PlotTools";
import VariableConfig from "../setup/VariableConfig";
import { RunSamplingButton } from "./RunSamplingButton";

async function runLhsSampling(
  selectedFunction: OsparcFunction | undefined,
  context: SamplingContextType,
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void,
  config: LHSamplingConfig,
) {
  const fun = selectedFunction as OsparcFunction;
  // send config to Python backend to create LHS
  context.setLaunchingSampling(true);
  const jc = await fetch(`/flask/sampling/lhs`, {
    method: "POST",
    body: JSON.stringify({
      funUid: fun.uid,
      config: config.inputs,
      seed: config.seed,
      N: config.points,
    }),
  })
    .then(async response => {
      if (!response.ok || response.status !== 200) {
        const errorText = await response.text();
        toast.error(`Error running LHS sampling: ${response.status}: ${errorText}`);
        context.setLaunchingSampling(false);
        context.setRunningSampling(false);
        throw new Error(`Error running LHS sampling: ${response.status}: ${errorText}`);
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

function LHSSampling() {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const jobContext = useJobContext();
  const SamplingContext = useSamplingContext();
  const functionContext = useFunctionContext();
  const { setLhsSamplingConfig, lhsSamplingConfig } = SamplingContext;
  const { fetchedJobCollections, setFetchedJobCollections, setRunningJobCollection } = jobContext;
  const { permissions } = useServiceContext();
  const selectedFunctionUid = selectedFunction?.uid;
  const selectedDistribution = selectedFunctionUid ? distribution[selectedFunctionUid] : undefined;

  const [lhsInputs, setLhsInputs] = useState<LHSamplingConfig>(lhsSamplingConfig);
  const [localSamplingPoints, setLocalSamplingPoints] = useState<number>(lhsInputs.points);
  const [loading, setLoading] = useState<boolean>(true);

  const recommendedLHSSamples = useCallback(() => {
    let nPoints: number = Math.sqrt(filterInputVars({ ...jobContext, ...functionContext, ...SamplingContext }).length) * 30 * 1.2;
    nPoints = Math.ceil(nPoints / 5) * 5;
    return nPoints;
  }, [functionContext, jobContext, SamplingContext]);

  // Count existing usable samples using getJobStatusCounts
  const countUsableSamples = useCallback(() => {
    if (!fetchedJobCollections) return 0;

    let totalUsableSamples = 0;

    fetchedJobCollections.forEach(jobCollection => {
      const { subJobs } = jobCollection;
      if (subJobs && subJobs.length > 0) {
        const statusCounts = getJobStatusCounts(subJobs);
        // Count all non-failed samples as usable
        totalUsableSamples += statusCounts.success + statusCounts.running + statusCounts.pending;
      }
    });

    return totalUsableSamples;
  }, [fetchedJobCollections]);

  const handleRunSampling = async () => {
    if (!selectedFunctionUid || lhsInputs.inputs.length === 0) {
      return;
    }

    setLhsSamplingConfig(lhsInputs);
    const recommendedSamples = recommendedLHSSamples();
    const existingUsableSamples = countUsableSamples();
    const userDesiredSamples = lhsInputs.points;
    const totalSamplesAfterRun = existingUsableSamples + userDesiredSamples;
    console.log("Recommended LHS samples:", recommendedSamples);
    console.log("Existing usable samples:", existingUsableSamples);
    console.log("User desired samples:", userDesiredSamples);
    console.log("Total samples after run:", totalSamplesAfterRun);

    // Only show warning if there are not enough total samples after this run
    if (totalSamplesAfterRun < recommendedSamples && permissions === "WRITE") {
      const stillNeeded = recommendedSamples - totalSamplesAfterRun;
      let warningMessage = `For your number of non-constant input variables, we recommend a total of ${recommendedSamples} LHS samples.`;

      if (existingUsableSamples > 0) {
        warningMessage += ` You currently have ${existingUsableSamples} potentially usable samples (SUCCESS/RUNNING/PENDING).`;
      }

      warningMessage += ` You are about to submit ${userDesiredSamples} new samples.`;
      warningMessage += ` After this run, you will have ${totalSamplesAfterRun} total samples, but you may want to consider running ${stillNeeded} additional samples to reach the recommended amount.`;

      if (userDesiredSamples > 50) {
        warningMessage +=
          "\n\nNote: Currently the maximum supported number of samples per run is 50. Please adjust your sample count.";
      } else {
        warningMessage += "\n\nYou can run additional campaigns with different seeds to reach the recommended sample count.";
      }

      toast.warning(warningMessage);
    }
    const jc = await runLhsSampling(selectedFunction, SamplingContext, setRunningJobCollection, lhsInputs);
    if (!jc) {
      console.error("Job collection is undefined. Cannot add to fetchedJobCollections.");
      return;
    }
    let jobs;
    try {
      jobs = await getFunctionJobsFromFunctionJobCollection(jc.uid);
    } catch (error) {
      console.error("Failed to fetch jobs from job collection:", error);
      toast.error("Failed to fetch jobs for the new sampling run. Please try again.");
      return;
    }
    const newJobs: SelectedJobCollection[] = [
      {
        jobCollection: jc,
        selected: true,
        subJobs: jobs.map(job => ({
          selected: false,
          job,
        })),
      },
    ];
    setFetchedJobCollections([...(fetchedJobCollections ?? []), ...newJobs]);
    // TODO Alex: how do I update the table without need to reload everything else?
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    setLhsInputs(prevInputs => {
      const newInputs: LHSamplingConfig = { ...prevInputs };
      if (["points", "seed"].includes(field)) {
        newInputs[field as "seed" | "points"] = field === "seed" ? parseFloat(value) : parseInt(value, 10);
      } else {
        newInputs.inputs[index] = {
          ...newInputs.inputs[index],
          [field]: parseFloat(value),
        };
      }
      return newInputs;
    });
  };

  const generateInputsList = useCallback(
    (inputVar: string) => ({
      variable: inputVar,
      start: getSamplingStartValue(inputVar, selectedDistribution || {}) as number,
      end: getSamplingEndValue(inputVar, selectedDistribution || {}) as number,
    }),
    [selectedDistribution],
  );

  useEffect(() => {
    if (!selectedFunctionUid || !selectedDistribution) {
      setLhsInputs({ ...lhsSamplingConfig, inputs: [] });
      setLoading(false);
      return;
    }

    const currentSampling: LHSamplingConfig = { ...lhsSamplingConfig };
    if (lhsSamplingConfig.inputs.length === 0) {
      currentSampling.inputs = inputVars.map(generateInputsList);
    }
    setLhsInputs(currentSampling);
    setLoading(false);
  }, [generateInputsList, inputVars, lhsSamplingConfig, selectedDistribution, selectedFunctionUid]);

  useEffect(() => {
    if (lhsInputs.points >= 5 && lhsInputs.points <= 50) return;
    setLhsInputs(prevInputs => {
      const nPoints = recommendedLHSSamples();
      const lhsPoints = Math.min(Math.max(Math.min(localSamplingPoints, nPoints), 5), 50); // hardcoded max points limit in backend
      setLocalSamplingPoints(lhsPoints);
      const newInputs = { ...prevInputs, inputs: inputVars.map(generateInputsList), points: lhsPoints };
      return newInputs;
    });
  }, [generateInputsList, inputVars, lhsInputs.points, localSamplingPoints, recommendedLHSSamples, selectedFunction]);

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
            <VariableConfig
              index={index}
              inputVar={inputVar}
              key={`lhs-input-${inputVar.variable}`}
              handleInputChange={handleInputChange}
            />
          ))
        )}
      </Box>

      {loading ? (
        <Skeleton variant="rounded" width="500px" height="28px" sx={{ fontSize: "1.5rem", marginBottom: "8px" }} />
      ) : (
        <form style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <Typography variant="body1">Number of sampling points: </Typography>
          <Input
            mmux-testid="lhs-number-of-sampling-points-input"
            type="number"
            placeholder="Number of sampling points"
            value={localSamplingPoints.toString()}
            sx={theme => ({
              width: 100,
              borderBottom: `1px solid ${theme.palette.background.paper}`,
            })}
            onChange={e => {
              const { value } = e.target;
              const parsed = value === "" ? 0 : parseInt(value, 10);
              setLocalSamplingPoints(Number.isNaN(parsed) ? 0 : parsed);
            }}
            onBlur={e => handleInputChange(0, "points", e.target.value)}
          />
          <Typography variant="body1">Seed: </Typography>
          <Input
            mmux-testid="lhs-seed-input"
            type="number"
            placeholder="seed"
            value={lhsInputs.seed.toString()}
            inputProps={{ min: 0 }}
            sx={theme => ({
              width: 100,
              borderBottom: `1px solid ${theme.palette.background.paper}`,
            })}
            onChange={e => handleInputChange(0, "seed", e.target.value)}
          />
        </form>
      )}
      <Box display="flex" flexDirection="row" justifyContent="space-between" marginTop={2}>
        <RunSamplingButton
          disabled={loading || !selectedFunctionUid || lhsInputs.inputs.length === 0}
          handleRunSampling={handleRunSampling}
        />
      </Box>
    </>
  );
}

export default LHSSampling;
