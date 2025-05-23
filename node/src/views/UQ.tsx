import React, { useState, useContext, useEffect } from 'react';
// import FileSelector from '../components/FileSelector';
// import SuMoTypeSelector from '../components/SuMoTypeSelector';
// import OutputResponseSelector from '../components/OutputResponseSelector';
import MMUXContext from './MMUXContext';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Box, Container } from '@mui/material';
import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import { getFunctionJobsFromFunctionUid, getFunctionJobCollections } from '../components/function_utils';

export default function UQ() {
    // Similar to Sumo building
    const context = useContext(MMUXContext)
    const [useSuMo, setUseSuMo] = useState(true);
    const inputVars = context?.selectedFunction?.inputSchema.schemaContent.required as string[]
    const [numSamples, setNumSamples] = useState(10000);
    const [dataUQHistogram, setDataUQHistogram] = useState(undefined)

    async function runUQ(config: any) {
        console.log("Running UQ...");
        // TODO get only those selected in the JobSelector (pass as status??)
        let jobList = await getFunctionJobsFromFunctionUid(context?.selectedFunction?.uid as string);
        console.log("Fetched jobs:", jobList);
        fetch(
            PYTHON_DAKOTA_BACKEND + '/flask/uq_propagation',
            {
                method: "POST",
                body: JSON.stringify(
                    {
                        inputs: inputVars,
                        output: selectedResponse, // TODO this will be in MMUXcontext
                        FunctionJobs: jobList,
                        numSamples: numSamples
                    }
                ),
            }).then(function (response) {
                return response.json()
            }).then(function (data) {
                setDataUQHistogram(data)
            }).catch(error => console.debug('Error:', error));
    }

    // TODO check how I did in the LHS sampling; also use persistent state
    function InputVariableDistributions() {
        // 2 - GUI to select the distribution of each input
        // (auto-save / load of that distribution)
        const [distribution, setDistribution] = useState("normal");
        return (
            <Box sx={{ marginTop: "20px", backgroundColor: "grey", padding: "20px" }}>
                <h3>Input Variable Distributions</h3>

                {inputVars.map((inputVar, index) => {
                    const handleDistributionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        setDistribution(e.target.value);
                    };
                    // const params = distributionParams[distribution] as string[]

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
                                {distribution === "normal" ? <NormalInputDistribution inputVar={inputVar} /> :
                                    distribution === "uniform" ? <UniformInputDistribution inputVar={inputVar} /> :
                                        distribution === "log-normal" ? <LogNormalInputDistribution inputVar={inputVar} /> :
                                            distribution === "exponential" ? <ExponentialInputDistribution inputVar={inputVar} /> : "not found"}

                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    }

    // TODO want to save for each fucntionId & inputVar (or maybe just inputVar)
    // the state so it is preserved across runs, or even when coming back to an old function
    // you used days or months ago. 
    // probably doing by inputVar is best - so modifications of the pipeline (and thus a new function)
    // can keep the same inputs and it is as smooth as possible
    function NormalInputDistribution(inputVar: string) {
        const [mean, setMean] = useState(0.0)
        const [std, setStd] = useState(1.0)

        // TODO save to JSON file? Brainstorm with Alex

        return (
            <div>
                <label>
                    {"Mean: "}:
                    <input
                        type="number"
                        value={mean}
                        onChange={(e) => setMean(parseFloat(e.target.value))}
                    />
                </label>
                <label>
                    {"Standard Deviation: "}:
                    <input
                        type="number"
                        value={std}
                        onChange={(e) => setStd(parseFloat(e.target.value))}
                    />
                </label>
            </div>
        )
    }

    function UniformInputDistribution(inputVar: string) {
        const [mean, setMean] = useState(0.0)
        const [std, setStd] = useState(1.0)

        return (
            <div>
                <label>
                    {"Mean: "}:
                    <input
                        type="number"
                        value={mean}
                        onChange={(e) => setMean(parseFloat(e.target.value))}
                    />
                </label>
                <label>
                    {"Standard Deviation: "}:
                    <input
                        type="number"
                        value={std}
                        onChange={(e) => setStd(parseFloat(e.target.value))}
                    />
                </label>
            </div>
        )
    }

    // Copy the structure from SuMo building; refactor the PY script as a Flask callback. 
    // Fixed Means & Stds (inside Python), will make that customizable later on.
    return (
        <MetaModelingUX tabTitle="Uncertainty Quantification" headerType="uq">
            < Container >
                <Box sx={{
                    justifySelf: 'left',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: "10px",
                    justifyContent: 'space-between',
                    color: '#eee',
                }}>
                    <span>Selected Function: <b>{context?.selectedFunction?.title}</b> </span>
                    <span>Selected Job Campaign(s): <b>TODO</b> </span>
                    <span>Selected QoI: <b>{context?.selectedResponse}</b> </span>
                    {/*
                    <label htmlFor="useSuMo">Use Surrogate Model to perform Uncertainty Quantification</label>
                    <input
                        type="checkbox"
                        id="useSuMo"
                        checked={useSuMo}
                        onChange={(e) => setUseSuMo(e.target.checked)}
                    /> */}

                    <label htmlFor="numSamples">Number of Samples:</label>
                    <input
                        type="number"
                        id="numSamples"
                        defaultValue={10000}
                        onChange={(e) => setNumSamples(Number(e.target.value))}
                    />
                    <InputVariableDistributions />


                </Box>
            </Container >

            {/*
            // 3 - pass fun & jobs to Flask backend, compute UQ, return UQ propagated data
            // 4 -  to plot hist of each input & qoi (in two sep rows) 
            */}



        </MetaModelingUX >
    )
}