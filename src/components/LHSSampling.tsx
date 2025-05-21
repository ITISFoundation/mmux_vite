import { useContext, useEffect, useState } from 'react';
import MMUXContext from '../views/MMUXContext';
import usePersistentJSONState from '../hooks/usePersistentJSONState';
import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import JobsDashboard from '../views/ParallelRunner';
import { Box, Button, Input, Typography } from '@mui/material';
import { Function, FunctionJob, FunctionJobCollection, RegisteredFunctionJobCollection } from '../osparc-api-ts-client';



async function runLhsSampling(fun: Function, config: any[], seed: number = 0, N: number = 5) {
    const context = useContext(MMUXContext);
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
    return jc
} // Now the LHS is both created & submitted to OSPARC API through the Python Backend. Implement. 
// What should I return here? 
// would be nice to have an "spinning" symbol while everything is getting done in the backend
// also, in the ParallelRunner dashboard, would be nice to see only that one JobCollection - how? simply get latest for the selected function (and only render when click "Run")
// ParallelRunner bar should show only when running something; clicking on it allows to "toggle down" the dashboard itself.

const LHSSampling = () => {
    const context = useContext(MMUXContext);
    const inputVars = context?.selectedFunction?.inputSchema.schemaContent.required as string[];
    const [JSONStateFilePath, setJSONStateFilePath] = useState("");
    // Needed to move the filePath outside of the PersistentJSONState hook to avoid triggering infinite loops
    // Now it works and I have persistence even across sessions :)
    const [lhsInputs, setLhsInputs] = usePersistentJSONState<PersistentState[]>({
        defaultState: inputVars.map((inputVar) => ({
            variable: inputVar,
            start: 0.0,
            end: 1.0,
            points: 5, // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
            seed: 0,  // FIXME stored here for ease of save-load as PersistentJSONState. Ideally should move somewhere else.
        })),
        filePath: JSONStateFilePath
    });


    useEffect(() => {
        if (context?.selectedFunction) {
            const funname = context?.selectedFunction?.title?.replace(/\s+/g, "_");
            setJSONStateFilePath(`src/assets/LhsInputs_${funname}.json`);
        }
    }, [context?.selectedFunction]);

    function CreateSamplingButton() {
        const handleRunSampling = () => {
            context?.setLaunchingSampling(true)
            runLhsSampling(context?.selectedFunction as Function, lhsInputs)
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
                {/* FIXME the spinner ddoes not work anymore */}
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
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <Typography variant='caption'>End: </Typography>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={{ width: 100 }}
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
                    sx={{ width: 100 }}
                    onChange={(e) => handleInputChange(0, "points", e.target.value)}
                />
                <Typography variant='body1'>Seed: </Typography>
                <Input
                    type="number"
                    placeholder="seed"
                    value={lhsInputs[0].seed?.toString()}
                    sx={{ width: 100 }}
                    onChange={(e) => handleInputChange(0, "seed", e.target.value)}
                />
                < CreateSamplingButton />
                {/* TODO should we have a "cancel run" option? */}
                {/* TODO make a "loading" symbol while the callback executes, as in SuMo creation */}
            </form>
            {context?.runningSampling ? <JobsDashboard progressBarOnly={true} /> : undefined}
        </>
    );
}



export default LHSSampling;