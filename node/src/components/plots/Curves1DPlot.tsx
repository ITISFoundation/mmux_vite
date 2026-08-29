import { useEffect, useRef, useState } from "react";
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
import { buildDakotaRequestKey } from "../../utils/dakotaRequestKey";
import { getResponseErrorMessage } from "../../utils/httpError";

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
  const lastFetchedKey = useRef<string | undefined>(undefined);

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

  const RunCentralSuMoInterpolations = async (jobs: OsparcFunctionJob[], requestKey: string) => {
    setPropagating(true);
    setErrorMessage(undefined);
    // NB do NOT set plotData to [] to allow "interactive" slider movement wo the "Calculating" word flashing
    fetch(`/flask/dakota/sumo_along_axes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: inputVars,
        distribution,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs,
        log: false,
      }),
    })
      .then(async response => {
        if (response && !response.ok) {
          console.warn("SuMo Curves plot error: ", response.body);
          // V18: reject (⊥ return/resolve) so the .catch path clears lastFetchedKey and
          // the identical inputs can be retried instead of caching a failed fetch.
          return Promise.reject(new Error(await getResponseErrorMessage(response)));
        }
        return response.json();
      })
      .then(data => {
        // Backend wraps the per-axis predictions under `predictions` (SumoAlongAxesResponse).
        createPlotData(data?.predictions);
        // V18: cache key ONLY on success, so transient failures don't block retry
        lastFetchedKey.current = requestKey;
        setPropagating(false);
        setErrorMessage(undefined);
      })
      .catch(error => {
        // V18: clear cache on error so same inputs can be retried
        lastFetchedKey.current = undefined;
        setPlotData([]);
        setPropagating(false);
        setErrorMessage(error instanceof Error ? error.message : String(error));
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      if (jobs.length === 0) {
        // Not enough jobs to build model - then returns empty list
        lastFetchedKey.current = undefined;
        return setPlotData([]);
      }
      // V16: dedup by stable logical request key; same key → no new fetch.
      // V36 (#501): encode the plotted axis' sampling range so that widening an
      // input's range invalidates the cache and the plot re-fetches with the new range.
      const fnUid = selectedFunction?.uid || "";
      const axisDist = distribution[fnUid]?.[axis];
      const axisRanges = axisDist ? { [axis]: [axisDist.min, axisDist.max] as [number, number] } : undefined;
      const requestKey = buildDakotaRequestKey({
        axes: [axis],
        sliderValues: otherAxis,
        qoi: selectedQoI,
        fn: fnUid,
        jobList: jobs.map(job => job.uid),
        logScale: false,
        axisRanges,
      });
      if (requestKey === lastFetchedKey.current) {
        return undefined;
      }
      return RunCentralSuMoInterpolations(jobs, requestKey);
    };
    run();
    // console.debug("axis: ", axis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputVars, selectedQoI, selectedFunction, axis, otherAxis, filteredJobList, distribution]);

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
