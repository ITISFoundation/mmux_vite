import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Function,
  FunctionJob,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";

export interface MMUXContextType {
  selectedFunction: Function | undefined;
  setSelectedFunction: (F: Function) => void;
  distribution: InputVarSelection;
  setDistribution: (d: InputVarSelection) => void;
  inputVars: string[];
  setInputVars: (vars: string[]) => void;
  outputVars: string[] | undefined;
  setOutputVars: (vars: string[]) => void;
  currentView: number;
  setCurrentView: (i: number) => void;
  launchingSampling: boolean;
  setLaunchingSampling: (b: boolean) => void;
  runningSampling: boolean;
  setRunningSampling: (b: boolean) => void;
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  setRunningJobCollection: (
    jc: RegisteredFunctionJobCollection | undefined
  ) => void;
  fetchedJobCollections: SelectedJobCollection[];
  setFetchedJobCollections: (jc: SelectedJobCollection[]) => void;
  selectedJobUids: string[];
  setSelectedJobUids: (selectedJobs: string[]) => void;
  selectedQoI: string | undefined;
  setSelectedQoI: (response: string | undefined) => void;
  isSuMoGenerated: boolean;
  setIsSuMoGenerated: (is: boolean) => void;
}

export const MMUXContext = createContext<MMUXContextType | undefined>(
  undefined
);

type Props = {
  children: React.ReactNode;
};

export const MMUXContextProvider = ({ children }: Props) => {
  const [currentView, setCurrentView] = useState(0);
  const [funct, setFunct] = useState<Function | undefined>(undefined);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false);
  const [runningSampling, setRunningSampling] = useState<boolean>(false);
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<
    SelectedJobCollection[]
  >([]);
  const [inputVars, setInputVars] = useState<string[]>([]);
  const [distribution, setDistribution] = useState<InputVarSelection>({});
  const [outputVars, setOutputVars] = useState<string[] | undefined>(undefined);
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<RegisteredFunctionJobCollection | undefined>(undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(false);

  const memoState = useMemo(() => {
    const filterSelectedJobList = () => {
      const response: FunctionJob[] = fetchedJobCollections.flatMap(
        (jobCollection) =>
          jobCollection.subJobs
            .filter((subJob) => subJob.selected)
            .map((subJob) => subJob.job)
      );
      return response;
    };
    return {
      selectedFunction: funct,
      setSelectedFunction: setFunct,
      distribution: distribution,
      setDistribution: setDistribution,
      inputVars: inputVars,
      setInputVars: setInputVars,
      outputVars: outputVars,
      setOutputVars: setOutputVars,
      currentView: currentView,
      setCurrentView: setCurrentView,
      launchingSampling: launchingSampling,
      setLaunchingSampling: setLaunchingSampling,
      runningSampling: runningSampling,
      setRunningSampling: setRunningSampling,
      selectedQoI: selectedQoI,
      setSelectedQoI: setSelectedQoI,
      runningJobCollection: runningJobCollection,
      setRunningJobCollection: setRunningJobCollection,
      selectedJobUids: selectedJobUids,
      setSelectedJobUids: setSelectedJobUids,
      fetchedJobCollections: fetchedJobCollections,
      setFetchedJobCollections: setFetchedJobCollections,
      filterSelectedJobList: filterSelectedJobList,
      isSuMoGenerated: isSuMoGenerated,
      setIsSuMoGenerated: setIsSuMoGenerated
    };
  }, [
    funct,
    distribution,
    inputVars,
    outputVars,
    currentView,
    launchingSampling,
    runningSampling,
    selectedQoI,
    runningJobCollection,
    selectedJobUids,
    fetchedJobCollections,
  ]);
  return (
    <MMUXContext.Provider value={memoState}>{children}</MMUXContext.Provider>
  );
};

export const useMMUXContext = () => {
  const context = useContext(MMUXContext);
  if (context === undefined) {
    throw new Error("useMMUXContext must be used within a MMUXContextProvider");
  }
  return context;
};
