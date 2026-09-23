import { OsparcFunctionJob } from "../../context/types";
import { DisplayMessage } from "../utils/DisplayMessage";

type InsufficientDataWarningPropsType = {
  fetchedJobCollections: SelectedJobCollection[] | undefined;
  filteredJobList: OsparcFunctionJob[];
  height?: number;
  errorMessage?: string;
  // Number of input variables for the current function/model. Used to compute the
  // minimum completed jobs Dakota needs to build a surrogate: max(5, numInputVars + 1)
  // -- see flaskapi SPEC.md V30 -- and to pick the right explanation for why more
  // samples are needed.
  numInputVars: number;
};

// insert if plotData has length 0
function InsufficientDataWarning(props: InsufficientDataWarningPropsType) {
  const { fetchedJobCollections, filteredJobList, height, numInputVars, errorMessage } = props;
  const minimumRequired = Math.max(5, numInputVars + 1);
  const isDimensionLimited = numInputVars + 1 > 5;
  const insufficientSamplesMessage = isDimensionLimited
    ? `You need at least ${minimumRequired} samples (one more than your ${numInputVars} input variables) to avoid an underdetermined system.`
    : `You need at least ${minimumRequired} samples.`;
  const hasEnoughSamples =
    filteredJobList.length < minimumRequired
      ? insufficientSamplesMessage
      : errorMessage || "Error during calculation, please contact support.";
  return (
    <DisplayMessage
      mssg={
        errorMessage ||
        (!fetchedJobCollections || fetchedJobCollections.length === 0
          ? "No data available. Please create more Samples."
          : hasEnoughSamples)
      }
      height={height}
    />
  );
}

export default InsufficientDataWarning;
