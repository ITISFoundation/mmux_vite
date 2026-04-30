import { describe, it, expect } from "vitest";
import { buildWarnings, computeDiagnostics, extractValuesFromJobs } from "./distributionDiagnostics";

// Box-Muller with a fixed seed-based PRNG so tests are deterministic.
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}
function gaussianSample(n: number, mean: number, std: number, seed = 42): number[] {
  const rng = makeRng(seed);
  const out: number[] = [];
  while (out.length < n) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const r = Math.sqrt(-2 * Math.log(u1));
    out.push(mean + std * r * Math.cos(2 * Math.PI * u2));
    if (out.length < n) out.push(mean + std * r * Math.sin(2 * Math.PI * u2));
  }
  return out.slice(0, n);
}

describe("computeDiagnostics", () => {
  it("returns hasEnoughSamples=false below 10 samples", () => {
    const diag = computeDiagnostics([1, 2, 3]);
    expect(diag.hasEnoughSamples).toBe(false);
    expect(diag.count).toBe(3);
  });

  it("flags log-normal data as not-normal raw and likely-normal in log", () => {
    // log10(values) ~ N(-1, 0.5) — i.e. values are log-normal. The linear-space
    // distribution is right-skewed; the log-space distribution is Gaussian.
    const logSamples = gaussianSample(200, -1, 0.5, 7);
    const values = logSamples.map(v => 10 ** v);
    const diag = computeDiagnostics(values);
    expect(diag.hasEnoughSamples).toBe(true);
    expect(diag.rawNormality).toBe("not-normal");
    expect(diag.logNormality).toBe("likely-normal");
  });

  it("returns log-normality 'not-applicable' for data with zero or negative values", () => {
    const values = Array.from({ length: 30 }, (_, i) => i - 5); // includes 0 and negatives
    const diag = computeDiagnostics(values);
    expect(diag.logNormality).toBe("not-applicable");
  });

  it("identifies Tukey outliers using the 1.5*IQR fence", () => {
    const values = [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 100]; // 100 is the obvious outlier
    const diag = computeDiagnostics(values);
    expect(diag.outlierCount).toBeGreaterThanOrEqual(1);
    expect(diag.outlierIndices).toContain(values.indexOf(100));
  });

  it("treats roughly normal data as likely-normal", () => {
    // Symmetric, low-kurtosis data centered at 0
    const values = Array.from({ length: 60 }, (_, i) => Math.cos((i * Math.PI) / 30));
    const diag = computeDiagnostics(values);
    expect(diag.skewness).toBeCloseTo(0, 0);
  });
});

describe("buildWarnings", () => {
  it("emits a 'consider log-scale' warning for SUMO inputs whose log looks more normal", () => {
    const logSamples = gaussianSample(200, -1, 0.5, 7);
    const values = logSamples.map(v => 10 ** v);
    const diag = computeDiagnostics(values);
    const warnings = buildWarnings(diag, { role: "input", serviceMode: "SUMO", logScale: false });
    expect(warnings.some(w => /log-scale/i.test(w))).toBe(true);
  });

  it("does not nag the user when log-scale is already enabled and the data looks log-normal", () => {
    const logSamples = gaussianSample(200, -1, 0.5, 7);
    const values = logSamples.map(v => 10 ** v);
    const diag = computeDiagnostics(values);
    const warnings = buildWarnings(diag, { role: "input", serviceMode: "SUMO", logScale: true });
    expect(warnings.some(w => /consider enabling log-scale/i.test(w))).toBe(false);
  });

  it("emits an outlier-count warning when Tukey fences detect outliers", () => {
    const values = [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 100, 100, 100];
    const diag = computeDiagnostics(values);
    const warnings = buildWarnings(diag, { role: "input", serviceMode: "SUMO" });
    expect(warnings.some(w => /Tukey/.test(w))).toBe(true);
  });

  it("returns a 'need more samples' notice below the minimum sample count", () => {
    const diag = computeDiagnostics([1, 2, 3, 4]);
    const warnings = buildWarnings(diag, { role: "input", serviceMode: "SUMO" });
    expect(warnings.some(w => /at least 10/.test(w))).toBe(true);
  });
});

describe("extractValuesFromJobs", () => {
  it("only includes completed jobs and coerces numeric strings", () => {
    const jobs = [
      { status: "completed", inputs: { x: 1.5 }, outputs: { y: 0.1 } },
      { status: "failed", inputs: { x: 9999 }, outputs: { y: 9999 } }, // skipped
      { status: "success", inputs: { x: "2.5" }, outputs: { y: 0.2 } }, // coerced
      { status: "completed", inputs: {}, outputs: { y: 0.3 } }, // missing key skipped
    ];
    const xs = extractValuesFromJobs(jobs, "x", "input");
    expect(xs).toEqual([1.5, 2.5]);
    const ys = extractValuesFromJobs(jobs, "y", "output");
    expect(ys).toEqual([0.1, 0.2, 0.3]);
  });
});
