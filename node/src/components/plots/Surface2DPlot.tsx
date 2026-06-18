import { Box, useTheme } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { OsparcFunctionJob } from "../../context/types";
import { useMMUXContext } from "../../context/MMUXContext";
import { CreateSelect, CreateSlider, filterInputVars, plotMarginsNarrow } from "./PlotTools";
import Header from "../navigation/Header";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { buildDakotaRequestKey } from "../../utils/dakotaRequestKey";

function Surface2DPlot() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const context = useJobContext();
  const { filteredJobList, fetchedJobCollections } = context;
  const filteredInputVars = filterInputVars({ ...context, selectedFunction, inputVars, distribution });
  const [axis1, setAxis1] = useState(filteredInputVars[0]);
  const [axis2, setAxis2] = useState(filteredInputVars[1]);
  const [propagating, setPropagating] = useState(false);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);
  const lastFetchedKey = useRef<string | undefined>(undefined);
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
    async (jobs: OsparcFunctionJob[], key1: string, key2: string, requestKey: string) => {
      // This should create the "data" state variable to be plotted
      console.info("Evaluating SuMo for 2D surface...");
      console.info("Jobs to build SuMo: ", jobs);
      setPropagating(true);
      fetch(`/flask/dakota/sumo_grid_evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gridVars: [key1, key2],
          inputVars,
          output: selectedQoI,
          sliderValues: otherAxis,
          FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
          log: false, // FIXME not used atm
        }),
      })
        .then(response => {
          if (response && !response.ok) {
            console.warn("SuMo Surface plot error: ", response.body);
            return new Error("SuMo Surface plot response not ok");
          }
          return response.json();
        })
        .then(d => {
          // Backend wraps the grid arrays under `gridData` (SumoGridEvaluationResponse).
          reshapePlotData(d?.gridData);
          // V18: cache key ONLY on success, so transient failures don't block retry
          lastFetchedKey.current = requestKey;
          setPropagating(false);
        })
        .catch(error => {
          // V18: clear cache on error so same inputs can be retried
          lastFetchedKey.current = undefined;
          console.warn("Error:", error);
          setPropagating(false);
          setPlotData([]);
        });
    },
    [inputVars, selectedQoI, otherAxis, reshapePlotData],
  );

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      // V16: dedup by stable logical request key; same key → no new fetch.
      const requestKey = buildDakotaRequestKey({
        axes: [axis1, axis2],
        sliderValues: otherAxis,
        qoi: selectedQoI,
        fn: selectedFunction?.uid,
        jobList: jobs.map(job => job.uid),
        logScale: false,
      });
      if (requestKey === lastFetchedKey.current) {
        return undefined;
      }
      return RunSuMo2DInterpolation(jobs, axis1, axis2, requestKey);
    };
    run();
  }, [axis1, axis2, inputVars, selectedQoI, selectedFunction, otherAxis, filteredJobList, RunSuMo2DInterpolation]);

  const layout: Partial<Layout> = {
    title: {
      text: `${selectedQoI} Surface 2D Plot`,
    },
    scene: {
      xaxis: { title: { text: axis1 } },
      yaxis: { title: { text: axis2 } },
      zaxis: { title: { text: selectedQoI } },
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
