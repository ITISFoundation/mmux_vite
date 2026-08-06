import { useState, useEffect, useRef } from "react";
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
import { useAutoDetectQoiScale } from "../../utils/useAutoDetectQoiScale";

function SuMoValidation() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();

  useAutoDetectQoiScale(selectedQoI ? [selectedQoI] : undefined);
  const [cvMetrics, setCvMetrics] = useState<CvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);
  const [propagating, setPropagating] = useState(false);
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
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      // The backend builds the prediction key as `<output>_hat`, but the global
      // after_request serializer camelCases every response key, so the client
      // receives `<selectedQoI>Hat` (e.g. `yHat`). Read the camelCase key.
      const yHat = data[`${selectedQoI}Hat`];

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

  const RunSuMoValidation = async (jobs: OsparcFunctionJob[]) => {
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

    const outputLogScaleForQoi = selectedQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[selectedQoI]) : false;

    fetch(`/flask/dakota/sumo_cross_validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputVars,
        output: selectedQoI,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        outputLogScales: selectedQoI ? { [selectedQoI]: outputLogScaleForQoi } : {},
      }),
    })
      .then(response => response.json())
      .then(response => {
        if (!response || (response && response.error)) {
          console.warn("SuMo Validation error: ", response.error);
          throw new Error(`Error running SuMo Validation: ${response.error}`);
        } else {
          const data = response;
          createDataAndMetrics(data);
          setPropagating(false);
        }
      })
      .catch(error => {
        console.warn("Error:", error);
        setPropagating(false);
        setPlotData([]);
        setCvMetrics(undefined);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      return RunSuMoValidation(jobs);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQoI, inputVars, selectedFunction, distribution, filteredJobList, outputLogScales]);

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

  const layout: Partial<Layout> = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    title: {
      text: `${selectedQoI || "Quantity of Interest"} Sample Distribution`,
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
          numInputVars={inputVars.length}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}

      {cvMetrics ? (
        <Box display="flex" flexDirection="row" flex={1} justifyContent="space-around" mt={4}>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.meanY} color="rgb(41, 146, 221)" />
            <Metric metricName="Std" metricValue={cvMetrics.stdY} color="rgb(41, 146, 221)" />
            {/* rgb(31, 119, 180) is the original; changed it slightly to improve visibility */}
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
