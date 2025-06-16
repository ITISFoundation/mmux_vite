import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  Box,
  Button,
  Container,
  InputLabel,
  MenuItem,
  Select,
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
import SelectQoIDocument from "../components/documents/SelectQoIDocument";
import AdaptExtedSamplingDocument from "../components/documents/AdaptExtendSamplingDocument";

export default function UQ() {
  // Similar to Sumo building
  const {
    outputVars,
    selectedFunction,
    selectedQoI,
    setSelectedQoI,
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

  const handlesetLocalNumSamples = (value: number) => {
    setLocalNumSamples(value);
    setNumSamples({
      ...numSamples,
      [selectedFunction?.uid || ""]: value,
    });
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
              gap: "8px",
              fontFamily: "inherit",
              fontWeight: 300,
              fontSize: "1.2em",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              Select Quantity of Interest
              <CustomTooltip
                title="Choose the simulation output to analyze for uncertainty propagation"
                ExtendedTootlip={SelectQoIDocument}
                placement="right"
                arrow
              >
                <InfoOutline
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    backgroundColor: theme.palette.grey[100],
                    borderRadius: "50%",
                    padding: "2px",
                    marginLeft: "4px",
                  })}
                />
              </CustomTooltip>
            </Box>
            <Select
              size="small"
              variant="outlined"
              sx={{ flex: 1, marginTop: "8px" }}
              value={localQoI}
              defaultValue={outputVars?.[0] || ""}
              onChange={(e) => {
                handlesetLocalQoI(e.target.value);
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
        </Box>
        <UncertainUQ
          numSamples={localNumSamples}
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
            padding: "4px 8px 4px 16px",
            margin: `0 0 ${jobPanelOpen ? "16px" : "0px"} 0`,
          }}
        >
          Adapt / Extend Sampling
          <CustomTooltip
            title="Improve surrogate model accuracy by modifying or adding sample points"
            ExtendedTootlip={AdaptExtedSamplingDocument}
            placement="right"
            arrow
          >
            <InfoOutline
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                backgroundColor: theme.palette.grey[100],
                borderRadius: "50%",
                padding: "2px",
                marginLeft: "8px",
              })}
            />
          </CustomTooltip>
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
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
    </MetaModelingUX>
  );
}
