// Lightweight, client-side distribution diagnostics for input/output variables.
//
// We deliberately use simple skewness/kurtosis heuristics rather than a full
// Shapiro-Wilk or Anderson-Darling implementation: this keeps the bundle small
// and runs cheaply on every render. The heuristic is intended as a hint, not a
// statistically rigorous test.

import { OsparcFunctionJob } from "../context/types";

const minSamplesForDiagnostics = 10;

type NormalityVerdict = "likely-normal" | "unclear" | "not-normal" | "not-applicable";

export interface VariableDiagnostics {
  count: number;
  mean: number;
  std: number;
  skewness: number;
  excessKurtosis: number;
  rawNormality: NormalityVerdict;
  logNormality: NormalityVerdict;
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

  return {
    count: n,
    mean: mu,
    std: sigma,
    skewness: skew,
    excessKurtosis: excessKurt,
    rawNormality: rawVerdict,
    logNormality: logVerdict,
    hasEnoughSamples: true,
  };
}

export function extractValuesFromJobs(jobs: OsparcFunctionJob[], variable: string, type: "input" | "output"): number[] {
  const completed = jobs.filter(
    j => (j.status || "").toLowerCase() === "completed" || (j.status || "").toLowerCase() === "success",
  );
  const key = type === "input" ? "inputs" : "outputs";
  const values: number[] = [];
  completed.forEach(j => {
    const bucket = (j as unknown as Record<string, Record<string, unknown> | undefined>)[key];
    if (bucket) {
      const raw = bucket[variable];
      const num = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(num)) values.push(num);
    }
  });
  return values;
}
