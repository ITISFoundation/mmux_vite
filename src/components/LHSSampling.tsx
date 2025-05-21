import { useContext, useEffect, useState } from 'react';
import MMUXContext from '../views/MMUXContext';
import usePersistentJSONState from '../hooks/usePersistentJSONState';
import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import ParallelRunner from '../views/ParallelRunner';
import { Button, Input, Typography } from '@mui/material';
import { Function, FunctionJob } from '../osparc-api-ts-client';


async function runFunctionJob(fun: Function, row: Record<string, any>): Promise<FunctionJob> {
    console.log("Input schema: ", fun.inputSchema);
    const inputValues = Object.keys(fun.inputSchema).reduce((acc, key) => {
        if (key in row) {
            acc[key] = row[key];
        } else {
            console.warn(`Missing value for input key: ${key}`);
        }
        return acc;
    }, {} as Record<string, any>);
    // TODO: FIX FUNCTION_API CALL from the API
    const job: FunctionJob = {} as unknown as FunctionJob;
    // const job = await FUNCTION_API.runFunction(
    //     fun.uid as number,
    //     JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
    // )
    return job
}

async function runLhsSampling(fun: Function, config: any[], seed: number = 0) {
    // send config to Python backend to create LHS
    console.log("Running LHS Sampling with config: ", config);
    const samples = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/lhs_sampling',
        {
            method: "POST",
            body: JSON.stringify(
                {
                    config: config,
                    seed: seed,
                }
            ),
        }).then(function (response) {
            return response.json()
        }).then(function (points) {
            console.log("LHS Sampling points: ", points);
            return points
        }).catch(function (error) {
            console.error("Error running LHS sampling: ", error);
        })

    // run jobs of the selected function based on the API
    // const context = useContext(MMUXContext);
    console.log("Running jobs for LHS samples: ", samples);
    const jobs = await Promise.all(samples.map((jobInput: any) => {
        return runFunctionJob(fun, jobInput);
    }));
    console.log("Jobs created: ", jobs);
}

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
            points: 5,
        })),
        filePath: JSONStateFilePath
    });

    useEffect(() => {
        if (context?.selectedFunction) {
            const funname = context?.selectedFunction?.title?.replace(/\s+/g, "_");
            setJSONStateFilePath(`src/assets/LhsInputs_${funname}.json`);
        }
    }, [context?.selectedFunction]);


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
            <Typography variant='h4' marginBottom={1}>LHS Sampling</Typography>
            <Typography variant='body1' marginBottom={1}>Specify total number of points, as well as the ranges of each parameter.</Typography>
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
                <Button variant="contained" onClick={() => runLhsSampling(context?.selectedFunction as Function, lhsInputs)}>Run LHS Sampling</Button>
            </form>
            <Typography variant='body1' marginTop={2}>Note: The LHS sampling will be run in the background, and you can check the status of the jobs in the Parallel Runner.</Typography>
            <ParallelRunner />
            {/* TODO have a nicer way to display ParallelRUnner (just bar to start with; allow toggle of the detailed cards?) */}
        </>
    );
}

export default LHSSampling;