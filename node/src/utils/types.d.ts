import { RegisteredFunctionJobCollection } from "osparc-api-ts-client";

// Shared types for node/src/utils/*. Extracted to their own file (rather than
// exported piecemeal from jobCollectionCsv.ts / functionUtils.ts) so consumers
// can import them directly without pulling in those modules and risking future
// circular imports between utils files.

// Best-fit preset inferred from a CSV column's data (jobCollectionCsv
// pickDistributionPreset): the shape is whichever candidate (constant,
// uniform in linear or log space, normal in linear or log space) whose
// (skewness, excess-kurtosis) shape is closest to the theoretical reference,
// plain uniform being the least-assumption fallback. Parameters are rounded
// to 3 significant digits (uniform bounds round outward).
export type UploadedInputPreset =
  | (VarSelection & { distribution: "constant"; value: number })
  | (VarSelection & { distribution: "uniform"; min: number; max: number })
  | (VarSelection & { distribution: "normal"; mean: number; std: number });

export interface ParsedJobCollectionRow {
  sourceJobUid?: string;
  status?: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
}

export interface ParsedJobCollectionCsv {
  sourceFunctionUid?: string;
  sourceJobCollectionUid?: string;
  sourceJobCollectionTitle?: string;
  inputVars: string[];
  outputVars: string[];
  inputPresets: Record<string, UploadedInputPreset>;
  rows: ParsedJobCollectionRow[];
}

export interface UploadJobCollectionCsvResponse {
  targetFunctionUid: string;
  importedSamples: number;
  jobCollection: RegisteredFunctionJobCollection;
}

export interface UploadJobCollectionCsvParams {
  csvContent: string;
  targetMode: "existing" | "new";
  targetFunctionUid?: string;
  newFunctionTitle?: string;
  sourceFunctionUid?: string;
}
