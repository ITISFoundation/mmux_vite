import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import { useMMUXContext } from "../context/MMUXContext";
import { Data } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import Header from "./Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";

type GPPrediction = {
  x: number[];
  y_hat: number[];
  std_hat: number[];
};

const Curves1DPlots = () => {
  const theme = useTheme();
  const {
    inputVars,
    selectedQoI,
    selectedFunction,
    distribution,
    filterSelectedJobList,
  } = useMMUXContext();
  const filteredInputVars = filterInputVars()
  const [plotData, setPlotData] = useState<Array<Data>>([]);
  const [axis, setAxis] = useState(filteredInputVars[0]);
  const [otherAxis, setOtherAxis] = useState<{ [key: string]: number }>(
    inputVars.reduce((acc: { [key: string]: number }, key) => {
      acc[key] =
        distribution[selectedFunction?.uid || ""][key].value ||
        distribution[selectedFunction?.uid || ""][key].mean ||
        distribution[selectedFunction?.uid || ""][key].min ||
        0;
      return acc;
    }, {})
  );
  console.log("QoI to 1D curves: ", selectedQoI);

  const RunCentralSuMoInterpolations = async (jobs: FunctionJob[]) => {
    console.log("Evaluating SuMo for 1D curves...");
    fetch(PYTHON_DAKOTA_BACKEND + "/flask/sumo_along_axes", {
      method: "POST",
      body: JSON.stringify({
        inputs: inputVars,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs,
        log: false,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        createPlotData(data);
      })
      .catch((error) => console.debug("Error:", error));
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunCentralSuMoInterpolations(jobs);
    };
    run();
  }, [inputVars, selectedQoI, selectedFunction, axis, otherAxis]);

  const createPlotData = (data: Record<string, GPPrediction>) => {
    if (!data || Object.keys(data).length === 0) {
      console.warn("No data available for plotting.");
      setPlotData([]);
    } else {
      const varName = axis;
      const x = data[varName]?.x || [];
      const y_hat = data[varName]?.y_hat || [];
      const std_hat = data[varName]?.std_hat || [];
      const traces: Data[] = [
        {
          x,
          y: y_hat,
          name: varName,
          xaxis: `x${inputVars.indexOf(varName) + 1}`,
          yaxis: "y",
          mode: "lines",
          line: { color: "#7fc7ff" },
        },
      ];
      if (std_hat.length === y_hat.length) {
        traces.push(
          {
            x,
            y: y_hat.map((y, i) => y + 2 * std_hat[i]),
            name: `${varName} +2σ`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            line: { color: "#7fc7ff", dash: "dot" },
            fill: "tonexty",
            showlegend: false,
          },
          {
            x,
            y: y_hat.map((y, i) => y - 2 * std_hat[i]),
            name: `${varName} -2σ`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            fill: "tonexty",
            line: { color: "#7fc7ff", dash: "dot" },
            showlegend: false,
          }
        );
      }
      setPlotData(traces);
      console.log("Registered plotData: ", traces);
    }
  };

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <CreateSelect
        axis={axis}
        setAxis={setAxis}
        inputVars={inputVars}
      />
      <Box overflow={"hidden"} borderRadius={1} width="100%" mb={2}>
        <Plot
          data={plotData}
          layout={{
            plot_bgcolor: `${theme.palette.background.default}`,
            paper_bgcolor: `${theme.palette.background.default}`,
            font: { color: `${theme.palette.text.primary}` },
            xaxis: {
              title: { text: axis }
            },
            yaxis: {
              title: { text: selectedQoI },
              // showgrid: true,
              anchor: "x",
            },
            showlegend: false,
          }}
          style={{
            height: 300,
            borderRadius: "8px",
            overflow: "hidden",
          }
          }
          config={{ responsive: true }}
        />
      </Box>
      <Box>
        <Header headerType="uq" infoText="" tabTitle="Selection" />
      </Box>
      <Box display={"flex"} flexDirection={"column"} gap={2} pt={2}>
        {inputVars.length > 0 &&
          distribution[selectedFunction?.uid || ""] !== undefined ? (
          <>
            {inputVars.map((key) => {
              if (key === axis) {
                return null; // Skip the first variable as it is already selected
              }
              const dist = distribution[selectedFunction?.uid || ""];
              return (
                <CreateSlider
                  input={key}
                  dist={dist[key]}
                  otherAxis={otherAxis}
                  setOtherAxis={setOtherAxis}
                  key={key}
                />
              );
            })}
          </>
        ) : undefined}
      </Box>
    </Box>
  );
};

export default Curves1DPlots;
