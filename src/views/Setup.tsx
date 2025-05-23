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
        <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
            {/* TODO convert into a toggle? and move the "Next" to the bottom? */}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px" }}>
                <Button onClick={() => setShowFunctionIndex(!showFunctionIndex)}>
                    <h5> Select Function</h5>
                </Button>
                {(context?.selectedFunction !== undefined) ? 
                    <Button disabled={context?.selectedFunction === undefined}
                    // TODO need to make the "disabled" condition much more visible (right now, no visual change)
                        onClick={() => context?.setCurrentView(context.currentView + 1)}>
                        Next Step
                    </Button>
                    : undefined}
            </div>
            {showFunctionIndex && <FunctionList functions={[]} />}

            {/* TODO Include some vertical spacing between the components */}

            {(context?.selectedFunction !== undefined) ? <PlusButton
                onClickFun={() => null}
                PlotFunComponent={() => {
                    return (
                      <Sampling />
                    );
                }}
                text="Create new sampling campaign"
                enabled={context?.selectedFunction !== undefined}
            /> : undefined}
        </MetaModelingUX >
    );
}

