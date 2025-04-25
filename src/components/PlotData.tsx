import React from 'react'
import Plot from 'react-plotly.js';

type PlotDataType = {
    data: any,
    inputVars: string[],
}

const PlotData = (props: PlotDataType) => {
    const { data, inputVars } = props
    let plots = [];
    for (let i = 0; i < inputVars.length - 1; i++) {
        plots.push(
            <Plot
                data={[
                    {
                        x: data[inputVars[i]].x,
                        y: data[inputVars[i]].y_hat,
                        type: 'scatter',
                        mode: 'lines+markers',
                        marker: { color: 'red' },
                    },
                ]}
                layout={{ width: 600, height: 420, title: { text: inputVars[i] } }}
            />
        )
    }

    return <>
        {plots}
    </>
}

export default PlotData