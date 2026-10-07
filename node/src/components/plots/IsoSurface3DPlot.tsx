import { Box, useTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { useGuardedAsyncEffect } from "../../hooks/useGuardedAsyncEffect";
import Plot from "react-plotly.js";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import { CreateSelect, CreateSlider, filterInputVars, plotMarginsNarrow } from "./PlotTools";
import Header from "../navigation/Header";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { requestJson } from "../../api/client";
import { getCachedOrFetch } from "../../api/sessionResponseCache";
import { getErrorMessage } from "../../utils/httpError";

function IsoSurface3DPlot() {
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
  const filteredInputVars = filterInputVars({
    ...context,
    selectedFunction,
    inputVars,
    distribution,
  });
  const [propagating, setPropagating] = useState(false);
  const [axis1, setAxis1] = useState(filteredInputVars[0]);
  const [axis2, setAxis2] = useState(filteredInputVars[1]);
  const [axis3, setAxis3] = useState(filteredInputVars[2]);
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
    if (axis3 === newAxis || axis2 === newAxis) {
      const newVars = filteredInputVars.filter(i => i !== newAxis);
      let newVar2 = newVars.find(i => i === axis2);
      let newVar3 = newVars.find(i => i === axis3);
      if (newVar2 || newVar3) {
        if (newVar2 && newVar3) {
          setAxis2(newVar2);
          setAxis3(newVar3);
        } else if (newVar2) {
          newVar3 = newVars.find(i => i !== newAxis && i !== axis2) || "";
          setAxis2(newVar2);
          setAxis3(newVar3);
        } else if (newVar3) {
          newVar2 = newVars.find(i => i !== newAxis && i !== axis3) || "";
          setAxis2(newVar2);
          setAxis3(newVar3);
        }
      } else {
        setAxis2(newVars[1]);
        setAxis3(newVars[0]);
      }
      setAxis1(newAxis);
    } else {
      setAxis1(newAxis);
    }
  };

  const handleSetAxis2 = (newAxis: string) => {
    if (axis3 === newAxis || axis1 === newAxis) {
      const newVars = filteredInputVars.filter(i => i !== newAxis);
      let newVar1 = newVars.find(i => i === axis1);
      let newVar3 = newVars.find(i => i === axis3);
      if (newVar1 || newVar3) {
        if (newVar1 && newVar3) {
          setAxis1(newVar1);
          setAxis3(newVar3);
        } else if (newVar1) {
          newVar3 = newVars.find(i => i !== newAxis && i !== axis1) || "";
          setAxis1(newVar1);
          setAxis3(newVar3);
        } else if (newVar3) {
          newVar1 = newVars.find(i => i !== newAxis && i !== axis3) || "";
          setAxis1(newVar1);
          setAxis3(newVar3);
        }
      } else {
        setAxis1(newVars[1]);
        setAxis3(newVars[0]);
      }
      setAxis2(newAxis);
    } else {
      setAxis2(newAxis);
    }
  };

  const handleSetAxis3 = (newAxis: string) => {
    if (axis1 === newAxis || axis2 === newAxis) {
      const newVars = filteredInputVars.filter(i => i !== newAxis);
      let newVar1 = newVars.find(i => i === axis1);
      let newVar2 = newVars.find(i => i === axis2);
      if (newVar1 || newVar2) {
        if (newVar1 && newVar2) {
          setAxis1(newVar1);
          setAxis2(newVar2);
        } else if (newVar1) {
          newVar2 = newVars.find(i => i !== newAxis && i !== newVar1) || "";
          setAxis1(newVar1);
          setAxis2(newVar2);
        } else if (newVar2) {
          newVar1 = newVars.find(i => i !== newAxis && i !== newVar2) || "";
          setAxis1(newVar1);
          setAxis2(newVar2);
        }
      } else {
        setAxis1(newVars[1]);
        setAxis2(newVars[0]);
      }
      setAxis3(newAxis);
    } else {
      setAxis3(newAxis);
    }
  };

  const reshapePlotData = (data: { [key: string]: number[] } | { [key: string]: number[][] } | { [key: string]: number }) => {
    if (data && selectedQoI) {
      const newData: Partial<Plotly.IsosurfaceData>[] = [
        {
          type: "isosurface",
          x: data[axis1] as number[],
          y: data[axis2] as number[],
          z: data[axis3] as number[],
          value: data[selectedQoI] as number[],
          colorscale: "Electric",
          showscale: true,
          opacity: 0.5,
          surface: { show: true, count: 10 },
        },
      ];
      setPlotData(newData);
    } else {
      setPlotData([]);
    }
  };

  const RunSuMo3DInterpolation = async (
    jobs: OsparcFunctionJob[],
    localAxis1: string,
    localAxis2: string,
    isStale: () => boolean,
  ) => {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...");
    console.info("Jobs to build SuMo: ", jobs);
    setPropagating(true);
    setErrorMessage(undefined);
    const requestBody = {
      gridVars: [localAxis1, localAxis2, axis3],
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
  };

  useGuardedAsyncEffect(
    async isStale => {
      const jobs = filteredJobList;
      // V16 dedup (same logical request -> no new fetch) now lives in the
      // session response cache (V46sc): a repeated (url, body) is a hit.
      return RunSuMo3DInterpolation(jobs, axis1, axis2, isStale);
    },
    // #663 log-scale deps ride the union: flipping a flag must re-trigger
    [
      axis1,
      axis2,
      axis3,
      inputVars,
      selectedQoI,
      selectedFunction,
      distribution,
      otherAxis,
      filteredJobList,
      inputLogScales,
      outputLogScaleForQoi,
    ],
  );

  const layout = {
    title: {
      text: `${selectedQoI} IsoSurface 3D Plot`,
    },
    autosize: true,
    willReadFrequently: true,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    margin: plotMarginsNarrow,
    scene: {
      xaxis: {
        title: { text: axis1 },
        tickangle: -45,
        type: axis1 && inputLogScales[axis1] ? "log" : undefined,
      },
      yaxis: {
        title: { text: axis2 },
        tickangle: -45,
        type: axis2 && inputLogScales[axis2] ? "log" : undefined,
      },
      zaxis: {
        title: { text: axis3 },
        tickangle: -45,
        type: axis3 && inputLogScales[axis3] ? "log" : undefined,
      },
      camera: {
        eye: {
          x: 1.88,
          y: -2.12,
          z: 0.96,
        },
      },
    },
  };

  const plotStyle = {
    height: 500,
    borderRadius: "8px",
    overflow: "hidden",
  };

  return (
    <Box display="flex" flexDirection="column" width="100%">
      {propagating && <CalculatingWarning height={plotStyle.height} dontShowText={false} />}
      {!propagating && plotData.length === 0 && (
        <InsufficientDataWarning
          fetchedJobCollections={fetchedJobCollections}
          filteredJobList={filteredJobList}
          height={plotStyle.height}
          errorMessage={errorMessage}
          numInputVars={inputVars.length}
        />
      )}
      {!propagating && plotData.length !== 0 && <Plot data={plotData} layout={layout} style={plotStyle} />}
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
        <Box display="flex" flex={1} flexDirection="row" justifyContent="space-between">
          <CreateSelect idx={1} axis={axis1} setAxis={handleSetAxis1} />
          <CreateSelect idx={2} axis={axis2} setAxis={handleSetAxis2} />
          <CreateSelect idx={3} axis={axis3} setAxis={handleSetAxis3} />
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          {inputVars.length > 0 && distribution[selectedFunction?.uid || ""] !== undefined ? (
            <>
              {inputVars.map(key => {
                if (key === axis1 || key === axis2 || key === axis3) {
                  return null; // Skip the first variable as it is already selected
                }
                const dist = distribution[selectedFunction?.uid || ""];
                return <CreateSlider input={key} dist={dist[key]} otherAxis={otherAxis} setOtherAxis={setOtherAxis} key={key} />;
              })}
            </>
          ) : undefined}
        </Box>
      </Box>
    </Box>
  );
}

export default IsoSurface3DPlot;
