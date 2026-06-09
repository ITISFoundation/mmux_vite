import { snakeToCamelCase } from "./functionUtils";

export type NumericSeries = number[] | number[][];

export type SumoAxisPrediction = {
  x: number[];
  yHat: number[];
  stdHat?: number[];
};

function normalizeResponseKey(value: string): string {
  return value.replace(/_/g, "").toLowerCase();
}

function findMatchingSeries(payload: Record<string, unknown>, ...candidateKeys: string[]): unknown {
  for (const candidateKey of candidateKeys) {
    if (candidateKey in payload) {
      return payload[candidateKey];
    }
  }

  const normalizedCandidates = new Set(candidateKeys.map(normalizeResponseKey));
  const matchedEntry = Object.entries(payload).find(([key]) => normalizedCandidates.has(normalizeResponseKey(key)));
  return matchedEntry?.[1];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === "number");
}

function isNumberMatrix(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every(item => isNumberArray(item));
}

function isNumericSeries(value: unknown): value is NumericSeries {
  return isNumberArray(value) || isNumberMatrix(value);
}

export function getValidationSeries(payload: unknown, selectedQoI: string): { y: number[]; yHat: number[] } | null {
  if (!isRecord(payload)) {
    return null;
  }

  const camelSelectedQoI = snakeToCamelCase(selectedQoI);
  const y = findMatchingSeries(payload, selectedQoI, camelSelectedQoI);
  const yHat = findMatchingSeries(
    payload,
    `${selectedQoI}Hat`,
    `${camelSelectedQoI}Hat`,
    `${selectedQoI}_hat`,
    `${camelSelectedQoI}_hat`,
    `${selectedQoI}hat`,
    `${camelSelectedQoI}hat`,
  );
  if (!isNumberArray(y) || !isNumberArray(yHat)) {
    return null;
  }

  return { y, yHat };
}

export function getAlongAxesPredictions(payload: unknown): Record<string, SumoAxisPrediction> | null {
  if (!isRecord(payload) || !isRecord(payload.predictions)) {
    return null;
  }

  const predictions: Record<string, SumoAxisPrediction> = {};
  for (const [axisName, axisPayload] of Object.entries(payload.predictions)) {
    if (!isRecord(axisPayload) || !isNumberArray(axisPayload.x) || !isNumberArray(axisPayload.yHat)) {
      return null;
    }

    const { stdHat } = axisPayload;
    if (stdHat !== undefined && !isNumberArray(stdHat)) {
      return null;
    }

    predictions[axisName] = {
      x: axisPayload.x,
      yHat: axisPayload.yHat,
      ...(stdHat !== undefined ? { stdHat } : {}),
    };
  }

  return predictions;
}

export function getGridData(payload: unknown): Record<string, NumericSeries> | null {
  if (!isRecord(payload) || !isRecord(payload.gridData)) {
    return null;
  }

  const gridData: Record<string, NumericSeries> = {};
  for (const [key, value] of Object.entries(payload.gridData)) {
    if (!isNumericSeries(value)) {
      return null;
    }
    gridData[key] = value;
  }

  return gridData;
}

export function getGridOutputValues(gridData: Record<string, NumericSeries>, selectedQoI: string): NumericSeries | null {
  const values = gridData[selectedQoI] ?? gridData.yHat;
  return values !== undefined ? values : null;
}

export function getUQHistogramData(payload: unknown): DataUQHistogramType | null {
  if (!isRecord(payload)) {
    return null;
  }

  const { binsStart, binsEnd, binMeans, binStds, q1, median, q3, whiskerMin, whiskerMax, outliers, mean, std, min, max } =
    payload;

  if (
    typeof binsStart !== "number" ||
    typeof binsEnd !== "number" ||
    !isNumberArray(binMeans) ||
    !isNumberArray(binStds) ||
    typeof q1 !== "number" ||
    typeof median !== "number" ||
    typeof q3 !== "number" ||
    typeof whiskerMin !== "number" ||
    typeof whiskerMax !== "number" ||
    !isNumberArray(outliers) ||
    typeof mean !== "number" ||
    typeof std !== "number" ||
    typeof min !== "number" ||
    typeof max !== "number"
  ) {
    return null;
  }

  return {
    binsStart,
    binsEnd,
    binMeans,
    binStds,
    q1,
    median,
    q3,
    whiskerMin,
    whiskerMax,
    outliers,
    mean,
    std,
    min,
    max,
  };
}
