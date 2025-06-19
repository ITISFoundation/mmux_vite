import MetaModelingUX from "../components/navigation/MetaModelingUX";
import { FunctionList } from "../components/setup/FunctionList";
import { InputVariableDist } from "../components/setup/InputVariableDist";
import SelectFunctionDocument from "../components/documents/SelectFunctionDocument";

export default function Setup() {
  return (
    <MetaModelingUX
      tabTitle="Select Function"
      infoText="Choose a function created from your parameterized simulation pipeline."
      ExtendedInfoText={SelectFunctionDocument}
      headerType="title"
    >
      <FunctionList />
      <InputVariableDist />
    </MetaModelingUX>
  );
}
