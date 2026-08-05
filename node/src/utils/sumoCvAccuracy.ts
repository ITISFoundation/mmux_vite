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

/**
 * Compute cross-validation accuracy statistics (mean/std of observed+predicted, MAE, RMSE, R²)
 * from paired actual/predicted arrays (V25, ../../SPEC.md T32/node/SPEC.md T34: MAE/RMSE/R²
 * moved out of `SuMoValidation`'s inline display into the Stats step).
 */
export function computeCvStatistics(y: number[], yHat: number[]): CvMetricsType {
  const n = y.length;
  if (n === 0) {
    return { meanY: 0, stdY: 0, meanYHat: 0, stdYHat: 0, mae: 0, rmse: 0, r2: 0 };
  }
  const mae = y.reduce((sum, value, index) => sum + Math.abs(value - yHat[index]), 0) / n;
  const rmse = Math.sqrt(y.reduce((sum, value, index) => sum + (value - yHat[index]) ** 2, 0) / n);
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  // Sample std is undefined for n=1 (0 degrees of freedom); treat it as 0 spread.
  const stdY = n <= 1 ? 0 : Math.sqrt(y.reduce((sum, value) => sum + (value - meanY) ** 2, 0) / (n - 1));
  const meanYHat = yHat.reduce((a, b) => a + b, 0) / n;
  const stdYHat = n <= 1 ? 0 : Math.sqrt(yHat.reduce((sum, value) => sum + (value - meanYHat) ** 2, 0) / (n - 1));
  const ssRes = y.reduce((sum, value, index) => sum + (value - yHat[index]) ** 2, 0);
  const ssTot = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { meanY, stdY, meanYHat, stdYHat, mae, rmse, r2 };
}
