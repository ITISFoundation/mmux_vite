import React from "react";
import MetaModelingUX from "../components/navigation/MetaModelingUX";
import SelectFunctionDocument from "../components/documents/SelectFunctionDocument";
import { FunctionList } from "../components/setup/FunctionList";
import { InputVariableDist } from "../components/setup/InputVariableDist";
import { OutputVariableDist } from "../components/setup/OutputVariableDist";

interface SetupProps {
  ServiceMode: string;
}

export default function Setup(props: SetupProps) {
  const { ServiceMode } = props;
  return (
    <MetaModelingUX
      tabTitle="Select Function"
      infoText="Choose a function created from your parameterized simulation pipeline."
      ExtendedInfoText={SelectFunctionDocument}
      headerType="title"
    >
      <FunctionList />
      <InputVariableDist />
      {ServiceMode === "MOGA" && <OutputVariableDist />}
    </MetaModelingUX>
  );
}
