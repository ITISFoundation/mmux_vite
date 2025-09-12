import { Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useMMUXContext } from "../../context/MMUXContext";
import { FunctionJob as OsparcFunctionJob } from "osparc-api-ts-client";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { CreateSelect, CreateSlider, filterInputVars, plotMargins } from "./PlotTools";
import Header from "../navigation/Header";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";
import { useFunctionContext } from "../../context/FunctionContext";
import { useJobContext } from "../../context/JobContext";

function IsoSurface3DPlot() {
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
  const [propagating, setPropagating] = useState(false);
  const [axis1, setAxis1] = useState(filteredInputVars[0]);
  const [axis2, setAxis2] = useState(filteredInputVars[1]);
  const [axis3, setAxis3] = useState(filteredInputVars[2]);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);
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

  interface IsoSurfaceData extends Plotly.PlotData {
    surface: { show: boolean; count: number }; // Just to make TypeScript happy. Edit if necessary.
  }
  const reshapePlotData = (data: { [key: string]: number[] } | { [key: string]: number[][] } | { [key: string]: number }) => {
    if (data && selectedQoI) {
      const newData: Partial<IsoSurfaceData>[] = [
        {
          type: "isosurface",
          x: data[axis1] as number[],
          y: data[axis2] as number[],
          z: data[axis3] as number[],
          value: data[selectedQoI] as number,
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

  const RunSuMo3DInterpolation = async (jobs: OsparcFunctionJob[], localAxis1: string, localAxis2: string) => {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...");
    console.info("Jobs to build SuMo: ", jobs);
    setPropagating(true);
    fetch(`${PYTHON_DAKOTA_BACKEND}/flask/sumo_grid_evaluation`, {
      method: "POST",
      body: JSON.stringify({
        gridVars: [localAxis1, localAxis2, axis3],
        inputVars,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        log: false,
      }),
    })
      .then(response => {
        if (response && !response.ok) {
          console.warn("SuMo Surface plot error: ", response.body);
          return Promise.reject(new Error(`Error running SuMo Surface plot: ${response.status}, ${response.statusText}`));
        }
        return response.json();
      })
      .then(d => {
        reshapePlotData(d);
        setPropagating(false);
      })
      .catch(error => {
        console.warn("Error:", error);
        setPropagating(false);
        setPlotData([]);
      });
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filteredJobList;
      return RunSuMo3DInterpolation(jobs, axis1, axis2);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis1, axis2, axis3, inputVars, selectedQoI, selectedFunction, otherAxis, filteredJobList]);

  const layout = {
    title: {
      text: `${selectedQoI} IsoSurface 3D Plot`,
    },
    autosize: true,
    willReadFrequently: true,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    margin: plotMargins,
    scene: {
      xaxis: { title: { text: axis1 }, tickangle: -45 },
      yaxis: { title: { text: axis2 }, tickangle: -45 },
      zaxis: { title: { text: axis3 }, tickangle: -45 },
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
