import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import { Tune } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import Plot from "react-plotly.js";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { useMMUXContext } from "../../context/MMUXContext";
import { requestJson } from "../../api/client";
import { getCachedOrFetch } from "../../api/sessionResponseCache";
import { getErrorMessage } from "../../utils/httpError";
import { useAutoDetectQoiScale } from "../../utils/useAutoDetectQoiScale";
import { useDisplayScale } from "../../utils/useDisplayScale";
import { DisplayScaleToggle } from "./DisplayScaleToggle";
import { JobsLoading } from "../data/JobsLoading";
import CalculatingWarning from "./CalculatingWarning";
import HistogramStats from "./HistogramStats";
import InsufficientDataWarning from "./InsufficientDataWarning";

type UncertainUQProps = LoadingPropsType & { onOpenSettings?: () => void };

export default function UncertainUQ(props: UncertainUQProps) {
  const { loading, jobProgress, onOpenSettings } = props;
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { uqSettings, selectedQoI } = useMMUXContext();
  // Per-variable log-scale flags (node SPEC V12), see Curves1DPlot for the pattern.
  const inputLogScales = useMemo(
    () =>
      inputVars.reduce(
        (acc: { [key: string]: boolean }, key) => {
          acc[key] = distribution[selectedFunction?.uid || ""]?.[key]?.scale === "log";
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    [inputVars, distribution, selectedFunction],
  );
  const outputLogScaleForQoi = selectedQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[selectedQoI]) : false;
  // Display axis scale follows the QoI's COMPUTE scale until the user overrides it
  // in this panel; the override is view-only (never in the request/cache key — the
  // uqBody below carries outputLogScales from the compute flag alone).
  const [displayLog, setDisplayLog] = useDisplayScale(
    outputLogScaleForQoi,
    `${selectedFunction?.uid || ""}|${selectedQoI || ""}`,
  );
  // V26/V27: propose linear-vs-log surrogate scale for the selected QoI from a
  // CV RMSE comparison; a manual toggle in OutputVariableDist locks it (V27).
  useAutoDetectQoiScale(selectedQoI ? [selectedQoI] : undefined);
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [dataUQHistogram, setDataUQHistogram] = useState<DataUQHistogramType>();
  const [plotData, setPlotData] = useState<Plotly.Data[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useGuardedAsyncEffect(
    async isStale => {
      console.log("running job collections: ", filteredJobList);
      setDataUQHistogram(undefined);
      setPlotData([]);
      setErrorMessage(undefined);
      setPropagating(true);
      if (filteredJobList.length === 0) {
        console.warn("No jobs selected for UQ propagation.");
        setPropagating(false);
        return;
      }
      try {
        console.info("Propagating UQ...");
        console.info("SelectedQoI: ", selectedQoI);
        const uqBody = {
          inputVars,
          output: selectedQoI,
          distributions: distribution[selectedFunction?.uid || ""],
          FunctionJobs: filteredJobList,
          numSamples: uqSettings[selectedFunction?.uid || ""]?.numSamples || 10000,
          inputLogScales,
          outputLogScales: selectedQoI ? { [selectedQoI]: outputLogScaleForQoi } : {},
          nHistograms: uqSettings[selectedFunction?.uid || ""]?.nHistograms || 50,
          seed: uqSettings[selectedFunction?.uid || ""]?.seed || 0,
        };
        // V46sc: seed/numSamples/nHistograms/distributions (and the #663
        // log-scale maps) are ALL in the cache key by construction - changing
        // any of them misses and refetches.
        const data = await getCachedOrFetch<DataUQHistogramType>(
          `/flask/dakota/manual_uq_propagation_with_uncertainty`,
          uqBody,
          () =>
            requestJson<DataUQHistogramType>(`/flask/dakota/manual_uq_propagation_with_uncertainty`, {
              method: "POST",
              retry: true,
              body: uqBody,
            }),
        );
        if (isStale()) return;
        const newPlotData: Plotly.Data[] = [
          {
            x: Array.from(
              { length: data.binMeans.length },
              (_, i) => data.binsStart + ((data.binsEnd - data.binsStart) / data.binMeans.length) * (i + 0.5),
            ),
            y: data.binMeans,
            type: "bar",
            marker: { color: `${theme.palette.primary.main}` },
            name: "UQ Histogram",
            error_y: {
              type: "data",
              array: data.binStds,
              visible: true,
            },
          },
        ];
        setPlotData(newPlotData);
        setDataUQHistogram(data); // now this is a dict w "mean_histogram" and "std_histogram" keys
        setPropagating(false);
      } catch (error) {
        if (isStale()) return;
        console.warn("Error:", error);
        setErrorMessage(getErrorMessage(error));
        setPropagating(false);
        setDataUQHistogram(undefined);
      }
    },
    // #663 log-scale deps ride the union (uqSettings already replaces numSamples here)
    [
      filteredJobList,
      selectedQoI,
      uqSettings,
      inputVars,
      distribution,
      selectedFunction,
      theme.palette.primary.main,
      inputLogScales,
      outputLogScaleForQoi,
    ],
  );
  if (loading) {
    return <JobsLoading jobProgress={jobProgress} message="Creating AI model..." />;
  }

  // A log axis cannot render bins whose centers are <= 0; keep the toggle honest
  // about that (disable + fall back to a linear axis) rather than shipping a blank plot.
  const plottedX = (plotData[0] as { x?: unknown } | undefined)?.x;
  const plotMinX = Array.isArray(plottedX) ? Math.min(...(plottedX as number[])) : 1;
  const canLog = plotMinX > 0;
  const axisLog = displayLog && canLog;

  const layout = {
    title: { text: "Uncertainty Quantification Histogram" },
    xaxis: { title: { text: selectedQoI || "Output" }, type: axisLog ? "log" : "linear" },
    yaxis: { title: { text: "Density" } },
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
      <Box sx={{ position: "relative", width: "100%" }}>
        {onOpenSettings && (
          <Tooltip title="UQ Settings" arrow>
            <IconButton
              size="small"
              onClick={onOpenSettings}
              aria-label="UQ Settings"
              mmux-testid="uq-settings-button"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1,
                backgroundColor: theme.palette.background.paper,
                "&:hover": { backgroundColor: theme.palette.background.paper },
              }}
            >
              <Tune fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {plotData.length !== 0 && (
          <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}>
            <DisplayScaleToggle
              log={axisLog}
              onChange={setDisplayLog}
              disabled={!canLog}
              disabledReason="Bin centers include non-positive values; a log axis can't render them."
              testId="uq-display-scale"
            />
          </Box>
        )}
        {propagating && <CalculatingWarning height={plotStyle.height} dontShowText={plotData.length !== 0} />}
        {!propagating && plotData.length === 0 && (
          <InsufficientDataWarning
            fetchedJobCollections={fetchedJobCollections}
            filteredJobList={filteredJobList}
            height={plotStyle.height}
            numInputVars={inputVars.length}
            errorMessage={errorMessage}
          />
        )}
        {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
      </Box>
      {dataUQHistogram !== undefined && <HistogramStats {...dataUQHistogram} />}
    </Box>
  );
}
