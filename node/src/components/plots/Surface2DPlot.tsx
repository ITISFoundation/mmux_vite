import { Box, useTheme } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import { useMMUXContext } from "../../context/MMUXContext";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { CreateSelect, CreateSlider, filterInputVars, plotMarginsNarrow } from "./PlotTools";
import Header from "../navigation/Header";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";
import { getGridData, getGridOutputValues, type NumericSeries } from "./sumoResponse";

function Surface2DPlot() {
  const theme = useTheme();
  const { selectedFunction, inputVars, distribution, outputLogScales } = useFunctionContext();
  const { selectedQoI } = useMMUXContext();
  const context = useJobContext();
  const { filteredJobList, fetchedJobCollections } = context;
  const selectedFunctionUid = selectedFunction?.uid;
  const selectedDistribution = selectedFunctionUid ? distribution[selectedFunctionUid] : undefined;
  const filteredInputVars = filterInputVars({ ...context, selectedFunction, inputVars, distribution });
  const [axis1, setAxis1] = useState(filteredInputVars[0] || "");
  const [axis2, setAxis2] = useState(filteredInputVars[1] || filteredInputVars[0] || "");
  const [propagating, setPropagating] = useState(false);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);
  const [otherAxis, setOtherAxis] = useState<{ [key: string]: number }>({});
  const lastRequestKeyRef = useRef("");

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
    const nextAxis1 = filteredInputVars.includes(axis1) ? axis1 : filteredInputVars[0] || "";
    const nextAxis2 =
      filteredInputVars.includes(axis2) && nextAxis1 !== axis2
        ? axis2
        : filteredInputVars.find(i => i !== nextAxis1) || filteredInputVars[1] || filteredInputVars[0] || "";

    if (nextAxis1 !== axis1) {
      setAxis1(nextAxis1);
    }
    if (nextAxis2 !== axis2) {
      setAxis2(nextAxis2);
    }
  }, [axis1, axis2, filteredInputVars]);

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
    (data: Record<string, NumericSeries>) => {
      if (data && selectedQoI) {
        const x = data[axis1];
        const y = data[axis2];
        const z = getGridOutputValues(data, selectedQoI);
        if (!Array.isArray(x) || !Array.isArray(y) || !Array.isArray(z) || !Array.isArray(z[0])) {
          setPlotData([]);
          console.warn("Unexpected SUMO surface payload:", {
            axis1,
            axis2,
            selectedQoI,
            availableKeys: Object.keys(data),
          });
          return;
        }
        const uniqueX: Array<number> = Array.from(new Set(x as number[]));
        const uniqueY: Array<number> = Array.from(new Set(y as number[]));

        const newData: Data[] = [
          {
            x: uniqueX,
            y: uniqueY,
            z: z as number[][],
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
    async (jobs: FunctionJob[], key1: string, key2: string) => {
      // This should create the "data" state variable to be plotted
      console.info("Evaluating SuMo for 2D surface...");
      console.info("Jobs to build SuMo: ", jobs);
      setPropagating(true);
      if (!selectedFunctionUid || !selectedDistribution) {
        setPlotData([]);
        setPropagating(false);
        return;
      }

      const inputLogScales = Object.fromEntries(inputVars.map(v => [v, Boolean(selectedDistribution[v]?.logScale)]));
      const selectedOutputLogScales = selectedFunctionUid ? outputLogScales[selectedFunctionUid] || {} : {};
      const outputLogScalesBody = selectedQoI ? { [selectedQoI]: Boolean(selectedOutputLogScales[selectedQoI]) } : {};
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
          inputLogScales,
          outputLogScales: outputLogScalesBody,
        }),
      })
        .then(response => {
          if (response && !response.ok) {
            console.warn("SuMo Surface plot error: ", response.body);
            return Promise.reject(new Error("SuMo Surface plot response not ok"));
          }
          return response.json();
        })
        .then(payload => {
          const gridData = getGridData(payload);
          if (!gridData) {
            throw new Error("Unexpected SUMO grid payload shape");
          }
          reshapePlotData(gridData);
          setPropagating(false);
        })
        .catch(error => {
          console.warn("Error:", error);
          setPropagating(false);
          setPlotData([]);
        });
    },
    [inputVars, outputLogScales, selectedDistribution, selectedFunctionUid, selectedQoI, otherAxis, reshapePlotData],
  );

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      const requestKey = JSON.stringify({
        axis1,
        axis2,
        inputVars,
        selectedFunctionUid,
        selectedQoI,
        otherAxis,
        selectedDistribution,
        outputLogScales,
        jobUids: jobs.map(job => job.uid),
      });

      if (requestKey === lastRequestKeyRef.current) {
        return;
      }

      lastRequestKeyRef.current = requestKey;

      await RunSuMo2DInterpolation(jobs, axis1, axis2);
    };
    run();
  }, [
    RunSuMo2DInterpolation,
    axis1,
    axis2,
    filteredJobList,
    inputVars,
    otherAxis,
    outputLogScales,
    selectedDistribution,
    selectedFunctionUid,
    selectedQoI,
  ]);

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
        {inputVars.length > 0 && selectedDistribution ? (
          <>
            {inputVars.map(key => {
              if (key === axis1 || key === axis2) {
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

export default Surface2DPlot;
