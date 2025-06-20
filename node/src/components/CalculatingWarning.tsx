import { DisplayMessage } from "./DisplayMessage";

type CalculatingWarningPropsType = {
  height?: number;
}

// Insert if calculating == true
const CalculatingWarning = (props: CalculatingWarningPropsType) => {
  const { height } = props
  return (
    <DisplayMessage mssg={"Calculating..."} height={height} />
  )
}

export default CalculatingWarning;