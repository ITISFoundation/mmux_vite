import { JSX, useState } from 'react';
import { Button, Box } from '@mui/material';

// This element is a generic + button with a few extra elements
// - Shows a text specifying what will be added
// - Allows to compute data on click, to be showed immediately (e.g. for SuMo plots)
// - TODO allows to remove the element (or at least to hide it) -- this is not implemented yet
type PlusButtonProps = {
    onClickFun: CallableFunction, // This defines whether something has to be done in the backend prior to adding the element
    PlotFunComponent: (props: any) => JSX.Element,
    text: string,
    enabled: boolean,
}
function PlusButton(props: PlusButtonProps) {
    // TODO would like + / - to be on the left of everything else, and on the middle height-wise
        const [showElement, setShowElement] = useState(false);
        return (<>
            <Box sx={{ justifySelf: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: "10px" }}>
                <Button
                    sx={{
                        color: "secondary", variant: "contained",
                        minWidth: "30px", height: "30px",
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={() => {
                        setShowElement(!showElement);
                        if (showElement) {
                            props.onClickFun()
                        }
                    }}
                    disabled={!props.enabled}
                >
                    <h3>{!showElement ? "+" : "-"}</h3>
                </Button>
                <Box sx={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
                    {/* TODO need to introduce new active / inactive colors */}
                    <span style={{ margin: 5, color: props.enabled && !showElement ? '#bbb' : '#eee' }} >
                        {(props.text != '' && !showElement) ? props.text : ''}
                    </span>
                    {
                    showElement && 
                    <props.PlotFunComponent/>
                }
            </Box>
            </Box >
        </>)
}

export default PlusButton;