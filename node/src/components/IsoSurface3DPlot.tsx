import { Box, MenuItem, Select } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useMMUXContext } from "../context/MMUXContext";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { Data } from "plotly.js";

const IsoSurface3DPlot = () => {
  const { selectedFunction, inputVars, selectedQoI, filterSelectedJobList } = useMMUXContext();
  const [key1, setKey1] = useState(inputVars[0]);
  const [key2, setKey2] = useState(inputVars[1]);
  // FIXME TEmporal fix for 2D-input
  const [key3, setKey3] = useState(inputVars.length > 2 ? inputVars[2] : inputVars[1]);
  const [plotData, setPlotData] = useState<Array<Plotly.Data>>([]);

  const RunSuMo3DInterpolation = async (jobs: FunctionJob[], key1: string, key2: string) => {
    // This should create the "data" state variable to be plotted
    console.info("Evaluating SuMo for 2D surface...")
    console.info("Jobs to build SuMo: ", jobs)
    fetch(
      PYTHON_DAKOTA_BACKEND + '/flask/sumo_grid_evaluation',
      {
        method: "POST",
        body: JSON.stringify(
          {
            gridVars: [key1, key2, key3],
            inputVars: inputVars,
            output: selectedQoI,
            FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
            log: false,
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
      // console.log("Executing reshapePlotData", data, selectedQoI, data[key1], data[key2], data[selectedQoI])
      console.log(
        "Lengths:",
        data[key1]?.length,
        data[key2]?.length,
        data[key3]?.length,
        data[selectedQoI]?.length
      );
      console.log(
        "Any NaN:",
        data[key1].some(Number.isNaN),
        data[key2].some(Number.isNaN),
        data[key3].some(Number.isNaN),
        data[selectedQoI].some(Number.isNaN)
      );

      console.log("Data types:", typeof data[key1][0], typeof data[key2][0], typeof data[key3][0], typeof data[selectedQoI][0]);
      console.log("Array lengths:", data[key1]?.length, data[key2]?.length, data[key3]?.length, data[selectedQoI]?.length);
      console.log("Sample values:", data[key1]?.slice(0, 5), data[key2]?.slice(0, 5), data[key3]?.slice(0, 5), data[selectedQoI]?.slice(0, 5));
      console.log("Any NaN:", data[key1]?.some(Number.isNaN), data[key2]?.some(Number.isNaN), data[key3]?.some(Number.isNaN), data[selectedQoI]?.some(Number.isNaN));
      const newData: Data[] = [{
        type: "isosurface",
        x: data[key1],
        y: data[key2],
        z: data[key3],
        value: data[selectedQoI],
        colorscale: "Reds",
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
      return await RunSuMo3DInterpolation(jobs, key1, key2)
    };
    run();
    console.log(key1, key2, key3);
  }, [key1, key2, key3]);

  const layout = {
    title: {
      text: selectedFunction?.title + " Surface Plot",
    },
    autosize: false,
    willReadFrequently: true,
    width: 930,
    // height: 500,
    margin: { t: 0, l: 0, b: 0 },
    scene: {
      xaxis: { title: { text: key1 }, tickangle: -45, range: [-10, 10] },
      yaxis: { title: { text: key2 }, tickangle: -45, range: [-10, 10] },
      zaxis: { title: { text: key3 }, tickangle: -45, range: [-10, 10] },
      camera: {
        eye: {
          x: 1.88,
          y: -2.12,
          z: 0.96,
        },
      },
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
        <Select
          labelId="select-key3"
          id="select-key3"
          defaultValue={""}
          value={key3}
          onChange={(e) => setKey3(e.target.value)}
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

export default IsoSurface3DPlot;
