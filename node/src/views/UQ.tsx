import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import { useMMUXContext } from "../context/MMUXContext";
import UQPlotsSteps from "../components/plots/UQPlotsSteps";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import ValidationModal from "./ValidationModal";
import { QoISelector } from "../components/plots/QoISelector";
import { JobSampling } from "../components/sampling/JobSampling";
import { useFunctionContext } from "../context/FunctionContext";

export default function UQ() {
  const { selectedFunction, outputVars } = useFunctionContext();
  const { selectedQoI, setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [validationModal, setValidationModal] = useState<boolean>(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars, selectedFunction, setSelectedQoI]);

  return (
    <MetaModelingUX headerType="title" tabTitle={`Uncertainty Quantification: ${selectedFunction?.title}`}>
      <UQPlotsSteps
        loading={loading}
        jobProgress={jobProgress}
        colsFetched={colsFetched}
        jobsFetched={jobsFetched}
        qoiSelector={
          <>
            <QoISelector
              outputVars={outputVars}
              selectedQoI={selectedQoI}
              setSelectedQoI={setSelectedQoI}
              testId="uq-plot-qoi-select"
            />
            <Button variant="contained" size="small" onClick={() => setValidationModal(true)} mmux-testid="inspect-model-button">
              Inspect Model
            </Button>
          </>
        }
      />
      <ValidationModal open={validationModal} setOpen={setValidationModal} />
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        setJobProgress={setJobProgress}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
