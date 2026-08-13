import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { fetchWithRetry } from "../../utils/fetchRetry";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import StatCard from "./StatCard";
import StatsModal from "./StatsModal";

type UQStatsModalProps = { open: boolean; setOpen: (open: boolean) => void };

function UQStatsModal({ open, setOpen }: UQStatsModalProps) {
  const { inputVars, selectedFunction, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [stats, setStats] = useState<DataUQHistogramType>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    if (filteredJobList.length === 0) {
      setStats(undefined);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithRetry("/flask/dakota/manual_uq_propagation_with_uncertainty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputVars,
        output: selectedQoI,
        distributions: distribution[selectedFunction?.uid || ""],
        FunctionJobs: filteredJobList,
        numSamples: numSamples[selectedFunction?.uid || ""] || 10000,
        log: false,
        nHistograms: 50,
        seed: 0,
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error(`UQ stats request failed: ${response.status}`);
        return response.json() as Promise<DataUQHistogramType>;
      })
      .then(data => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(undefined);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction]);

  return (
    <StatsModal open={open} setOpen={setOpen} title="UQ Stats" testId="uq-stats-modal">
      {loading && <CalculatingWarning height={200} dontShowText />}
      {!loading && !stats && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={200}
          numInputVars={inputVars.length}
        />
      )}
      {!loading && stats && (
        <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
          <StatCard label="Mean" value={stats.mean} />
          <StatCard label="Std" value={stats.std} />
          <StatCard label="Min" value={stats.min} />
          <StatCard label="Q1" value={stats.q1} />
          <StatCard label="Median" value={stats.median} />
          <StatCard label="Q3" value={stats.q3} />
          <StatCard label="Max" value={stats.max} />
        </Box>
      )}
    </StatsModal>
  );
}

export default UQStatsModal;
