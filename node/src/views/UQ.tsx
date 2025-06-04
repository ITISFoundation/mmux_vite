import { useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import MetaModelingUX from "../components/MetaModelingUX";
import { Box, Container } from "@mui/material";
import UncertainUQ from "../components/UncertainUQ";

export default function UQ() {
  // Similar to Sumo building
  const { inputVars, selectedFunction, selectedQoI, distribution, filterSelectedJobList } = useMMUXContext();
  const [numSamples, setNumSamples] = useState(10000);


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
        </Box>
        <UncertainUQ numSamples={numSamples} />
      </Container>
    </MetaModelingUX>
  );
}
