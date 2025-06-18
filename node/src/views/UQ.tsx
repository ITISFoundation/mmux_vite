import { useEffect, useRef, useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import UncertainUQ from "../components/UncertainUQ";
import SuMoModal from "../components/SuMoModal";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { UQSetup } from "../components/UQSetup";
import { JobSampling } from "../components/JobSampling";

export default function UQ() {
  const { selectedFunction, outputVars, setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
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
      tabTitle={`Uncertainty Quantification: ${selectedFunction?.title}`}
    >
      <UQSetup loading={loading} setSumoModal={setSumoModal} />
      <UncertainUQ
        colsFetched={colsFetched}
        jobProgress={jobProgress}
        jobsFetched={jobsFetched}
        loading={loading}
        progress={progress}
      />
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
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
