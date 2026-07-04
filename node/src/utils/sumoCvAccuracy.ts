// Pure helpers for the SuMo CV statistical-rigor extension (V25, ../flaskapi/SPEC.md V26/V27).
// Backend shape (`/flask/dakota/get_sumo_cv_accuracy_metrics`, already camelCased by the global
// after_request serializer):
//   { metrics: { [output]: { rootMeanSquared, sumAbs, meanAbs, maxAbs } | string },
//     tTest?: { statistic: number, pValue: number },
//     convergence: { nSamples: number, metric: number }[] }

export interface CvAccuracyMetrics {
  rootMeanSquared?: number | string | null;
  sumAbs?: number | string | null;
  meanAbs?: number | string | null;
  maxAbs?: number | string | null;
}

export interface PairedTTestResult {
  statistic: number;
  pValue: number;
}

export interface CvConvergencePoint {
  nSamples: number;
  metric: number;
}

export interface SumoCvAccuracyMetricsResponse {
  metrics: { [output: string]: CvAccuracyMetrics | string };
  tTest?: PairedTTestResult;
  convergence?: CvConvergencePoint[];
  error?: string;
}

export interface BiasBanner {
  significant: boolean;
  text: string;
}

// Default significance threshold for the paired t-test bias banner.
export const defaultBiasSignificanceThreshold = 0.05;

/**
 * Format the paired-t-test result (V26) into a human-readable bias-significance banner.
 * `threshold` defaults to the conventional 0.05 significance level.
 */
export function formatBiasBanner(
  tTest: PairedTTestResult | undefined,
  threshold = defaultBiasSignificanceThreshold,
): BiasBanner | undefined {
  if (!tTest || typeof tTest.pValue !== "number" || Number.isNaN(tTest.pValue)) {
    return undefined;
  }
  const pValueText = tTest.pValue.toFixed(3);
  if (tTest.pValue < threshold) {
    return {
      significant: true,
      text: `Statistically significant bias detected (paired t-test p=${pValueText})`,
    };
  }
  return {
    significant: false,
    text: `No significant bias detected (paired t-test p=${pValueText})`,
  };
}
