import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  InputLabel,
  MenuItem,
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

export default function UQ() {
  // Similar to Sumo building
  const {
    outputVars,
    selectedFunction,
    selectedQoI,
    setSelectedQoI,
  } = useMMUXContext();
  const theme = useTheme();
  const [numSamples, setNumSamples] = useState(1000);

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
      <Container disableGutters style={{ padding: "0px 16px" }}>
        <Box
          sx={{
            justifySelf: "left",
            flex: 1,
            display: "flex",
            gap: "16px",
            color: `${theme.palette.text.primary}`,
            margin: "16px 0",
            width: "100%",
          }}
        >
          <InputLabel
            size="small"
            sx={{
              display: "flex",
              transform: "none",
              alignItems: "baseline",
              gap: "16px",
              fontSize: "1.2em",
            }}
          >
            Select input variables:
            <Select
              size="small"
              variant="outlined"
              sx={{ minWidth: "200px", marginTop: "8px" }}
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
              transform: "none",
              alignItems: "baseline",
              gap: "16px",
              fontSize: "1.2em",
            }}
          >
            Number of Samples:
            <TextField
              type="number"
              variant="outlined"
              size="small"
              sx={{ marginTop: "8px" }}
              value={numSamples}
              onChange={(e) => setNumSamples(parseInt(e.target.value))}
            />
          </InputLabel>
          {/* <Button REPLACE WITH SUMO MODAL
            variant="contained"
            size="small"
            sx={{ marginTop: "8px", fontSize: "1.2em" }}
            color="primary"
            onClick={run}
            disabled={
              !selectedFunction || !selectedQoI || inputVars.length === 0
            }
          >
            Run UQ
          </Button> */}
        </Box>

      <UncertainUQ numSamples={numSamples} />
      </Container>
      <Accordion
        variant="outlined"
        sx={{
          marginTop: "16px",
          border: "none",
          "&:before": { display: "none" },
        }}
        style={{}}
      >
        <AccordionSummary>
          <Button
            variant="contained"
            color="primary"
          >
            Modify selected jobs
          </Button>
        </AccordionSummary>
        <AccordionDetails>
          <JobSelector />
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
    </MetaModelingUX>
  );
}
