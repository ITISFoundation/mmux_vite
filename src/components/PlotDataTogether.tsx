import React from 'react';
import Plot from 'react-plotly.js';

type PlotDataType = {
    data: any,
    inputVars: string[],
    qoi: string,
};

const PlotDataTogether = (props: PlotDataType) => {
    const { data, inputVars, qoi } = props;
    let plotData = [];
    let xAxes = [];

    for (let i = 0; i < inputVars.length; i++) {
        plotData.push({
            x: data[inputVars[i]].x,
            y: data[inputVars[i]].y_hat,
            name: inputVars[i],
            xaxis: `x${i + 1}`,
            yaxis: `y`,
        });

        const w = 1 / inputVars.length
        const padding = 0.2 // this means 20% of each figure size
        const domain = [i * w + padding / 2 * w, (i + 1) * w - padding / 2 * w]
        xAxes.push({
            title: { text: inputVars[i] },
            domain: domain,
            // for some reason, different x-scales produce different plot sizes? 
            anchor: 'y',
            autorange: true,
            nticks: 4,
        });
    }

    let subplot_config = [inputVars.map((_, i) => `x${i + 1}y`)]
    return (
        <Plot
            data={plotData}
            layout={{
                // title: { text: qoi },
                width: 180 * inputVars.length,
                height: 300,
                grid: { rows: 1, columns: inputVars.length, subplots: subplot_config },
                yaxis: {
                    // title: { text: qoi }, 
                    showgrid: true, anchor: 'x1'
                },
                ...xAxes.reduce((acc, axis, i) => ({ ...acc, [`xaxis${i + 1}`]: axis }), {}),
                showlegend: false,
            }}
            config={{ responsive: true }}
        />
    );
};

export default PlotDataTogether;