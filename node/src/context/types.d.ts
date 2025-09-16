import { Function as OsparcFunct, FunctionJob, RegisteredFunctionJobCollection } from "osparc-api-ts-client";

export type OsparcFunction = OsparcFunct & {
  inputs: string[];
  outputs: string[];
  uid: string;
};

export type OsparcFunctionJob = FunctionJob & {
  uid: string;
  status: string;
  inputs: { [key: string]: unknown };
  outputs: { [key: string]: unknown };
};

export type OsparcRegFunctionJobCollection = RegisteredFunctionJobCollection & {
  jobIds: string[];
};

interface PersistenceType {
  currentView: number;
  selectedFunction: OsparcFunction | undefined;
  inputVars: string[];
  outputVars: string[];
  distribution: { [key: string]: InputVarSelection };
  outputTargets: { [key: string]: OutputVarSelection };
  lhsSamplingConfig: LHSamplingConfig;
  gridSamplingConfig: GRIDSamplingConfig;
  singleJobConfig: SingleJobConfig[];
  numSamples: { [key: string]: number };
  runningJobCollection: OsparcRegFunctionJobCollection | undefined;
  fetchedJobCollections: SelectedJobCollection[];
  selectedJobUids: string[];
  selectedQoI: string | undefined;
  isSuMoGenerated: boolean;
  weights: { [key: string]: number } | undefined;
  sortModel: GridSortModel | undefined;
}
