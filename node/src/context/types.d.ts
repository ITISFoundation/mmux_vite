import { Function as OsparcFunction, RegisteredFunctionJobCollection } from "../osparc-api-ts-client";

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
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  fetchedJobCollections: SelectedJobCollection[];
  selectedJobUids: string[];
  selectedQoI: string | undefined;
  isSuMoGenerated: boolean;
  weights: { [key: string]: number } | undefined;
  sortModel: GridSortModel | undefined;
}
