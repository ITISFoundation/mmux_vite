import MetaModelingUX from "../components/navigation/MetaModelingUX";
import SelectFunctionDocument from "../components/documents/SelectFunctionDocument";
import { FunctionList } from "../components/setup/FunctionList";
import { InputVariableDist } from "../components/setup/InputVariableDist";
import { OutputVariableDist } from "../components/setup/OutputVariableDist";

interface SetupProps {
  serviceMode: string;
}

export default function Setup(props: SetupProps) {
  return (
    <MetaModelingUX
      tabTitle="Select Function"
      infoText="Choose a function created from your parameterized simulation pipeline."
      ExtendedInfoText={SelectFunctionDocument}
      headerType="title"
    >
      <FunctionList />
      <InputVariableDist />
      {props.serviceMode === "MOGA" && <OutputVariableDist />}
    </MetaModelingUX>
  );
}
