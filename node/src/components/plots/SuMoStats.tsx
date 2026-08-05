import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { computeCvStatistics } from "../../utils/sumoCvAccuracy";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import StatCard from "./StatCard";

/**
 * SuMo "Stats" step (../../SPEC.md T32/../flaskapi/SPEC.md T24/node T34): MAE/RMSE/R²
 * computed client-side from the same CV actual/predicted arrays `SuMoValidation` fetches
 * (moved out of that view's inline display into this dedicated stepper step); mounted only
 * while this step is active (mirrors the other `SuMoPlotsSteps` steps' per-mount fetch).
 */
function SuMoStats() {
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [cvMetrics, setCvMetrics] = useState<CvMetricsType>();
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    const jobs: OsparcFunctionJob[] = filteredJobList;
    if (!jobs || jobs.length < 5 || !selectedQoI) {
      setCvMetrics(undefined);
      setPropagating(false);
      return undefined;
    }

    let cancelled = false;
    setCvMetrics(undefined);
    setPropagating(true);

    fetch(`/flask/dakota/sumo_cross_validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputVars,
        output: selectedQoI,
        FunctionJobs: jobs,
        log: false,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (cancelled) return;
        if (!data || data.error) {
          console.warn("SuMo Stats error: ", data?.error);
          setCvMetrics(undefined);
          setPropagating(false);
          return;
        }
        // V42: response is now { cvResults: { [originalVarName]: [...] } } —
        // variable names preserved via _DEFAULT_PRESERVE_NESTED_KEYS.
        const { cvResults } = data;
        const y = cvResults[selectedQoI];
        const yHat = cvResults[`${selectedQoI}_hat`];
        if (!y || !yHat) {
          setCvMetrics(undefined);
          setPropagating(false);
          return;
        }
        setCvMetrics(computeCvStatistics(y, yHat));
        setPropagating(false);
      })
      .catch(error => {
        if (cancelled) return;
        console.warn("Error fetching SuMo Stats:", error);
        setCvMetrics(undefined);
        setPropagating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedQoI, inputVars, selectedFunction, distribution, filteredJobList]);

  if (propagating) {
    return <CalculatingWarning height={200} dontShowText />;
  }

  if (!cvMetrics) {
    return (
      <InsufficientDataWarning
        fetchedJobCollections={fetchedJobCollections}
        filteredJobList={filteredJobList}
        height={200}
        numInputVars={inputVars.length}
      />
    );
  }

  return (
    <Box
      display="flex"
      flex={1}
      flexDirection="row"
      gap={2}
      justifyContent="center"
      alignItems="center"
      mmux-testid="sumo-stats-view"
    >
      <StatCard label="MAE" value={cvMetrics.mae} />
      <StatCard label="RMSE" value={cvMetrics.rmse} />
      <StatCard label={"R\u00B2"} value={cvMetrics.r2} />
    </Box>
  );
}

export default SuMoStats;
