import React, { useEffect, useRef, useState } from "react";
import { useMMUXContext } from "../context/MMUXContext";
import UncertainUQ from "../components/plots/UncertainUQ";
import CorrelationIndicesPlot from "../components/plots/CorrelationIndicesPlot";
import SobolIndicesPlot from "../components/plots/SobolIndicesPlot";
import SuMoModal from "./SuMoModal";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { OutputSetup } from "./OutputSetup";
import { JobSampling } from "../components/sampling/JobSampling";
import { useFunctionContext } from "../context/FunctionContext";

export default function UQ() {
  const { selectedFunction, outputVars } = useFunctionContext();
  const { setSelectedQoI } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sumoModal, setSumoModal] = useState<boolean>(false);
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
      <OutputSetup loading={loading} setSumoModal={setSumoModal} mode="full" />
      <UncertainUQ colsFetched={colsFetched} jobProgress={jobProgress} jobsFetched={jobsFetched} loading={loading} />
      {!loading && <CorrelationIndicesPlot />}
      {!loading && <SobolIndicesPlot />}
      <SuMoModal open={sumoModal} setOpen={setSumoModal} />
      <JobSampling
        loading={loading}
        setLoading={setLoading}
        setJobProgress={setJobProgress}
        selectedFunction={selectedFunction}
      />
    </MetaModelingUX>
  );
}
