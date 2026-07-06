import { computeDiagnostics } from "./distributionDiagnostics";

export type UploadedInputPreset =
  | (VarSelection & { distribution: "constant"; value: number })
  | (VarSelection & { distribution: "uniform"; min: number; max: number; logScale: boolean })
  | (VarSelection & { distribution: "normal"; mean: number; std: number })
  | (VarSelection & { distribution: "log-normal"; logMean: number; logStd: number });

export interface UploadedJobCollectionAnalysis {
  inputVars: string[];
  outputVars: string[];
  inputPresets: Record<string, UploadedInputPreset>;
}

function splitCsvPreambleAndTable(csvContent: string): { tableLines: string[] } {
  const tableLines: string[] = [];

  for (const line of csvContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if ((trimmed || tableLines.length > 0) && !(tableLines.length === 0 && trimmed.startsWith("#"))) {
      tableLines.push(line);
    }
  }

  return { tableLines };
}

function parseCsvRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function shapeScore(values: number[]): number {
  const count = values.length;
  if (count === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let mean = 0;
  for (const value of values) {
    mean += value;
  }
  mean /= count;

  let secondMoment = 0;
  let thirdMoment = 0;
  let fourthMoment = 0;
  for (const value of values) {
    const delta = value - mean;
    const deltaSquared = delta * delta;
    secondMoment += deltaSquared;
    thirdMoment += deltaSquared * delta;
    fourthMoment += deltaSquared * deltaSquared;
  }

  secondMoment /= count;
  thirdMoment /= count;
  fourthMoment /= count;

  if (secondMoment === 0) {
    return 0;
  }

  const sigma = Math.sqrt(secondMoment);
  const skewness = thirdMoment / (sigma * sigma * sigma);
  const excessKurtosis = fourthMoment / (secondMoment * secondMoment) - 3;
  return Math.abs(skewness) + Math.abs(excessKurtosis);
}

function shouldUseLogScale(values: number[]): boolean {
  if (values.length === 0 || values.some(value => value <= 0)) {
    return false;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!(max > min)) {
    return false;
  }

  const diagnostics = computeDiagnostics(values);
  if (!diagnostics.hasEnoughSamples) {
    return Math.log10(max) - Math.log10(min) >= 2;
  }

  const rawScore = shapeScore(values);
  const logScore = shapeScore(values.map(value => Math.log10(value)));

  return logScore <= rawScore - 0.06;
}

// Theoretical shapeScore (|skewness| + |excess kurtosis|) of a perfect uniform
// distribution: skewness = 0, excess kurtosis = -1.2.
const uniformReferenceShapeScore = 1.2;
// Only prefer a richer/more-specific distribution (log-normal over normal/uniform,
// normal over uniform) when its shape-fit is clearly better by this margin — mirrors
// the margin already used by shouldUseLogScale above, avoiding needless flip-flopping.
const distributionPreferenceMargin = 0.06;

function roundToSignificantDigits(value: number, digits = 3): number {
  return Number(value.toPrecision(digits));
}

/**
 * Infer the best-fit distribution (constant, uniform, normal, or log-normal) for a
 * variable's imported data, so newly-created functions start with sensible defaults
 * instead of always defaulting to uniform. Falls back to uniform (+ the existing
 * logScale heuristic) when there isn't enough data to trust a shape comparison.
 *
 * Values computed from data (mean/std/logMean/logStd) are rounded to 3 significant
 * digits; literal min/max bounds are preserved exactly.
 */
function pickDistributionPreset(values: number[]): UploadedInputPreset {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { distribution: "constant", value: roundToSignificantDigits(min) };
  }

  const diagnostics = computeDiagnostics(values);
  if (!diagnostics.hasEnoughSamples) {
    return { distribution: "uniform", min, max, logScale: shouldUseLogScale(values) };
  }

  const allPositive = values.every(value => value > 0);
  const normalDistance = shapeScore(values);
  const uniformDistance = Math.abs(normalDistance - uniformReferenceShapeScore);
  const logNormalDistance = allPositive ? shapeScore(values.map(value => Math.log(value))) : undefined;

  const bestLinearDistance = Math.min(normalDistance, uniformDistance);

  if (logNormalDistance !== undefined && logNormalDistance + distributionPreferenceMargin < bestLinearDistance) {
    const logStats = computeDiagnostics(values.map(value => Math.log(value)));
    return {
      distribution: "log-normal",
      logMean: roundToSignificantDigits(logStats.mean),
      logStd: roundToSignificantDigits(logStats.std),
    };
  }

  if (normalDistance + distributionPreferenceMargin < uniformDistance) {
    return {
      distribution: "normal",
      mean: roundToSignificantDigits(diagnostics.mean),
      std: roundToSignificantDigits(diagnostics.std),
    };
  }

  return { distribution: "uniform", min, max, logScale: shouldUseLogScale(values) };
}

export interface AnalyzeUploadedJobCollectionCsvOptions {
  /**
   * When true, infer the best-fit distribution (constant/uniform/normal/log-normal) per
   * variable instead of always defaulting to uniform. Intended for the "create new
   * function from CSV" flow only.
   */
  inferDistributionType?: boolean;
}

export function analyzeUploadedJobCollectionCsv(
  csvContent: string,
  options: AnalyzeUploadedJobCollectionCsvOptions = {},
): UploadedJobCollectionAnalysis {
  const { tableLines } = splitCsvPreambleAndTable(csvContent);
  const dataLines = tableLines.map(line => line.trimEnd()).filter(line => line.trim().length > 0);
  const headerLine = dataLines[0];

  if (!headerLine) {
    return { inputVars: [], outputVars: [], inputPresets: {} };
  }

  const header = parseCsvRow(headerLine);
  const inputColumns = header.filter(column => column.startsWith("input__"));
  const outputColumns = header.filter(column => column.startsWith("output__"));
  const inputVars = inputColumns.map(column => column.replace("input__", ""));
  const outputVars = outputColumns.map(column => column.replace("output__", ""));
  const valueBuckets = Object.fromEntries(inputVars.map(variable => [variable, [] as number[]]));

  for (const line of dataLines.slice(1)) {
    const row = parseCsvRow(line);
    inputColumns.forEach((column, index) => {
      const columnIndex = header.indexOf(column);
      const rawValue = row[columnIndex] ?? "";
      const numericValue = Number(rawValue);
      if (Number.isFinite(numericValue)) {
        valueBuckets[inputVars[index]].push(numericValue);
      }
    });
  }

  const inputPresets = Object.fromEntries(
    inputVars
      .filter(variable => valueBuckets[variable].length > 0)
      .map(variable => {
        const values = valueBuckets[variable];
        const preset: UploadedInputPreset = options.inferDistributionType
          ? pickDistributionPreset(values)
          : { distribution: "uniform", min: Math.min(...values), max: Math.max(...values), logScale: shouldUseLogScale(values) };
        return [variable, preset];
      }),
  );

  return {
    inputVars,
    outputVars,
    inputPresets,
  };
}

export function triggerCsvDownload(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const pickSingleCsvFile = (): Promise<File> =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      resolve(file);
    };
    input.click();
  });
