import {
  RegisteredProjectFunction,
  RegisteredPythonCodeFunction,
  RegisteredSolverFunction,
  RegisteredFunctionJobCollection,
  RegisteredProjectFunctionJobWithStatus,
  RegisteredPythonCodeFunctionJobWithStatus,
  RegisteredSolverFunctionJobWithStatus,
  FunctionJobStatus,
} from "osparc-api-ts-client";

// The oSPARC API hands the app *registered* functions/jobs (they carry `uid`). The
// generated client emits a bare `Function` union (ProjectFunction | PythonCodeFunction |
// SolverFunction) that has NO `uid`, plus the three concrete `Registered*Function`
// classes — but NO `RegisteredFunction` union type. So we mirror the generated `Function`
// union here over the registered variants. App code must use this (never the bare
// `Function`) so that `.uid` is always available. See node/SPEC.md §V20 / §B10.
export type RegisteredFunction = RegisteredProjectFunction | RegisteredPythonCodeFunction | RegisteredSolverFunction;

// Utility type: transforms a *WithStatus variant by flattening `status` from a
// FunctionJobStatus object → string. JobContext.jobStatusFilter() does this normalization
// at fetch time so the whole app can compare `job.status === "SUCCESS"`. Keeps `uid` and
// `status` required (always present post-normalization), but makes other API fields
// optional to allow test fixtures to omit them.
type FlattenStatus<T extends { status: FunctionJobStatus; uid: string }> = {
  uid: string;
  status: string;
} & Partial<Omit<T, "status" | "uid">>;

// Runtime shape of a function job AFTER JobContext normalizes it. Inherits all fields
// from the API's *WithStatus variants, but with `status` flattened from FunctionJobStatus
// object to a plain string. This reflects post-normalization reality without duplicating
// fields manually. See node/SPEC.md §V20 / §B10.
export type OsparcFunctionJob =
  | FlattenStatus<RegisteredProjectFunctionJobWithStatus>
  | FlattenStatus<RegisteredPythonCodeFunctionJobWithStatus>
  | FlattenStatus<RegisteredSolverFunctionJobWithStatus>;

interface PersistenceType {
  currentView: number;
  selectedFunction: RegisteredFunction | undefined;
  inputVars: string[];
  outputVars: string[];
  distribution: { [key: string]: InputVarSelection };
  outputTargets: { [key: string]: OutputVarSelection };
  // Per-function, per-output-variable log-scale toggle (surrogate trained/inverted in
  // log space for that output). Keyed by function uid, then output variable name. §V12.
  outputLogScales: { [key: string]: { [varName: string]: boolean } };
  lhsSamplingConfig: LHSamplingConfig;
  gridSamplingConfig: GridSamplingConfig;
  singleJobConfig: SingleJobConfig[];
  numSamples: { [key: string]: number };
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  fetchedJobCollections: SelectedJobCollection[] | undefined;
  selectedJobUids: string[];
  selectedQoI: string | undefined;
  isSuMoGenerated: boolean;
  mogaSettings: MOGASettings;
  weights: { [key: string]: number };
  sortModel: GridSortModel;
}
