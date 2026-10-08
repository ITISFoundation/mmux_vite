// Job-collection CSV upload parsing (§T6, V13). Parses the backend's
// "# key,value" metadata preamble + inputs/outputs table format consumed by
// `POST /flask/sampling/upload_job_collection_csv`. Pure utility (⊥ JSX/React),
// see node/SPEC.md §C structural conventions.

import { UploadedInputPreset, ParsedJobCollectionRow, ParsedJobCollectionCsv } from "./types";
import { computeDiagnostics } from "./distributionDiagnostics";

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

// B48ab (legacy B30): L1 distance in (skewness, excess-kurtosis) space between a sample's shape
// stats and a reference distribution's theoretical shape. This MUST use the signed
// excess kurtosis, not a pre-collapsed |skew|+|kurt| magnitude — collapsing to a
// single non-negative scalar before comparing against a reference number loses the
// sign, so a heavy-tailed *positive*-kurtosis shape (e.g. log-normal-like data in
// raw space) could spuriously read as "close to uniform" (kurtosis=-1.2) whenever
// its magnitude happened to coincide numerically.
function shapeDistance(skew: number, excessKurt: number, refSkew: number, refExcessKurt: number): number {
  return Math.abs(skew - refSkew) + Math.abs(excessKurt - refExcessKurt);
}

// Theoretical (skewness, excess kurtosis) of a perfect uniform distribution: 0, -1.2.
// The "normal" reference is (0, 0), used directly as literals below.
const uniformRefExcessKurt = -1.2;

// B48ab (legacy B30): minimum span (in orders of magnitude) required before a shape-fit is even
// allowed to suggest a LOG-scale candidate — BOTH log-normal and log-uniform
// (GH-Copilot #714: the gate once only covered log-uniform, so a narrow positive
// column could still infer scale:"log" via a log-normal shape-fit — e.g. the
// bell-shaped fixture exponentiated by position/10 spans ~0.26 decades yet
// picked log-normal). A skewness/kurtosis shape-fit is noisy at
// realistic sample sizes (e.g. N=50: skewness's standard error alone is ~0.3), so on a
// narrow-range (<1 decade) variable that noise can spuriously tip the shape distance
// toward "closer to log" even though a log axis would barely differ visually
// from a linear one there. Requiring a minimum span filters out that false-positive
// case without rejecting genuinely log-sampled data (real log-LHS columns in practice
// still comfortably clear 1+ decades).
const minLogScaleSpanDecades = 1;

function spansAtLeastDecades(min: number, max: number, decades: number): boolean {
  return min > 0 && max > 0 && Math.log10(max / min) >= decades;
}

// Only prefer a richer/more-specific distribution (log-scale over linear, normal or
// log-normal over uniform) when its shape-fit is clearly better by this margin —
// avoids needless flip-flopping between near-tied candidates.
const distributionPreferenceMargin = 0.06;

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

  if (!spansAtLeastDecades(min, max, minLogScaleSpanDecades)) {
    return false;
  }

  const logDiagnostics = computeDiagnostics(values.map(value => Math.log10(value)));
  const distToRawUniform = shapeDistance(diagnostics.skewness, diagnostics.excessKurtosis, 0, uniformRefExcessKurt);
  const distToLogUniform = shapeDistance(logDiagnostics.skewness, logDiagnostics.excessKurtosis, 0, uniformRefExcessKurt);

  return distToLogUniform <= distToRawUniform - distributionPreferenceMargin;
}

// B48ab (legacy B28): round a value to N significant digits for display/entry.
function roundToSignificantDigits(value: number, digits = 3): number {
  return Number(value.toPrecision(digits));
}

// B48ab (legacy B28): round a lower bound DOWN (toward -Infinity) to N significant digits, so the
// rounded bound never excludes the observed data it was derived from (plain
// toPrecision rounds to nearest, which can round a min *up* past real samples).
function floorToSignificantDigits(value: number, digits = 3): number {
  if (value === 0) {
    return 0;
  }
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const scale = 10 ** (digits - 1 - exponent);
  return Math.floor(value * scale) / scale;
}

// B48ab (legacy B28): round an upper bound UP (toward +Infinity) to N significant digits — the max
// counterpart of floorToSignificantDigits above.
function ceilToSignificantDigits(value: number, digits = 3): number {
  if (value === 0) {
    return 0;
  }
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const scale = 10 ** (digits - 1 - exponent);
  return Math.ceil(value * scale) / scale;
}

