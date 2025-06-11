import MetaModelingUX from "../components/MetaModelingUX";
import { FunctionList } from "../components/FunctionList";
import { InputVariableDist } from "../components/InputVariableDist";
import SelectFunctionDocument from "../components/documents/SelectFunctionDocument";

export default function Setup() {
  return (
    <MetaModelingUX
      tabTitle="Select Function"
      infoText="Choose a function created from your parameterized simulation pipeline."
      ExtendedInfoText={SelectFunctionDocument}
      headerType="setup"
    >
      <FunctionList />
      <InputVariableDist />
    </MetaModelingUX>
  );
}
