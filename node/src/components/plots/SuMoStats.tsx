import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import StatCard from "./StatCard";
import { computeCvStatistics } from "../../utils/sumoCvAccuracy";

function SuMoStats() {
  const { inputVars, selectedFunction, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [metrics, setMetrics] = useState<CvMetricsType>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filteredJobList.length < 5 || !selectedQoI) {
      setMetrics(undefined);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/flask/dakota/sumo_cross_validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputVars, output: selectedQoI, FunctionJobs: filteredJobList, log: false }),
    })
      .then(response => response.json())
      .then(data => {
        if (cancelled) return;
        const y = data?.[selectedQoI];
        const yHat = data?.[`${selectedQoI}Hat`];
        setMetrics(y && yHat ? computeCvStatistics(y, yHat) : undefined);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics(undefined);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filteredJobList, inputVars, selectedFunction, distribution, selectedQoI]);

  if (loading) return <CalculatingWarning height={200} dontShowText />;
  if (!metrics) {
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
    <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center" mmux-testid="sumo-stats-view">
      <StatCard label="MAE" value={metrics.mae} />
      <StatCard label="RMSE" value={metrics.rmse} />
      <StatCard label="R²" value={metrics.r2} />
    </Box>
  );
}

export default SuMoStats;
