import { Box, MenuItem, Select } from "@mui/material";
import { useState, useContext, useEffect } from "react";
import Plot from "react-plotly.js";
import MMUXContext from "../views/MMUXContext";


const Surface2DPlot = () => {
  const context = useContext(MMUXContext);
  console.log("InputVars to 3D surface (e.g. 2D plot): ", context?.inputVars)
  console.log("QoI  to 3D surface (e.g. 2D plot): ", context?.selectedQoI)

  if (
    !Array.isArray(context?.inputVars) ||
    context?.inputVars.length < 2 ||
    !context?.inputVars.every((v) => typeof v === "string")
  ) {
    return (
      <Box color="error.main" p={2}>
        2D surface plot could not be created - as at least two input dimensions are necessary.
      </Box>
    );
  }
  const [key1, setKey1] = useState(context?.inputVars[0]);
  const [key2, setKey2] = useState(context?.inputVars[1]);

  async function RunSuMo2DInterpolation() {

  }


  useEffect(() => {
    await RunSuMo2DInterpolation(...)

  }, [jobs, key1, key2]);


  function unpack(rows, key) {
    return rows.map(function (row) {
      return row[key];
    });
  }

  const z_data = [];
  for (let i = 0; i < 24; i++) {
    z_data.push(unpack(mockdata, i));
  }

  const data = [
    {
      z: z_data,
      type: "surface",
    },
  ];

  const layout = {
    title: {
      text: "Mt Bruno Elevation",
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
          defaultValue={"x1"}
          value={key1}
          onChange={(e) => setKey1(e.target.value)}
        >
          {Object.keys(mockdata2).map((key) => {
            if (key.includes("x"))
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
          defaultValue={"x2"}
          value={key2}
          onChange={(e) => setKey2(e.target.value)}
        >
          {Object.keys(mockdata2).map((key) => {
            if (key.includes("x"))
              return (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              );
          })}
        </Select>
      </Box>
      <Box width={"100%"}>
        <Plot data={data} layout={layout} />
      </Box>
    </Box>
  );
};

export default Surface2DPlot;
