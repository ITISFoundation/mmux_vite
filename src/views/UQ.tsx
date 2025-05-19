import React, { useState, useContext, useEffect } from 'react';
// import FileSelector from '../components/FileSelector';
// import SuMoTypeSelector from '../components/SuMoTypeSelector';
// import OutputResponseSelector from '../components/OutputResponseSelector';
import MMUXContext from './MMUXContext';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Box, Container } from '@mui/material';

export default function UQ() {
    // Similar to Sumo building
    const context = useContext(MMUXContext)
    const inputVars = context?.selectedFunction?.inputSchema.required as string[]
    const outputVars = context?.selectedFunction?.outputSchema.required as string[]
    const [useSuMo, setUseSuMo] = useState(true);
    const [numSamples, setNumSamples] = useState(10000);

    function runUQ() {
        console.log("Running UQ...");
        // const url = new URL("/flask/query_data", "http://localhost:3001")
        // url.searchParams.append("filename", "asdf")
        // url.searchParams.append("output", selectedResponse)
        const url = '/flask/uq_propagation' + "?filename=" + fileName + "&output=" + selectedResponse + "&inputs=" + inputVars + "&log=" + isLogEnabled
        console.log(url)
        fetch(url)
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(data => {
            })
            .catch(error => console.debug('Error:', error));
    }

    function InputVariableDistributions() {
        // 2 - GUI to select the distribution of each input
        // (auto-save / load of that distribution)
        const [distribution, setDistribution] = useState("normal");
        const [param1, setParam1] = useState("");
        const [param2, setParam2] = useState("");
        const distributionParams = {
            normal: ["Mean", "Standard Deviation"],
            uniform: ["Min", "Max"],
            exponential: ["Rate", ""],
        };
        return (
            <Box sx={{ marginTop: "20px" }}>
                <h3>Input Variable Distributions</h3>
                {inputVars.map((inputVar, index) => {
                    const handleDistributionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        setDistribution(e.target.value);
                        setParam1("");
                        setParam2("");
                    };
                    const params = distributionParams[distribution] as string[]

                    return (
                        <Box key={index} sx={{ marginBottom: "15px" }}>
                            <label>
                                {inputVar} Distribution:
                                <select value={distribution} onChange={handleDistributionChange}>
                                    <option value="normal">Normal</option>
                                    <option value="uniform">Uniform</option>
                                    <option value="exponential">Exponential</option>
                                </select>
                            </label>
                            <Box sx={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <label>
                                    {params[0]}:
                                    <input
                                        type="number"
                                        value={param1}
                                        onChange={(e) => setParam1(e.target.value)}
                                    />
                                </label>
                                {params[1] && (
                                    <label>
                                        {params[1]}:
                                        <input
                                            type="number"
                                            value={param2}
                                            onChange={(e) => setParam2(e.target.value)}
                                        />
                                    </label>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    }

    // Copy the structure from SuMo building; refactor the PY script as a Flask callback. 
    // Fixed Means & Stds (inside Python), will make that customizable later on.
    return (
        <MetaModelingUX tabTitle="Uncertainty Quantification" headerType="header">
            {/* // 1 - Function is selected; tickbox to "use SuMo" ? */}
            < Container >
                <Box sx={{ justifySelf: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: "10px", justifyContent: 'space-between' }}>
                    <text>Selected Function: <b>{context?.selectedFunction?.name}</b> </text>
                    <label htmlFor="useSuMo">Use Surrogate Model to perform Uncertainty Quantification</label>
                    <input
                        type="checkbox"
                        id="useSuMo"
                        checked={useSuMo}
                        onChange={(e) => setUseSuMo(e.target.checked)}
                    />
                    <label htmlFor="numSamples">Number of Samples:</label>
                    <input
                        type="number"
                        id="numSamples"
                        defaultValue={10000}
                        onChange={(e) => setNumSamples(Number(e.target.value))}
                    />
                    {/* <InputVariableDistributions /> */}


                </Box>
            </Container >

            {/*
            // 3 - pass fun & jobs to Flask backend, compute UQ, return UQ propagated data
            // 4 -  to plot hist of each input & qoi (in two sep rows) 
            */}



        </MetaModelingUX >
    )
}