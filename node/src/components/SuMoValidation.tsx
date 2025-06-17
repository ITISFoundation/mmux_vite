import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import Plot from "react-plotly.js";
import { Box, Typography, useTheme } from "@mui/material";
import { PlotData } from "plotly.js";
import { FunctionJob } from "../osparc-api-ts-client";
import Header from "./Header";

type cvMetricsType = {
  mean_y: number;
  std_y: number;
  mean_error: number;
  std_error: number;
  mae: number;
  rmse: number;
};

const SuMoValidation = () => {
  const theme = useTheme();
  // This component will be perform the following tasks:
  // 1. Perform a call to the backend where all samples are evaluated through crossvalidation.
  //    Each sample (job) will have associated y, y_hat, and error (and ofc all inputs)
  // 2. A histogram of y and a histogram of y-y_hat centered around mean(y) will be plotted
  // 3. On the right, certain statistics will be shown, such as:
  //    - Mean of y
  //    - Std of y
  //    - Mean of y-y_hat
  //    - Std of y-y_hat
  const { selectedFunction, inputVars, selectedQoI, filterSelectedJobList } =
    useMMUXContext();
  const [cvMetrics, setCvMetrics] = useState<cvMetricsType>();
  const [plotData, setPlotData] = useState<Partial<PlotData>[]>([]);

  console.log(
    "Performing SuMo Validation for function: ",
    selectedFunction,
    " and QoI: ",
    selectedQoI
  );

  const RunSuMoValidation = async (jobs: FunctionJob[]) => {
    console.info("Evaluating SuMo Validation for jobs: ", jobs);
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
      .then(function (data) {
        console.log("SuMo Validation retrieved data: ", data);
        createDataAndMetrics(data);
      })
      .catch((error) => console.debug("Error:", error));
  };

  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      const mean_y = y.reduce((a: number, b: number) => a + b, 0) / y.length;
      const std_y = Math.sqrt(
        y.reduce(
          (sum: number, value: number) => sum + Math.pow(value - mean_y, 2),
          0
        ) /
        (y.length - 1)
      );
      const y_hat = data[selectedQoI + "_hat"];
      const diff = y.map(
        (value: number, index: number) => value - y_hat[index]
      );
      const diff_shifted = diff.map((d: number) => d + mean_y);
      // const std_hat = data[selectedQoI + "_std_hat"];

      // Compute global min/max for binning
      const allValues = [...y, ...y_hat];
      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      const binCount = 30; // You can adjust the number of bins as needed
      const binSize = (maxVal - minVal) / binCount;
      const binSettings = {
        start: minVal,
        end: maxVal,
        size: binSize > 0 ? binSize : 1,
      };

      const newPlotData: Partial<PlotData>[] = [
        {
          x: y,
          type: "histogram",
          histnorm: "probability",
          marker: { color: "#7fc7ff" },
          name: "Observations",
          xbins: binSettings,
        },
        {
          x: diff_shifted,
          type: "histogram",
          histnorm: "probability",
          marker: { color: "#2ca02c" },
          name: "Prediction Deviations",
          xbins: binSettings,
        },
      ];
      setPlotData(newPlotData);
      console.log("Registered plotData: ", newPlotData);

      // compute statistics
      const mean_error =
        y.reduce(
          (sum: number, value: number, index: number) =>
            sum + (value - y_hat[index]),
          0
        ) / y.length;
      const std_error = Math.sqrt(
        y.reduce(
          (sum: number, value: number, index: number) =>
            sum + Math.pow(value - y_hat[index] - mean_error, 2),
          0
        ) /
        (y.length - 1)
      );
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
      const cvMetricsData = {
        mean_y: mean_y,
        std_y: std_y,
        mean_error: mean_error,
        std_error: std_error,
        mae: mae,
        rmse: rmse,
      };
      setCvMetrics(cvMetricsData);
      console.log("Registered cvMetrics: ", cvMetricsData);
    } else {
      console.warn("No data available for SuMo validation.");
      setPlotData([]);
      setCvMetrics({} as cvMetricsType);
    }
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMoValidation(jobs);
    };
    run();
  }, []);

  const skewnessValue =
    cvMetrics &&
    (() => {
      const n = cvMetrics.std_y && cvMetrics.std_y !== 0 ? cvMetrics.std_y : 1;
      const y = (plotData[0]?.y as Array<number>) || [];
      const mean = cvMetrics.mean_y || 0;
      const skew =
        y.length > 2
          ? y.reduce(
            (acc: number, val: number) => acc + Math.pow((val - mean) / n, 3),
            0
          ) *
          (y.length / ((y.length - 1) * (y.length - 2)))
          : 0;
      return skew.toFixed(4);
    })();

  const KurtosisValue =
    cvMetrics &&
    (() => {
      const n = cvMetrics.std_y && cvMetrics.std_y !== 0 ? cvMetrics.std_y : 1;
      const y = (plotData[0]?.y as Array<number>) || [];
      const mean = cvMetrics.mean_y || 0;
      const kurt =
        y.length > 3
          ? (y.reduce(
            (acc: number, val: number) => acc + Math.pow((val - mean) / n, 4),
            0
          ) *
            (y.length * (y.length + 1))) /
          ((y.length - 1) * (y.length - 2) * (y.length - 3)) -
          (3 * Math.pow(y.length - 1, 2)) / ((y.length - 2) * (y.length - 3))
          : 0;
      return kurt.toFixed(4);
    })();

  const layout = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };

  const plotStyle = {
    height: 300,
    borderRadius: "8px",
    overflow: "hidden",
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} width={"100%"}>
      <Plot
        data={plotData}
        layout={{
          ...layout,
          title: {
            text:
              selectedFunction?.title + " " + selectedQoI + " SuMo Validation",
          },
          scene: {
            xaxis: {
              title: {
                text: selectedQoI ? selectedQoI : "Quantity of Interest",
              },
            },
            yaxis: { title: { text: "Count" } },
          },
          barmode: "overlay",
          legend: {
            x: 1,
            xanchor: "right",
            y: 1,
          },
          margin: {
            l: 75,
            r: 65,
            b: 65,
            t: 90,
          },
        }}
        style={plotStyle}
        config={{ responsive: true }}
      />
      <Box flex={1} maxHeight={200} borderRadius={"8px"} overflow="hidden">
        <Plot
          data={[
            {
              x: plotData[0]?.x,
              type: "box",
              name: "",
              marker: { color: "#7fc7ff" },
              boxpoints: "suspectedoutliers",
              hoverinfo: "skip",
            },
            {
              x: plotData[1]?.x,
              type: "box",
              name: "",
              marker: { color: "#2ca02c" },
              boxpoints: "suspectedoutliers",
              hoverinfo: "skip",
            },
          ]}
          layout={{
            ...layout,
            showlegend: false,
            margin: {
              l: 30,
              r: 30,
              b: 60,
              t: 30,
              pad: 4,
            },
          }}
          style={{ ...plotStyle, height: 200 }}
          config={{ responsive: true }}
        />
      </Box>
      <Box display="flex" flexDirection="row" width="680px" ml={2} mr={2} >
        <Box mt={1} display={"flex"} flexDirection={"column"} width={"100%"}>
          {/* <Header headerType="uq" infoText="" tabTitle="Data Statistics" /> */}
          <Box display={"flex"} flexDirection={"row"} width={"100%"}>
            <Box mt={2} display={"flex"} flexDirection={"row"} width={"100%"}>
              {cvMetrics ? (
                <ul style={{
                  listStyle: "none", padding: 0, margin: "0px", display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" // Ensure the ul takes full width
                }}>
                  <Typography
                    variant="body1"
                    fontFamily={"inherit"}
                    fontWeight={100}
                  >
                    Mean(y): <strong>{cvMetrics.mean_y?.toFixed(4)}</strong>
                  </Typography>
                  <Typography
                    variant="body1"
                    fontFamily={"inherit"}
                    fontWeight={100}
                  >
                    Std(y): <strong>{cvMetrics.std_y?.toFixed(4)}</strong>
                  </Typography>
                  <Typography
                    variant="body1"
                    fontFamily={"inherit"}
                    fontWeight={100}
                  >
                    Skewness(y): <strong>{skewnessValue}</strong>
                  </Typography>
                  <Typography
                    variant="body1"
                    fontFamily={"inherit"}
                    fontWeight={100}
                  >
                    Kurtosis(y): <strong>{KurtosisValue}</strong>
                  </Typography>
                </ul>
              ) : (
                <div>No data statistics available.</div>
              )}
            </Box>
            {/* <Box mt={2} ml={4}>
              {cvMetrics ? (
                <>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    <Typography
                      variant="body1"
                      fontFamily={"inherit"}
                      fontWeight={100}
                    >
                      Mean Error (y - ŷ):{" "}
                      <strong>{cvMetrics.mean_error?.toFixed(4)}</strong>
                    </Typography>
                    <Typography
                      variant="body1"
                      fontFamily={"inherit"}
                      fontWeight={100}
                    >
                      Std Error (y - ŷ):{" "}
                      <strong>{cvMetrics.std_error?.toFixed(4)}</strong>
                    </Typography>
                    <Typography
                      variant="body1"
                      fontFamily={"inherit"}
                      fontWeight={100}
                    >
                      MAE: <strong>{cvMetrics.mae?.toFixed(4)}</strong>
                    </Typography>
                    <Typography
                      variant="body1"
                      fontFamily={"inherit"}
                      fontWeight={100}
                    >
                      RMSE: <strong>{cvMetrics.rmse?.toFixed(4)}</strong>
                    </Typography>
                  </ul>
                </>
              ) : undefined}
            </Box> */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SuMoValidation;
