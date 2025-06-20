import React from "react";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";
import { useTheme } from "@mui/material";
import { plotMargins } from "./PlotTools";

const WhiskerPlot: React.FC<dataUQHistogramType> = (
  props: dataUQHistogramType
) => {
  const { q1, median, q3, whisker_min, whisker_max, outliers } = props;
  const theme = useTheme();
  // Create data for Plotly box plot
  const data: Data[] = [
    // Main horizontal whisker line
    {
      type: "scatter",
      x: [whisker_min, whisker_max],
      y: [0, 0],
      mode: "lines",
      line: {
        color: theme.palette.primary.main,
        width: 2,
      },
      showlegend: false,
      hoverinfo: "none",
    },
    // Vertical lines at the ends of whiskers
    {
      type: "scatter",
      x: [whisker_min, whisker_min],
      y: [-0.15, 0.15],
      mode: "lines",
      line: {
        color: theme.palette.primary.main,
        width: 2,
      },
      showlegend: false,
      hoverinfo: "none",
    },
    {
      type: "scatter",
      x: [whisker_max, whisker_max],
      y: [-0.15, 0.15],
      mode: "lines",
      line: {
        color: theme.palette.primary.main,
        width: 2,
      },
      showlegend: false,
      hoverinfo: "none",
    },
    // Box (q1 to q3)
    {
      type: "box",
      x: [q1, q3, q3, q1, q1],
      fill: "toself",
      fillcolor: theme.palette.primary.light,
      line: {
        color: theme.palette.primary.main,
        width: 2,
      },
      showlegend: false,
      hoverinfo: "x",
      name: "IQR",
    },
    // Median line
    {
      type: "scatter",
      x: [median, median],
      y: [-0.25, 0.25],
      mode: "lines",
      marker: { color: "#2ca02c" },
      showlegend: false,
      hoverinfo: "x",
      name: "Median",
    },
  ];
  // TODO also plot outliers
  // // Add outliers if they exist
  // if (outliers && outliers.length > 0) {
  //     data.push({
  //         type: 'scatter',
  //         x: outliers,
  //         y: Array(outliers.length).fill(0),
  //         mode: 'markers',
  //         marker: {
  //             color: '#333',
  //             size: 6
  //         },
  //         showlegend: false,
  //         hoverinfo: 'x',
  //         name: 'Outliers'
  //     });
  // }

  const layout = {
    autosize: true,
    willReadFrequently: true,
    plot_bgcolor: `${theme.palette.background.default}`,
    paper_bgcolor: `${theme.palette.background.default}`,
    font: { color: `${theme.palette.text.primary}` },
    margin: plotMargins,
    xaxis: {
      showticklabels: false,
      showgrid: false,
      zeroline: false,
    },
    yaxis: {
      showticklabels: false,
      showgrid: false,
      zeroline: false,
    },
  };

  const plotStyle = {
    height: 100,
    borderRadius: "8px",
    overflow: "hidden",
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    staticPlot: true,
  };

  return <Plot data={data} layout={layout} config={config} style={plotStyle} />;
};

export default WhiskerPlot;
