import { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import { FunctionJob as OsparcFunctionJob } from "../../osparc-api-ts-client";
import { useMMUXContext } from "../../context/MMUXContext";
import Header from "../navigation/Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { getAlongAxesPredictions, type SumoAxisPrediction } from "../../utils/sumoResponse";

function Curves1DPlots() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const context = useJobContext();
  const { filteredJobList, fetchedJobCollections } = context;
  const selectedFunctionUid = selectedFunction?.uid;
  const selectedDistribution = selectedFunctionUid ? distribution[selectedFunctionUid] : undefined;
  const selectedOutputLogScales = selectedFunctionUid ? outputLogScales[selectedFunctionUid] || {} : {};
  const filteredInputVars = filterInputVars({
    ...context,
    selectedFunction,
    inputVars,
    distribution,
  });
  const [plotData, setPlotData] = useState<Array<Data>>([]);
  const [axis, setAxis] = useState(filteredInputVars[0] || "");
  const [propagating, setPropagating] = useState(false);
  const [otherAxis, setOtherAxis] = useState<{ [key: string]: number }>({});
  const lastRequestKeyRef = useRef("");
  const plotColor = "rgb(127, 199, 255)";
  const fillColor = "rgba(127, 199, 255, 0.3)";

  useEffect(() => {
    if (!selectedDistribution) {
      setOtherAxis({});
      return;
    }

    const nextOtherAxis = inputVars.reduce((acc: { [key: string]: number }, key) => {
      acc[key] = selectedDistribution[key]?.value || selectedDistribution[key]?.mean || selectedDistribution[key]?.min || 0;
      return acc;
    }, {});

    setOtherAxis(current => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextOtherAxis);
      const sameValues = currentKeys.length === nextKeys.length && nextKeys.every(key => current[key] === nextOtherAxis[key]);
      return sameValues ? current : nextOtherAxis;
    });
  }, [inputVars, selectedDistribution]);

  useEffect(() => {
    if (!filteredInputVars.includes(axis)) {
      setAxis(filteredInputVars[0] || "");
    }
  }, [axis, filteredInputVars]);

  const createPlotData = (data: Record<string, SumoAxisPrediction>) => {
    if (!data || Object.keys(data).length === 0) {
      // warn if no data available
      console.warn("No data available for plotting.");
      setPlotData([]);
    } else {
      const varName = axis;
      const x = data[varName]?.x || [];
      const yHat = data[varName]?.yHat || [];
      const stdHat = data[varName]?.stdHat || [];
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
    if (!selectedFunctionUid || !selectedDistribution) {
      setPlotData([]);
      setPropagating(false);
      return;
    }

    const inputLogScales = Object.fromEntries(inputVars.map(v => [v, Boolean(selectedDistribution[v]?.logScale)]));
    const outputLogScalesBody = selectedQoI ? { [selectedQoI]: Boolean(selectedOutputLogScales[selectedQoI]) } : {};
    fetch(`/flask/dakota/sumo_along_axes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: inputVars,
        distribution: selectedDistribution,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs,
        log: false,
        inputLogScales,
        outputLogScales: outputLogScalesBody,
      }),
    })
      .then(response => response.json())
      .then(payload => {
        const predictions = getAlongAxesPredictions(payload);
        if (!predictions) {
          throw new Error("Unexpected SUMO along-axes payload shape");
        }
        createPlotData(predictions);
        setPropagating(false);
      })
      .catch(error => {
        console.warn("Error:", error);
        setPlotData([]);
        setPropagating(false);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      const requestKey = JSON.stringify({
        axis,
        inputVars,
        selectedFunctionUid,
        selectedQoI,
        otherAxis,
        selectedDistribution,
        selectedOutputLogScales,
        jobUids: jobs.map(job => job.uid),
      });

      if (requestKey === lastRequestKeyRef.current) {
        return;
      }

      lastRequestKeyRef.current = requestKey;

      if (jobs.length !== 0) {
        await RunCentralSuMoInterpolations(jobs);
        return;
      }
      // Not enough jobs to build model - then returns empty list
      setPlotData([]);
    };
    run();
    // console.debug("axis: ", axis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    axis,
    filteredJobList,
    inputVars,
    otherAxis,
    selectedDistribution,
    selectedFunctionUid,
    selectedOutputLogScales,
    selectedQoI,
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
        {inputVars.length > 0 && selectedDistribution ? (
          <>
            {inputVars.map(key => {
              if (key === axis) {
                return null; // Skip the first variable as it is already selected
              }
              return (
                <CreateSlider
                  input={key}
                  dist={selectedDistribution[key]}
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
}

export default Curves1DPlots;
