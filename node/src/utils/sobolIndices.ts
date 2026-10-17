import { OsparcFunctionJob } from "../context/types";
import { requestJson } from "../api/client";
import { getCachedOrFetch } from "../api/sessionResponseCache";

export type FetchSobolIndicesParams = {
  inputVars: string[];
  output: string | undefined;
  functionJobs: OsparcFunctionJob[];
  seed?: number;
  inputLogScales?: { [varName: string]: boolean };
  outputLogScale?: boolean;
};

/**
 * Fetch per-input first-order (main effect) and total-order Sobol' sensitivity
 * indices plus pairwise second-order indices from the backend, computed via
 * scipy on a surrogate model built from the completed jobs.
 *
 * ROOT #84 (auto-derived sampling limits, DOMAIN ⊥ DISTRIBUTION): the Sobol'
 * exploration box is DOMAIN vocabulary owned by itis-sumo — `domains`/`fixed`
 * are OPTIONAL, and omitted boxes are auto-inferred from the OBSERVED sample
 * bounds (a column constant in the samples becomes a fixed factor; draws are
 * uniform across the box, log-uniform under a log-scale flag). The Saltelli
 * sample count is fixed inside the engine (V36). Modeller distributions are
 * NOT an input here — they drive the uncertainty propagation, never this
 * endpoint. So the body carries ONLY jobs + inputVars/output + seed + scale
 * maps: `domains`/`fixed` would re-derive a box in the FE (exactly what the
 * removed bounds-editor `buildSobolBounds`, PRs #698/#711/#56, got wrong),
 * and `distributions`/`numSamples` are GONE from the backend contract
 * (SobolIndicesRequest) — they were tolerated extra keys that only polluted
 * the V46sc cache key (a distribution/numSamples edit was a guaranteed cache
 * MISS for a response that cannot depend on them, B59vw). Locked by the
 * node V49 contract test in sobolIndices.test.ts.
 */
export async function fetchSobolIndices(params: FetchSobolIndicesParams): Promise<SobolIndicesResponse> {
  const { inputVars, output, functionJobs, seed = 0, inputLogScales = {}, outputLogScale = false } = params;

  // V44eh: single dialect via requestJson. It still rejects (⊥ resolve) on
  // failure so callers' .catch/try-catch can clear fetch-dedup state (V18) and
  // surfaces the BE {"error": <str>} payload verbatim as the ApiError message.
  const body = {
    inputVars,
    output,
    FunctionJobs: functionJobs,
    seed,
    // V12: scales ride EVERY surrogate request — the backend
    // SobolIndicesRequest inherits the scale maps, so omitting them here let
    // the panel score an all-linear surrogate whose cache key ignored scale
    // toggles entirely (GH-Copilot #696 re-review).
    inputLogScales,
    outputLogScales: output ? { [output]: outputLogScale } : {},
  };
  // V46sc: every sent parameter is in the cache key by construction.
  return getCachedOrFetch<SobolIndicesResponse>(`/flask/dakota/compute_sobol_indices`, body, () =>
    requestJson<SobolIndicesResponse>(`/flask/dakota/compute_sobol_indices`, { method: "POST", retry: true, body }),
  );
}

/**
 * Build a grouped bar-chart trace (Main vs Total effect) showing the Sobol'
 * sensitivity of every input variable to the selected QoI in a single plot.
 */
export function buildSobolBarData(
  sobol: SobolIndicesResponse["sobol"],
  inputVars: string[],
  colors: { main: string; total: string },
): Partial<Plotly.BarData>[] {
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
): Partial<Plotly.HeatmapData> {
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
