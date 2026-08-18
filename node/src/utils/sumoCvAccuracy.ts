export function computeCvStatistics(y: number[], yHat: number[]): CvMetricsType {
  if (y.length !== yHat.length) {
    throw new Error("CV actual and predicted arrays must have the same length");
  }

  const n = y.length;
  if (n === 0) {
    return { meanY: 0, stdY: 0, meanYHat: 0, stdYHat: 0, mae: 0, rmse: 0, r2: 0 };
  }

  const meanY = y.reduce((sum, value) => sum + value, 0) / n;
  const meanYHat = yHat.reduce((sum, value) => sum + value, 0) / n;
  const residuals = y.map((value, index) => value - yHat[index]);
  const mae = residuals.reduce((sum, value) => sum + Math.abs(value), 0) / n;
  const rmse = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / n);
  const stdY = n <= 1 ? 0 : Math.sqrt(y.reduce((sum, value) => sum + (value - meanY) ** 2, 0) / (n - 1));
  const stdYHat = n <= 1 ? 0 : Math.sqrt(yHat.reduce((sum, value) => sum + (value - meanYHat) ** 2, 0) / (n - 1));
  const ssTot = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const ssRes = residuals.reduce((sum, value) => sum + value ** 2, 0);

  return { meanY, stdY, meanYHat, stdYHat, mae, rmse, r2: ssTot === 0 ? (ssRes === 0 ? 1 : 0) : 1 - ssRes / ssTot };
}
