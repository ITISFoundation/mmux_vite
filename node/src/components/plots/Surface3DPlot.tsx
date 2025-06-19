import { Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useMMUXContext } from "../../context/MMUXContext";
import { FunctionJob } from "../../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from "../../utils/api_objects";
import { Data } from "plotly.js";
import { CreateSelect, CreateSlider } from "./PlotTools";

const Surface2DPlot = () => {
  const theme = useTheme();
  const {
    selectedFunction,
    inputVars,
    distribution,
    selectedQoI,
    filterSelectedJobList,
  } = useMMUXContext();
  const filteredInputVars = inputVars.filter(
    (i) =>
      (distribution[selectedFunction?.uid || ""][i]
        .distribution as distribution) !== "constant"
  );
  const [axis1, setAxis1] = useState(filteredInputVars[0]);
  const [axis2, setAxis2] = useState(filteredInputVars[1]);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);
  const [otherAxis, setOtherAxis] = useState<{ [key: string]: number }>(
    inputVars.reduce((acc: { [key: string]: number }, key) => {
      acc[key] =
        distribution[selectedFunction?.uid || ""][key].value ||
        distribution[selectedFunction?.uid || ""][key].mean ||
        distribution[selectedFunction?.uid || ""][key].min ||
        0;
      return acc;
    }, {})
  );

  const handleSetAxis1 = (newAxis: string) => {
    if (axis2 === newAxis) {
      setAxis2(filteredInputVars.find((i) => i !== newAxis) || "");
      setAxis1(newAxis);
    } else {
      setAxis1(newAxis);
    }
  };

  const handleSetAxis2 = (newAxis: string) => {
    if (axis1 === newAxis) {
      setAxis1(filteredInputVars.find((i) => i !== newAxis) || "");
      setAxis2(newAxis);
    } else {
      setAxis2(newAxis);
    }
  };

  const RunSuMo2DInterpolation = async (
    jobs: FunctionJob[],
    key1: string,
    key2: string
  ) => {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...");
    console.info("Jobs to build SuMo: ", jobs);
    fetch(PYTHON_DAKOTA_BACKEND + "/flask/sumo_grid_evaluation", {
      method: "POST",
      body: JSON.stringify({
        gridVars: [key1, key2],
        inputVars: inputVars,
        output: selectedQoI,
        sliderValues: otherAxis,
        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
        log: false, // FIXME not used atm
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (d) {
        console.log("2D retrieved data: ", d);
        reshapePlotData(d);
      })
      .catch((error) => console.debug("Error:", error));
  };

  const reshapePlotData = (
    data: { [key: string]: number[] } | { [key: string]: number[][] }
  ) => {
    if (data && selectedQoI) {
      const uniqueX: Array<number> = Array.from(
        new Set(data[axis1] as number[])
      );
      const uniqueY: Array<number> = Array.from(
        new Set(data[axis2] as number[])
      );
      const z: Array<Array<number>> = data[selectedQoI] as number[][];

      const newData: Data[] = [
        {
          x: uniqueX,
          y: uniqueY,
          z: z,
          type: "surface",
          colorscale: "Viridis",
          showscale: true,
        },
      ];
      setPlotData(newData);
    } else {
      setPlotData([{}]);
      console.log("Empty plotData");
    }
  };

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMo2DInterpolation(jobs, axis1, axis2);
    };
    run();
  }, [axis1, axis2, inputVars, selectedQoI, selectedFunction, otherAxis]);

  const layout = {
    title: {
      text: selectedFunction?.title + " Surface Plot",
    },
    scene: {
      xaxis: { title: { text: axis1 } },
      yaxis: { title: { text: axis2 } },
      zaxis: { title: { text: selectedQoI } },
    },
    autosize: true,
    willReadFrequently: true,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    },
  };

  const plotStyle = {
    height: 500,
    borderRadius: "8px",
    overflow: "hidden",
  };

  if (
    !Array.isArray(inputVars) ||
    inputVars.length < 2 ||
    !inputVars.every((v) => typeof v === "string")
  ) {
    return (
      <Box color="error.main" p={2}>
        2D surface plot could not be created - as at least two input dimensions
        are necessary.
      </Box>
    );
  }

  console.log("Rendering 2D surface plot with keys: ", plotData);

  return (
    <Box display={"flex"} flexDirection={"column"} gap={2} width={"100%"}>
      <Box
        sx={{
          width: "100%",
          height: "500px",
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <Plot data={plotData} layout={layout} style={plotStyle} />
      </Box>
      <Box display={"flex"} flexDirection={"row"} gap={2} pt={1}>
        <CreateSelect
          axis={axis1}
          idx={1}
          setAxis={handleSetAxis1}
          inputVars={inputVars}
        />
        <CreateSelect
          axis={axis2}
          idx={2}
          setAxis={handleSetAxis2}
          inputVars={inputVars}
        />
      </Box>

      <Box display={"flex"} flexDirection={"column"} gap={2} pt={2}>

        {inputVars.length > 0 &&
          distribution[selectedFunction?.uid || ""] !== undefined ? (
          <>
            {inputVars.map((key) => {
              if (key === axis1 || key === axis2) {
                return null; // Skip the first variable as it is already selected
              }
              const dist = distribution[selectedFunction?.uid || ""];
              return (
                <CreateSlider
                  input={key}
                  dist={dist[key]}
                  otherAxis={otherAxis}
                  setOtherAxis={setOtherAxis}
                  key={key}
                />
              );
            })}
          </>
        ) : undefined}
      </Box>
    </Box>
  );
};

export default Surface2DPlot;
