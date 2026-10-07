import { Box, useTheme } from "@mui/material";
import { useState, useCallback, useMemo } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import { CreateSelect, CreateSlider, filterInputVars, plotMarginsNarrow } from "./PlotTools";
import Header from "../navigation/Header";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { requestJson } from "../../api/client";
import { getCachedOrFetch } from "../../api/sessionResponseCache";
import { getErrorMessage } from "../../utils/httpError";

function Surface2DPlot() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  // Per-variable log-scale flags (node SPEC V12), see Curves1DPlot for the pattern.
  const inputLogScales = useMemo(
    () =>
      inputVars.reduce(
        (acc: { [key: string]: boolean }, key) => {
          acc[key] = distribution[selectedFunction?.uid || ""]?.[key]?.scale === "log";
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    [inputVars, distribution, selectedFunction],
  );
  const outputLogScaleForQoi = selectedQoI ? Boolean(outputLogScales[selectedFunction?.uid || ""]?.[selectedQoI]) : false;
  const context = useJobContext();
  const { filteredJobList, fetchedJobCollections } = context;
  const filteredInputVars = filterInputVars({ ...context, selectedFunction, inputVars, distribution });
  const [axis1, setAxis1] = useState(filteredInputVars[0]);
  const [axis2, setAxis2] = useState(filteredInputVars[1]);
  const [propagating, setPropagating] = useState(false);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);
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

  const handleSetAxis1 = (newAxis: string) => {
    if (axis2 === newAxis) {
      setAxis2(filteredInputVars.find(i => i !== newAxis) || "");
      setAxis1(newAxis);
    } else {
      setAxis1(newAxis);
    }
  };

  const handleSetAxis2 = (newAxis: string) => {
    if (axis1 === newAxis) {
      setAxis1(filteredInputVars.find(i => i !== newAxis) || "");
      setAxis2(newAxis);
    } else {
      setAxis2(newAxis);
    }
  };

  const reshapePlotData = useCallback(
    (data: { [key: string]: number[] } | { [key: string]: number[][] }) => {
      if (data && selectedQoI) {
        const uniqueX: Array<number> = Array.from(new Set(data[axis1] as number[]));
        const uniqueY: Array<number> = Array.from(new Set(data[axis2] as number[]));
        const z: Array<Array<number>> = data[selectedQoI] as number[][];

        const newData: Data[] = [
          {
            x: uniqueX,
            y: uniqueY,
            z,
            type: "surface",
            colorscale: "Electric",
            showscale: true,
          },
        ];
        setPlotData(newData);
      } else {
        setPlotData([]);
        console.warn("Empty plotData");
      }
    },
    [axis1, axis2, selectedQoI],
  );

  const RunSuMo2DInterpolation = useCallback(
    async (jobs: OsparcFunctionJob[], key1: string, key2: string, isStale: () => boolean) => {
      // This should create the "data" state variable to be plotted
      console.info("Evaluating SuMo for 2D surface...");
      console.info("Jobs to build SuMo: ", jobs);
      setPropagating(true);
      setErrorMessage(undefined);
      const requestBody = {
        gridVars: [key1, key2],
        inputVars,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        inputLogScales,
        outputLogScales: selectedQoI ? { [selectedQoI]: outputLogScaleForQoi } : {},
      };
      // V46sc (T39ab): session cache subsumes the V16/V18 lastFetchedKey slot -
      // the same (url, body) answers with zero network and survives unmount,
      // failures stay uncached (retry stays possible). The grid endpoint derives
      // everything from this body (jobs + slider values + log flags; the FE-side
      // axis ranges the old hand-curated key carried never reached the backend),
      // so the body-derived key is complete by construction (B37rv).
      getCachedOrFetch<{ gridData: { [key: string]: number[] } }>(`/flask/dakota/sumo_grid_evaluation`, requestBody, () =>
        requestJson<{ gridData: { [key: string]: number[] } }>(`/flask/dakota/sumo_grid_evaluation`, {
          method: "POST",
          body: requestBody,
        }),
      )
        .then(d => {
          if (isStale()) return;
          // Backend wraps the grid arrays under `gridData` (SumoGridEvaluationResponse).
          reshapePlotData(d?.gridData);
          setPropagating(false);
          setErrorMessage(undefined);
        })
        .catch(error => {
          if (isStale()) return;
          console.warn("Error:", error);
          setPropagating(false);
          setPlotData([]);
          setErrorMessage(getErrorMessage(error));
        });
    },
    [inputVars, selectedQoI, otherAxis, reshapePlotData, inputLogScales, outputLogScaleForQoi],
  );

  useGuardedAsyncEffect(
    async isStale => {
      const jobs = filteredJobList;
      // V16 dedup (same logical request -> no new fetch) now lives in the
      // session response cache (V46sc): a repeated (url, body) is a hit.
      return RunSuMo2DInterpolation(jobs, axis1, axis2, isStale);
    },
    // #663 log-scale deps ride the union: flipping a flag must re-trigger
    [
      axis1,
      axis2,
      inputVars,
      selectedQoI,
      selectedFunction,
      distribution,
      otherAxis,
      filteredJobList,
      RunSuMo2DInterpolation,
      inputLogScales,
      outputLogScaleForQoi,
    ],
  );

  const layout: Partial<Layout> = {
    title: {
      text: `${selectedQoI} Surface 2D Plot`,
    },
    scene: {
      xaxis: { title: { text: axis1 }, type: axis1 && inputLogScales[axis1] ? "log" : undefined },
      yaxis: { title: { text: axis2 }, type: axis2 && inputLogScales[axis2] ? "log" : undefined },
      zaxis: { title: { text: selectedQoI }, type: outputLogScaleForQoi ? "log" : undefined },
    },
    autosize: true,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    margin: plotMarginsNarrow,
  };

  const plotStyle = {
    height: 500,
    borderRadius: "8px",
    overflow: "hidden",
  };

  if (!Array.isArray(inputVars) || inputVars.length < 2 || !inputVars.every(v => typeof v === "string")) {
    return (
      <Box color="error.main" p={2}>
        2D surface plot could not be created - as at least two input dimensions are necessary.
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" flexDirection="column" width="100%">
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

      <Box mt={2}>
        <Header headerType="subTitle" infoText="" tabTitle="Selection" />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        p={4}
        sx={{
          backgroundColor: theme.palette.background.default,
          borderRadius: theme.spacing(2),
        }}
      >
        <Box display="flex" flexDirection="row" gap={2}>
          <CreateSelect axis={axis1} idx={1} setAxis={handleSetAxis1} />
          <CreateSelect axis={axis2} idx={2} setAxis={handleSetAxis2} />
        </Box>
        {inputVars.length > 0 && distribution[selectedFunction?.uid || ""] !== undefined ? (
          <>
            {inputVars.map(key => {
              if (key === axis1 || key === axis2) {
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

export default Surface2DPlot;
