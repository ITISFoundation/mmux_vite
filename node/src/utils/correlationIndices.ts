import { PlotData } from "plotly.js";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import { getResponseErrorMessage } from "./httpError";

export type FetchCorrelationIndicesParams = {
  inputVars: string[];
  output: string | undefined;
  distributions: InputVarSelection;
  functionJobs: OsparcFunctionJob[];
  numSamples: number;
  seed?: number;
};

/**
 * Fetch per-input <-> output Pearson/Spearman correlation coefficients from the
 * backend (#470), computed on the same Monte Carlo sample set used for UQ propagation.
 */
export async function fetchCorrelationIndices(params: FetchCorrelationIndicesParams): Promise<CorrelationIndicesResponse> {
  const { inputVars, output, distributions, functionJobs, numSamples, seed = 0 } = params;

  const response = await fetchWithRetry(`/flask/dakota/compute_correlation_indices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputVars,
      output,
      distributions,
      numSamples,
      FunctionJobs: functionJobs,
      seed,
    }),
  });

  if (!response.ok) {
    // V23-style: reject (⊥ resolve) on non-OK so callers' .catch/try-catch can clear
    // any cached fetch-dedup state instead of treating the failure as a success.
    throw new Error(await getResponseErrorMessage(response));
  }

  return response.json();
}

/**
 * Build a grouped bar-chart trace (Pearson vs Spearman) showing the correlation
 * strength of every input variable to the selected QoI in a single plot (#470).
 */
export function buildCorrelationBarData(
  correlations: CorrelationIndicesResponse["correlations"],
  inputVars: string[],
  colors: { pearson: string; spearman: string },
): Partial<PlotData>[] {
  const pearsonValues = inputVars.map(inputVar => correlations[inputVar]?.pearson ?? 0);
  const spearmanValues = inputVars.map(inputVar => correlations[inputVar]?.spearman ?? 0);

  return [
    {
      x: inputVars,
      y: pearsonValues,
      type: "bar",
      name: "Pearson",
      marker: { color: colors.pearson },
    },
    {
      x: inputVars,
      y: spearmanValues,
      type: "bar",
      name: "Spearman",
      marker: { color: colors.spearman },
    },
  ];
}
