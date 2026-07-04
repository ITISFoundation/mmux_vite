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
      // no outputTargets generated for ANY function yet
      if (Object.keys(functionContext?.outputTargets).length === 0) return false;

      // not enough output targets selected yet
      const outputTargets = functionContext.outputTargets[functionContext.selectedFunction.uid];
      if (!outputTargets) return false;

      // at least one output target is necessary for optimization
      if (Object.keys(outputTargets).length < 1) {
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
          dist.logMean !== undefined && !Number.isNaN(dist.logMean) && dist.logStd !== undefined && !Number.isNaN(dist.logStd)
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
