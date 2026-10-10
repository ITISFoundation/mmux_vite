import { OsparcFunctionJob } from "../context/types";
import { requestJson } from "../api/client";
import { getCachedOrFetch } from "../api/sessionResponseCache";

// Domain-vocabulary request shape (flaskapi SobolIndicesRequest, bounds-editor
// contract): per-input exploration boxes + constant pins. Variables absent
// from BOTH maps fall back to the package's auto-inferred observed-bounds box
// (flaskapi SPEC V26dd).
export type SobolDomainBox = { minimum: number; maximum: number };

export type FetchSobolIndicesParams = {
  inputVars: string[];
  output: string | undefined;
  functionJobs: OsparcFunctionJob[];
  domains?: { [varName: string]: SobolDomainBox };
  fixed?: { [varName: string]: number };
  seed?: number;
  inputLogScales?: { [varName: string]: boolean };
  outputLogScale?: boolean;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/**
 * Derive the domains/fixed request shape from the UQ configuration, reusing
 * the SAME exploration-box convention LHS sampling already applies
 * (utils/sampling.ts): uniform -> [min, max]; normal -> mean +/- 2.5*std
 * (the 98.8% interval the sampling grids explore); constant -> a `fixed` pin
 * (a9: a pinned factor leaves the sensitivity sweep entirely).
 *
 * Incomplete or degenerate entries are OMITTED, so the backend auto-infers
 * the observed box (V26dd) rather than the request 400ing on a degenerate
 * box. A log-flagged variable only gets a box while its minimum is > 0: the
 * backend positivity guard rejects every non-positive log request, and the
 * auto-inferred box over positive job data is the honest fallback
 * (mirrors how the UQ panels keep log requests valid).
 */
export function buildSobolBounds(
  distribution: InputVarSelection | undefined,
  inputVars: string[],
): { domains: { [varName: string]: SobolDomainBox }; fixed: { [varName: string]: number } } {
  const domains: { [varName: string]: SobolDomainBox } = {};
  const fixed: { [varName: string]: number } = {};
  inputVars.forEach(inputVar => {
    const entry = distribution?.[inputVar];
    if (!entry) return;
    if (entry.distribution === "constant") {
      if (isFiniteNumber(entry.value)) fixed[inputVar] = entry.value;
      return;
    }
    let box: SobolDomainBox | undefined;
    if (entry.distribution === "uniform" && isFiniteNumber(entry.min) && isFiniteNumber(entry.max)) {
      box = { minimum: entry.min, maximum: entry.max };
    } else if (entry.distribution === "normal" && isFiniteNumber(entry.mean) && isFiniteNumber(entry.std) && entry.std > 0) {
      box = { minimum: entry.mean - 2.5 * entry.std, maximum: entry.mean + 2.5 * entry.std };
    }
    if (!box || box.maximum <= box.minimum) return; // degenerate/invalid -> auto-infer
    if (entry.scale === "log" && !(box.minimum > 0)) return; // ⊥ the positivity guard's 400
    domains[inputVar] = box;
  });
  return { domains, fixed };
}

/**
 * Fetch per-input first-order (main effect) and total-order Sobol' sensitivity
 * indices plus pairwise second-order indices from the backend, computed via
 * scipy on a surrogate model built from the completed jobs.
 */
export async function fetchSobolIndices(params: FetchSobolIndicesParams): Promise<SobolIndicesResponse> {
  const {
    inputVars,
    output,
    functionJobs,
    domains = {},
    fixed = {},
    seed = 0,
    inputLogScales = {},
    outputLogScale = false,
  } = params;

  // V44eh: single dialect via requestJson. It still rejects (⊥ resolve) on
  // failure so callers' .catch/try-catch can clear fetch-dedup state (V18) and
  // surfaces the BE {"error": <str>} payload verbatim as the ApiError message.
  const body = {
    inputVars,
    output,
    // Domain vocabulary since the bounds-editor contract (GH-Copilot #706
    // review): the legacy distributions/numSamples fields were GONE from
    // SobolIndicesRequest, so keep-sending them meant Pydantic silently
    // ignored them and every UI request scored the auto-inferred box instead
    // of the configured exploration ranges.
    domains,
    fixed,
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
