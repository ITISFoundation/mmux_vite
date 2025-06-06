import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { FunctionJob } from '../osparc-api-ts-client/models/FunctionJob';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { useMMUXContext } from '../context/MMUXContext';
import { Data } from 'plotly.js';

type GPPrediction = {
    x: number[];
    y_hat: number[];
    std_hat: number[];
};

const Curves1DPlots = () => {
    const { inputVars, selectedQoI, filterSelectedJobList } = useMMUXContext();
    const [plotData, setPlotData] = useState<Array<Data>>([]);
    console.log("InputVars to 1D curves: ", inputVars)
    console.log("QoI to 1D curves: ", selectedQoI)

    const RunCentralSuMoInterpolations = async (jobs: FunctionJob[]) => {
        console.log("Evaluating SuMo for 1D curves...");
        fetch(
            PYTHON_DAKOTA_BACKEND + '/flask/sumo_along_axes',
            {
                method: "POST",
                body: JSON.stringify(
                    {
                        inputs: inputVars,
                        output: selectedQoI,
                        FunctionJobs: jobs,
                        log: false,
                    }
                ),
            }).then(function (response) {
                return response.json()
            }).then(function (data) {
                console.log("1D retrieved data: ", data);
                createPlotData(data)
            }).catch(error => console.debug('Error:', error));
    }

    useEffect(() => {
        const run = async () => {
            const jobs = filterSelectedJobList();
            return await RunCentralSuMoInterpolations(jobs)
        };
        run();
    }, []);

    const w = 1 / inputVars.length
    const padding = 0.2 // this means 20% of each figure size
    const createPlotData = (data: Record<string, GPPrediction>) => {
        if (!data || Object.keys(data).length === 0) {
            console.warn("No data available for plotting.");
            setPlotData([]);
        } else {

            const newData: Data[] = [
                ...inputVars.flatMap((varName) => {
                    const x = data[varName]?.x || [];
                    const y_hat = data[varName]?.y_hat || [];
                    const std_hat = data[varName]?.std_hat || [];
                    const traces: Data[] = [
                        {
                            x,
                            y: y_hat,
                            name: varName,
                            xaxis: `x${inputVars.indexOf(varName) + 1}`,
                            yaxis: 'y',
                            mode: 'lines',
                            line: { color: 'blue' },
                        }
                    ];
                    if (std_hat.length === y_hat.length) {
                        traces.push(
                            {
                                x,
                                y: y_hat.map((y, i) => y + 2 * std_hat[i]),
                                name: `${varName} +2σ`,
                                xaxis: `x${inputVars.indexOf(varName) + 1}`,
                                yaxis: 'y',
                                mode: 'lines',
                                line: { color: 'rgba(0,0,255,0.3)', dash: 'dot' },
                                fill: 'tonexty',
                                showlegend: false,
                            },
                            {
                                x,
                                y: y_hat.map((y, i) => y - 2 * std_hat[i]),
                                name: `${varName} -2σ`,
                                xaxis: `x${inputVars.indexOf(varName) + 1}`,
                                yaxis: 'y',
                                mode: 'lines',
                                fill: 'tonexty',
                                line: { color: 'rgba(0,0,255,0.3)', dash: 'dot' },
                                showlegend: false,
                            }
                        );
                    }
                    return traces;
                })
            ]
            setPlotData(newData);
            console.log("Registered plotData: ", newData);
        }
    }
    const createXAxes = () => {
        const xAxes = [];
        for (let i = 0; i < inputVars.length; i++) {
            const domain = [i * w + padding / 2 * w, (i + 1) * w - padding / 2 * w];
            xAxes.push({
                title: { text: inputVars[i] },
                domain: domain,
                // for some reason, different x-scales produce different plot sizes? 
                anchor: 'y',
                autorange: true,
                nticks: 4,
            });
        }
        return xAxes;
    }

    const subplot_config = inputVars.map((_, i) => `x${i + 1}y`);
    const xAxes = createXAxes();
    return <Plot
        data={plotData}
        layout={{
            title: { text: selectedQoI },
            width: 380 * inputVars.length,
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


export default Curves1DPlots;