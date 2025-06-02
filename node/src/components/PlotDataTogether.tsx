import { useContext, useState } from 'react';
import Plot from 'react-plotly.js';
import MMUXContext from '../views/MMUXContext';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { FunctionJob } from '../osparc-api-ts-client/models/FunctionJob';

type PredictedData = {
    x: ;
    y: ;
    y_hat: ;
    std: ;
}
type PlotInputData = {
    jobs: FunctionJob[]
}
const Curves1DPlots = (props: PlotInputData) => {
    const { jobs } = props
    const context = useContext(MMUXContext);
    const [data, setDataSumoCentralCurves] = useState(undefined)
    console.log("InputVars to 1D curves: ", context?.inputVars)
    console.log("QoI to 1D curves: ", context?.selectedQoI)
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
                        inputs: context?.inputVars,
                        output: context?.selectedQoI,
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

    if (data === undefined || context?.inputVars === undefined) {
        return <span>Loading...</span>;
    } else {
        for (let i = 0; i < context?.inputVars.length; i++) {
            plotData.push({
                x: data[context?.inputVars[i]].x,
                y: data[context?.inputVars[i]].y_hat,
                name: context?.inputVars[i],
                xaxis: `x${i + 1}`,
                yaxis: `y`,
            });

            const w = 1 / context?.inputVars.length
            const padding = 0.2 // this means 20% of each figure size
            const domain = [i * w + padding / 2 * w, (i + 1) * w - padding / 2 * w]
            xAxes.push({
                title: { text: context?.inputVars[i] },
                domain: domain,
                // for some reason, different x-scales produce different plot sizes? 
                anchor: 'y',
                autorange: true,
                nticks: 4,
            });
        }

        let subplot_config = [context?.inputVars.map((_, i) => `x${i + 1}y`)]
        return <Plot
            data={plotData}
            layout={{
                // title: { text: qoi },
                width: 180 * context?.inputVars.length,
                height: 300,
                grid: { rows: 1, columns: context?.inputVars.length, subplots: subplot_config },
                yaxis: {
                    // title: { text: qoi }, 
                    showgrid: true, anchor: 'x1'
                },
                ...xAxes.reduce((acc, axis, i) => ({ ...acc, [`xaxis${i + 1}`]: axis }), {}),
                showlegend: false,
            }}
            config={{ responsive: true }}
        />

    }
};

export default Curves1DPlots;