import { Box, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import {
  correlationAbsLogRange,
  correlationLinearRange,
  correlationSymlogRange,
  logDisplayValue,
  symlogTicks,
  symlogTransform,
  type CorrelationScaleType,
} from "../../utils/plotScale";
import { fetchCorrelationIndices } from "../../utils/correlationIndices";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";

export type CorrelationViewMode = "pearson" | "spearman";

type CorrelationIndicesPlotProps = {
  viewMode: CorrelationViewMode;
  scaleType: CorrelationScaleType;
};

type CorrelationControlsProps = {
  viewMode: CorrelationViewMode;
  scaleType: CorrelationScaleType;
  onViewModeChange: (_event: React.MouseEvent<HTMLElement>, newMode: CorrelationViewMode | null) => void;
  onScaleTypeChange: (_event: React.MouseEvent<HTMLElement>, newScale: CorrelationScaleType | null) => void;
};

export function CorrelationControls({ viewMode, scaleType, onViewModeChange, onScaleTypeChange }: CorrelationControlsProps) {
  return (
    <Box display="flex" gap={1}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={onViewModeChange}
        size="small"
        mmux-testid="correlation-view-toggle"
      >
        <ToggleButton value="pearson" sx={{ textTransform: "none" }} mmux-testid="correlation-toggle-pearson">
          Pearson
        </ToggleButton>
        <ToggleButton value="spearman" sx={{ textTransform: "none" }} mmux-testid="correlation-toggle-spearman">
          Spearman
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        value={scaleType}
        exclusive
        onChange={onScaleTypeChange}
        size="small"
        mmux-testid="correlation-scale-toggle"
      >
        <ToggleButton value="linear" sx={{ textTransform: "none" }} mmux-testid="correlation-scale-linear">
          Linear
        </ToggleButton>
        <ToggleButton value="abslog" sx={{ textTransform: "none" }} mmux-testid="correlation-scale-abslog">
          Log
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

// #470: single-plot sensitivity view — one bar per input variable, toggling between
// Pearson and Spearman correlation strength to the selected QoI (beyond the current
// 3-var 1D/2D/3D plot limit).
export default function CorrelationIndicesPlot({ viewMode, scaleType }: CorrelationIndicesPlotProps) {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { numSamples, selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [correlations, setCorrelations] = useState<CorrelationIndicesResponse["correlations"] | null>(null);
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    (async () => {
      setCorrelations(null);
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
        setCorrelations(data.correlations);
        setComputing(false);
      } catch (error) {
        console.warn("Error computing correlation indices:", error);
        setComputing(false);
        setCorrelations(null);
      }
    })();
  }, [filteredJobList, selectedQoI, numSamples, inputVars, distribution, selectedFunction]);

  useEffect(() => {
    if (!correlations) {
      setPlotData([]);
      return;
    }
    const rawValues = inputVars.map(inputVar => correlations[inputVar]?.[viewMode] ?? 0);

    if (scaleType === "abslog") {
      // Sign is dropped from the axis (log can't represent it), so we split into two
      // traces colored by sign instead — lets magnitudes be compared directly even
      // across opposite-sign variables, with the sign recovered via color + legend.
      const positive: { x: string[]; y: number[]; raw: number[] } = { x: [], y: [], raw: [] };
      const negative: { x: string[]; y: number[]; raw: number[] } = { x: [], y: [], raw: [] };
      inputVars.forEach((inputVar, i) => {
        const raw = rawValues[i];
        const bucket = raw >= 0 ? positive : negative;
        bucket.x.push(inputVar);
        bucket.y.push(logDisplayValue(Math.abs(raw)));
        bucket.raw.push(raw);
      });
      setPlotData([
        {
          x: positive.x,
          y: positive.y,
          customdata: positive.raw,
          type: "bar",
          width: 0.45,
          name: "Positive",
          marker: { color: theme.palette.primary.main },
          hovertemplate: "%{x}: %{customdata:.4f}<extra></extra>",
        },
        {
          x: negative.x,
          y: negative.y,
          customdata: negative.raw,
          type: "bar",
          width: 0.45,
          name: "Negative",
          marker: { color: theme.palette.secondary.main },
          hovertemplate: "%{x}: %{customdata:.4f}<extra></extra>",
        },
      ]);
      return;
    }

    const values = scaleType === "symlog" ? rawValues.map(symlogTransform) : rawValues;
    const color = viewMode === "pearson" ? theme.palette.primary.main : theme.palette.secondary.main;
    setPlotData([
      {
        x: inputVars,
        y: values,
        customdata: rawValues,
        type: "bar",
        width: 0.45,
        name: viewMode === "pearson" ? "Pearson" : "Spearman",
        marker: { color },
        hovertemplate: "%{x}: %{customdata:.4f}<extra></extra>",
      },
    ]);
  }, [correlations, viewMode, scaleType, inputVars, theme.palette.primary.main, theme.palette.secondary.main]);

  const symlogAxis = symlogTicks();
  const gridStyle = { showgrid: true, gridcolor: theme.palette.divider };
  const minorGridStyle = { showgrid: true, gridcolor: theme.palette.divider, gridwidth: 0.5 };
  let yaxis: Partial<Plotly.LayoutAxis>;
  if (scaleType === "symlog") {
    yaxis = {
      title: { text: "Correlation coefficient (symlog)" },
      range: correlationSymlogRange,
      tickvals: symlogAxis.tickvals,
      ticktext: symlogAxis.ticktext,
      ...gridStyle,
      minor: { ...minorGridStyle, dtick: 0.1 },
    };
  } else if (scaleType === "abslog") {
    yaxis = {
      title: { text: "|Correlation coefficient| (log)" },
      type: "log",
      range: correlationAbsLogRange,
      ...gridStyle,
      minor: minorGridStyle,
    };
  } else {
    yaxis = {
      title: { text: "Correlation coefficient" },
      range: correlationLinearRange,
      ...gridStyle,
      minor: { ...minorGridStyle, dtick: 0.1 },
    };
  }
  const layout = {
    title: { text: "Sensitivity / Correlation Indices" },
    // fixed category order needed for abslog's two sign-split traces to line up correctly
    // (each only covers a subset of inputVars, in varying orders otherwise)
    xaxis: { title: { text: "Input variable" }, categoryorder: "array" as const, categoryarray: inputVars },
    yaxis,
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
          numInputVars={inputVars.length}
        />
      )}
      {!computing && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
    </Box>
  );
}
