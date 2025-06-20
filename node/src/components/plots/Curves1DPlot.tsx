import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { useMMUXContext } from "../../context/MMUXContext";
import { Data } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import Header from "../navigation/Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";
import ShowPlotOrWarning from "./ShowPlotOrWarning";

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
    fetchedJobCollections
  } = useMMUXContext();
  const context = useMMUXContext();
  const filteredInputVars = filterInputVars(context);
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
          name: varName,
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
            fill: "tonexty",
            showlegend: false,
          },
          {
            x: x,
            y: y_hat.map((y, i) => y - 2 * std_hat[i]),
            name: `${varName}-2σ`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            fill: "tonexty",
            line: { color: "rgba(0,0,0,0)" },
            fillcolor: fillColor,
            showlegend: false,
          }
        );
      }
      setPlotData(traces);
      console.log("Registered plotData: ", traces);
    }
  };

  const RunCentralSuMoInterpolations = async (jobs: FunctionJob[]) => {
    console.log("Evaluating SuMo for 1D curves...");
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
        console.log("Error in RunCentralSuMoInterpolations: ", error);
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
  }

  const layout = {
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    xaxis: {
      title: { text: axis },
    },
    yaxis: {
      title: { text: selectedQoI },
      anchor: "x",
    },
    showlegend: false,
  }

  return (
    <>
      <Box display={"flex"} flexDirection={"column"}>
        <ShowPlotOrWarning plotData={plotData} plotStyle={plotStyle} layout={layout} calculating={propagating} />
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
