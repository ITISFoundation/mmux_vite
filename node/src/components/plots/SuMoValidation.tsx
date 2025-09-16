import { useState, useEffect, useRef } from "react";
import { Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { Layout } from "plotly.js";
import { FunctionJob } from "osparc-api-ts-client";
import { useMMUXContext } from "../../context/MMUXContext";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import Metric from "./Metric";
import MetricRow from "./MetricRow";
import { plotMargins } from "./PlotTools";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";

function SuMoValidation() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const { fetchedJobCollections, filteredJobList } = useJobContext();
  const [cvMetrics, setCvMetrics] = useState<CvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [width, setWidth] = useState(1080);
  const boxRef = useRef<HTMLDivElement>(null);

  function computeStatisticsCv(y: number[], y_hat: number[]) {
    // compute statistics
    const mae = y.reduce((sum: number, value: number, index: number) => sum + Math.abs(value - y_hat[index]), 0) / y.length;
    const rmse = Math.sqrt(
      y.reduce((sum: number, value: number, index: number) => sum + (value - y_hat[index]) ** 2, 0) / y.length,
    );
    const meanY = y.reduce((a: number, b: number) => a + b, 0) / y.length;
    const stdY = Math.sqrt(y.reduce((sum: number, value: number) => sum + (value - meanY) ** 2, 0) / (y.length - 1));
    const meanYhat = y_hat.reduce((a: number, b: number) => a + b, 0) / y_hat.length;
    const stdYhat = Math.sqrt(
      y_hat.reduce((sum: number, value: number) => sum + (value - meanYhat) ** 2, 0) / (y_hat.length - 1),
    );
    const cvMetricsData = {
      mean_y: meanY,
      std_y: stdY,
      mean_y_hat: meanYhat,
      std_y_hat: stdYhat,
      mae,
      rmse,
    };
    setCvMetrics(cvMetricsData);
  }

  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      const yHat = data[`${selectedQoI}_hat`];

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

  const RunSuMoValidation = async (jobs: FunctionJob[]) => {
    console.info("Evaluating SuMo Validation for jobs: ", jobs);

    setCvMetrics(undefined);
    setPlotData([]);
    setPropagating(true);

    fetch(`${PYTHON_DAKOTA_BACKEND}/flask/sumo_cross_validation`, {
      method: "POST",
      body: JSON.stringify({
        inputVars,
        output: selectedQoI,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        log: false,
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
  }, [selectedQoI, inputVars, selectedFunction, distribution, filteredJobList]);

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
    margin: plotMargins,
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
    <Box display="flex" flex={1} flexDirection="column" width="100%" justifyContent="center" ref={boxRef}>
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}

      {cvMetrics ? (
        <Box display="flex" flexDirection="row" flex={1} justifyContent="space-around" mt={4}>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.mean_y} color="rgb(41, 146, 221)" />
            <Metric metricName="Std" metricValue={cvMetrics.std_y} color="rgb(41, 146, 221)" />
            {/* rgb(31, 119, 180) is the original; changed it slightly to improve visibility */}
          </MetricRow>
          <MetricRow width={width}>
            <Metric metricName="Mean" metricValue={cvMetrics.mean_y_hat} color="rgb(255, 127, 14)" />
            <Metric metricName="Std" metricValue={cvMetrics.std_y_hat} color="rgb(255, 127, 14)" />
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
