import MetaModelingUX from "../components/MetaModelingUX";
import { FunctionList } from "../components/FunctionList";
import { InputVariableDist } from "../components/InputVariableDist";

export default function Setup() {
  return (
    <MetaModelingUX
      tabTitle="Select Function"
      infoText="Functions can be created out of parameterized pipelines using the ‘Create Function’ tab when clicking on a Project on the Dashboard"
      headerType="setup"
    >
      <FunctionList />
      <InputVariableDist />
    </MetaModelingUX>
  );
}
