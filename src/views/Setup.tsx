import { useState, useContext, useEffect, use } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Input } from '@mui/material';
import { FunctionList } from '../components/FunctionIndex';
import MMUXContext from './MMUXContext';
import PlusButton from '../components/PlusButton';
import usePersistentJSONState from '../hooks/usePersistentJSONState';

function runGridSearchSampling(points: any[]) {
    console.log("Grid Search Sampling not implemented yet!")
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
        setGridSearchInputs((prevInputs: any) => {
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
                    <text>Start: </text>
                    <Input
                        type="number"
                        placeholder="Start"
                        value={inputVar.start.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "start", e.target.value)}
                    />
                    <text>End: </text>
                    <Input
                        type="number"
                        placeholder="End"
                        value={inputVar.end.toString()}
                        sx={{ width: 100 }}
                        onChange={(e) => handleInputChange(index, "end", e.target.value)}
                    />
                    <text>Number of points: </text>
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

export default function Setup() {
    const [showFunctionIndex, setShowFunctionIndex] = useState(false)
    const context = useContext(MMUXContext)

    return (
        < MetaModelingUX tabTitle="Base Function Selection" headerType="setup-header">
            {/* TODO convert into a toggle? and move the "Next" to the bottom? */}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px" }}>
                <Button onClick={() => setShowFunctionIndex(!showFunctionIndex)}>
                    <h5> Select Function</h5>
                </Button>
                <Button disabled={context?.selectedFunction === undefined}
                    onClick={() => context?.setCurrentView(context.currentView + 1)}>
                    Next Screen
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
                            <h4>Sampling Campaign Setup</h4>
                            <p>Specify the ranges and number of points for the sampling campaign.</p>
                            {<GridSearchSampling />}
                        </div>
                    );
                }}
                text="Create new sampling campaign"
                enabled={context?.selectedFunction !== undefined}
            />
        </MetaModelingUX >
    );
}

