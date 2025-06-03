import { useContext, useState } from 'react';
import Plot from 'react-plotly.js';
import { FunctionJob } from '../osparc-api-ts-client/models/FunctionJob';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { useMMUXContext } from '../context/MMUXContext';

type DataEntry = {
    x: number[];
    y_hat: number[];
};



const Curves1DPlots = () => {
    const { jobs, inputVars, selectedQoI } = useMMUXContext();
    const [data, setDataSumoCentralCurves] = useState(undefined)
    console.log("InputVars to 1D curves: ", inputVars)
    console.log("QoI to 1D curves: ", selectedQoI)
    let plotData = [];
    let xAxes = [];

    // TODO move this to the PlotComponent (same as the 2D and 3D plots)
    async function RunPlotCentralSuMoInterpolations() {
        console.log("Evaluating SuMo for 1D curves...");
        fetch(
            PYTHON_DAKOTA_BACKEND + '/flask/sumo_along_axes',
            {
                method: "POST",
                body: JSON.stringify(
                    {
                        inputs: inputVars,
                        output: selectedQoI,
                        FunctionJobs: jobs, // TODO bfr this was UIDs, now it is the full job info
                        log: false,
                    }
                ),
            }).then(function (response) {
                return response.json()
            }).then(function (data) {
                setDataSumoCentralCurves(data)
            }).catch(error => console.debug('Error:', error));
    }
    // TODO run sumo here, to get data. Use similar workflow as I was doing before.

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


        const subplot_config = inputVars.map((_, i) => `x${i + 1}y`);
        return <Plot
            data={plotData}
            layout={{
                // title: { text: qoi },
                width: 180 * inputVars.length,
                height: 300,
                grid: { rows: 1, columns: inputVars.length, subplots: subplot_config },
                yaxis: {
                    // title: { text: qoi }, 
                    showgrid: true, anchor: 'x'
                },
                ...xAxes.reduce((acc, axis, i) => ({ ...acc, [`xaxis${i + 1}`]: axis }), {}),
                showlegend: false,
            }}
            config={{ responsive: true }}
        />
    }
};

export default Curves1DPlots;