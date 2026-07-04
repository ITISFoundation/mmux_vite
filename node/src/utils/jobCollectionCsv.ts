// Job-collection CSV upload parsing (§T6, V13). Parses the backend's
// "# key,value" metadata preamble + inputs/outputs table format consumed by
// `POST /flask/sampling/upload_job_collection_csv`. Pure utility (⊥ JSX/React),
// see node/SPEC.md §C structural conventions.

import { UploadedInputPreset, ParsedJobCollectionRow, ParsedJobCollectionCsv } from "./types";
import { computeDiagnostics } from "./distributionDiagnostics";

export type { UploadedInputPreset };

export interface UploadedJobCollectionAnalysis {
  inputVars: string[];
  outputVars: string[];
  inputPresets: Record<string, UploadedInputPreset>;
}

const inputPrefix = "input__";
const outputPrefix = "output__";

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

function splitPreambleAndTable(csvContent: string): { preamble: Record<string, string>; tableLines: string[] } {
  const preamble: Record<string, string> = {};
  const tableLines: string[] = [];

  csvContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (tableLines.length === 0 && trimmed.startsWith("#")) {
      // B20: parse the "# key,value" preamble line via the CSV row parser (not a raw
      // indexOf(",") split) so a quoted value can itself contain commas/quotes.
      const [key, ...rest] = parseCsvRow(trimmed.slice(1).trim());
      if (key !== undefined && rest.length > 0) {
        preamble[key.trim()] = rest.join(",").trim();
      }
      return;
    }
    if (tableLines.length === 0 && trimmed.length === 0) {
      return; // skip blank lines before the table starts
    }
    tableLines.push(line);
  });

  return { preamble, tableLines };
}

