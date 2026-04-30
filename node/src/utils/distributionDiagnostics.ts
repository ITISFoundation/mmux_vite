// Lightweight, client-side distribution diagnostics for input/output variables.
//
// These checks are advisory only: they surface warnings on the parameter card so
// the user can spot mismatches between the declared distribution and the data
// (e.g. data that is log-distributed when the user has uniform/linear configured),
// and to flag potential outliers via Tukey's IQR fence rule.
//
// We deliberately use simple skewness/kurtosis heuristics rather than a full
// Shapiro-Wilk or Anderson-Darling implementation: this keeps the bundle small
// and runs cheaply on every render. The heuristic is intended as a hint, not a
// statistically rigorous test.

const minSamplesForDiagnostics = 10;

export type NormalityVerdict = "likely-normal" | "unclear" | "not-normal" | "not-applicable";

export interface VariableDiagnostics {
  count: number;
  mean: number;
  std: number;
  skewness: number;
  excessKurtosis: number;
  rawNormality: NormalityVerdict;
  logNormality: NormalityVerdict;
  outlierCount: number;
  outlierIndices: number[];
  hasEnoughSamples: boolean;
}

function mean(values: number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function moments(values: number[]): { mu: number; sigma: number; skew: number; excessKurt: number } {
  const n = values.length;
  const mu = mean(values);
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - mu;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;
  const sigma = Math.sqrt(m2);
  const skew = sigma > 0 ? m3 / (sigma * sigma * sigma) : 0;
  const excessKurt = sigma > 0 ? m4 / (m2 * m2) - 3 : 0;
  return { mu, sigma, skew, excessKurt };
}

// Heuristic verdict from skewness/excess kurtosis. Tighter thresholds give a
// "likely-normal" call; loose gives "unclear" so we don't yell at every dataset.
function normalityVerdict(skew: number, excessKurt: number): NormalityVerdict {
  const aSkew = Math.abs(skew);
  const aKurt = Math.abs(excessKurt);
  if (aSkew < 0.5 && aKurt < 1.0) return "likely-normal";
  if (aSkew > 1.0 || aKurt > 2.0) return "not-normal";
  return "unclear";
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Tukey's IQR rule with 1.5*IQR fences (the standard "outlier" definition,
// not the 3*IQR "extreme outlier" one).
function tukeyOutliers(values: number[]): { indices: number[]; lower: number; upper: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const indices: number[] = [];
  values.forEach((v, i) => {
    if (v < lower || v > upper) indices.push(i);
  });
  return { indices, lower, upper };
}

export function computeDiagnostics(values: number[]): VariableDiagnostics {
  const finite = values.filter(v => Number.isFinite(v));
  const n = finite.length;
  const empty: VariableDiagnostics = {
    count: n,
    mean: NaN,
    std: NaN,
    skewness: NaN,
    excessKurtosis: NaN,
    rawNormality: "unclear",
    logNormality: "not-applicable",
    outlierCount: 0,
    outlierIndices: [],
    hasEnoughSamples: n >= minSamplesForDiagnostics,
  };
  if (n < minSamplesForDiagnostics) return empty;

  const { mu, sigma, skew, excessKurt } = moments(finite);
  const rawVerdict = normalityVerdict(skew, excessKurt);

  let logVerdict: NormalityVerdict = "not-applicable";
  if (finite.every(v => v > 0)) {
    const logged = finite.map(v => Math.log10(v));
    const lm = moments(logged);
    logVerdict = normalityVerdict(lm.skew, lm.excessKurt);
  }

  const outliers = tukeyOutliers(finite);

  return {
    count: n,
    mean: mu,
    std: sigma,
    skewness: skew,
    excessKurtosis: excessKurt,
    rawNormality: rawVerdict,
    logNormality: logVerdict,
    outlierCount: outliers.indices.length,
    outlierIndices: outliers.indices,
    hasEnoughSamples: true,
  };
}

export function extractValuesFromJobs(
  jobs: Array<{ status?: string; inputs?: Record<string, unknown> | null; outputs?: Record<string, unknown> | null }>,
  variable: string,
  type: "input" | "output",
): number[] {
  const completed = jobs.filter(j => {
    const s = (j.status || "").toLowerCase();
    return s === "completed" || s === "success";
  });
  const key = type === "input" ? "inputs" : "outputs";
  const values: number[] = [];
  completed.forEach(j => {
    const bucket = (j as Record<string, unknown>)[key] as Record<string, unknown> | null | undefined;
    if (bucket) {
      const raw = bucket[variable];
      const num = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(num)) values.push(num);
    }
  });
  return values;
}

export interface DiagnosticsWarningContext {
  /** True if the user has the per-variable log-scale toggle enabled (only meaningful for SUMO/MOGA inputs). */
  logScale?: boolean;
  /** The user's chosen distribution form (only meaningful for UQ inputs). */
  declaredDistribution?: "constant" | "normal" | "uniform" | "log-normal" | "exponential";
  /** Variable role — affects message wording. */
  role: "input" | "output";
  /** Service mode — controls which warnings to surface. */
  serviceMode?: "SUMO" | "MOGA" | "UQ" | string;
}

/**
 * Produce a (possibly empty) list of short, plain-English warnings for the
 * parameter card. Each warning is a single sentence; the parent component
 * decides how to render them.
 */
export function buildWarnings(diag: VariableDiagnostics, ctx: DiagnosticsWarningContext): string[] {
  if (!diag.hasEnoughSamples) {
    if (diag.count > 0) {
      return [
        `Only ${diag.count} completed sample${diag.count === 1 ? "" : "s"} — diagnostics need at least ${minSamplesForDiagnostics}.`,
      ];
    }
    return [];
  }

  const out: string[] = [];

  // Suggest log-scale when the data is clearly non-normal in raw space but
  // significantly more symmetric in log-space. This covers both log-normal data
  // (log-space → "likely-normal") and log-uniform data (log-space → "unclear"
  // because kurtosis ≈ -1.2 but skewness ≈ 0, i.e. still better than raw).
  const logBetterThanRaw =
    diag.logNormality !== "not-applicable" && diag.logNormality !== "not-normal" && diag.rawNormality === "not-normal";

  if ((ctx.serviceMode === "SUMO" || ctx.serviceMode === "MOGA") && ctx.role === "input") {
    if (logBetterThanRaw && !ctx.logScale) {
      out.push(
        `Data is heavily skewed in linear space (skewness=${diag.skewness.toFixed(2)}) but more symmetric in log-space; consider enabling log-scale.`,
      );
    } else if (ctx.logScale && diag.rawNormality === "likely-normal" && diag.logNormality !== "likely-normal") {
      out.push(
        `Log-scale is on but raw data already looks well-spread (skewness=${diag.skewness.toFixed(2)}); log may not be helping.`,
      );
    } else if (diag.rawNormality === "not-normal" && diag.logNormality !== "likely-normal" && !ctx.logScale) {
      out.push(
        `Data is heavily skewed (skewness=${diag.skewness.toFixed(2)}); consider more samples or a wider parameter range.`,
      );
    }
  }

  if (ctx.serviceMode === "UQ" && ctx.role === "input" && ctx.declaredDistribution) {
    if (ctx.declaredDistribution === "normal" && diag.rawNormality === "not-normal") {
      out.push(`Selected distribution is normal, but data does not look normal (skewness=${diag.skewness.toFixed(2)}).`);
    }
    if (ctx.declaredDistribution === "uniform" && diag.rawNormality === "likely-normal") {
      out.push("Selected distribution is uniform, but data looks closer to normal — verify the choice.");
    }
  }

  if (ctx.role === "output") {
    if (logBetterThanRaw && !ctx.logScale) {
      out.push(
        `Output is heavily skewed in linear space (skewness=${diag.skewness.toFixed(2)}); consider enabling log-scale for better surrogate fit.`,
      );
    }
  }

  if (diag.outlierCount > 0) {
    out.push(`${diag.outlierCount} of ${diag.count} samples are outside Tukey IQR fences (potential outliers).`);
  }

  return out;
}
