import Setup from "./Setup";
import UQ from "./UQ";
import SuMo from "./SuMo";
import { useServiceContext } from "../context/ServiceContext";
import { DisplayMessage } from "../components/DisplayMessage";

type ReturnCurrentViewPropsType = {
  currentView: number;
};

const MessageComponent = () => {
  return (
    <DisplayMessage mssg="Service mode not supported">
      Please contact support for assistance.
    </DisplayMessage>
  );
};

export const ReturnCurrentView = (props: ReturnCurrentViewPropsType) => {
  const { currentView } = props;
  const { serviceMode } = useServiceContext();
  const validMode = ["UQ", "SUMO"].includes(serviceMode);
  console.info("service mode: ", serviceMode, " which is not a: ", validMode);

  return (
    <>
      {currentView === 0 && <Setup />}
      {currentView === 1 && serviceMode === "UQ" && <UQ />}
      {currentView === 1 && serviceMode === "SUMO" && <SuMo />}
      {currentView === 1 && validMode === false && <MessageComponent />}
    </>
  );
};
