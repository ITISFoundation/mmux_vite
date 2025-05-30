import { MMUXContextType } from "../context/MMUXContext";

export function stepValidator(context: MMUXContextType, step: number): boolean {
  if (step === 0) {
    // Step 0: Check if a function is selected
    return context?.selectedFunction !== undefined
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