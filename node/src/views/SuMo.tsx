import { useMMUXContext } from "../context/MMUXContext";
import SuMoPlotsSteps from "../components/plots/SuMoPlotsSteps";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { JobSampling } from "../components/sampling/JobSampling";
import { useState, useRef, useEffect } from "react";
import { JobsLoading } from "../components/data/JobsLoading";
import { OutputSetup } from "./OutputSetup";
import { useFunctionContext } from "../context/FunctionContext";

export default function SuMo() {
  const { selectedFunction, outputVars } = useFunctionContext();
  const { setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars, selectedFunction]);

  return (
    <MetaModelingUX
      headerType="title"
      tabTitle={`Response Surface Modeling: ${selectedFunction?.title}`}
    >
      <OutputSetup loading={loading} mode="onlyQoI" />
      {loading ? (
        <JobsLoading
          progress={progress}
          jobProgress={jobProgress}
          message={"Creating AI model..."}
        />
      ) : (
        <SuMoPlotsSteps />
      )}
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        progress={progress}
        setProgress={setProgress}
        jobProgress={jobProgress}
        setJobProgress={setJobProgress}
        jobsFetched={jobsFetched}
        colsFetched={colsFetched}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
