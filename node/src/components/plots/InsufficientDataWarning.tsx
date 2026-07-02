import { OsparcFunctionJob } from "../../context/types";
import { DisplayMessage } from "../utils/DisplayMessage";

type InsufficientDataWarningPropsType = {
  fetchedJobCollections: SelectedJobCollection[] | undefined;
  filteredJobList: OsparcFunctionJob[];
  height?: number;
};

// insert if plotData has length 0
function InsufficientDataWarning(props: InsufficientDataWarningPropsType) {
  const { fetchedJobCollections, filteredJobList, height } = props;
  const hasEnoughSamples =
    filteredJobList.length === 0
      ? "Select at least 5 Samples to be used by the model."
      : "Error during calculation, please contact support.";
  return (
    <DisplayMessage
      mssg={
        !fetchedJobCollections || fetchedJobCollections.length === 0
          ? "No data available. Please create more Samples."
          : hasEnoughSamples
      }
      height={height}
    />
  );
}

export default InsufficientDataWarning;
