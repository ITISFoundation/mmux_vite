export type ValidationSeries = {
  observations: number[];
  predictions: number[];
};

type ValidationResponse = {
  observed?: number[];
  predicted?: number[];
};

export function getValidationSeries(data: ValidationResponse): ValidationSeries | undefined {
  const { observed: observations, predicted: predictions } = data;

  if (!Array.isArray(observations) || !Array.isArray(predictions)) {
    return undefined;
  }

  return { observations, predictions };
}
