import { FunctionJob } from "../../osparc-api-ts-client";
import { DisplayMessage } from "../utils/DisplayMessage";

type InsufficientDataWarningPropsType = {
  fetchedJobCollections: SelectedJobCollection[] | undefined;
  filteredJobList: FunctionJob[];
  height?: number;
  calculationError?: string;
};

// insert if plotData has length 0
function InsufficientDataWarning(props: InsufficientDataWarningPropsType) {
  const { fetchedJobCollections, filteredJobList, height, calculationError } = props;
  const hasEnoughSamples =
    filteredJobList.length === 0
      ? "Select at least 5 Samples to be used by the model."
      : calculationError || "Error during calculation, please contact support.";
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
