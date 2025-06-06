import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
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
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
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
  const {
    inputVars,
    outputVars,
    selectedFunction,
    selectedQoI,
    setSelectedQoI,
    isSuMoGenerated,
  } = useMMUXContext();
  const theme = useTheme();
  const [numSamples, setNumSamples] = useState(1000);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [localQoI, setLocalQoI] = useState<string | undefined>(selectedQoI);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars]);

  const handlesetLocalQoI = (value: string) => {
    setLocalQoI(value);
    setSelectedQoI(value);
  };

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
            Select QoI:
            <Select
              size="small"
              variant="outlined"
              sx={{ flex: 1, marginTop: "8px" }}
              value={localQoI}
              defaultValue={outputVars?.[0] || ""}
              onChange={(e) => { handlesetLocalQoI(e.target.value); }}
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
        disableGutters
        variant="outlined"
        sx={{
          marginTop: "16px",
          border: "none",
          "&:before": { display: "none" },
        }}
      >
        <Button
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={() => setJobPanelOpen(loading ? false : !jobPanelOpen)}
          sx={{
            minHeight: "auto",
            padding: "4px 8px",
            margin: `0 0 ${jobPanelOpen ? '16px' : '0px'} 0`,
          }}
        >
          Modify selected jobs
        </Button>
        <AccordionDetails sx={{ padding: "0" }}>
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
          <Carousel
            renderItem={(item) => {
              // Only render the current slide
              return item;
            }}
            selectedItem={0}
            showThumbs={false}
            showStatus={false}
            infiniteLoop={false}
          >
            <div>
              <SuMoValidation />
            </div>
            {inputVars.length > 0 ? (
              <div>
                <Curves1DPlots />
              </div>
            ) : undefined}
            {inputVars.length > 1 ? (
              <div>
                <Surface2DPlot />
              </div>
            ) : undefined}
            {inputVars.length > 2 ? (
              <div>
                <IsoSurface3DPlot />
              </div>
            ) : undefined}
          </Carousel>
        </Box>
      </Modal>
    </MetaModelingUX>
  );
}
