import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { useMMUXContext } from "../../context/MMUXContext";
import { Data, Layout } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import Header from "../navigation/Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";

type GPPrediction = {
  x: number[];
  y_hat: number[];
  std_hat: number[];
};

const Curves1DPlots = () => {
  const theme = useTheme();
  const { selectedFunction, inputVars } = useFunctionContext();
  const {
    selectedQoI,
    distribution,
    filterSelectedJobList,
    fetchedJobCollections,
  } = useMMUXContext();
  const context = useMMUXContext();
  const filteredInputVars = filterInputVars({
    ...context,
    selectedFunction,
    inputVars,
  });
  const [plotData, setPlotData] = useState<Array<Data>>([]);
  const [axis, setAxis] = useState(filteredInputVars[0]);
  const [propagating, setPropagating] = useState(false);
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
  const plotColor = "rgb(127, 199, 255)";
  const fillColor = "rgba(127, 199, 255, 0.3)";

  const createPlotData = (data: Record<string, GPPrediction>) => {
    if (!data || Object.keys(data).length === 0) {
      // warn if no data available
      console.warn("No data available for plotting.");
      setPlotData([]);
    } else {
      const varName = axis;
      const x = data[varName]?.x || [];
      const y_hat = data[varName]?.y_hat || [];
      const std_hat = data[varName]?.std_hat || [];
      const traces: Data[] = [
        {
          x: x,
          y: y_hat,
          name: "Model prediction",
          xaxis: `x${inputVars.indexOf(varName) + 1}`,
          yaxis: "y",
          mode: "lines",
          line: { color: plotColor },
        },
      ];
      if (std_hat.length === y_hat.length) {
        traces.push(
          {
            x: x,
            y: y_hat.map((y, i) => y + 2 * std_hat[i]),
            name: `${varName}+2σ`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            line: { color: "rgba(0,0,0,0)" },
            fillcolor: fillColor,
            showlegend: false,
          },
          {
            x: x,
            y: y_hat.map((y, i) => y - 2 * std_hat[i]),
            name: `${varName}+/-2σ (95% Confidence Interval)`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            fill: "tonexty",
            line: { color: "rgba(0,0,0,0)" },
            fillcolor: fillColor,
            showlegend: true,
          }
        );
      }
      setPlotData(traces);
    }
  };

  const RunCentralSuMoInterpolations = async (jobs: FunctionJob[]) => {
    setPropagating(true);
    // NB do NOT set plotData to [] to allow "interactive" slider movement wo the "Calculating" word flashing
    fetch(PYTHON_DAKOTA_BACKEND + "/flask/sumo_along_axes", {
      method: "POST",
      body: JSON.stringify({
        inputs: inputVars,
        distribution: distribution,
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
        setPropagating(false);
      })
      .catch((error) => {
        setPlotData([]);
        setPropagating(false);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      if (jobs.length !== 0) {
        return await RunCentralSuMoInterpolations(jobs);
      } else {
        // Not enough jobs to build model - then returns empty list
        setPlotData([]);
      }
    };
    run();
    console.log("axis: ", axis);
  }, [
    inputVars,
    selectedQoI,
    selectedFunction,
    axis,
    otherAxis,
    filterSelectedJobList,
  ]);

  const plotStyle = {
    height: 300,
    borderRadius: "8px",
    overflow: "hidden",
  };

  const layout: Partial<Layout> = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    legend: {
      yanchor: "top",
      xanchor: "right",
      x: 1,
      y: 1.4,
      bgcolor: "rgba(0,0,0,0)",
    },
    xaxis: {
      title: { text: axis }, // FIXME axis is only showing for the first parameter in the list
    },
    yaxis: {
      title: { text: selectedQoI },
      anchor: "x",
    },
    showlegend: true,
  };

  return (
    <>
      <Box display={"flex"} flexDirection={"column"}>
        {!propagating && plotData.length === 0 && (
          <InsufficientDataWarning
            fetchedJobCollections={fetchedJobCollections}
            filterSelectedJobList={filterSelectedJobList}
            height={plotStyle.height}
          />
        )}
        {plotData.length !== 0 && (
          <Plot data={plotData} layout={layout} style={plotStyle} />
        )}
      </Box>
      <Box>
        <Header headerType="subTitle" infoText="" tabTitle="Selection" />
      </Box>
      <Box
        display={"flex"}
        flexDirection={"column"}
        overflow={"visible"}
        gap={2}
        p={4}
        sx={(theme) => ({
          backgroundColor: theme.palette.background.default,
          borderRadius: theme.spacing(2),
        })}
      >
        <CreateSelect axis={axis} setAxis={setAxis} inputVars={inputVars} />
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
    </>
  );
};

export default Curves1DPlots;
