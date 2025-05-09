import { useState, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Input } from '@mui/material';
import { FunctionList } from '../components/FunctionIndex';
import MMUXContext from './MMUXContext';
import PlusButton from '../components/PlusButton';
import { loadJSONState, saveJSONState } from '../components/json_state_utils';

function runGridSearchSampling(points: any[]) {
    console.log("Grid Search Sampling not implemented yet!")
}

function GridSearchSampling() {
    const context = useContext(MMUXContext)
    const inputVars = context?.selectedFunction?.inputSchema.required as string[]
    const [gridSearchInputs, setGridSearchInputs] = useState<any[]>([]);
    // TODO at some point, this should be a list of objects (keyed by function uuid) and only the changed values be modified; thus state within service kept indefinitely

    function updateGridSearchInputs() {
        // gather all input and save to the gridSearchInputs (not just the one that was changed)
        inputVars.forEach((inputVar, index) => {
            const startInput = document.querySelectorAll('input[placeholder="Start"]')[index] as HTMLInputElement;
            const endInput = document.querySelectorAll('input[placeholder="End"]')[index] as HTMLInputElement;
            const pointsInput = document.querySelectorAll('input[placeholder="Points"]')[index] as HTMLInputElement;

            setGridSearchInputs((prevInputs) => {
                const newInputs = [...prevInputs];
                newInputs[index] = {
                    variable: inputVar,
                    start: parseFloat(startInput.value),
                    end: parseFloat(endInput.value),
                    points: parseInt(pointsInput.value),
                };
                return newInputs;
            });
        });
        // Save the updated gridSearchInputs to a JSON file using the FlaskAPI 
        const filePath = '/home/jgo/itis/mmux_vite/src/assets/gridSearchInputs.json';
        console.log("Saving gridSearchInputs ", gridSearchInputs, " to ", filePath);
        saveJSONState(gridSearchInputs, filePath)
        // To ensure sync with the file (and that operations on the input data are displayed to the user)
        // load the data & apply it to the state
        loadJSONState(filePath, setGridSearchInputs);
        // then, apply it to the actual input fields (otherwise what the user sees might not be the actual state!)
        inputVars.forEach((inputVar, index) => {
            const startInput = document.querySelectorAll('input[placeholder="Start"]')[index] as HTMLInputElement;
            const endInput = document.querySelectorAll('input[placeholder="End"]')[index] as HTMLInputElement;
            const pointsInput = document.querySelectorAll('input[placeholder="Points"]')[index] as HTMLInputElement;
            if (gridSearchInputs[index]?.variable === inputVar) {
                // startInput.value = gridSearchInputs[index].start.toString();
                startInput.value = "42";
                endInput.value = gridSearchInputs[index].end.toString();
                pointsInput.value = gridSearchInputs[index].points.toString();
            } else {
                console.log("loaded variable ", gridSearchInputs[index]?.variable, " does not match inputVar ", inputVar);
            }
        });
    }

    return (
        <>
            <h4>Grid Search Sampling</h4>
            <p>Specify the ranges and number of points per dimension for the grid search sampling.</p>
            {inputVars?.map((inputVar, index) => (
                <form key={index} style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "10px" }}>
                    <h5 style={{ marginLeft: 10, marginRight: 20, marginBottom: 0, marginTop: 0, fontSize: 18 }}>{inputVar}</h5>
                    <Input type="number" placeholder="Start" sx={{ width: 100 }} onChange={updateGridSearchInputs} />
                    <Input type="number" placeholder="End" sx={{ width: 100 }} onChange={updateGridSearchInputs} />
                    <Input type="number" placeholder="Points" sx={{ width: 100 }} onChange={updateGridSearchInputs} />
                </form>
            ))}

            <Button onClick={() => runGridSearchSampling(gridSearchInputs)}>Run Grid Search Sampling</Button>
        </>)
};

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

