import { useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import MetaModelingUX from "../components/MetaModelingUX";
import { Box, Button, Container } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import Plot from "react-plotly.js";
import { FunctionJob } from "../osparc-api-ts-client/models/FunctionJob";

export default function UQ() {
  // Similar to Sumo building
  const { inputVars, selectedFunction, selectedQoI, distribution, filterSelectedJobList } = useMMUXContext();
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

    // Dakota UQ is much less noisy in its sampling - however more constrained
    // fetch(PYTHON_DAKOTA_BACKEND + "/flask/uq_propagation", {
    fetch(PYTHON_DAKOTA_BACKEND + "/flask/manual_uq_propagation", {
      method: "POST",
      body: JSON.stringify({
        inputVars: inputVars,
        output: selectedQoI,
        distributions: distribution,
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
    return await runUQ(jobs)
  };

  // Copy the structure from SuMo building; refactor the PY script as a Flask callback.
  // Fixed Means & Stds (inside Python), will make that customizable later on.
  return (
    <MetaModelingUX tabTitle="Uncertainty Quantification" headerType="uq">
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
          }}
        >
          <span>
            Selected Function: <b>{selectedFunction?.title}</b>{" "}
          </span>
          <span>
            Selected QoI: <b>{selectedQoI}</b>{" "}
          </span>

          <label htmlFor="numSamples">Number of Samples:</label>
          <input
            type="number"
            id="numSamples"
            defaultValue={1000}
            onChange={(e) => setNumSamples(Number(e.target.value))}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={run}
            disabled={!selectedFunction || !selectedQoI || inputVars.length === 0}
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
            config={{ responsive: true }} />
        )}


      </Container>

    </MetaModelingUX>
  );
}
