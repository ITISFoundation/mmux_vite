import { useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import MetaModelingUX from "../components/MetaModelingUX";
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
} from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";
import JobSelector from "../components/JobSelector";
import PlusButton from "../components/PlusButton";
import { Sampling } from "../components/Sampling";
import { InputBlock } from "../components/InputBlock";

export default function UQ() {
  // Similar to Sumo building
  const {
    inputVars,
    outputVars,
    selectedFunction,
    selectedQoI,
    setSelectedQoI,
    distribution,
    filterSelectedJobList,
  } = useMMUXContext();
  const [numSamples, setNumSamples] = useState(1000);
  const [dataUQHistogram, setDataUQHistogram] = useState<Array<number>>([]);

  async function runUQ(jobs: FunctionJob[]) {
    console.log("Running UQ...");
    // Ensure all inputVars have a 'distribution' property and are Normal
    const invalidVars = Object.values(distribution).filter(
      (v: VarSelection) => !v.distribution || v.distribution !== "normal"
    );
    if (invalidVars.length > 0) {
      alert(
        `All variables must have Normal (Gaussian) distributions. Invalid: ${invalidVars
          .map((v: VarSelection) => v.distribution)
          .join(", ")}`
      );
      return;
    }

    // Extract means and stds from distributions
    const means = Object.keys(distribution).reduce((acc, key) => {
      acc[key] = distribution[key].mean ? distribution[key].mean : NaN;
      return acc;
    }, {} as Record<string, number>);
    const stds = Object.keys(distribution).reduce((acc, key) => {
      acc[key] = distribution[key].std ? distribution[key].std : NaN;
      return acc;
    }, {} as Record<string, number>);

    fetch(PYTHON_DAKOTA_BACKEND + "/flask/uq_propagation", {
      method: "POST",
      body: JSON.stringify({
        inputVars: inputVars,
        output: selectedQoI,
        FunctionJobs: jobs,
        numSamples: numSamples,
        log: false,
        means: means,
        stds: stds,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.log("UQ Data:", data);
        setDataUQHistogram(data);
      })
      .catch((error) => console.debug("Error:", error));
  }

  const run = async () => {
    const jobs = filterSelectedJobList();
    return await runUQ(jobs);
  };

  // Copy the structure from SuMo building; refactor the PY script as a Flask callback.
  // Fixed Means & Stds (inside Python), will make that customizable later on.
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
            color: "#eee",
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
          <Button
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
          </Button>
        </Box>

        {dataUQHistogram && dataUQHistogram.length > 0 && (
          <Plot
            data={[
              {
                x: dataUQHistogram,
                type: "histogram",
                marker: { color: "#1976d2" },
                name: "UQ Histogram",
              },
            ]}
            layout={{
              title: { text: "Uncertainty Quantification Histogram" },
              xaxis: { title: { text: selectedQoI || "Output" } },
              yaxis: { title: { text: "Frequency" } },
              plot_bgcolor: "#222",
              paper_bgcolor: "#222",
              font: { color: "#eee" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true }}
          />
        )}
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
          <span style={{ padding: '8px', backgroundColor:'grey', borderRadius: '8px'}}>Modify selected functions</span>
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
