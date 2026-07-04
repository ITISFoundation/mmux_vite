import { useEffect, useMemo, useRef, useState } from "react";
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

type GPPrediction = {
  x: number[];
  yHat: number[];
  stdHat: number[];
};

function Curves1DPlots() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
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
  const lastFetchedKey = useRef<string | undefined>(undefined);

  // Per-variable log-scale flags (§V12): input flags come from the distribution config,
  // the output flag from the per-function outputLogScales map (only meaningful for the
  // currently selected QoI).
  const inputLogScales = useMemo(
    () =>
      inputVars.reduce(
        (acc: { [key: string]: boolean }, key) => {
          acc[key] = Boolean(distribution[selectedFunction?.uid || ""]?.[key]?.logScale);
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    [inputVars, distribution, selectedFunction],
  );
  const outputLogScaleForQoi = selectedQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[selectedQoI]) : false;

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
        inputLogScales,
        outputLogScales: selectedQoI ? { [selectedQoI]: outputLogScaleForQoi } : {},
      }),
    })
      .then(response => {
        if (response && !response.ok) {
          console.warn("SuMo Curves plot error: ", response.body);
          // V18: reject (⊥ return/resolve) so the .catch path clears lastFetchedKey and
          // the identical inputs can be retried instead of caching a failed fetch.
          return Promise.reject(new Error(`SuMo Curves plot response not ok: ${response.status}, ${response.statusText}`));
        }
        return response.json();
      })
      .then(data => {
        // Backend wraps the per-axis predictions under `predictions` (SumoAlongAxesResponse).
        createPlotData(data?.predictions);
        // V18: cache key ONLY on success, so transient failures don't block retry
        lastFetchedKey.current = requestKey;
        setPropagating(false);
      })
      .catch(_error => {
        // V18: clear cache on error so same inputs can be retried
        lastFetchedKey.current = undefined;
        setPlotData([]);
        setPropagating(false);
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
      const requestKey = buildDakotaRequestKey({
        axes: [axis],
        sliderValues: otherAxis,
        qoi: selectedQoI,
        fn: selectedFunction?.uid,
        jobList: jobs.map(job => job.uid),
        logScales: selectedQoI ? { ...inputLogScales, [selectedQoI]: outputLogScaleForQoi } : inputLogScales,
      });
      if (requestKey === lastFetchedKey.current) {
        return undefined;
      }
      return RunCentralSuMoInterpolations(jobs, requestKey);
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
      type: inputLogScales[axis] ? "log" : undefined,
    },
    yaxis: {
      title: { text: selectedQoI },
      anchor: "x",
      type: outputLogScaleForQoi ? "log" : undefined,
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