// B19: a blank/whitespace-only cell means the value is missing, not 0 —
// `Number("")===0` would otherwise silently record a real zero.
function parseNumericCell(rawCell: string | undefined): number | undefined {
  if (rawCell === undefined || rawCell.trim().length === 0) {
    return undefined;
  }
  const numericValue = Number(rawCell);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

// B25: reduce (not `Math.min(...values)`/`Math.max(...values)`) — spreading a large
// job collection's values into function arguments can throw a RangeError and abort
// the import.
function minMax(values: number[]): { min: number; max: number } {
  return values.reduce((acc, value) => ({ min: Math.min(acc.min, value), max: Math.max(acc.max, value) }), {
    min: values[0],
    max: values[0],
  });
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
  const { min, max } = minMax(values);
  if (!(max > min)) {
    return false;
  }

  const diagnostics = computeDiagnostics(values);
  if (!diagnostics.hasEnoughSamples) {
    // heuristic: values spanning >=2 orders of magnitude read better on a log axis
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
  const { min, max } = minMax(values);

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

export function parseJobCollectionCsv(csvContent: string): ParsedJobCollectionCsv {
  const { preamble, tableLines } = splitPreambleAndTable(csvContent);
  const dataLines = tableLines.map(line => line.trimEnd()).filter(line => line.trim().length > 0);
  const headerLine = dataLines[0];

  const base = {
    sourceFunctionUid: preamble.source_function_uid,
    sourceJobCollectionUid: preamble.source_job_collection_uid,
    sourceJobCollectionTitle: preamble.source_job_collection_title,
  };

  if (!headerLine) {
    return { ...base, inputVars: [], outputVars: [], inputPresets: {}, rows: [] };
  }

  const header = parseCsvRow(headerLine);
  const inputColumns = header.filter(column => column.startsWith(inputPrefix));
  const outputColumns = header.filter(column => column.startsWith(outputPrefix));
  const inputVars = inputColumns.map(column => column.slice(inputPrefix.length));
  const outputVars = outputColumns.map(column => column.slice(outputPrefix.length));
  // B24: precompute column indices once (not `header.indexOf(column)` per row/column
  // inside the loop below), keeping parsing O(rows x columns) instead of O(rows x columns x headerLength).
  const inputColumnIndices = inputColumns.map(column => header.indexOf(column));
  const outputColumnIndices = outputColumns.map(column => header.indexOf(column));
  const sourceJobUidIndex = header.indexOf("source_job_uid");
  const statusIndex = header.indexOf("status");
  const valueBuckets: Record<string, number[]> = Object.fromEntries(inputVars.map(variable => [variable, []]));
  const rows: ParsedJobCollectionRow[] = [];

  dataLines.slice(1).forEach(line => {
    const cells = parseCsvRow(line);
    const inputs: Record<string, number> = {};
    const outputs: Record<string, number> = {};

    inputColumnIndices.forEach((columnIndex, index) => {
      const numericValue = parseNumericCell(cells[columnIndex]);
      if (numericValue !== undefined) {
        inputs[inputVars[index]] = numericValue;
        valueBuckets[inputVars[index]].push(numericValue);
      }
    });
    outputColumnIndices.forEach((columnIndex, index) => {
      const numericValue = parseNumericCell(cells[columnIndex]);
      if (numericValue !== undefined) {
        outputs[outputVars[index]] = numericValue;
      }
    });

    rows.push({
      sourceJobUid: sourceJobUidIndex !== -1 ? cells[sourceJobUidIndex] : undefined,
      status: statusIndex !== -1 ? cells[statusIndex] : undefined,
      inputs,
      outputs,
    });
  });

  const inputPresets: Record<string, UploadedInputPreset> = {};
  inputVars.forEach(variable => {
    const values = valueBuckets[variable];
    if (values.length === 0) {
      return;
    }
    const { min, max } = minMax(values);
    inputPresets[variable] = {
      distribution: "uniform",
      min,
      max,
      logScale: shouldUseLogScale(values),
    };
  });

  return { ...base, inputVars, outputVars, inputPresets, rows };
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
  const { tableLines } = splitPreambleAndTable(csvContent);
  const dataLines = tableLines.map(line => line.trimEnd()).filter(line => line.trim().length > 0);
  const headerLine = dataLines[0];

  if (!headerLine) {
    return { inputVars: [], outputVars: [], inputPresets: {} };
  }

  const header = parseCsvRow(headerLine);
  const inputColumns = header.filter(column => column.startsWith(inputPrefix));
  const outputColumns = header.filter(column => column.startsWith(outputPrefix));
  const inputVars = inputColumns.map(column => column.slice(inputPrefix.length));
  const outputVars = outputColumns.map(column => column.slice(outputPrefix.length));
  // B24: precompute column indices once, see parseJobCollectionCsv above.
  const inputColumnIndices = inputColumns.map(column => header.indexOf(column));
  const valueBuckets: Record<string, number[]> = Object.fromEntries(inputVars.map(variable => [variable, []]));

  dataLines.slice(1).forEach(line => {
    const cells = parseCsvRow(line);
    inputColumnIndices.forEach((columnIndex, index) => {
      const numericValue = parseNumericCell(cells[columnIndex]);
      if (numericValue !== undefined) {
        valueBuckets[inputVars[index]].push(numericValue);
      }
    });
  });

  const inputPresets: Record<string, UploadedInputPreset> = {};
  inputVars.forEach(variable => {
    const values = valueBuckets[variable];
    if (values.length === 0) {
      return;
    }
    if (options.inferDistributionType) {
      inputPresets[variable] = pickDistributionPreset(values);
      return;
    }
    const { min, max } = minMax(values);
    inputPresets[variable] = { distribution: "uniform", min, max, logScale: shouldUseLogScale(values) };
  });

  return { inputVars, outputVars, inputPresets };
}

export function pickSingleCsvFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";

    // B22: dismissing the native file picker does not fire `change` in most
    // browsers, so `onchange` alone leaves this promise pending forever. Use the
    // window regaining focus (which happens when the picker closes) as a
    // fallback signal, deferred so the genuine `change` event gets a chance to
    // fire first, and guard both paths with `settled` so only one ever resolves.
    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          settled = true;
          window.removeEventListener("focus", onWindowFocus);
          reject(new Error("No file selected"));
        }
      }, 300);
    };

    input.onchange = () => {
      if (settled) return;
      const file = input.files?.[0];
      settled = true;
      window.removeEventListener("focus", onWindowFocus);
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      resolve(file);
    };
    window.addEventListener("focus", onWindowFocus);
    input.click();
  });
}
