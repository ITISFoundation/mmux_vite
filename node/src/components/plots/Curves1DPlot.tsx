import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import { FunctionJob as OsparcFunctionJob } from "../../osparc-api-ts-client";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { useMMUXContext } from "../../context/MMUXContext";
import Header from "../navigation/Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";

type GPPrediction = {
  x: number[];
  y_hat: number[];
  std_hat: number[];
};

function Curves1DPlots() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const context = useJobContext();
  const { filteredJobList, fetchedJobCollections } = context;
  const filteredInputVars = filterInputVars({
    ...context,
    selectedFunction,
    inputVars,
    distribution,
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
    }, {}),
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
      const yHat = data[varName]?.y_hat || [];
      const stdHat = data[varName]?.std_hat || [];
      const traces: Data[] = [
        {
          x,
          y: yHat,
          name: "Model prediction",
          xaxis: `x${inputVars.indexOf(varName) + 1}`,
          yaxis: "y",
          mode: "lines",
          line: { color: plotColor },
        },
      ];
      if (stdHat.length === yHat.length) {
        traces.push(
          {
            x,
            y: yHat.map((y, i) => y + 2 * stdHat[i]),
            name: `${varName}+2σ`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            line: { color: "rgba(0,0,0,0)" },
            fillcolor: fillColor,
            showlegend: false,
          },
          {
            x,
            y: yHat.map((y, i) => y - 2 * stdHat[i]),
            name: `${varName}+/-2σ (95% Confidence Interval)`,
            xaxis: `x${inputVars.indexOf(varName) + 1}`,
            yaxis: "y",
            mode: "lines",
            fill: "tonexty",
            line: { color: "rgba(0,0,0,0)" },
            fillcolor: fillColor,
            showlegend: true,
          },
        );
      }
      setPlotData(traces);
    }
  };

  const RunCentralSuMoInterpolations = async (jobs: OsparcFunctionJob[]) => {
    setPropagating(true);
    // NB do NOT set plotData to [] to allow "interactive" slider movement wo the "Calculating" word flashing
    fetch(`${PYTHON_DAKOTA_BACKEND}/flask/sumo_along_axes`, {
      method: "POST",
      body: JSON.stringify({
        inputs: inputVars,
        distribution,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs,
        log: false,
      }),
    })
      .then(response => response.json())
      .then(data => {
        createPlotData(data);
        setPropagating(false);
      })
      .catch(_error => {
        setPlotData([]);
        setPropagating(false);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      if (jobs.length !== 0) {
        return RunCentralSuMoInterpolations(jobs);
      }
      // Not enough jobs to build model - then returns empty list
      return setPlotData([]);
    };
    run();
    // console.debug("axis: ", axis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputVars, selectedQoI, selectedFunction, axis, otherAxis, filteredJobList]);

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
      <Box display="flex" flexDirection="column">
        {!propagating && plotData.length === 0 && (
          <InsufficientDataWarning
            fetchedJobCollections={fetchedJobCollections}
            filteredJobList={filteredJobList}
            height={plotStyle.height}
          />
        )}
        {plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
      </Box>
      <Box>
        <Header headerType="subTitle" infoText="" tabTitle="Selection" />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        overflow="visible"
        gap={2}
        p={4}
        sx={{
          backgroundColor: theme.palette.background.default,
          borderRadius: theme.spacing(2),
        }}
      >
        <CreateSelect axis={axis} setAxis={setAxis} />
        {inputVars.length > 0 && distribution[selectedFunction?.uid || ""] !== undefined ? (
          <>
            {inputVars.map(key => {
              if (key === axis) {
                return null; // Skip the first variable as it is already selected
              }
              const dist = distribution[selectedFunction?.uid || ""];
              return <CreateSlider input={key} dist={dist[key]} otherAxis={otherAxis} setOtherAxis={setOtherAxis} key={key} />;
            })}
          </>
        ) : undefined}
      </Box>
    </>
  );
}

export default Curves1DPlots;
