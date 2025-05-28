import { useContext, useState } from 'react';
import MMUXContext, { MMUXContextType } from '../views/MMUXContext';
import { PYTHON_DAKOTA_BACKEND } from '../utils/api_objects';
import { Box, Button, Input, Typography } from '@mui/material';
import { Function, RegisteredFunctionJobCollection } from '../osparc-api-ts-client';



async function runLhsSampling(context: MMUXContextType | undefined, config: any[], seed: number = 0, N: number = 5) {
    const fun = context?.selectedFunction as Function;
    // send config to Python backend to create LHS
    console.log("Running LHS Sampling with config: ", config);
    context?.setLaunchingSampling(true)
    const jc = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/lhs_sampling',
        {
            method: "POST",
            body: JSON.stringify(
                {
                    funUid: fun.uid,
                    config: config,
                    seed: seed,
                    N: N,
                }
            ),
        }).then(function (response) {
            return response.json()
        }).then(function (jc: RegisteredFunctionJobCollection) {
            console.log("JobCollection Uid: ", jc.uid);
            return jc
        }).catch(function (error) {
            console.error("Error running LHS sampling: ", error);
        })
    context?.setLaunchingSampling(false)
    context?.setRunningSampling(true)
    context?.setRunningJobCollection(jc ? jc : undefined)
    return jc
}


const LHSSampling = () => {
    const context = useContext(MMUXContext);
    const inputVars = context?.inputVars as string[];
    const [lhsInputs, setLhsInputs] = useState(
        inputVars.map((inputVar) => ({
            variable: inputVar,
            start: 0.0,
            end: 1.0,
            points: 5, // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
            seed: 0,  // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
        })),
    )

    function CreateSamplingButton() {
        const handleRunSampling = () => {
            context?.setLaunchingSampling(true)
            runLhsSampling(context, lhsInputs)
            setTimeout(() => {
                // for now the request fails very quickly
                context?.setLaunchingSampling(false)
                context?.setRunningSampling(true)
            }, 3000);
            // TODO have some way to detect that it finished running; and set the corresponding context variable to False
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                {/* <Button variant="contained" onClick={() => }>Run LHS Sampling</Button> */}

                <Button
                    onClick={handleRunSampling}
                    disabled={(context?.launchingSampling || context?.runningSampling)}
                >
                    {context?.launchingSampling ? "Launching..." : context?.runningSampling ? "Running..." : "Run Sampling"}
                </Button>
                {context?.launchingSampling && <Box className="spinner" />}
            </Box>
        );
    }

    function handleInputChange(index: number, field: string, value: string) {
        setLhsInputs((prevInputs) => {
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
            {lhsInputs?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "16px", }}>
                    <Typography variant='h6'>{inputVar.variable}:</Typography>
                    <Typography variant='caption'>Start: </Typography>
                    <Input
                        type="number"
                        placeholder="Start"
                        value={inputVar.start.toString()}
                        sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}`})}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <Typography variant='caption'>End: </Typography>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}`})}
                        onChange={(e) => handleInputChange(index, "end", e.target.value)}
                    />
                </form>
            ))}

            <form style={{ display: "flex", alignItems: "center", gap: "40px", }}>
                <Typography variant='body1'>Number of sampling points: </Typography>
                <Input
                    type="number"
                    placeholder="N"
                    value={lhsInputs[0].points.toString()}
                    sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}`})}
                    onChange={(e) => handleInputChange(0, "points", e.target.value)}
                />
                <Typography variant='body1'>Seed: </Typography>
                <Input
                    type="number"
                    placeholder="seed"
                    value={lhsInputs[0].seed?.toString()}
                    sx={(theme) => ({ width: 100, borderBottom: `1px solid ${theme.palette.background.paper}`})}
                    onChange={(e) => handleInputChange(0, "seed", e.target.value)}
                />
                < CreateSamplingButton />
                {/* TODO should we have a "cancel run" option? */}
                {/* TODO make a "loading" symbol while the callback executes, as in SuMo creation */}
            </form>
        </>
    );
}



export default LHSSampling;