/**
 * Infer the best-fit distribution (constant, uniform [linear or log-scale], normal, or
 * log-normal expressed as the narrowed union's normal shape + scale:"log") for a
 * variable's imported data, so newly-created functions start with sensible defaults
 * instead of always defaulting to uniform.
 *
 * Below `minSamplesForDiagnostics` there's too little data to trust a skewness/kurtosis
 * shape-fit, so we fall back to uniform — UNLESS the data is strictly positive and
 * spans >=2 orders of magnitude (shouldUseLogScale), in which case we still can't tell
 * log-normal (bell-shaped in log-space) from log-uniform (flat in log-space) apart, so
 * log-uniform (uniform w/ scale:"log") is preferred as the least-assumption choice
 * (B48ab) — mirroring why plain (non-log) uniform is already the low-confidence
 * default for narrow-range data, rather than assuming a bell curve.
 *
 * At/above that threshold, every candidate distribution's shape distance is computed
 * properly in (skewness, excess-kurtosis) space (B48ab — see shapeDistance) against
 * normal (0,0), and — for strictly-positive data spanning at least
 * minLogScaleSpanDecades — log-normal and log-uniform (both evaluated on
 * log(values), against (0,0) and (0,-1.2) respectively). The closest
 * candidate wins only if it beats plain uniform by distributionPreferenceMargin;
 * otherwise plain uniform remains the default.
 *
 * Values computed from data (mean/std/min/max) are rounded to 3 significant digits
 * (B48ab); min rounds down and max rounds up so the bounds never exclude the data they
 * were derived from.
 */
export function pickDistributionPreset(values: number[]): UploadedInputPreset {
  const { min, max } = minMax(values);

  if (min === max) {
    return { distribution: "constant", value: roundToSignificantDigits(min), scale: "linear" };
  }

  const diagnostics = computeDiagnostics(values);
  if (!diagnostics.hasEnoughSamples) {
    return {
      distribution: "uniform",
      min: floorToSignificantDigits(min),
      max: ceilToSignificantDigits(max),
      scale: shouldUseLogScale(values) ? "log" : "linear",
    };
  }

  const allPositive = values.every(value => value > 0);
  const spansEnoughForLogScale = allPositive && spansAtLeastDecades(min, max, minLogScaleSpanDecades);
  const distToNormal = shapeDistance(diagnostics.skewness, diagnostics.excessKurtosis, 0, 0);
  const distToUniform = shapeDistance(diagnostics.skewness, diagnostics.excessKurtosis, 0, uniformRefExcessKurt);

  let logDiagnostics: ReturnType<typeof computeDiagnostics> | undefined;
  let distToLogNormal: number | undefined;
  let distToLogUniform: number | undefined;
  if (spansEnoughForLogScale) {
    // GH-Copilot #714 (B51gh): BOTH log candidates sit behind the ≥1-decade
    // gate — V13 has always said "log candidates gated on ≥1-decade span", but
    // the gate once covered only log-uniform, letting a narrow positive column
    // infer scale:"log" through a log-normal shape-fit.
    logDiagnostics = computeDiagnostics(values.map(value => Math.log(value)));
    distToLogNormal = shapeDistance(logDiagnostics.skewness, logDiagnostics.excessKurtosis, 0, 0);
    distToLogUniform = shapeDistance(logDiagnostics.skewness, logDiagnostics.excessKurtosis, 0, uniformRefExcessKurt);
  }

  type Candidate = { kind: "normal" | "log-normal" | "log-uniform"; distance: number };
  const candidates: Candidate[] = [{ kind: "normal", distance: distToNormal }];
  if (distToLogNormal !== undefined) candidates.push({ kind: "log-normal", distance: distToLogNormal });
  if (distToLogUniform !== undefined) candidates.push({ kind: "log-uniform", distance: distToLogUniform });

  const best = candidates.reduce((closest, candidate) => (candidate.distance < closest.distance ? candidate : closest));

  if (best.distance + distributionPreferenceMargin < distToUniform) {
    if (best.kind === "normal") {
      return {
        distribution: "normal",
        mean: roundToSignificantDigits(diagnostics.mean),
        std: roundToSignificantDigits(diagnostics.std),
        scale: "linear",
      };
    }
    if (best.kind === "log-normal" && logDiagnostics) {
      // Convert log-space moments to LINEAR-space mean/std so users read the
      // intuitive linear values (B33/V40: normal shape + orthogonal scale:"log"
      // IS the log-normal; there is no separate log-normal form).
      const expMuHalfSigmaSq = Math.exp(logDiagnostics.mean + (logDiagnostics.std * logDiagnostics.std) / 2);
      const mean = expMuHalfSigmaSq;
      const variance = expMuHalfSigmaSq * expMuHalfSigmaSq * (Math.exp(logDiagnostics.std * logDiagnostics.std) - 1);
      return {
        distribution: "normal",
        mean: roundToSignificantDigits(mean),
        std: roundToSignificantDigits(Math.sqrt(variance)),
        scale: "log",
      };
    }
    return {
      distribution: "uniform",
      min: floorToSignificantDigits(min),
      max: ceilToSignificantDigits(max),
      scale: "log",
    };
  }

  return {
    distribution: "uniform",
    min: floorToSignificantDigits(min),
    max: ceilToSignificantDigits(max),
    scale: "linear",
  };
}

