import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import SuMoPlotsSteps from "../components/plots/SuMoPlotsSteps";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { JobSampling } from "../components/sampling/JobSampling";
import { JobsLoading } from "../components/data/JobsLoading";
import ValidationModal from "./ValidationModal";
import { useFunctionContext } from "../context/FunctionContext";

export default function SuMo() {
  const { selectedFunction, outputVars } = useFunctionContext();
  const { setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [validationModal, setValidationModal] = useState(false);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars, selectedFunction, setSelectedQoI]);

  return (
    <MetaModelingUX headerType="title" tabTitle={`Response Surface Modeling: ${selectedFunction?.title}`}>
      {loading ? (
        <JobsLoading jobProgress={jobProgress} message="Creating AI model..." />
      ) : (
        <SuMoPlotsSteps onInspectModel={() => setValidationModal(true)} />
      )}
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
