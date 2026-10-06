import { OsparcFunctionJob } from "../context/types";
import { requestJson } from "../api/client";
import { getCachedOrFetch } from "../api/sessionResponseCache";

export type FetchSobolIndicesParams = {
  inputVars: string[];
  output: string | undefined;
  /** Explicit per-variable exploration boxes (V26dd domain vocabulary). */
  domains: SobolDomainMap;
  /** Variables pinned to a constant value (a9; excluded from the sweep). */
  fixed: SobolFixedMap;
  inputLogScales?: { [inputVar: string]: boolean };
  outputLogScales?: { [outputVar: string]: boolean };
  functionJobs: OsparcFunctionJob[];
  seed?: number;
};

/**
 * Fetch per-input first-order (main effect) and total-order Sobol' sensitivity
 * indices plus pairwise second-order indices from the backend, computed via
 * scipy on a surrogate model built from the completed jobs.
 *
 * Bounds-editor shape (V26dd): the panel's per-variable Range|Pin editor is
 * sent as `domains` + `fixed` directly — no distribution translation happens
 * anywhere, and sample count is fixed inside itis_sumo.api (V36), so the
 * request carries no distributions/numSamples.
 */
export async function fetchSobolIndices(params: FetchSobolIndicesParams): Promise<SobolIndicesResponse> {
  const { inputVars, output, domains, fixed, inputLogScales = {}, outputLogScales = {}, functionJobs, seed = 0 } = params;

  // V44eh: single dialect via requestJson. It still rejects (⊥ resolve) on
  // failure so callers' .catch/try-catch can clear fetch-dedup state (V18) and
  // surfaces the BE {"error": <str>} payload verbatim as the ApiError message.
  const body = {
    inputVars,
    output,
    domains,
    fixed,
    inputLogScales,
    outputLogScales,
    FunctionJobs: functionJobs,
    seed,
  };
  // V46sc: every sent parameter (the #664 bounds-editor domains/fixed included)
  // is in the cache key by construction — editing a bound misses and refetches.
  return getCachedOrFetch<SobolIndicesResponse>(`/flask/dakota/compute_sobol_indices`, body, () =>
    requestJson<SobolIndicesResponse>(`/flask/dakota/compute_sobol_indices`, { method: "POST", retry: true, body }),
  );
}

/**
 * Seed the bounds editor from the UQ distribution selections so the Sobol'
 * panel keeps working with zero edits after the migration:
 *   uniform(min,max) → the explicit box;
 *   normal(mean,std) → the mean ± 3σ box (the FE OWNS this choice now —
 *     flaskapi retired the backend back-derivation, V26dd);
 *   constant(value)  → a pin (a9 `fixed`; this path used to 422);
 *   missing/ill-formed entry → unspecified, backend auto-infers the observed
 *     box (V26dd fallback).
 */
export function initialSobolDomain(
  inputVars: string[],
  selections: InputVarSelection | undefined,
): { domains: SobolDomainMap; fixed: SobolFixedMap } {
  const domains: SobolDomainMap = {};
  const fixed: SobolFixedMap = {};
  for (const inputVar of inputVars) {
    const selection = selections?.[inputVar];
    if (!selection) {
      continue;
    }
    if (selection.distribution === "uniform") {
      const { min, max } = selection;
      if (min !== undefined && max !== undefined && max > min) {
        domains[inputVar] = { minimum: min, maximum: max };
      }
    } else if (selection.distribution === "normal") {
      const { mean, std } = selection;
      if (mean !== undefined && std !== undefined && std > 0) {
        const minimum = mean - 3 * std;
        const maximum = mean + 3 * std;
        // A log-flagged normal whose ±3σ box crosses zero CANNOT be seeded:
        // the same request carries the log flag, so a non-positive lower
        // bound fails the backend positivity guard on first load (GH-Copilot
        // #664). Leave it unspecified instead — the auto-inferred box is
        // built from observed values, which the UI's log-eligibility guard
        // keeps strictly positive.
        if (selection.scale === "log" && minimum <= 0) {
          continue;
        }
        domains[inputVar] = { minimum, maximum };
      }
    } else if (selection.distribution === "constant") {
      const { value } = selection;
      if (value !== undefined) {
        fixed[inputVar] = value;
      }
    }
  }
  return { domains, fixed };
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
