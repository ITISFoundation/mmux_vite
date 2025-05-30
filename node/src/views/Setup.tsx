import MetaModelingUX from "../components/MetaModelingUX";
import { FunctionList } from "../components/FunctionList";
import { InputVariableDist } from "../components/InputVariableDist";

export default function Setup() {

  return (
    <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
      <FunctionList />
      <InputVariableDist />
    </MetaModelingUX>
  );
}
