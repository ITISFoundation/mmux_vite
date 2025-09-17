import { toast } from "react-toastify";
import { FunctionContextType } from "../context/FunctionContext";
import { JobContextType } from "../context/JobContext";

export function stepValidator(
  functionContext: FunctionContextType | undefined,
  jobContext: JobContextType,
  ServiceMode: string,
  step: number,
): boolean {
  if (step === 0) {
    // Step 0: Check if a function is selected
    const selectedDistribution = functionContext?.distribution[functionContext?.selectedFunction?.uid || ""];
    if (!functionContext?.selectedFunction || !selectedDistribution) {
      return false; // No function or distribution selected
    }
    if (ServiceMode === "MOGA") {
      // no outputTargets generated for any function yet
      if (Object.keys(functionContext?.outputTargets).length === 0) return false;

      // selected function does not have enough outputs (at least 2 required)
      if (functionContext.outputVars.length < 2) {
        // MOGA needs at least two output target variables
        toast.warn(
          "At least two output variables are needed for Multi-Objective Optimization. Please choose a different function.",
        );
        return false;
      }

      // not enough output variables selected yet
      // console.debug("output Distribution: ",  functionContext.outputTargets)
      const outDist = functionContext.outputTargets[functionContext.selectedFunction.uid];
      // console.debug("output Distribution for this function: ", outDist)
      if (!outDist) {
        // console.debug("output Distribution not defined yet")
        return false;
      }
      if (Object.keys(outDist).length < 1) {
        return false;
      }
    }
    const correctDistributions = Object.values(selectedDistribution).every(dist => {
      if (dist.distribution === "constant") {
        return dist.value !== undefined && !Number.isNaN(dist.value);
      }
      if (dist.distribution === "normal") {
        return dist.mean !== undefined && !Number.isNaN(dist.mean) && dist.std !== undefined && !Number.isNaN(dist.std);
      }
      if (dist.distribution === "uniform") {
        return (
          dist.min !== undefined &&
          !Number.isNaN(dist.min) &&
          dist.max !== undefined &&
          !Number.isNaN(dist.max) &&
          dist.min <= dist.max
        );
      }
      if (dist.distribution === "log-normal") {
        return (
          dist.location !== undefined && !Number.isNaN(dist.location) && dist.scale !== undefined && !Number.isNaN(dist.scale)
        );
      }
      if (dist.distribution === "exponential") {
        return (
          dist.mean !== undefined && !Number.isNaN(dist.mean) // Exponential distribution typically uses mean
        );
      }
      return false; // If the distribution type is not recognized or is missing values
    });
    return functionContext?.selectedFunction !== undefined && correctDistributions;
  }
  if (step === 1) {
    // Step 1: Check if a job is selected
    return jobContext ? jobContext.selectedJobUids.length > 0 : false;
  }
  if (step === 2) {
    // Step 2: Check if a sampling campaign is created
    // return context.samplingCampaigns.length > 0;
    return true;
  }
  return false; // Default case, should not happen
}
