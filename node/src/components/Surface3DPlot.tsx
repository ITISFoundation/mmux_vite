import { Box, MenuItem, Select } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useMMUXContext } from "../context/MMUXContext";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { Data } from "plotly.js";


const Surface2DPlot = () => {
  const { selectedFunction, inputVars, selectedQoI, filterSelectedJobList } = useMMUXContext();
  const [key1, setKey1] = useState(inputVars[0]);
  const [key2, setKey2] = useState(inputVars[1]);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);

  const RunSuMo2DInterpolation = async (jobs: FunctionJob[], key1: string, key2: string) => {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...")
    console.info("Jobs to build SuMo: ", jobs)
    fetch(
      PYTHON_DAKOTA_BACKEND + '/flask/sumo_grid_evaluation',
      {
        method: "POST",
        body: JSON.stringify(
          {
            gridVars: [key1, key2],
            inputVars: inputVars,
            output: selectedQoI,
            FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
            log: false, // FIXME not used atm
          }
        ),
      }).then(function (response) {
        return response.json()
      }).then(function (d) {
        console.log("2D retrieved data: ", d)
        reshapePlotData(d)
      }).catch(error => console.debug('Error:', error));
  }

  const reshapePlotData = (data: any) => {
    if (data && selectedQoI) {
      const uniqueX: Array<number> = Array.from(new Set(data[key1]));
      const uniqueY: Array<number> = Array.from(new Set(data[key2]));
      const zFlat: Array<Array<number>> = data[selectedQoI];
      const z = [];
      for (let j = 0; j < uniqueY.length; j++) {
        z.push(zFlat.slice(j * uniqueX.length, (j + 1) * uniqueX.length));
      }
      console.log("Executing reshapePlotData", data, selectedQoI, data[key1], data[key2], data[selectedQoI])
      const newData: Data[] = [{
        x: uniqueX,
        y: uniqueY,
        z: z,
        type: "surface",
        colorscale: "Viridis",
        showscale: true,
      }];
      setPlotData(newData);
      console.log("Registered plotData: ", newData)
    } else {
      setPlotData([{}])
      console.log("Empty plotData")
    }
  }

  useEffect(() => {
    const run = async () => {
      const jobs = filterSelectedJobList();
      return await RunSuMo2DInterpolation(jobs, key1, key2)
    };
    run();
    console.log(key1, key2)
  }, [key1, key2]);

  const layout = {
    title: {
      text: selectedFunction?.title + " Surface Plot",
    },
    scene: {
      xaxis: { title: { text: key1 } },
      yaxis: { title: { text: key2 } },
      zaxis: { title: { text: selectedQoI } },
    },
    autosize: true,
    willReadFrequently: true,
    width: 920,
    height: 500,
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    },
  };

  if (
    !Array.isArray(inputVars) ||
    inputVars.length < 2 ||
    !inputVars.every((v) => typeof v === "string")
  ) {
    return (
      <Box color="error.main" p={2}>
        2D surface plot could not be created - as at least two input dimensions are necessary.
      </Box>
    );
  }

  console.log("Rendering 2D surface plot with keys: ", plotData);

  return (
    <Box display={"flex"} flexDirection={"column"} gap={2} width={"100%"}>
      <Box display={"flex"} flexDirection={"row"} gap={2} width={"100%"}>
        <Select
          labelId="select-key1"
          id="select-key1"
          defaultValue={""}
          value={key1}
          onChange={(e) => setKey1(e.target.value)}
        >
          {inputVars.map((key) => {
            return (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            );
          })}
        </Select>
        <Select
          labelId="select-key2"
          id="select-key2"
          defaultValue={""}
          value={key2}
          onChange={(e) => setKey2(e.target.value)}
        >
          {inputVars.map((key) => {
            return (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            );
          })}
        </Select>
      </Box>
      <Box width={"100%"}>
        <Plot data={plotData} layout={layout} />
      </Box>
    </Box>
  );
};
// }

export default Surface2DPlot;

