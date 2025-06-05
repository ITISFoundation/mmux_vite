import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  useTheme,
} from "@mui/material";
import MetaModelingUX from "../components/MetaModelingUX";
import PlusButton from "../components/PlusButton";
import JobSelector from "../components/JobSelector";
import { useMMUXContext } from "../context/MMUXContext";
import { Sampling } from "../components/Sampling";
import UncertainUQ from "../components/UncertainUQ";
import IsoSurface3DPlot from "../components/IsoSurface3DPlot";
import Curves1DPlots from "../components/PlotDataTogether";
import SuMoValidation from "../components/SuMoValidation";
import Surface2DPlot from "../components/Surface3DPlot";

export default function UQ() {
  // Similar to Sumo building
  const { inputVars, outputVars, selectedFunction, selectedQoI, setSelectedQoI, isSuMoGenerated} =
    useMMUXContext();
  const theme = useTheme();
  const [numSamples, setNumSamples] = useState(1000);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars]);

  useEffect(() => {
    console.log("Selected QoI changed:", selectedQoI);
  }, [selectedQoI]);

  return (
    <MetaModelingUX
      tabTitle={`Uncertainty Quantification: ${selectedFunction?.title}`}
      headerType="uq"
    >
      <Container disableGutters>
        <Box
          sx={{
            justifySelf: "left",
            flex: 1,
            display: "flex",
            gap: "16px",
            color: `${theme.palette.text.primary}`,
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <InputLabel
            size="small"
            sx={{
              display: "flex",
              flex: 1,
              transform: "none",
              alignItems: "baseline",
              gap: "16px",
              fontFamily: "inherit",
              fontWeight: 300,
              fontSize: "1.2em",
            }}
          >
            Select input variables:
            <Select
              size="small"
              variant="outlined"
              sx={{ flex: 1, marginTop: "8px" }}
              value={selectedQoI}
              defaultValue={outputVars?.[0] || ""}
              onChange={(e) => {
                setSelectedQoI(e.target.value);
                console.log(e.target.value);
              }}
            >
              {outputVars?.map((qoi) => (
                <MenuItem key={qoi} value={qoi}>
                  {qoi}
                </MenuItem>
              ))}
            </Select>
          </InputLabel>
          <InputLabel
            size="small"
            sx={{
              display: "flex",
              flex: 1,
              transform: "none",
              alignItems: "baseline",
              gap: "16px",
              fontFamily: "inherit",
              fontWeight: 300,
              fontSize: "1.2em",
            }}
          >
            Number of Samples:
            <TextField
              type="number"
              variant="outlined"
              size="small"
              sx={{ marginTop: "8px", flex: 1 }}
              value={numSamples}
              onChange={(e) => setNumSamples(parseInt(e.target.value))}
            />
          </InputLabel>
          <Button
            variant="contained"
            size="small"
            sx={{
              marginTop: "8px",
              width: "200px",
              fontSize: "1.1em",
              fontFamily: "inherit",
              fontWeight: 200,
              textTransform: "none",
            }}
            color="primary"
            onClick={() => setSumoModal(true)}
            disabled={loading}
          >
            View SuMo results
          </Button>
        </Box>
        <UncertainUQ
          numSamples={numSamples}
          colsFetched={colsFetched}
          jobProgress={jobProgress}
          jobsFetched={jobsFetched}
          loading={loading}
          progress={progress}
        />
      </Container>
      <Accordion
        expanded={jobPanelOpen}
        onChange={() => setJobPanelOpen(loading ? false : !jobPanelOpen)}
        disableGutters
        variant="outlined"
        sx={{
          marginTop: "16px",
          border: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary sx={{padding: "0", "& .MuiAccordionSummary-content": { margin: "0 0 4px 0" }}}>
          <Button variant="contained" color="primary" disabled={loading} sx={{ minHeight: 'auto' }} >
            Modify selected jobs
          </Button>
        </AccordionSummary>
        <AccordionDetails sx={{padding: "0"}}>
          <JobSelector
            loading={loading}
            setLoading={setLoading}
            progress={progress}
            setProgress={setProgress}
            jobProgress={jobProgress}
            setJobProgress={setJobProgress}
            jobsFetched={jobsFetched}
            colsFetched={colsFetched}
          />
          {selectedFunction !== undefined ? (
            <PlusButton
              onClickFun={() => null}
              PlotFunComponent={() => {
                return <Sampling />;
              }}
              text="Create new sampling campaign"
              enabled={selectedFunction !== undefined}
            />
          ) : undefined}
        </AccordionDetails>
      </Accordion>
      <Modal
        open={sumoModal}
        onClose={() => setSumoModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          margin: "auto",
          height: "600px",
          width: "900px",
        }}
      >
        <Box
          bgcolor={theme.palette.background.default}
          p={4}
          borderRadius={2}
          width={900}
          height={600}
          overflow={"auto"}
        >
          {isSuMoGenerated && (
            <>
              <SuMoValidation />
              {inputVars.length > 0 ? <Curves1DPlots /> : undefined}
              {inputVars.length > 1 ? <Surface2DPlot /> : undefined}
              {inputVars.length > 2 ? <IsoSurface3DPlot /> : undefined}
            </>
          )}
        </Box>
      </Modal>
    </MetaModelingUX>
  );
}
