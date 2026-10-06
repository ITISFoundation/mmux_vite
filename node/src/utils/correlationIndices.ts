import { OsparcFunctionJob } from "../context/types";
import { requestJson } from "../api/client";
import { getCachedOrFetch } from "../api/sessionResponseCache";

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

  // V44eh: single dialect via requestJson. It still rejects (⊥ resolve) on
  // failure so callers' .catch/try-catch can clear fetch-dedup state (V18) and
  // surfaces the BE {"error": <str>} payload verbatim as the ApiError message.
  const body = {
    inputVars,
    output,
    distributions,
    numSamples,
    FunctionJobs: functionJobs,
    seed,
  };
  // V46sc: every sent parameter is in the cache key by construction.
  return getCachedOrFetch<CorrelationIndicesResponse>(`/flask/dakota/compute_correlation_indices`, body, () =>
    requestJson<CorrelationIndicesResponse>(`/flask/dakota/compute_correlation_indices`, { method: "POST", retry: true, body }),
  );
}

/**
 * Build a grouped bar-chart trace (Pearson vs Spearman) showing the correlation
 * strength of every input variable to the selected QoI in a single plot (#470).
 */
export function buildCorrelationBarData(
  correlations: CorrelationIndicesResponse["correlations"],
  inputVars: string[],
  colors: { pearson: string; spearman: string },
): Partial<Plotly.BarData>[] {
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
