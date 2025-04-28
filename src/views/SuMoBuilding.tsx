import React, { useState, useEffect, useContext, JSX } from 'react';
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
    const [plotDataSumoCentralCurves, setPlotDataSumoCentralCurves] = useState(undefined);


    useEffect(() => {
        if (Array.isArray(outputVars)) setSelectedResponse(outputVars[0])
    }, [context])

    async function RunPlotCentralSuMoInterpolations() {
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
                setPlotDataSumoCentralCurves(data)
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

    function ButtonAddPlot(onClickFun: CallableFunction, plotFunElement: JSX.Element, text: string, data: undefined): JSX.Element {
        return <Box sx={{ justifySelf: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: "10px" }}>
            <Button
                onClick={onClickFun}
                sx={{ backgroundColor: 'purple', color: 'white', minWidth: "30px", height: "30px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                children={<h3>+</h3>}
            /> <text style={{ margin: 5 }}>{text}</text>
            <Box sx={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
                {
                    data && inputVars &&
                    <plotFunElement data={data} inputVars={inputVars} qoi={selectedResponse} />
                }
            </Box>
        </Box>
    }

    function SuMoCentralCurves() {
        return ButtonAddPlot(RunPlotCentralSuMoInterpolations, PlotDataTogether, "Add central SuMo interpolations", plotDataSumoCentralCurves)

        // return <Box sx={{ justifySelf: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: "10px" }}>
        //     <Button
        //         onClick={RunPlotCentralSuMoInterpolations}
        //         sx={{ backgroundColor: 'purple', color: 'white', minWidth: "30px", height: "30px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        //         children={<h3>+</h3>}
        //     /> <text style={{ margin: 5 }}>Add central SuMo interpolations</text>
        //     <Box sx={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
        //         {
        //             plotDataSumoCentralCurves && inputVars &&
        //             <PlotDataTogether data={plotDataSumoCentralCurves} inputVars={inputVars} qoi={selectedResponse} />
        //         }
        //     </Box>
        // </Box>
    }

    function SuMoCVAccuracyMetrics() {
        return ButtonAddPlot(() => null, <text>Not implemented yet </text>, "Add SuMo CrossValidation accuracy metrics", undefined)
    }

    function SuMo2DVisualization() {
        return ButtonAddPlot(() => null, <text>Not implemented yet </text>, "Add SuMo 2D visualization", undefined)
        // This should have a pop-up to select 2 input variables
    }
    function SuMo3DVisualization() {
        return ButtonAddPlot(() => null, <text>Not implemented yet </text>, "Add SuMo 3D visualization", undefined)
        // This should have a pop-up to select 3 input variables
    }

    return (
        < MetaModelingUX tabTitle="Surrogate Model Building & Validation" headerType="sumo-header">
            <Container>
                <Box sx={{ justifySelf: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: "10px", justifyContent: 'space-between' }}>
                    <text>Selected Function: <b>{context?.selectedFunction?.name}</b> </text>
                    <QoISelector />
                    // TODO include button "create SuMo" and a loading wheel for 3 secs; that should enable the + buttons
                    <SuMoCentralCurves />
                    <SuMoCVAccuracyMetrics />
                    <SuMo2DVisualization />
                    <SuMo3DVisualization />
                </Box>

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
