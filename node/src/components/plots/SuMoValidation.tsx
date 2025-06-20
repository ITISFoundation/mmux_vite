import { useState, useEffect, useRef } from "react";
import { useMMUXContext } from "../../context/MMUXContext";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import Plot from "react-plotly.js";
import { Box, useTheme } from "@mui/material";
import { FunctionJob } from "../../osparc-api-ts-client";
import Metric from "./../Metric";
import SuMoMetricRow from "./../SuMoMetricRow";
import CalculatingWarning from "../CalculatingWarning";
import InsufficientDataWarning from "../InsufficientDataWarning";

const SuMoValidation = () => {
  const plotHeight = 400;
  const theme = useTheme();
  const {
    selectedFunction,
    inputVars,
    distribution,
    selectedQoI,
    filterSelectedJobList,
    fetchedJobCollections
  } = useMMUXContext();
  const [cvMetrics, setCvMetrics] = useState<cvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);
  const [propagating, setPropagating] = useState(false);
  const [width, setWidth] = useState(1080);
  const boxRef = useRef<HTMLDivElement>(null);

  function computeStatisticsCv(y: number[], y_hat: number[]) {
    // compute statistics
    const mae =
      y.reduce(
        (sum: number, value: number, index: number) =>
          sum + Math.abs(value - y_hat[index]),
        0
      ) / y.length;
    const rmse = Math.sqrt(
      y.reduce(
        (sum: number, value: number, index: number) =>
          sum + Math.pow(value - y_hat[index], 2),
        0
      ) / y.length
    );
    const mean_y = y.reduce((a: number, b: number) => a + b, 0) / y.length;
    const std_y = Math.sqrt(
      y.reduce(
        (sum: number, value: number) => sum + Math.pow(value - mean_y, 2),
        0
      ) /
      (y.length - 1)
    );
    const mean_y_hat =
      y_hat.reduce((a: number, b: number) => a + b, 0) / y_hat.length;
    const std_y_hat = Math.sqrt(
      y_hat.reduce(
        (sum: number, value: number) => sum + Math.pow(value - mean_y_hat, 2),
        0
      ) /
      (y_hat.length - 1)
    );
    const cvMetricsData = {
      mean_y: mean_y,
      std_y: std_y,
      mean_y_hat: mean_y_hat,
      std_y_hat: std_y_hat,
      mae: mae,
      rmse: rmse,
    };
    setCvMetrics(cvMetricsData);
    console.log("Registered cvMetrics: ", cvMetricsData);
  }

  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      const y_hat = data[selectedQoI + "_hat"];

      // For violin plots, y should be the data and x should be the label
      const createViolinPlot = (
        data: number[],
        name: string,
        side: "positive" | "negative"
      ): Partial<Plotly.ViolinData> => {
        return {
          x: data,
          y: Array(data.length).fill(""), // Use same x value to overlay
          orientation: "h",
          type: "violin",
          name: name,
          pointpos: side === "positive" ? 1 : -1,
          points: "all",
          side: side,
          box: {
            visible: true,
          },
          spanmode: "soft", // TODO show Esra both variants
        };
      };
      const newPlotData: Partial<Plotly.ViolinData>[] = [
        createViolinPlot(y, "Observations", "positive"),
        createViolinPlot(y_hat, "Predictions", "negative"),
      ];
      setPlotData(newPlotData);
      console.log("Registered plotData: ", newPlotData);
      computeStatisticsCv(y, y_hat);
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

    fetch(PYTHON_DAKOTA_BACKEND + "/flask/sumo_cross_validation", {
      method: "POST",
      body: JSON.stringify({
        inputVars: inputVars,
        output: selectedQoI,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        log: false,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (response) {
        if (!response || (response && response.error)) {
          console.warn("SuMo Validation error: ", response.error);
          throw new Error(`Error running SuMo Validation: ${response.error}`);
        } else {
          const data = response;
          console.log("SuMo Validation retrieved data: ", data);
          createDataAndMetrics(data);
          setPropagating(false);
        }
      })
      .catch((error) => {
        console.debug("Error:", error);
        setPropagating(false);
        setPlotData([]);
        setCvMetrics(undefined);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMoValidation(jobs);
    };
    run();
  }, [
    selectedQoI,
    inputVars,
    selectedFunction,
    distribution,
    filterSelectedJobList,
  ]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((event) => {
      console.log("ResizeObserver event: ", event);
      // Depending on the layout, you may need to swap inlineSize with blockSize
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
      setWidth(event[0].contentBoxSize[0].inlineSize);
    });

    if (boxRef.current) {
      resizeObserver.observe(boxRef.current);
    }
  }, [boxRef]);

  const layout = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };

  const plotStyle = {
    height: plotHeight,
    borderRadius: "8px",
    overflow: "hidden",
    margin: "0 auto", // Center the plot horizontally
    maxWidth: `${width}px`, // Match the width of the statistics box below
  };


  if (propagating) {
    return <CalculatingWarning height={plotHeight} />
  }

  if (plotData.length === 0) {
    return <InsufficientDataWarning
      fetchedJobCollections={fetchedJobCollections}
      filterSelectedJobList={filterSelectedJobList}
      height={plotHeight}
    />
  }

  return (
    <>
      {plotData && selectedQoI && (
        <Box
          display="flex"
          flex={1}
          flexDirection="column"
          width={"100%"}
          justifyContent={"center"}
          ref={boxRef}
        >
          <Plot
            data={plotData}
            layout={{
              ...layout,
              title: {
                text:
                  (selectedQoI ? selectedQoI : "Quantity of Interest") +
                  " Sample Distribution",
              },
              margin: { t: 40, l: 30, r: 30, b: 40 },
              height: plotHeight,
              width: width,
              barmode: "overlay",
              legend: {
                x: 1,
                xanchor: "right",
                y: 1,
                bgcolor: "rgba(0,0,0,0)",
              },
            }}
            style={plotStyle}
            config={{ responsive: true }}
          />
          {cvMetrics ? (
            <Box
              display="flex"
              flexDirection="row"
              flex={1}
              justifyContent="space-around"
              mt={4}
            >
              <SuMoMetricRow width={width}>
                <Metric
                  metricName={"Mean"}
                  metricValue={cvMetrics.mean_y}
                  color={"rgb(41, 146, 221)"}
                />
                <Metric
                  metricName={"Std"}
                  metricValue={cvMetrics.std_y}
                  color={"rgb(41, 146, 221)"}
                />
                {/* rgb(31, 119, 180) is the original; changed it slightly to improve visibility */}
              </SuMoMetricRow>
              <SuMoMetricRow width={width}>
                <Metric
                  metricName={"Mean"}
                  metricValue={cvMetrics.mean_y_hat}
                  color={"rgb(255, 127, 14)"}
                />
                <Metric
                  metricName={"Std"}
                  metricValue={cvMetrics.std_y_hat}
                  color={"rgb(255, 127, 14)"}
                />
              </SuMoMetricRow>
              <SuMoMetricRow width={width}>
                <Metric metricName={"MAE"} metricValue={cvMetrics.mae} />
                <Metric metricName={"RMSE"} metricValue={cvMetrics.rmse} />
              </SuMoMetricRow>
            </Box>
          ) : (
            <div></div>
          )}
        </Box>
      )}
    </>
  );
};

export default SuMoValidation;
