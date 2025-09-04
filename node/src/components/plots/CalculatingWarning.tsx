import { DisplayMessage } from "../utils/DisplayMessage";

type CalculatingWarningPropsType = {
  height?: number;
  dontShowText?: boolean;
};

// Insert if calculating == true
function CalculatingWarning(props: CalculatingWarningPropsType) {
  const { height, dontShowText } = props;
  // Debug statements removed to prevent unnecessary console output
  // Debug statements removed to prevent unnecessary console output
  return <DisplayMessage mssg={dontShowText ? "" : "Calculating..."} height={height} />;
}

export default CalculatingWarning;
