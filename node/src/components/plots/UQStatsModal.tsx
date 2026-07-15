import { useEffect, useState, type ReactNode } from "react";
import { Box, Divider, Typography, useTheme } from "@mui/material";
import { useMMUXContext } from "../../context/MMUXContext";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { fetchWithRetry } from "../../utils/fetchRetry";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import StatCard from "./StatCard";
import StatsModal from "./StatsModal";

type UQStatsModalProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

type StatsSectionProps = {
  title: string;
  children: ReactNode;
  testId: string;
};

function StatsSection(props: StatsSectionProps) {
  const { title, children, testId } = props;
  const theme = useTheme();
  return (
    <Box display="flex" flexDirection="column" gap={1} mmux-testid={testId}>
      <Typography variant="overline" color={theme.palette.text.secondary} sx={{ letterSpacing: "1px" }}>
        {title}
      </Typography>
      <Divider sx={{ marginBottom: "4px" }} />
      {children}
    </Box>
  );
}

/**
 * UQ "Stats" modal (../../SPEC.md T32/../flaskapi/SPEC.md T24/node T34): standalone modal
 * (⊥ nested inside SuMoModal's stepper) showing per-QoI mean/std/quantiles from the same
 * `/manual_uq_propagation_with_uncertainty` endpoint `UncertainUQ` consumes. Fetches on open
 * (⊥ shared cache — that's a separate future task, node/SPEC.md T35/V33).
 */
function UQStatsModal(props: UQStatsModalProps) {
  const { open, setOpen } = props;
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [stats, setStats] = useState<DataUQHistogramType>();
  const [propagating, setPropagating] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    if (filteredJobList.length === 0) {
      setStats(undefined);
      setPropagating(false);
      return undefined;
    }

    let cancelled = false;
    setStats(undefined);
    setPropagating(true);

    (async () => {
      try {
        const response = await fetchWithRetry(`/flask/dakota/manual_uq_propagation_with_uncertainty`, {
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
        });
        if (!response.ok) {
          throw new Error(`Error in UQ Stats response: ${response.status}, ${response.statusText}`);
        }
        const data: DataUQHistogramType = await response.json();
        if (!cancelled) {
          setStats(data);
          setPropagating(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Error fetching UQ Stats:", error);
          setStats(undefined);
          setPropagating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction]);

  return (
    <StatsModal open={open} setOpen={setOpen} title="UQ Stats" testId="uq-stats-modal">
      {propagating && <CalculatingWarning height={200} dontShowText />}
      {!propagating && !stats && (
        <InsufficientDataWarning fetchedJobCollections={fetchedJobCollections} filteredJobList={filteredJobList} height={200} />
      )}
      {!propagating && stats && (
        <Box display="flex" flexDirection="column" gap={3} padding="0px 8px">
          <StatsSection title="Central tendency" testId="uq-stats-central-tendency">
            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
              <StatCard label="Mean" value={stats.mean} />
              <StatCard label="Std" value={stats.std} />
            </Box>
          </StatsSection>
          <StatsSection title="Percentiles" testId="uq-stats-percentiles">
            <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center">
              <StatCard label="P1" value={stats.p1} />
              <StatCard label="P5" value={stats.p5} />
              <StatCard label="Q1" value={stats.q1} />
              <StatCard label="Median" value={stats.median} />
              <StatCard label="Q3" value={stats.q3} />
              <StatCard label="P95" value={stats.p95} />
              <StatCard label="P99" value={stats.p99} />
            </Box>
          </StatsSection>
          <StatsSection title="Uncertainty decomposition" testId="uq-stats-uncertainty-decomposition">
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="body2" color="text.secondary">
                Epistemic uncertainty: coming soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aleatoric uncertainty: coming soon
              </Typography>
            </Box>
          </StatsSection>
        </Box>
      )}
    </StatsModal>
  );
}

export default UQStatsModal;
