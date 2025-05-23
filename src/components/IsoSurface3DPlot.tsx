import { Box, MenuItem, Select } from "@mui/material";
import React, { useState } from "react";
import Plot from "react-plotly.js";

const IsoSurface3DPlot = () => {
  // const [data, setData] = useState(mockdata2);
  const [key1, setKey1] = useState("x1");
  const [key2, setKey2] = useState("x2");

  const data = [
    {
      type: "isosurface",
      x: [0, 0, 0, 0, 1, 1, 1, 1],
      y: [0, 1, 0, 1, 0, 1, 0, 1],
      z: [1, 1, 0, 0, 1, 1, 0, 0],
      value: [1, 2, 3, 4, 5, 6, 7, 8],
      isomin: 2,
      isomax: 6,
      colorscale: "Reds",
    },
  ];

  const layout = {
    autosize: false,
    willReadFrequently: true,
    width: 930,
    height: 500,
    margin: { t: 0, l: 0, b: 0 },
    scene: {
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
          defaultValue={"x1"}
          value={key1}
          onChange={(e) => setKey1(e.target.value)}
          sx={{ backgroundColor: "white" }}
        >
          {Object.keys({'x1': 'a', 'x2': 'b'}).map((key) => {
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
          sx={{ backgroundColor: "white" }}
        >
          {Object.keys({'x1': 'a', 'x2': 'b'}).map((key) => {
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

export default IsoSurface3DPlot;
