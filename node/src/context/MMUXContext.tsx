import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Function,
  FunctionJob,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";

export interface MMUXContextType {
  selectedFunction: Function | undefined;
  setSelectedFunction: (F: Function | undefined) => void;
  distribution: { [key: string]: InputVarSelection };
  setDistribution: (d: { [key: string]: InputVarSelection }) => void;
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
  lhsSamplingConfig: LHSamplingConfig;
  setLhsSamplingConfig: (config: LHSamplingConfig) => void;
  gridSamplingConfig: GRIDSamplingConfig;
  setGridSamplingConfig: (config: GRIDSamplingConfig) => void;
  singleJobConfig: SingleJobConfig[];
  setSingleJobConfig: (config: SingleJobConfig[]) => void;
  numSamples: { [key: string]: number };
  setNumSamples: (ns: { [key: string]: number }) => void;
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  setRunningJobCollection: (
    jc: RegisteredFunctionJobCollection | undefined
  ) => void;
  fetchedJobCollections: SelectedJobCollection[];
  setFetchedJobCollections: (jc: SelectedJobCollection[]) => void;
  selectedJobUids: string[];
  setSelectedJobUids: (selectedJobs: string[]) => void;
  filterSelectedJobList: () => FunctionJob[];
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

const defaultLHSamplingConfig: LHSamplingConfig = {
  inputs: [],
  points: 50,
  seed: 0,
};

const defaultGRIDamplingConfig: GRIDSamplingConfig = [];

const defaultSingleJobConfig: SingleJobConfig[] = [];

export const MMUXContextProvider = ({ children }: Props) => {
  const [currentView, setCurrentView] = useState(0);
  const [funct, setFunct] = useState<Function | undefined>(undefined);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false);
  const [runningSampling, setRunningSampling] = useState<boolean>(false);
  const [lhsSamplingConfig, setLhsSamplingConfig] = useState<LHSamplingConfig>(
    defaultLHSamplingConfig
  );
  const [gridSamplingConfig, setGridSamplingConfig] =
    useState<GRIDSamplingConfig>(defaultGRIDamplingConfig);
  const [singleJobConfig, setSingleJobConfig] = useState<SingleJobConfig[]>(
    defaultSingleJobConfig
  );
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<
    SelectedJobCollection[]
  >([]);
  const [inputVars, setInputVars] = useState<string[]>([]);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>({});
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>({});
  const [outputVars, setOutputVars] = useState<string[] | undefined>(undefined);
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<
    RegisteredFunctionJobCollection | undefined
  >(undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(false);

  const handleSelecedFunction = (F: Function | undefined) => {
    setFunct(F);
    setSelectedJobUids([]);
    setFetchedJobCollections([]);
  };

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
      setSelectedFunction: handleSelecedFunction,
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
      lhsSamplingConfig: lhsSamplingConfig,
      setLhsSamplingConfig: setLhsSamplingConfig,
      gridSamplingConfig: gridSamplingConfig,
      setGridSamplingConfig: setGridSamplingConfig,
      singleJobConfig: singleJobConfig,
      setSingleJobConfig: setSingleJobConfig,
      runningSampling: runningSampling,
      setRunningSampling: setRunningSampling,
      numSamples: numSamples,
      setNumSamples: setNumSamples,
      selectedQoI: selectedQoI,
      setSelectedQoI: setSelectedQoI,
      runningJobCollection: runningJobCollection,
      setRunningJobCollection: setRunningJobCollection,
      fetchedJobCollections: fetchedJobCollections,
      setFetchedJobCollections: setFetchedJobCollections,
      selectedJobUids: selectedJobUids,
      setSelectedJobUids: setSelectedJobUids,
      filterSelectedJobList: filterSelectedJobList,
      isSuMoGenerated: isSuMoGenerated,
      setIsSuMoGenerated: setIsSuMoGenerated,
    };
  }, [
    funct,
    distribution,
    inputVars,
    outputVars,
    currentView,
    launchingSampling,
    lhsSamplingConfig,
    gridSamplingConfig,
    singleJobConfig,
    runningSampling,
    numSamples,
    selectedQoI,
    runningJobCollection,
    fetchedJobCollections,
    selectedJobUids,
    isSuMoGenerated,
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
