import { Function as OsparcFunction, RegisteredFunctionJobCollection } from "../osparc-api-ts-client";

interface PersistenceType {
  currentView: number;
  selectedFunction: OsparcFunction | undefined;
  inputVars: string[];
  outputVars: string[];
  distribution: { [key: string]: InputVarSelection };
  outputTargets: { [key: string]: OutputVarSelection };
  outputLogScales: { [uid: string]: { [varName: string]: boolean } };
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
