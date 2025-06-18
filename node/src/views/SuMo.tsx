import { useMMUXContext } from "../context/MMUXContext";
import SuMoPlotsSteps from "../components/SuMoPlotsSteps";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { JobSampling } from "../components/JobSampling";
import { useState, useRef, useEffect } from "react";
import { JobsLoading } from "../components/JobsLoading";

export default function SuMo() {
  const { selectedFunction, outputVars, setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  useEffect(() => {
    if (outputVars && outputVars.length > 0) {
      setSelectedQoI(outputVars[0]);
    }
  }, [outputVars]);

  return (
    <MetaModelingUX
      headerType="title"
      tabTitle={`AI-Enabled Model Insights: ${selectedFunction?.title}`}
    >
      {loading ? (
        <JobsLoading
          progress={progress}
          jobProgress={jobProgress}
          message={"Creating SuMo AI model..."}
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
