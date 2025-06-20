import { DisplayMessage } from "./DisplayMessage";

type CalculatingWarningPropsType = {
  height?: number;
  dontShowText?: boolean;
}

// Insert if calculating == true
const CalculatingWarning = (props: CalculatingWarningPropsType) => {
  const { height, dontShowText } = props
  console.log("Dont Show Text: ", dontShowText)
  console.log("Text: ", dontShowText ? "" : "Calculating...")
  return (
    <DisplayMessage mssg={dontShowText ? "" : "Calculating..."} height={height} />
  )
}

export default CalculatingWarning;