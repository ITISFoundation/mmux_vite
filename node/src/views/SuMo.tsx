import { useState, useEffect } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import SuMoPlotsSteps from "../components/plots/SuMoPlotsSteps";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { JobSampling } from "../components/sampling/JobSampling";
import { JobsLoading } from "../components/data/JobsLoading";
import { OutputSetup } from "./OutputSetup";
import { useFunctionContext } from "../context/FunctionContext";
import { useJobContext } from "../context/JobContext";

export default function SuMo() {
  const { selectedFunction, outputVars } = useFunctionContext();
  const { setSelectedQoI } = useMMUXContext();
  const { fetchedJobCollections } = useJobContext();
  // Only show loading bar when we have no cached job data yet (fresh load).
  // If persistence already restored job collections, render immediately.
  const [loading, setLoading] = useState<boolean>(fetchedJobCollections === undefined);
  const [jobProgress, setJobProgress] = useState<number>(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars, selectedFunction, setSelectedQoI]);

  return (
    <MetaModelingUX headerType="title" tabTitle={`Response Surface Modeling: ${selectedFunction?.title}`}>
      <OutputSetup loading={loading} mode="onlyQoI" />
      {loading ? <JobsLoading jobProgress={jobProgress} message="Creating AI model..." /> : <SuMoPlotsSteps />}
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        setJobProgress={setJobProgress}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
