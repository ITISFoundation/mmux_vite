import { useState, useEffect, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import JobSelector from '../components/JobSelector';
import { Button, Box, Container } from '@mui/material';
import MMUXContext from './MMUXContext';
import PlotDataTogether from '../components/PlotDataTogether'
import { JOB_API, PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import PlusButton from '../components/PlusButton';

function SuMoBuildingValidation() {
    const context = useContext(MMUXContext)
    const inputVars = context?.selectedFunction?.inputSchema.required as string[]
    const outputVars = context?.selectedFunction?.outputSchema.required as string[]
    const [isSuMoGenerated, setIsSuMoGenerated] = useState(false)

    const [selectedResponse, setSelectedResponse] = useState(outputVars ? outputVars[0] : '');
    const [isLogEnabled, setIsLogEnabled] = useState(false);
    const [plotDataSumoCentralCurves, setPlotDataSumoCentralCurves] = useState(undefined);


    useEffect(() => {
        if (Array.isArray(outputVars)) setSelectedResponse(outputVars[0])
    }, [context?.selectedFunction])

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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                <text>Quantity of Interest (QoI) to inspect: </text>
                <select
                    value={selectedResponse}
                    onChange={(e) => {
                        setIsSuMoGenerated(false)
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
                <CreateSuMo />
            </Box>
        )
    }

    function CreateSuMo() {
        // eventually, we will actually register a SuMo. For now, this is just a placeholder
        const [loading, setLoading] = useState(false);

        const handleCreateSuMo = () => {
            setLoading(true);
            setTimeout(() => {
                setIsSuMoGenerated(true);
                setLoading(false);
            }, 1000);
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                <Button
                    onClick={handleCreateSuMo}
                    disabled={loading || isSuMoGenerated}
                >
                    {loading ? "Creating..." : isSuMoGenerated ? "SuMo created!" : "Create SuMo"}
                </Button>
                {loading && <Box className="spinner" />}
            </Box>
        );
    }

    return (
        < MetaModelingUX tabTitle="Surrogate Model Building & Validation" headerType="header">
            <Container>
                <Box sx={{
                    justifySelf: 'left',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: "10px",
                    justifyContent: 'space-between',
                    color: '#eee',
                }}>
                    <text>Selected Function: <b>{context?.selectedFunction?.name}</b> </text>
                    <JobSelector />
                    <QoISelector />
                    <PlusButton
                        onClickFun={RunPlotCentralSuMoInterpolations}
                        PlotFunComponent={() => <PlotDataTogether
                            data={plotDataSumoCentralCurves}
                            inputVars={inputVars}
                            qoi={selectedResponse}
                        />}
                        text="Visualize central SuMo interpolations"
                        enabled={isSuMoGenerated}
                    />

                    <PlusButton
                        onClickFun={() => null}
                        PlotFunComponent={() => <text>Not implemented yet</text>}
                        text="Add SuMo CrossValidation accuracy metrics"
                        enabled={isSuMoGenerated}
                    />
                    <PlusButton
                        onClickFun={() => null}
                        PlotFunComponent={() => <text>Not implemented yet</text>}
                        text="Add SuMo 2D visualization"
                        enabled={isSuMoGenerated}
                    />
                    <PlusButton
                        onClickFun={() => null}
                        PlotFunComponent={() => <text>Not implemented yet</text>}
                        text="Add SuMo 3D visualization"
                        enabled={isSuMoGenerated}
                    />
                </Box>
            </Container>
        </MetaModelingUX >
    );
}

export default SuMoBuildingValidation;
