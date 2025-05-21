import { useState, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button } from '@mui/material';
import { FunctionList } from '../components/FunctionList';
import MMUXContext from './MMUXContext';
import PlusButton from '../components/PlusButton';
import { Sampling } from '../components/Sampling';


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
                      <Sampling />
                    );
                }}
                text="Create new sampling campaign"
                enabled={context?.selectedFunction !== undefined}
            />
        </MetaModelingUX >
    );
}

