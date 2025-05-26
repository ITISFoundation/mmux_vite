import React from "react";
import MetaModelingUX from "../components/MetaModelingUX";
import { FunctionList } from "../components/FunctionList";

export default function Setup() {

  return (
    <MetaModelingUX tabTitle="Base Function Selection" headerType="setup">
      <FunctionList />
    </MetaModelingUX>
  );
}
