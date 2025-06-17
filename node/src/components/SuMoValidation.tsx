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
  const [plotData, setPlotData] = useState<Partial<Plotly.ViolinData>[]>([]);

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
  function computeStatisticsCv(y: number[], y_hat: number[]) {
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
    const mean_y = y.reduce((a: number, b: number) => a + b, 0) / y.length;
    const std_y = Math.sqrt(
      y.reduce(
        (sum: number, value: number) => sum + Math.pow(value - mean_y, 2),
        0
      ) /
      (y.length - 1)
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
  }

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMoValidation(jobs);
    };
    run();
  }, []);


  const createDataAndMetrics = (data: { [key: string]: number[] }) => {
    if (data && selectedQoI) {
      const y = data[selectedQoI];
      const y_hat = data[selectedQoI + "_hat"];

      // For violin plots, y should be the data and x should be the label
      const createViolinPlot = (data: number[], name: string, side: "positive" | "negative"): Partial<Plotly.ViolinData> => {
        return {
          x: data,
          y: Array(data.length).fill(""), // Use same x value to overlay
          orientation: "h",
          type: "violin",
          name: name,
          pointpos: (side === "positive" ? 1. : -1.),
          points: "all",
          side: side,
          box: {
            visible: true
          },
          spanmode: "hard", // TODO show Esra both variants
        };
      }


      const newPlotData: Partial<Plotly.ViolinData>[] = [
        createViolinPlot(y, "Observations", "positive"),
        createViolinPlot(y_hat, "Predictions", "negative"),
      ];
      setPlotData(newPlotData);
      console.log("Registered plotData: ", newPlotData);
      computeStatisticsCv(y, y_hat)
    } else {
      console.warn("No data available for SuMo validation.");
      setPlotData([]);
      setCvMetrics({} as cvMetricsType);
    }
  };

  const layout = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
  };

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

  const plotStyle = {
    height: 300,
    borderRadius: "8px",
    overflow: "hidden",
    margin: "0 auto", // Center the plot horizontally
    maxWidth: "680px", // Match the width of the statistics box below
  };

  return (
    <>
      {plotData && selectedQoI && (
        <Box display="flex" flexDirection="column" gap={1} width={"100%"} justifyContent={"center"}>
          <Plot
            data={plotData}
            layout={{
              ...layout,
              title: { text: (selectedQoI ? selectedQoI : "Quantity of Interest") + " Sample Distribution" },
              margin: { t: 40, l: 30, r: 30, b: 40 },
              height: 300,
              width: 650,
              barmode: "overlay",
              legend: {
                x: 1,
                xanchor: "right",
                y: 1,
                bgcolor: 'rgba(0,0,0,0)'
              },
            }}
            style={plotStyle}
            config={{ responsive: true }}
          />
          <Box display="flex" flexDirection="row" width="680px" ml={3} mr={3} >
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
      )}
    </>
  );
};

export default SuMoValidation;
