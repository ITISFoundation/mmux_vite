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
    const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
    const correctDistributions = Object.values(selectedDistribution).every(dist => {
      if (dist.distribution === "constant") {
        return finite(dist.value);
      }
      if (dist.distribution === "normal") {
        return finite(dist.mean) && finite(dist.std) && dist.std > 0;
      }
      if (dist.distribution === "uniform") {
        return finite(dist.min) && finite(dist.max) && dist.min < dist.max;
      }
      if (dist.distribution === "log-normal") {
        return finite(dist.location) && finite(dist.scale) && dist.scale > 0;
      }
      if (dist.distribution === "exponential") {
        return finite(dist.mean) && dist.mean > 0;
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
