import { useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  Box,
  Button,
  Container,
  InputLabel,
  TextField,
  useTheme,
} from "@mui/material";
import { InfoOutline } from "@mui/icons-material";
import MetaModelingUX from "../components/MetaModelingUX";
import PlusButton from "../components/PlusButton";
import JobSelector from "../components/JobSelector";
import { useMMUXContext } from "../context/MMUXContext";
import { Sampling } from "../components/Sampling";
import UncertainUQ from "../components/UncertainUQ";
import CustomTooltip from "../components/CustomTooltip";
import SuMoModal from "../components/SuMoModal";
import AdaptExtedSamplingDocument from "../components/documents/AdaptExtendSamplingDocument";
import GeneralResultsView from "./GeneralResultsView";

export default function UQ() {
  const {
    selectedFunction,
    numSamples,
    setNumSamples,
    filterSelectedJobList,
  } = useMMUXContext();
  const theme = useTheme();
  const [localNumSamples, setLocalNumSamples] = useState(numSamples[selectedFunction?.uid || ""] || 1000);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobPanelOpen, setJobPanelOpen] = useState<boolean>(false);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  const handlesetLocalNumSamples = (value: number) => {
    setLocalNumSamples(value);
    setNumSamples({
      ...numSamples,
      [selectedFunction?.uid || ""]: value,
    });
  };

  const NumSamplesInput = () => {
    return (
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
        Number of UQ Samples:
        <TextField
          type="number"
          variant="outlined"
          size="small"
          sx={{ marginTop: "8px", flex: 1 }}
          value={localNumSamples}
          onChange={(e) => handlesetLocalNumSamples(parseInt(e.target.value))}
        />
      </InputLabel>
    )
  }

  return (
    <GeneralResultsView headerType="uq" tabTitle={`Uncertainty Quantification: ${selectedFunction?.title}`}>
      <NumSamplesInput />
      <Button
        variant="contained"
        size="small"
        disabled={loading || !selectedFunction || filterSelectedJobList().length === 0}
        sx={{
          marginTop: "8px",
          width: "160px",
          fontSize: "1.1em",
          fontFamily: "inherit",
          fontWeight: 200,
          textTransform: "none",
        }}
        color="primary"
        onClick={() => setSumoModal(true)}
      >
        Inspect Model
      </Button>
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
      <UncertainUQ
        numSamples={localNumSamples}
        colsFetched={colsFetched}
        jobProgress={jobProgress}
        jobsFetched={jobsFetched}
        loading={loading}
        progress={progress}
      />
    </GeneralResultsView >
  );
}
