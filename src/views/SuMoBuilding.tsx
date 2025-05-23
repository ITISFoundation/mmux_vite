import { useState, useEffect, useContext } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import JobSelector from '../components/JobSelector';
import { Button, Box, Container } from '@mui/material';
import MMUXContext from './MMUXContext';
import PlotDataTogether from '../components/PlotDataTogether'
import ShowCvMetrics from '../components/ShowCvMetrics';
import { PYTHON_DAKOTA_BACKEND } from '../components/api_objects';
import PlusButton from '../components/PlusButton';
import { getFunctionJobsFromFunctionUid } from "../components/function_utils";
import Surface3DPlot from "../components/Surface3DPlot";
import IsoSurface3DPlot from "../components/IsoSurface3DPlot";


function SuMoBuildingValidation() {
  const context = useContext(MMUXContext)
  const inputVars = context?.selectedFunction?.inputSchema.schemaContent.required as string[]
  const outputVars = context?.selectedFunction?.outputSchema.schemaContent.required as string[]
  const [isSuMoGenerated, setIsSuMoGenerated] = useState(false)

  const [selectedResponse, setSelectedResponse] = useState(outputVars ? outputVars[0] : '');
  const [isLogEnabled, setIsLogEnabled] = useState(false);
  const [dataSumoCentralCurves, setDataSumoCentralCurves] = useState(undefined);

  useEffect(() => {
    if (Array.isArray(outputVars)) setSelectedResponse(outputVars[0]);
  }, [context?.selectedFunction, outputVars]);

  useEffect(() => {
    setIsSuMoGenerated(false);
  }, [context?.selectedJobs]);

  async function RunPlotCentralSuMoInterpolations() {
    // TODO get only those selected in the JobSelector (pass as status??)
    let jobList = await getFunctionJobsFromFunctionUid(context?.selectedFunction?.uid as string);
    console.log("Fetched jobs:", jobList);
    console.log("Running SuMo...");
    fetch(
      PYTHON_DAKOTA_BACKEND + '/flask/sumo_along_axes',
      {
        method: "POST",
        body: JSON.stringify(
          {
            inputs: inputVars,
            output: selectedResponse,
            log: isLogEnabled,
            FunctionJobs: jobList,
          }
        ),
      }).then(function (response) {
        return response.json()
      }).then(function (data) {
        setDataSumoCentralCurves(data)
      }).catch(error => console.debug('Error:', error));
  }

  function QoISelector() {
    return (
      // TODO show only when jobs have already been selected
      <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
        <span>Quantity of Interest (QoI) to inspect: </span>
        <select
          value={selectedResponse}
          onChange={(e) => {
            // TODO make this more visible & prominent
            setIsSuMoGenerated(false)
            setSelectedResponse(e.target.value)
            console.log(selectedResponse)
          }}
        >
          {outputVars?.map((qoi) => (
            <option key={qoi} value={qoi}>
              {qoi}
            </option>
          ))}
        </select>
        <CreateSuMoButton />
      </Box>
    )
  }

  function CreateSuMoButton() {
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
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          onClick={handleCreateSuMo}
          disabled={
            loading || isSuMoGenerated || context?.selectedJobs.length === 0
          }
        >
          {loading
            ? "Creating..."
            : isSuMoGenerated
              ? "SuMo created!"
              : "Create SuMo"}
        </Button>
        {loading && <Box className="spinner" />}
      </Box>
    );
  }

  return (
    <MetaModelingUX
      tabTitle="Surrogate Model Building & Validation"
      headerType="sumo"
    >
      <Container>
        <Box
          sx={{
            justifySelf: "left",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            justifyContent: "space-between",
            color: "#eee",
            width: "100%",
          }}
        >
          <span>
            Selected Function: <b>{context?.selectedFunction?.title}</b>
          </span>
          <JobSelector />
          <QoISelector />
          {isSuMoGenerated && (
            <>
              <PlusButton
                onClickFun={() => null} // TODO need to execute this
                PlotFunComponent={() => {
                  const sumoCvMetrics = {
                    "cv_metrics": { // mockup
                      'RMSE': 0.0122742,
                      'Sum Absolute Error': 0.637624,
                      'Mean Absolute Error': 0.00850166,
                      'Maximal Absolute Error': 0.065424
                    },
                    "statistics": { // mockup
                      'Mean': 0.0122742,
                      'Standard Deviation': 0.637624,
                      'Minimum': 0.00850166,
                      'Maximum': 0.065424
                    }
                  }
                  return <ShowCvMetrics
                    data={sumoCvMetrics}
                    inputVars={inputVars}
                    qoi={selectedResponse}
                  />
                }
                }
                text="Add SuMo CrossValidation accuracy metrics"
                enabled={isSuMoGenerated}
              />
              <PlusButton
                onClickFun={RunPlotCentralSuMoInterpolations}
                PlotFunComponent={() => (
                  <PlotDataTogether
                    data={dataSumoCentralCurves}
                    inputVars={inputVars}
                    qoi={selectedResponse}
                  />
                )}
                text="Visualize central SuMo interpolations"
                enabled={isSuMoGenerated}
              />
              <PlusButton
                onClickFun={() => null}
                PlotFunComponent={() => <Surface3DPlot />}
                text="Add SuMo 3D Surface visualization"
                enabled={isSuMoGenerated}
              />
              <PlusButton
                onClickFun={() => null}
                PlotFunComponent={() => <IsoSurface3DPlot />}
                text="Add SuMo 3D IsoSurface visualization"
                enabled={isSuMoGenerated}
              />
            </>
          )}
        </Box>
      </Container>
    </MetaModelingUX >
  );
}

export default SuMoBuildingValidation;
