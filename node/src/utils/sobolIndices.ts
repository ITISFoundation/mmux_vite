import { PlotData } from "plotly.js";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";

export type FetchSobolIndicesParams = {
  inputVars: string[];
  output: string | undefined;
  distributions: InputVarSelection;
  functionJobs: OsparcFunctionJob[];
  numSamples: number;
  seed?: number;
};

/**
 * Fetch per-input first-order (main effect) and total-order Sobol' sensitivity
 * indices from the backend (#470 follow-up), computed via Dakota's native
 * `variance_based_decomp` on a surrogate model built from the completed jobs.
 */
export async function fetchSobolIndices(params: FetchSobolIndicesParams): Promise<SobolIndicesResponse> {
  // Unlike fetchCorrelationIndices' seed (only feeds numpy.random.seed, where 0
  // is valid), this seed is written verbatim into a Dakota NIDR input file's
  // `sampling` block for `variance_based_decomp`. Dakota's own NIDR parser
  // rejects `seed = 0` ("seed must be > 0"), aborting with an opaque 400/500
  // (flaskapi/SPEC.md B17) - default to 1 instead.
  const { inputVars, output, distributions, functionJobs, numSamples, seed = 1 } = params;

  const response = await fetchWithRetry(`/flask/dakota/compute_sobol_indices`, {
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
    throw new Error(`Error in Sobol' indices response: ${response.status}, ${response.statusText}`);
  }

  return response.json();
}

/**
 * Build a grouped bar-chart trace (Main vs Total effect) showing the Sobol'
 * sensitivity of every input variable to the selected QoI in a single plot.
 */
export function buildSobolBarData(
  sobol: SobolIndicesResponse["sobol"],
  inputVars: string[],
  colors: { main: string; total: string },
): Partial<PlotData>[] {
  const mainValues = inputVars.map(inputVar => sobol[inputVar]?.main ?? 0);
  const totalValues = inputVars.map(inputVar => sobol[inputVar]?.total ?? 0);

  return [
    {
      x: inputVars,
      y: mainValues,
      type: "bar",
      name: "Main effect",
      marker: { color: colors.main },
    },
    {
      x: inputVars,
      y: totalValues,
      type: "bar",
      name: "Total effect",
      marker: { color: colors.total },
    },
  ];
}
