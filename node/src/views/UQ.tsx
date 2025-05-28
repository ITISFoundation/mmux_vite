import React, { useState, useContext } from "react";
// import FileSelector from '../components/FileSelector';
// import SuMoTypeSelector from '../components/SuMoTypeSelector';
// import OutputResponseSelector from '../components/OutputResponseSelector';
import MMUXContext from "./MMUXContext";
import MetaModelingUX from "../components/MetaModelingUX";
import { Box, Container } from "@mui/material";
import { PYTHON_DAKOTA_BACKEND } from "../utils/api_objects";
import {
  getFunctionJobsFromFunctionUid,
  getFunctionJobCollections,
} from "../utils/function_utils";

export default function UQ() {
  // Similar to Sumo building
  const context = useContext(MMUXContext);
  const inputVars = (context?.inputVars ?? []) as string[];
  const [numSamples, setNumSamples] = useState(10000);
  const [dataUQHistogram, setDataUQHistogram] = useState(undefined);

  async function runUQ(config: any) {
    console.log("Running UQ...");
    // TODO get only those selected in the JobSelector (pass as status??)
    let jobList = await getFunctionJobsFromFunctionUid(
      context?.selectedFunction?.uid as string
    );
    console.log("Fetched jobs:", jobList);
    fetch(PYTHON_DAKOTA_BACKEND + "/flask/uq_propagation", {
      method: "POST",
      body: JSON.stringify({
        inputs: inputVars,
        output: selectedResponse, // TODO this will be in MMUXcontext
        FunctionJobs: jobList,
        numSamples: numSamples,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        setDataUQHistogram(data);
      })
      .catch((error) => console.debug("Error:", error));
  }


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
            Selected Function: <b>{context?.selectedFunction?.title}</b>{" "}
          </span>
          <span>
            Selected Job Campaign(s): <b>TODO</b>{" "}
          </span>
          <span>
            Selected QoI: <b>{context?.selectedResponse}</b>{" "}
          </span>
          {/*
            <label htmlFor="useSuMo">Use Surrogate Model to perform Uncertainty Quantification</label>
            <input
                type="checkbox"
                id="useSuMo"
                checked={useSuMo}
                onChange={(e) => setUseSuMo(e.target.checked)}
          /> */}

          <label htmlFor="numSamples">Number of Samples:</label>
          <input
            type="number"
            id="numSamples"
            defaultValue={10000}
            onChange={(e) => setNumSamples(Number(e.target.value))}
          />
        </Box>
      </Container>

      {/*
        // 3 - pass fun & jobs to Flask backend, compute UQ, return UQ propagated data
        // 4 -  to plot hist of each input & qoi (in two sep rows) 
      */}
    </MetaModelingUX>
  );
}
