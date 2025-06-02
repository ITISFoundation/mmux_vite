import { useState } from 'react';
import { MMUXContextType } from '../views/MMUXContext';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { Box, Button, Input, Typography } from '@mui/material';
import { Function, FunctionJob } from '../osparc-api-ts-client';
import { useMMUXContext } from '../context/MMUXContext';


async function runTestJob(context: MMUXContextType | undefined, config: any[]) {
    const fun = context?.selectedFunction as Function;
    // send config to Python backend to create LHS
    console.log("Running single job with config: ", config);
    context?.setLaunchingSampling(true)
    const j = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/test_job',
        {
            method: "POST",
            body: JSON.stringify(
                {
                    funUid: fun.uid,
                    config: config,
                }
            ),
        }).then(function (response) {
            return response.json()
        }).then(function (j: FunctionJob) {
            console.log("Job Uid: ", j.uid);
            return j
        }).catch(function (error) {
            console.error("Error running single job: ", error);
        })
    context?.setLaunchingSampling(false)
    return j
}


const TestJob = () => {
    const { inputVars, launchingSampling, runningSampling } = useMMUXContext();
    const [jobInputs, setJobInputs] = useState(
        inputVars.map((inputVar) => ({
            variable: inputVar,
            value: 0.0,
        })),
    )

    function CreateSamplingButton() {
        const handleRunSampling = () => {
            const context = useMMUXContext();
            runTestJob(context, jobInputs)
            setTimeout(() => {
                context?.setLaunchingSampling(false)
            }, 3000);
            // TODO have some way to detect that it finished running; and set the corresponding context variable to False
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                {/* <Button variant="contained" onClick={() => }>Run LHS Sampling</Button> */}

                <Button
                    onClick={handleRunSampling}
                    disabled={(launchingSampling || runningSampling)}
                >
                    {launchingSampling ? "Launching..." : runningSampling ? "Running..." : "Run Test Job"}
                </Button>
                {launchingSampling && <Box className="spinner" />}
            </Box>
        );
    }

    function handleInputChange(index: number, field: string, value: string) {
        setJobInputs((prevInputs) => {
            const newInputs = [...prevInputs];
            newInputs[index] = {
                ...newInputs[index],
                [field]: field === "points" ? parseInt(value) : parseFloat(value),
            };
            return newInputs;
        });
    }

    return (
        <>
            <Typography variant='h6' marginBottom={1}>Latin Hypercube Sampling</Typography>
            <Typography variant='body1' marginBottom={1}>Specify total number of sample points that will be computed, as well as the ranges of each parameter.</Typography>
            {jobInputs?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "16px", }}>
                    <Typography variant='h6'>{inputVar.variable}:</Typography>
                    <Typography variant='caption'>Value: </Typography>
                    <Input
                        type="number"
                        placeholder="Value"
                        value={inputVar.value.toString()}
                        sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}` })}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                </form>
            ))}

            < CreateSamplingButton />
        </>
    );
}



export default TestJob;