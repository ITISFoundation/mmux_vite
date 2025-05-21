import { useState, useContext, useEffect } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Input } from '@mui/material';
import { FunctionList } from '../components/FunctionList';
import MMUXContext from './MMUXContext';
import PlusButton from '../components/PlusButton';
import usePersistentJSONState from '../hooks/usePersistentJSONState';
import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import { Function, FunctionJob } from '../osparc-api-ts-client';
import ParallelRunner from './ParallelRunner';

function runGridSearchSampling(config: unknown[]) {
    console.log("Grid Search Sampling not implemented yet!", config)
}


function GridSearchSampling() {
    const context = useContext(MMUXContext);
    const inputVars = context?.selectedFunction?.inputSchema.required as string[];
    const [JSONStateFilePath, setJSONStateFilePath] = useState("");
    // Needed to move the filePath outside of the PersistentJSONState hook to avoid triggering infinite loops
    // Now it works and I have persistence even across sessions :)

    const [gridSearchInputs, setGridSearchInputs] = usePersistentJSONState({
        defaultState: inputVars.map((inputVar) => ({
            variable: inputVar,
            start: 0.0,
            end: 1.0,
            points: 10,
        })),
        filePath: JSONStateFilePath
    });

    useEffect(() => {
        if (context?.selectedFunction) {
            const funname = context?.selectedFunction?.name.replace(/\s+/g, "_");
            setJSONStateFilePath(`src/assets/gridSearchInputs_${funname}.json`);
        }
    }, [context?.selectedFunction]);


    function handleInputChange(index: number, field: string, value: string) {
        setGridSearchInputs((prevInputs: PersistentState[]) => {
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
            <h4>Grid Search Sampling</h4>
            <p>Specify the ranges and number of points per dimension for the grid search sampling.</p>
            {gridSearchInputs?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "20px", }}>
                    <h5 style={{ marginLeft: 10, marginRight: 20, marginBottom: 0, marginTop: 0, fontSize: 18 }}>{inputVar.variable}</h5>
                    <span>Start: </span>
                    <Input
                        type="number"
                        placeholder="Start"
                        value={inputVar.start.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <span>End: </span>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "end", e.target.value)}
                    />
                    <span>Number of points: </span>
                    <Input
                        type="number"
                        placeholder="Points"
                        value={inputVar.points.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "points", e.target.value)}
                    />
                </form>
            ))}

            <Button onClick={() => runGridSearchSampling(gridSearchInputs)}>Run Grid Search Sampling</Button>
        </>
    );
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

async function runFunctionJob(fun: Function, row: Record<string, any>): Promise<FunctionJob> {
    console.log("Input schema: ", fun.inputSchema);
    var inputValues = Object.keys(fun.inputSchema).reduce((acc, key) => {
        if (key in row) {
            acc[key] = row[key];
        } else {
            console.warn(`Missing value for input key: ${key}`);
        }
        return acc;
    }, {} as Record<string, any>);
    let job = await FUNCTION_API.runFunction(
        fun.uid as number,
        JSON.stringify(inputValues)// Convert input values to a comma-separated string with key-value pairs
    )
    return job
}

function LHSSampling() {
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
            <h4>LHS Sampling</h4>
            <p>Specify total number of points, as well as the ranges of each parameter.</p>
            {lhsInputs?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "20px", }}>
                    <h5 style={{ marginLeft: 10, marginRight: 20, marginBottom: 0, marginTop: 0, fontSize: 18 }}>{inputVar.variable}</h5>
                    <span>Start: </span>
                    <Input
                        type="number"
                        placeholder="Start"
                        value={inputVar.start.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <span>End: </span>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "end", e.target.value)}
                    />
                </form>
            ))}

            <form style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "40px", }}>
                <span>Number of sampling points: </span>
                <Input
                    type="number"
                    placeholder="N"
                    value={lhsInputs[0].points.toString()}
                    sx={{ width: 100 }}
                    onChange={(e) => handleInputChange(0, "points", e.target.value)}
                />
                <Button variant="contained" onClick={() => runLhsSampling(context?.selectedFunction as Function, lhsInputs)}>Run LHS Sampling</Button>
            </form>
            <p>Note: The LHS sampling will be run in the background, and you can check the status of the jobs in the Parallel Runner.</p>
            <ParallelRunner />
            {/* TODO have a nicer way to display ParallelRUnner (just bar to start with; allow toggle of the detailed cards?) */}
        </>
    );
}

export default function Setup() {
    const [showFunctionIndex, setShowFunctionIndex] = useState(false)
    const context = useContext(MMUXContext)

    return (
        <MetaModelingUX tabTitle="Base Function Selection" headerType="header">
            {/* TODO convert into a toggle? and move the "Next" to the bottom? */}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px" }}>
                <Button onClick={() => setShowFunctionIndex(!showFunctionIndex)}>
                    <h5> Select Function</h5>
                </Button>
                <Button disabled={context?.selectedFunction === undefined}
                    onClick={() => context?.setCurrentView(context.currentView + 1)}>
                    Next Step
                </Button>
            </div>
            {showFunctionIndex && <FunctionList functions={[]} />}

            {/* Include grid / LHS runner here (specify ranges, N points...) */}
            <PlusButton
                onClickFun={() => null}
                PlotFunComponent={() => {
                    // ONGOING implement LHS / grid sampling setup & Run as an ELement (or bunch of them)
                    return (
                        <div>
                            {/* {<GridSearchSampling />} */}
                            {<LHSSampling />}
                        </div>
                    );
                }}
                text="Create new sampling campaign"
                enabled={context?.selectedFunction !== undefined}
            />
        </MetaModelingUX >
    );
}

