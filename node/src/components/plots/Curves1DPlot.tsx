import { useState } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { Box, useTheme } from "@mui/material";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import Header from "../navigation/Header";
import { CreateSelect, CreateSlider, filterInputVars } from "./PlotTools";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { requestJson } from "../../api/client";
import { getCachedOrFetch } from "../../api/sessionResponseCache";
import { getErrorMessage } from "../../utils/httpError";

type GPPrediction = {
  x: number[];
  yHat: number[];
  stdHat: number[];
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
  const [errorMessage, setErrorMessage] = useState<string>();
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

  const RunCentralSuMoInterpolations = async (jobs: OsparcFunctionJob[], isStale: () => boolean) => {
    setPropagating(true);
    setErrorMessage(undefined);
    // NB do NOT set plotData to [] to allow "interactive" slider movement wo the "Calculating" word flashing
    const requestBody = {
      inputs: inputVars,
      distribution,
      output: selectedQoI,
      sliderValues: otherAxis,
      FunctionJobs: jobs,
      log: false,
    };
    // V46sc: the V16/V18 lastFetchedKey success slot is subsumed by the session
    // cache - the same (url, body) answers with zero network and survives
    // unmount, failures stay uncached (retry stays possible). The plotted
    // axis' sampling range that the hand-curated key encoded for #501 lives
    // inside `distribution` in the body, so it keys the entry by construction.
    getCachedOrFetch<{ predictions: Record<string, GPPrediction> }>(`/flask/dakota/sumo_along_axes`, requestBody, () =>
      requestJson<{ predictions: Record<string, GPPrediction> }>(`/flask/dakota/sumo_along_axes`, {
        method: "POST",
        body: requestBody,
      }),
    )
      .then(data => {
        if (isStale()) return;
        // Backend wraps the per-axis predictions under `predictions` (SumoAlongAxesResponse).
        createPlotData(data?.predictions);
        setPropagating(false);
        setErrorMessage(undefined);
      })
      .catch(error => {
        if (isStale()) return;
        console.warn("SuMo Curves plot error: ", error);
        setPlotData([]);
        setPropagating(false);
        setErrorMessage(getErrorMessage(error));
      });
  };

  useGuardedAsyncEffect(
    async isStale => {
      const jobs = filteredJobList;
      if (jobs.length === 0) {
        // Not enough jobs to build model - then returns empty list
        setPlotData([]);
        // V45gd: this generation owns the commits and starts no request -
        // release loading a superseded generation left running.
        setPropagating(false);
        return;
      }
      // V16 dedup (same logical request -> no new fetch) now lives in the
      // session response cache (V46sc): a repeated (url, body) is a hit.
      return RunCentralSuMoInterpolations(jobs, isStale);
    },
    [inputVars, selectedQoI, selectedFunction, axis, otherAxis, filteredJobList, distribution],
  );

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
            errorMessage={errorMessage}
            numInputVars={inputVars.length}
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