/**
 * Short human-readable verdict of the shape fit this data implies, so the UI can
 * explain WHY an imported column got the shape/scale it did (and why an
 * untouched-looking default is actually data-driven). Mirrors
 * pickDistributionPreset's candidate math; returns undefined when there is no
 * data to describe. Not wired into pickDistributionPreset itself — the preset
 * stays the single source of truth for what is applied.
 */
export function describeShapeFit(values: number[]): string | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const { min, max } = minMax(values);
  if (min === max) {
    return "constant · every value identical";
  }

  const diagnostics = computeDiagnostics(values);
  if (!diagnostics.hasEnoughSamples) {
    const logFallback = shouldUseLogScale(values);
    return `uniform · ${values.length} samples (below the shape-fit bar; log axis only via the >=2-decade span rule: ${logFallback ? "met" : "not met"})`;
  }

  const allPositive = values.every(value => value > 0);
  const spansEnoughForLogScale = allPositive && spansAtLeastDecades(min, max, minLogScaleSpanDecades);
  const distToNormal = shapeDistance(diagnostics.skewness, diagnostics.excessKurtosis, 0, 0);
  const distToUniform = shapeDistance(diagnostics.skewness, diagnostics.excessKurtosis, 0, uniformRefExcessKurt);

  let distToLogNormal: number | undefined;
  let distToLogUniform: number | undefined;
  if (spansEnoughForLogScale) {
    // mirrors pickDistributionPreset: both log candidates behind the ≥1-decade gate
    const logDiagnostics = computeDiagnostics(values.map(value => Math.log(value)));
    distToLogNormal = shapeDistance(logDiagnostics.skewness, logDiagnostics.excessKurtosis, 0, 0);
    distToLogUniform = shapeDistance(logDiagnostics.skewness, logDiagnostics.excessKurtosis, 0, uniformRefExcessKurt);
  }

  type Candidate = { kind: "normal" | "log-normal" | "log-uniform"; distance: number };
  const candidates: Candidate[] = [{ kind: "normal", distance: distToNormal }];
  if (distToLogNormal !== undefined) candidates.push({ kind: "log-normal", distance: distToLogNormal });
  if (distToLogUniform !== undefined) candidates.push({ kind: "log-uniform", distance: distToLogUniform });

  const best = candidates.reduce((closest, candidate) => (candidate.distance < closest.distance ? candidate : closest));

  if (best.distance + distributionPreferenceMargin < distToUniform) {
    return `best fit ${best.kind} · shape-distance ${best.distance.toFixed(2)} vs uniform ${distToUniform.toFixed(2)}`;
  }
  return `plain uniform · no shape beats it (uniform ${distToUniform.toFixed(2)}, closest ${best.kind} ${best.distance.toFixed(2)}) by the ${distributionPreferenceMargin} margin`;
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
    // V13: the best-fit shape (constant/uniform/normal x linear/log) inferred from
    // the column's data, with 3-sig-digit parameters (uniform bounds outward).
    inputPresets[variable] = pickDistributionPreset(values);
  });

  return { ...base, inputVars, outputVars, inputPresets, rows };
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
