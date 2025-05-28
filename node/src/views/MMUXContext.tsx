import { createContext } from "react";
import { Function, RegisteredFunctionJobCollection } from "../osparc-api-ts-client";

export interface MMUXContextType {
  selectedFunction: Function | undefined;
  setSelectedFunction: (F: Function) => void;
  inputVars: string[] | undefined;
  setInputVars: (vars: string[]) => void;
  outputVars: string[] | undefined;
  setOutputVars: (vars: string[]) => void;
  currentView: number;
  setCurrentView: (i: number) => void;
  launchingSampling: boolean,
  setLaunchingSampling: (b: boolean) => void;
  runningSampling: boolean,
  setRunningSampling: (b: boolean) => void;
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void;
  selectedJobUids: string[];
  setSelectedJobUids: (selectedJobs: string[]) => void;
}

const MMUXContext = createContext<MMUXContextType | undefined>(undefined);

export default MMUXContext;
