import MetaModelingUX from "../components/MetaModelingUX";
import { useMMUXContext } from "../context/MMUXContext";
import PlusButton from "../components/PlusButton";
import { Sampling } from "../components/Sampling";
import JobSelector from "../components/JobSelector";
import { useState, useRef } from "react";

export default function Setup() {
  const { selectedFunction } = useMMUXContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const jobsFetched = useRef(0);
  const colsFetched = useRef(0);

  return (
    <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
      <JobSelector
        loading={loading}
        setLoading={setLoading}
        jobProgress={jobProgress}
        setJobProgress={setJobProgress}
        progress={progress}
        setProgress={setProgress}
        colsFetched={colsFetched}
        jobsFetched={jobsFetched}
      />
      {selectedFunction !== undefined ? (
        <PlusButton
          onClickFun={() => null}
          PlotFunComponent={() => {
            return <Sampling />;
          }}
          text="Create new sampling campaign"
          enabled={selectedFunction !== undefined}
        />
      ) : undefined}
    </MetaModelingUX>
  );
}
