import { useState, useEffect } from 'react';
import MetaModelingUX from '../components/MetaModelingUX';
import { Button, Box, Container } from '@mui/material';
import { useMMUXContext } from '../context/MMUXContext';
import Curves1DPlots from '../components/PlotDataTogether'
import Surface2DPlot from "../components/Surface3DPlot";
import IsoSurface3DPlot from "../components/IsoSurface3DPlot";
import SuMoValidation from '../components/SuMoValidation';

function SuMoBuildingValidation() {
  const { inputVars, outputVars, selectedFunction, selectedJobUids, isSuMoGenerated, setIsSuMoGenerated, selectedQoI, setSelectedQoI } = useMMUXContext()

  useEffect(() => {
    setSelectedQoI("");
  }, [selectedFunction]);

  useEffect(() => {
    setIsSuMoGenerated(false);
  }, [selectedJobUids]);

  function QoISelector() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
        <span>Quantity of Interest (QoI) to inspect: </span>
        <select
          value={selectedQoI ?? ""}
          onChange={(e) => {
            setIsSuMoGenerated(false)
            setSelectedQoI(e.target.value)
            console.log(e.target.value)
          }}
        >
          <option value="">-- Select QoI --</option>
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
            loading || isSuMoGenerated || selectedJobUids.length === 0 || selectedQoI === ""
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
            width: "100%",
          }}
        >
          <span>
            Selected Function: <b>{selectedFunction?.title}</b>
          </span>
          <QoISelector />



          {/* Refactor from here. Have the cross-validation metrics always displayed,
          and the + button to add 1D / 2D / 3D plots always right below it. */}
          {isSuMoGenerated && (
            <>
              <SuMoValidation />
              {inputVars.length > 0 ? <Curves1DPlots /> : undefined}
              {inputVars.length > 1 ? <Surface2DPlot /> : undefined}
              {inputVars.length > 2 ? <IsoSurface3DPlot /> : undefined}
            </>
          )}
        </Box>
      </Container>
    </MetaModelingUX >
  );
}

export default SuMoBuildingValidation;
