import { useMemo, useState, useEffect, useRef } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import { Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { Layout } from "plotly.js";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import Metric from "./Metric";
import MetricRow from "./MetricRow";
import { plotMarginsNarrow } from "./PlotTools";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { getValidationSeries } from "../../utils/sumoValidation";
import { requestJson } from "../../api/client";
import { getCachedOrFetch } from "../../api/sessionResponseCache";
import { getErrorMessage } from "../../utils/httpError";
import { useAutoDetectQoiScale } from "../../utils/useAutoDetectQoiScale";
import { useDisplayScale } from "../../utils/useDisplayScale";
import { DisplayScaleToggle } from "./DisplayScaleToggle";

function SuMoValidation({ validationQoIOverride }: { validationQoIOverride?: string }) {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { validationQoI: contextValidationQoI } = useMMUXContext();
  const validationQoI = validationQoIOverride ?? contextValidationQoI;
  // Per-variable log-scale flags (node SPEC V12), see Curves1DPlot for the
  // pattern. Re-port note: keyed off validationQoI, NOT selectedQoI -- since
  // #681 this view can render a modal-selected QoI; scale must follow what
  // is actually being validated.
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
  const outputLogScaleForQoi = validationQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[validationQoI]) : false;
  // Display axis scale (view-only) defaults to the compute scale; the resetKey is
  // the (function, validated-QoI) identity so a view choice doesn't leak across.
  const [displayLog, setDisplayLog] = useDisplayScale(
    outputLogScaleForQoi,
    `${selectedFunction?.uid || ""}|${validationQoI || ""}`,
  );
  // V26/V27: propose linear-vs-log surrogate scale for the validated QoI from a
  // CV RMSE comparison; a manual toggle in OutputVariableDist locks it (V27).
  useAutoDetectQoiScale(validationQoI ? [validationQoI] : undefined);
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [cvMetrics, setCvMetrics] = useState<CvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [width, setWidth] = useState(1080);
  const boxRef = useRef<HTMLDivElement>(null);

  function computeStatisticsCv(y: number[], yHat: number[]) {
    // compute statistics
    const mae = y.reduce((sum: number, value: number, index: number) => sum + Math.abs(value - yHat[index]), 0) / y.length;
    const rmse = Math.sqrt(
      y.reduce((sum: number, value: number, index: number) => sum + (value - yHat[index]) ** 2, 0) / y.length,
    );
    const meanY = y.reduce((a: number, b: number) => a + b, 0) / y.length;
    const stdY = Math.sqrt(y.reduce((sum: number, value: number) => sum + (value - meanY) ** 2, 0) / (y.length - 1));
    const meanYhat = yHat.reduce((a: number, b: number) => a + b, 0) / yHat.length;
    const stdYhat = Math.sqrt(yHat.reduce((sum: number, value: number) => sum + (value - meanYhat) ** 2, 0) / (yHat.length - 1));
    const cvMetricsData = {
      meanY,
      stdY,
      meanYHat: meanYhat,
      stdYHat: stdYhat,
      mae,
      rmse,
    };
    setCvMetrics(cvMetricsData);
  }

  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && validationQoI) {
      const series = getValidationSeries(data);
      if (!series) {
        console.warn("SuMo Validation response is missing the selected QoI series.");
        setPlotData([]);
        setCvMetrics(undefined);
        throw new Error("Validation response did not include observed and predicted series.");
      }
      const { observations: y, predictions: yHat } = series;

      // For violin plots, y should be the data and x should be the label
      const createViolinPlot = (
        localData: number[],
        name: string,
        side: "positive" | "negative",
      ): Partial<Plotly.ViolinData> => ({
        x: localData,
        y: Array(localData.length).fill(""), // Use same x value to overlay
        orientation: "h",
        type: "violin",
        name,
        pointpos: side === "positive" ? 1 : -1,
        points: "all",
        side,
        box: {
          visible: true,
        },
        spanmode: "soft", // TODO show Esra both variants
      });
      const newPlotData: Partial<Plotly.ViolinData>[] = [
        createViolinPlot(y, "Observations", "positive"),
        createViolinPlot(yHat, "Predictions", "negative"),
      ];
      setPlotData(newPlotData);
      computeStatisticsCv(y, yHat);
    } else {
      console.warn("No data available for SuMo validation.");
      setPlotData([]);
      setCvMetrics(undefined);
    }
  };

  const RunSuMoValidation = async (jobs: OsparcFunctionJob[], isStale: () => boolean) => {
    console.info("Evaluating SuMo Validation for jobs: ", jobs);

    if (!jobs || jobs.length < 5) {
      setCvMetrics(undefined);
      setPlotData([]);
      setPropagating(false);
      return;
    }

    setCvMetrics(undefined);
    setPlotData([]);
    setPropagating(true);
    setErrorMessage(undefined);

    const cvBody = {
      inputVars,
      output: validationQoI,
      FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
      inputLogScales,
      outputLogScales: validationQoI ? { [validationQoI]: outputLogScaleForQoi } : {},
    };
    // V46sc: session response cache - identical (url, body) is served with zero
    // network, including after unmount/remount; failures are never cached.
    getCachedOrFetch(`/flask/dakota/sumo_cross_validation`, cvBody, () =>
      requestJson<{ error?: string } | undefined>(`/flask/dakota/sumo_cross_validation`, {
        method: "POST",
        body: cvBody,
      }),
    )
      .then(response => {
        if (isStale()) return;
        if (!response || response.error) {
          console.warn("SuMo Validation error: ", response?.error);
          throw new Error(`Error running SuMo Validation: ${response?.error}`);
        } else {
          createDataAndMetrics(response as unknown as { [key: string]: number[] });
          setPropagating(false);
          setErrorMessage(undefined);
        }
      })
      .catch(error => {
        if (isStale()) return;
        console.warn("Error:", error);
        setPropagating(false);
        setPlotData([]);
        setCvMetrics(undefined);
        setErrorMessage(getErrorMessage(error));
      });
  };

  useGuardedAsyncEffect(
    async isStale => {
      if (!validationQoI) {
        // V45gd: release loading a superseded CV request left running.
        setPropagating(false);
        return;
      }
      const jobs = filteredJobList;
      return RunSuMoValidation(jobs, isStale);
    },
    // #663 log-scale deps ride the union (validationQoI already replaces selectedQoI here)
    [validationQoI, inputVars, selectedFunction, distribution, filteredJobList, inputLogScales, outputLogScaleForQoi],
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(event => {
      // Depending on the layout, you may need to swap inlineSize with blockSize
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
      setWidth(event[0].contentBoxSize[0].inlineSize);
    });

    if (boxRef.current) {
      resizeObserver.observe(boxRef.current);
    }
  }, [boxRef]);

  // Horizontal violins carry their values on x (observations + predictions); a log
  // x-axis is only renderable if every plotted value is strictly positive.
  const canLog = plotData.every(trace => {
    const xs = (trace.x as number[] | undefined) ?? [];
    return xs.length === 0 || xs.every(v => v > 0);
  });
  const axisLog = displayLog && canLog;

  const layout: Partial<Layout> = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    xaxis: { type: axisLog ? "log" : "linear" },
    title: {
      text: `${validationQoI || "Quantity of Interest"} Sample Distribution`,
    },
    margin: plotMarginsNarrow,
    width,
    barmode: "overlay",
    legend: {
      x: 1,
      xanchor: "right",
      y: 1,
      bgcolor: "rgba(0,0,0,0)",
    },
  };

  const plotStyle = {
    height: 400,
    borderRadius: "8px",
    overflow: "hidden",
    margin: "0 auto", // Center the plot horizontally
    maxWidth: `${width}px`, // Match the width of the statistics box below
  };

  return (
    <Box
      display="flex"
      flex={1}
      flexDirection="column"
      width="100%"
      justifyContent="center"
      ref={boxRef}
      mmux-testid="sumo-validation-view"
    >
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
          errorMessage={errorMessage}
          numInputVars={inputVars.length}
        />
      )}
      {!propagating && plotData.length !== 0 && (
        <Box sx={{ position: "relative", width: "100%" }}>
          <Plot data={plotData} layout={layout} style={plotStyle} />
          <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}>
            <DisplayScaleToggle
              log={axisLog}
              onChange={setDisplayLog}
              disabled={!canLog}
              disabledReason="Values include non-positive samples; a log axis can't render them."
              testId="sumo-validation-display-scale"
            />
          </Box>
        </Box>
      )}

      {cvMetrics ? (
        <Box display="flex" flexDirection="row" flex={1} justifyContent="space-around" mt={4}>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.meanY} color="rgb(66, 165, 235)" />
            <Metric metricName="Std" metricValue={cvMetrics.stdY} color="rgb(66, 165, 235)" />
            {/* rgb(31, 119, 180) is the original; lightened to reach WCAG AA 4.5:1 on the dark surface */}
          </MetricRow>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.meanYHat} color="rgb(255, 127, 14)" />
            <Metric metricName="Std" metricValue={cvMetrics.stdYHat} color="rgb(255, 127, 14)" />
          </MetricRow>
          <MetricRow width={width}>
            <Metric metricName="MAE" metricValue={cvMetrics.mae} />
            <Metric metricName="RMSE" metricValue={cvMetrics.rmse} />
          </MetricRow>
        </Box>
      ) : (
        <div />
      )}
    </Box>
  );
}

export default SuMoValidation;
