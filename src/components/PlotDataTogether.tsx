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

        xAxes.push({
            title: { text: inputVars[i] },
            domain: [i / inputVars.length, (i + 1) * 0.5 / inputVars.length],
            // for some reason, different x-scales produce different plot sizes? 
            anchor: 'y',
            autorange: true,
            nticks: 4,
            // tickwidth: 1,
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
                grid: { rows: 1, columns: inputVars.length, subplots: subplot_config, },
                yaxis: { showgrid: true },
                ...xAxes.reduce((acc, axis, i) => ({ ...acc, [`xaxis${i + 1}`]: axis }), {}),
                showlegend: false,
            }}
            config={{ responsive: true }}
        />
    );
};

export default PlotDataTogether;