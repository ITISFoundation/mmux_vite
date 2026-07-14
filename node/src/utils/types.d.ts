import { RegisteredFunctionJobCollection } from "osparc-api-ts-client";

// Shared types for node/src/utils/*. Extracted to their own file (rather than
// exported piecemeal from jobCollectionCsv.ts / functionUtils.ts) so consumers
// can import them directly without pulling in those modules and risking future
// circular imports between utils files.

export interface UploadedInputPreset {
  distribution: "uniform";
  min: number;
  max: number;
  logScale: boolean;
}

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
