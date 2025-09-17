import { useRef, useState } from "react";
import SuMoModal from "./SuMoModal";
import MOGAModal from "./MOGAModal";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { OutputSetup } from "./OutputSetup";
import { JobSampling } from "../components/sampling/JobSampling";
import { useFunctionContext } from "../context/FunctionContext";
import { MOGAPareto } from "../components/plots/MOGAPareto";

export default function MOGA() {
  const { selectedFunction } = useFunctionContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
  const [mogaModal, setMogaModal] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  return (
    <MetaModelingUX headerType="title" tabTitle={`Multi Objective Genetic Algorithm: ${selectedFunction?.title}`}>
      <OutputSetup loading={loading} setSumoModal={setSumoModal} setMogaModal={setMogaModal} mode="moga" />
      <MOGAPareto
        colsFetched={colsFetched}
        jobProgress={jobProgress}
        jobsFetched={jobsFetched}
        loading={loading}
        progress={progress}
      />
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
      <MOGAModal open={mogaModal} setOpen={setMogaModal} />
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
