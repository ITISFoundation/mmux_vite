import { Box, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { buildCorrelationBarData, fetchCorrelationIndices } from "../../utils/correlationIndices";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";

// #470: single-plot sensitivity view — one bar per input variable (Pearson + Spearman),
// showing correlation strength to the selected QoI for *all* parameters at once
// (beyond the current 3-var 1D/2D/3D plot limit).
export default function CorrelationIndicesPlot() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    (async () => {
      setPlotData([]);
      setComputing(true);
      if (filteredJobList.length === 0 || !selectedQoI) {
        console.warn("No jobs selected for correlation indices computation.");
        setComputing(false);
        return;
      }
      try {
        const data = await fetchCorrelationIndices({
          inputVars,
          output: selectedQoI,
          distributions: distribution[selectedFunction?.uid || ""],
          functionJobs: filteredJobList,
          numSamples: numSamples[selectedFunction?.uid || ""] || 10000,
          seed: 0,
        });
        setPlotData(
          buildCorrelationBarData(data.correlations, inputVars, {
            pearson: theme.palette.primary.main,
            spearman: theme.palette.secondary.main,
          }),
        );
        setComputing(false);
      } catch (error) {
        console.warn("Error computing correlation indices:", error);
        setComputing(false);
        setPlotData([]);
      }
    })();
  }, [
    filteredJobList,
    selectedQoI,
    numSamples,
    inputVars,
    distribution,
    selectedFunction,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);

  const layout = {
    title: { text: "Sensitivity / Correlation Indices" },
    xaxis: { title: { text: "Input variable" } },
    yaxis: { title: { text: "Correlation coefficient" }, range: [-1, 1] },
    barmode: "group" as const,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };
  const plotStyle = {
    width: "100%",
    height: 400,
    borderRadius: "8px",
    overflow: "hidden",
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} width="100%">
      {computing && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
      {!computing && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!computing && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
    </Box>
  );
}
