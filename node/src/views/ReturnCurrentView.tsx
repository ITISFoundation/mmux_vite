import React from "react";
import Setup from "./Setup";
import UQ from "./UQ";
import SuMo from "./SuMo";
import MOGA from "./MOGA";
import { useServiceContext } from "../context/ServiceContext";
import { DisplayMessage } from "../components/utils/DisplayMessage";

type ReturnCurrentViewPropsType = {
  currentView: number;
};

function MessageComponent() {
  return <DisplayMessage mssg="Service mode not supported">Please contact support for assistance.</DisplayMessage>;
}

export function ReturnCurrentView(props: ReturnCurrentViewPropsType) {
  const { currentView } = props;
  const { ServiceMode: serviceMode } = useServiceContext();
  const validMode = ["UQ", "SUMO", "MOGA"].includes(serviceMode);
  console.info("service mode: ", serviceMode, ` which is a ${validMode ? "" : "not"}a valid mode`);

  return (
    <>
      {currentView === 0 && <Setup serviceMode={serviceMode} />}
      {currentView === 1 && serviceMode === "UQ" && <UQ />}
      {currentView === 1 && serviceMode === "SUMO" && <SuMo />}
      {currentView === 1 && serviceMode === "MOGA" && <MOGA />}
      {currentView === 1 && validMode === false && <MessageComponent />}
    </>
  );
}
