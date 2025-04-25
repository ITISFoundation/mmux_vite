import React from 'react'
import Plot from 'react-plotly.js';

type PlotDataType = {
    data: any,
    inputVars: string[],
}

const PlotDataTogether = (props: PlotDataType) => {
    const { data, inputVars } = props
    let plotData = [];
    for (let i = 0; i < inputVars.length - 1; i++) {
        plotData.push(
            {
                x: data[inputVars[i]].x,
                y: data[inputVars[i]].y_hat,
                type: 'scatter',
                xaxis: `x${i + 1}`,
                yaxis: `y${i + 1}`,
                name: inputVars[i],
            },
        )
    }

    return <>
        <Plot
            data={plotData}
            layout={{ width: 900, height: 620, title: { text: 'General Plot' }, grid: { rows: 4, columns: 3, pattern: 'independent' } }}
        />
    </>
}

export default PlotDataTogether