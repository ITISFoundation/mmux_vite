import {
  RegisteredProjectFunction,
  RegisteredPythonCodeFunction,
  RegisteredSolverFunction,
  RegisteredFunctionJobCollection,
} from "osparc-api-ts-client";

// The oSPARC API hands the app *registered* functions/jobs (they carry `uid`). The
// generated client emits a bare `Function` union (ProjectFunction | PythonCodeFunction |
// SolverFunction) that has NO `uid`, plus the three concrete `Registered*Function`
// classes — but NO `RegisteredFunction` union type. So we mirror the generated `Function`
// union here over the registered variants. App code must use this (never the bare
// `Function`) so that `.uid` is always available. See node/SPEC.md §V20 / §B10.
export type RegisteredFunction = RegisteredProjectFunction | RegisteredPythonCodeFunction | RegisteredSolverFunction;

// Runtime shape of a function job AFTER JobContext normalizes it. We deliberately do NOT
// reuse the generated job types here:
//   - bare `FunctionJob` / `Registered*FunctionJob` have NO `status` field at all;
//   - the `*WithStatus` variants carry `status` as a FunctionJobStatus OBJECT
//     ({ status: string }), but `JobContext.jobStatusFilter()` flattens it to a plain
//     string at fetch time so the whole app can compare `job.status === "SUCCESS"`.
// This minimal interface reflects that post-normalization truth (uid + status:string).
// Compromise: it intentionally diverges from the raw generated job types (Option A —
// the alternative, Option B, would refactor ~30 status call sites to read an object).
export interface OsparcFunctionJob {
  uid: string;
  status: string;
  functionUid?: string;
  functionClass?: string;
  inputs: { [key: string]: unknown } | null;
  outputs: { [key: string]: unknown } | null;
}

interface PersistenceType {
  currentView: number;
  selectedFunction: RegisteredFunction | undefined;
  inputVars: string[];
  outputVars: string[];
  distribution: { [key: string]: InputVarSelection };
  outputTargets: { [key: string]: OutputVarSelection };
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
