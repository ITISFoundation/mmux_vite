import React from "react";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";

const PLOT_WIDTH = 300;
const PLOT_HEIGHT = 60;

const WhiskerPlot: React.FC<dataUQHistogramType> = (props: dataUQHistogramType) => {
    const { q1, median, q3, whisker_min, whisker_max, outliers } = props
    // Create data for Plotly box plot
    const data: Data[] = [
        // Main horizontal whisker line
        {
            type: 'scatter',
            x: [whisker_min, whisker_max],
            y: [0, 0],
            mode: 'lines',
            line: {
                color: '#333',
                width: 2
            },
            showlegend: false,
            hoverinfo: 'none'
        },
        // Vertical lines at the ends of whiskers
        {
            type: 'scatter',
            x: [whisker_min, whisker_min],
            y: [-0.15, 0.15],
            mode: 'lines',
            line: {
                color: '#333',
                width: 2
            },
            showlegend: false,
            hoverinfo: 'none'
        },
        {
            type: 'scatter',
            x: [whisker_max, whisker_max],
            y: [-0.15, 0.15],
            mode: 'lines',
            line: {
                color: '#333',
                width: 2
            },
            showlegend: false,
            hoverinfo: 'none'
        },
        // Box (q1 to q3)
        {
            type: 'scatter',
            x: [q1, q3, q3, q1, q1],
            y: [-0.25, -0.25, 0.25, 0.25, -0.25],
            fill: 'toself',
            fillcolor: '#cce5ff',
            line: {
                color: '#333',
                width: 2
            },
            showlegend: false,
            hoverinfo: 'x',
            name: 'IQR'
        },
        // Median line
        {
            type: 'scatter',
            x: [median, median],
            y: [-0.25, 0.25],
            mode: 'lines',
            line: {
                color: '#333',
                width: 2
            },
            showlegend: false,
            hoverinfo: 'x',
            name: 'Median'
        },
        // {
        //     type: "box",
        //     q1: 1,
        // }
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
        width: PLOT_WIDTH,
        height: PLOT_HEIGHT,
        margin: {
            l: 2,
            r: 2,
            t: 2,
            b: 2,
            pad: 0
        },
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
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
    };

    const config = {
        displayModeBar: false,
        responsive: true,
        staticPlot: true,
    };

    return (
        <Plot
            data={data}
            layout={layout}
            config={config}
        />
    );
};

export default WhiskerPlot;
