import { MMUXContextType } from "../context/MMUXContext";

export function stepValidator(context: MMUXContextType, step: number): boolean {
  if (step === 0) {
    // Step 0: Check if a function is selected
    const selectedFunction = context?.selectedFunction;
    const selectedDistribution = context?.distribution[selectedFunction?.uid || ""];
    if(!selectedFunction || !selectedDistribution) {
      return false; // No function or distribution selected
    }
    const correctDistributions = Object.values(selectedDistribution).every(
      (dist) => {
        if (dist.distribution === "constant") {
          return dist.value !== undefined && !isNaN(dist.value);
        }
        if (dist.distribution === "normal") {
          return (
            dist.mean !== undefined &&
            !isNaN(dist.mean) &&
            dist.std !== undefined &&
            !isNaN(dist.std)
          );
        }
        if (dist.distribution === "uniform") {
          return (
            dist.min !== undefined &&
            !isNaN(dist.min) &&
            dist.max !== undefined &&
            !isNaN(dist.max) && dist.min <= dist.max
          );
        }
        if (dist.distribution === "log-normal") {
          return (
            dist.location !== undefined &&
            !isNaN(dist.location) &&
            dist.scale !== undefined &&
            !isNaN(dist.scale)
          );
        }
        if (dist.distribution === "exponential") {
          return (
            dist.mean !== undefined &&
            !isNaN(dist.mean) // Exponential distribution typically uses mean
          );
        }
        return false; // If the distribution type is not recognized or is missing values
      }
    );
    return context?.selectedFunction !== undefined && correctDistributions
  } else if (step === 1) {
    // Step 1: Check if a job is selected
    return context ? context.selectedJobUids.length > 0 : false;
  } else if (step === 2) {
    // Step 2: Check if a sampling campaign is created
    // return context.samplingCampaigns.length > 0;
    return true;
  }
  return false; // Default case, should not happen
}