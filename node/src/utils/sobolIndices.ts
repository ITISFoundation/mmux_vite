import { PlotData } from "plotly.js";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import { getResponseErrorMessage } from "./httpError";

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
 * indices plus pairwise second-order indices from the backend, computed via
 * scipy on a surrogate model built from the completed jobs.
 */
export async function fetchSobolIndices(params: FetchSobolIndicesParams): Promise<SobolIndicesResponse> {
  const { inputVars, output, distributions, functionJobs, numSamples, seed = 0 } = params;

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
    throw new Error(await getResponseErrorMessage(response));
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

/**
 * Build a Plotly heatmap trace for second-order Sobol' indices.
 * Diagonal cells are filled from the corresponding first-order (main) index.
 * Off-diagonal cells come from the symmetric sobolSecondOrder pairwise matrix.
 */
export function buildSobolHeatmapData(
  sobol: SobolIndicesResponse["sobol"],
  sobolSecondOrder: SobolIndicesResponse["sobolSecondOrder"],
  inputVars: string[],
  colorScale?: string,
): Partial<PlotData> {
  const n = inputVars.length;
  const z: number[][] = [];

  for (let i = 0; i < n; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < n; j += 1) {
      if (i === j) {
        row.push(sobol[inputVars[i]]?.main ?? 0);
      } else {
        const varA = inputVars[i];
        const varB = inputVars[j];
        const vA = sobolSecondOrder[varA]?.[varB];
        const vB = sobolSecondOrder[varB]?.[varA];
        row.push(vA ?? vB ?? 0);
      }
    }
    z.push(row);
  }

  return {
    z,
    x: inputVars,
    y: inputVars,
    type: "heatmap",
    colorscale: colorScale || "Viridis",
    colorbar: { title: { text: "Sobol' index" } },
    hoverongaps: false,
    hovertemplate: "%{x} ↔ %{y}: %{z:.4f}<extra></extra>",
  };
}
