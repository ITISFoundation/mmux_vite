import { Box, MenuItem, Select } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useMMUXContext } from "../context/MMUXContext";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';


const Surface2DPlot = () => {
  const { selectedFunction, inputVars, selectedQoI, filterSelectedJobList } = useMMUXContext();
  const jobs = filterSelectedJobList()

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
  const [key1, setKey1] = useState(inputVars[0]);
  const [key2, setKey2] = useState(inputVars[1]);
  const [data, setData] = useState(undefined);
  const [plotData, setPlotData] = useState<Partial<Plotly.PlotData>[] | undefined>(undefined);

  async function RunSuMo2DInterpolation(jobs: FunctionJob[], key1: string, key2: string) {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...")
    console.info("Jobs to build SuMo: ", jobs)
    fetch(
      PYTHON_DAKOTA_BACKEND + '/flask/sumo_2d_surface',
      {
        method: "POST",
        body: JSON.stringify(
          {
            key1: key1,
            key2: key2,
            output: selectedQoI,
            FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
            log: false,
          }
        ),
      }).then(function (response) {
        return response.json()
      }).then(function (d) {
        console.log("2D retrieved data: ", d)
        setData(d)
      }).catch(error => console.debug('Error:', error));
  }

  useEffect(() => {
    console.log("Running SuMo again")
    const run = async () => {
      return await RunSuMo2DInterpolation(jobs, key1, key2)
    };
    run();
    console.log(key1, key2)
  }, [jobs, key1, key2]);

  // Transform backend data to Plotly surface format
  // Expecting backend returns: { x: number[], y: number[], z: number[][] }
  // If not, adjust accordingly.

  function reshapePlotData() {
    console.log("Executing reshapePlotData")
    if (data && selectedQoI) {
      setPlotData(
        [{
          x: data[key1],
          y: data[key2],
          z: data[selectedQoI],
          type: "surface",
        }]
      )
      console.log("Registered plotData: ", plotData)
    } else {
      setPlotData([{}])
      console.log("Empty plotData")
    }
  }

  useEffect(() => {
    reshapePlotData();
  }, [data]);


  const layout = {
    title: {
      text: selectedFunction?.title + " Surface Plot",
    },
    autosize: false,
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

