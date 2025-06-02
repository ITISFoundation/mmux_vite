import MetaModelingUX from "../components/MetaModelingUX";
import { useMMUXContext } from "../context/MMUXContext";
import PlusButton from "../components/PlusButton";
import { Sampling } from "../components/Sampling";
import JobSelector from "../components/JobSelector";

export default function Setup() {
  const { selectedFunction } = useMMUXContext();

  return (
    <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
      <JobSelector />
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
