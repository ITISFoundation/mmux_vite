import { useContext } from "react";
import MetaModelingUX from "../components/MetaModelingUX";
import { FunctionList } from "../components/FunctionList";
import MMUXContext from "./MMUXContext";
import PlusButton from "../components/PlusButton";
import { Sampling } from "../components/Sampling";

export default function Setup() {
  const context = useContext(MMUXContext);

  return (
    <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
      <FunctionList />
      {context?.selectedFunction !== undefined ? (
        <PlusButton
          onClickFun={() => null}
          PlotFunComponent={() => {
            return <Sampling />;
          }}
          text="Create new sampling campaign"
          enabled={context?.selectedFunction !== undefined}
        />
      ) : undefined}
    </MetaModelingUX>
  );
}
