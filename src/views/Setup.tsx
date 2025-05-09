import { useState, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Input } from '@mui/material';
import { FunctionList } from '../components/FunctionIndex';
import MMUXContext from './MMUXContext';
import PlusButton from '../components/PlusButton';
// import { writeFile } from 'fs';

function runGridSearchSampling(points: any[]) {
    console.log("Grid Search Sampling not implemented yet!")
}

function GridSearchSampling() {
    const context = useContext(MMUXContext)
    const inputVars = context?.selectedFunction?.inputSchema.required as string[]
    const [gridSearchInputs, setGridSearchInputs] = useState<any[]>([]);
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
            // // Save the updated gridSearchInputs to a JSON file
            // const filePath = '/home/jgo/itis/mmux_vite/assets/gridSearchInputs.json';
            // writeFile(filePath, JSON.stringify(gridSearchInputs, null, 2), (err) => {
            //     if (err) {
            //         console.error('Error saving gridSearchInputs.json:', err);
            //     } else {
            //         console.log('gridSearchInputs.json saved successfully');
            //     }
            // });
        });
        console.log("grid SEARCH: ", gridSearchInputs);
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

