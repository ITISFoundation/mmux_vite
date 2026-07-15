import { Box, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { sobolLinearRange, sobolLogRange, toLogSafe, type ScaleType } from "../../utils/plotScale";
import { buildSobolHeatmapData, fetchSobolIndices } from "../../utils/sobolIndices";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";

type SobolViewMode = "first-order" | "total-order" | "second-order";

export default function SobolIndicesPlot() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [sobolData, setSobolData] = useState<SobolIndicesResponse | null>(null);
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [computing, setComputing] = useState(false);
  const [viewMode, setViewMode] = useState<SobolViewMode>("first-order");
  const [scaleType, setScaleType] = useState<ScaleType>("linear");

  useEffect(() => {
    (async () => {
      setSobolData(null);
      setPlotData([]);
      setComputing(true);
      if (filteredJobList.length === 0 || !selectedQoI) {
        console.warn("No jobs selected for Sobol' indices computation.");
        setComputing(false);
        return;
      }
      try {
        const data = await fetchSobolIndices({
          inputVars,
          output: selectedQoI,
          distributions: distribution[selectedFunction?.uid || ""],
          functionJobs: filteredJobList,
          numSamples: numSamples[selectedFunction?.uid || ""] || 10000,
          seed: 0,
        });
        setSobolData(data);
        setComputing(false);
      } catch (error) {
        console.warn("Error computing Sobol' indices:", error);
        setComputing(false);
        setSobolData(null);
      }
    })();
  }, [filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction]);

  useEffect(() => {
    if (!sobolData) {
      setPlotData([]);
      return;
    }
    const { sobol, sobolSecondOrder } = sobolData;

    if (viewMode === "first-order") {
      const mainValues = inputVars.map(v => sobol[v]?.main ?? 0);
      const ciHighDelta = inputVars.map(v => Math.max(0, (sobol[v]?.mainCiHigh ?? sobol[v]?.main ?? 0) - (sobol[v]?.main ?? 0)));
      const ciLowDelta = inputVars.map(v => Math.max(0, (sobol[v]?.main ?? 0) - (sobol[v]?.mainCiLow ?? sobol[v]?.main ?? 0)));
      setPlotData([
        {
          x: inputVars,
          y: mainValues,
          type: "bar",
          name: "First order",
          marker: { color: theme.palette.primary.main },
          error_y: { type: "data", symmetric: false, array: ciHighDelta, arrayminus: ciLowDelta },
        },
      ]);
    } else if (viewMode === "total-order") {
      const totalValues = inputVars.map(v => sobol[v]?.total ?? 0);
      const ciHighDelta = inputVars.map(v =>
        Math.max(0, (sobol[v]?.totalCiHigh ?? sobol[v]?.total ?? 0) - (sobol[v]?.total ?? 0)),
      );
      const ciLowDelta = inputVars.map(v => Math.max(0, (sobol[v]?.total ?? 0) - (sobol[v]?.totalCiLow ?? sobol[v]?.total ?? 0)));
      setPlotData([
        {
          x: inputVars,
          y: totalValues,
          type: "bar",
          name: "Total order",
          marker: { color: theme.palette.secondary.main },
          error_y: { type: "data", symmetric: false, array: ciHighDelta, arrayminus: ciLowDelta },
        },
      ]);
    } else {
      // second-order heatmap: log scale applies to the color axis, not a value axis
      const heatmap = buildSobolHeatmapData(sobol, sobolSecondOrder, inputVars);
      if (scaleType === "log") {
        const z = (heatmap.z as number[][]).map(row => row.map(toLogSafe));
        setPlotData([{ ...heatmap, z, zmin: sobolLogRange[0], zmax: sobolLogRange[1] }]);
      } else {
        setPlotData([{ ...heatmap, zmin: sobolLinearRange[0], zmax: sobolLinearRange[1] }]);
      }
    }
  }, [sobolData, viewMode, scaleType, inputVars, theme.palette.primary.main, theme.palette.secondary.main]);

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: SobolViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleScaleTypeChange = (_event: React.MouseEvent<HTMLElement>, newScale: ScaleType | null) => {
    if (newScale !== null) {
      setScaleType(newScale);
    }
  };

  const isHeatmap = viewMode === "second-order";
  const layout = isHeatmap
    ? {
        title: { text: "Sobol' Indices" },
        xaxis: { title: { text: "Variable" }, side: "bottom" as const },
        yaxis: { title: { text: "Variable" }, autorange: "reversed" as const },
        plot_bgcolor: `${theme.palette.background.default}`,
        paper_bgcolor: `${theme.palette.background.default}`,
        font: { color: `${theme.palette.text.primary}` },
      }
    : {
        title: { text: "Sobol' Indices" },
        xaxis: { title: { text: "Input variable" } },
        yaxis: {
          title: { text: "Sobol' index" },
          type: scaleType,
          range: scaleType === "log" ? sobolLogRange : sobolLinearRange,
        },
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
      <Box display="flex" justifyContent="flex-end" gap={1}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          mmux-testid="sobol-view-toggle"
        >
          <ToggleButton value="first-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-first">
            First order
          </ToggleButton>
          <ToggleButton value="second-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-second">
            Second order
          </ToggleButton>
          <ToggleButton value="total-order" sx={{ textTransform: "none" }} mmux-testid="sobol-toggle-total">
            Total order
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={scaleType}
          exclusive
          onChange={handleScaleTypeChange}
          size="small"
          mmux-testid="sobol-scale-toggle"
        >
          <ToggleButton value="linear" sx={{ textTransform: "none" }} mmux-testid="sobol-scale-linear">
            Linear
          </ToggleButton>
          <ToggleButton value="log" sx={{ textTransform: "none" }} mmux-testid="sobol-scale-log">
            Log
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {computing && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
      {!computing && !sobolData && (
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
