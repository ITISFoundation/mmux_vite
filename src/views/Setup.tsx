import { useState, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button } from '@mui/material';
import { FunctionList } from '../components/FunctionIndex';
import MMUXContext from './MMUXContext';

export default function Setup() {
    const [showFunctionIndex, setShowFunctionIndex] = useState(false)
    const context = useContext(MMUXContext)
    return (
        < MetaModelingUX tabTitle="Base Function Selection" headerType="setup-header">
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px" }}>
                <Button onClick={() => setShowFunctionIndex(!showFunctionIndex)}>
                    <h5> Select Function</h5>
                </Button>
                <Button disabled={context?.selectedFunction === undefined} onClick={() => context?.setCurrentView(context.currentView + 1)}>Next Screen</Button>
            </div>
            {showFunctionIndex && <FunctionList functions={[]} />}
        </MetaModelingUX >
    );
    // TODO add much more interactivity, etc
}

