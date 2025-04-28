import React from 'react'
import Plot from 'react-plotly.js';

type PlotDataType = {
    data: any,
    inputVars: string[],
    qoi: string,
}

const PlotDataTogether = (props: PlotDataType) => {
    const { data, inputVars, qoi } = props
    let plotData = [];
    for (let i = 0; i < inputVars.length - 1; i++) {
        plotData.push(
            {
                x: data[inputVars[i]].x,
                y: data[inputVars[i]].y_hat,
                xaxis: `x${i + 1}`,
                yaxis: `y`,
                name: inputVars[i],
                title: inputVars[i],
            },
        )
    }
    console.log(inputVars)
    console.log(qoi)
    let subplot_config = [inputVars.map((_, i) => `x${i + 1}y`)]
    return (<>
        <Plot
            data={plotData}
            layout={{
                title: { text: qoi },
                width: 1900,
                height: 320,
                grid: { rows: 1, columns: inputVars.length, subplots: subplot_config, },
                showlegend: false,
                // yaxis: {
                //     range: [0, 10], title: 'Y-axis 1', side: 'left', position: 0, anchor: 'free',
                //     domain: [0.7, 1.0]
                // }, // Y-axis 1 with manual position
                // xaxis: { range: [0, 5], domain: [0.1, 0.9] }, // Adjust x-axis domain to make space for the y-axis text

            }}
            config={{ responsive: true }}
        />
    </>)
}

export default PlotDataTogether