import React, { useState, useEffect, useContext } from 'react';
// import FileSelector from '../components/FileSelector';
// import SuMoTypeSelector from '../components/SuMoTypeSelector';
// import OutputResponseSelector from '../components/OutputResponseSelector';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Box, Container } from '@mui/material';
import MMUXContext from './MMUXContext';
// import PlotData from '../components/PlotData'
import PlotDataTogether from '../components/PlotDataTogether'
import { Function } from '../functions-api-ts-client';
import { FUNCTION_API, JOB_API, PYTHON_DAKOTA_BACKEND } from '../components/api_objects';

function PlotImageIfExists(props: any) {
    return (
        props.image ? <div>
            < Box
                component="img"
                src={"results/" + props.image}
                sx={{ height: props.height, width: props.width }}
            /></div > : null
    );
}

function SuMoBuildingValidation() {
    const context = useContext(MMUXContext)
    const inputVars = context?.selectedFunction?.inputSchema.required as string[]
    const outputVars = context?.selectedFunction?.outputSchema.required as string[]

    const [selectedResponse, setSelectedResponse] = useState(outputVars ? outputVars[0] : '');
    const [isLogEnabled, setIsLogEnabled] = useState(false);

    const [plotData, setPlotData] = useState(undefined);

    useEffect(() => {
        if (Array.isArray(outputVars)) setSelectedResponse(outputVars[0])
    }, [context])

    async function runSuMo() {
        console.log("Running SuMo...");
        const jobs = await JOB_API.getFunctionJobs(context?.selectedFunction?.id as number)
        fetch(
            PYTHON_DAKOTA_BACKEND + '/flask/sumo_along_axes',
            {
                method: "POST",
                body: JSON.stringify(
                    {
                        inputs: inputVars,
                        output: selectedResponse,
                        log: isLogEnabled,
                        FunctionJobs: jobs,
                    }
                ),
            }).then(function (response) {
                return response.json()
            }).then(function (data) {
                setPlotData(data)
            })
    }

    function QoISelector() {
        return (

            <div>
                <text>Quantity of Interest (QoI) to inspect: </text>
                <select
                    value={selectedResponse}
                    onChange={(e) => {
                        setSelectedResponse(e.target.value)
                        console.log(selectedResponse)
                    }}
                >// TODO issue: onlly creating DF w inputs + QoI, and NIH is trying to normalize...
                    // How do I solve that in general (given that I wanna give users chance to do operations, etc w custom code)?
                    // Pass evth to function and then leave only inputs + qoi right before saving?
                    {outputVars?.map((qoi) => (
                        <option key={qoi} value={qoi}>
                            {qoi}
                        </option>
                    ))}
                </select>
            </div>
        )
    }

    return (
        < MetaModelingUX tabTitle="SuMo Building & Validation" headerType="sumo-header">
            <Container>
                <Box sx={{ justifySelf: 'center', flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <text>Selected Function: <b>{context?.selectedFunction?.name}</b> </text>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        // TODO include toggle to choose SuMo (?)
                        <QoISelector />
                        // TODO change this by + button that allows to get central cuts; get SuMo fitting metrics, get 3D visualziations (?)
                        <Button onClick={runSuMo} sx={{ backgroundColor: 'purple', color: 'white' }}>
                            <h5> Run</h5>
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
                    {
                        plotData && inputVars &&
                        <PlotDataTogether data={plotData} inputVars={inputVars} qoi={selectedResponse} />
                    }
                </Box>
                // TODO make it one after the other vertically
            </Container>


            {/* 
            /* TODO this is also including SuMo building: choose jobs, dump into a csv file for Dakota, then call python and generate SuMo, then save and register it
            This all should also eventually be done with Functions API
            However, for now, for simplicity, simply choose the file and build the SuMo on the fly (I already have those scripts)
            The rest of the pipeline (getting outputs of Dakota, and plotting & showing) should stay the same */}

        </MetaModelingUX >
    );
}

export default SuMoBuildingValidation;
