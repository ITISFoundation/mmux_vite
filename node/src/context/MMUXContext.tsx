import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Function,
  FunctionJob,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";
import { usePersistenceContext } from "./PersistenceContext";

export interface MMUXDataType {
  selectedFunction: Function | undefined;
  distribution: { [key: string]: InputVarSelection };
  inputVars: string[];
  outputVars: string[] | undefined;
  currentView: number;
  launchingSampling: boolean;
  runningSampling: boolean;
  lhsSamplingConfig: LHSamplingConfig;
  gridSamplingConfig: GRIDSamplingConfig;
  singleJobConfig: SingleJobConfig[];
  numSamples: { [key: string]: number };
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  fetchedJobCollections: SelectedJobCollection[];
  selectedJobUids: string[];
  selectedQoI: string | undefined;
  isSuMoGenerated: boolean;
}

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
  allJobsList: () => FunctionJob[];
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
  const {persistence, saveState} = usePersistenceContext();
  const [currentView, setCurrentView] = useState(persistence?.currentView || 0);
  const [funct, setFunct] = useState<Function | undefined>(persistence?.selectedFunction || undefined);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(persistence?.launchingSampling || false);
  const [runningSampling, setRunningSampling] = useState<boolean>(persistence?.runningSampling || false);
  const [lhsSamplingConfig, setLhsSamplingConfig] = useState<LHSamplingConfig>(
    persistence?.lhsSamplingConfig || defaultLHSamplingConfig
  );
  const [gridSamplingConfig, setGridSamplingConfig] =
    useState<GRIDSamplingConfig>(persistence?.gridSamplingConfig || defaultGRIDamplingConfig);
  const [singleJobConfig, setSingleJobConfig] = useState<SingleJobConfig[]>(
    persistence?.singleJobConfig || defaultSingleJobConfig
  );
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>(persistence?.selectedJobUids || []);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<
    SelectedJobCollection[]
  >(persistence?.fetchedJobCollections || []);
  const [inputVars, setInputVars] = useState<string[]>(persistence?.inputVars || []);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>(persistence?.distribution || {});
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>(persistence?.numSamples || {});
  const [outputVars, setOutputVars] = useState<string[] | undefined>(persistence?.outputVars || undefined);
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(persistence?.selectedQoI || undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<
    RegisteredFunctionJobCollection | undefined
  >(persistence?.runningJobCollection || undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(persistence?.isSuMoGenerated || false);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSelectedFunction = (F: Function | undefined) => {
    setFunct(F);
    setSelectedJobUids([]);
    setFetchedJobCollections([]);
    setInputVars([]);
    setLhsSamplingConfig(defaultLHSamplingConfig);
    setGridSamplingConfig(defaultGRIDamplingConfig);
    setSingleJobConfig(defaultSingleJobConfig);
  };

  const filterSelectedJobList = () => {
    const response: FunctionJob[] = fetchedJobCollections.flatMap(
      (jobCollection) =>
        jobCollection.subJobs
          .filter((subJob) => subJob.selected)
          .map((subJob) => subJob.job)
    );

    if (fetchedJobCollections.length !== 0 && response.length < 5) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  };

  const allJobsList = () => {
    const response: FunctionJob[] = fetchedJobCollections.flatMap(
      (jobCollection) =>
        jobCollection.subJobs
          .map((subJob) => subJob.job)
    );

    if (fetchedJobCollections.length !== 0 && response.length <= 4) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  };

  // persist the state of the MMUX context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if(loading) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    saveState({
      selectedFunction: funct,
      distribution: distribution,
      inputVars: inputVars,
      outputVars: outputVars,
      currentView: currentView,
      launchingSampling: launchingSampling,
      lhsSamplingConfig: lhsSamplingConfig,
      gridSamplingConfig: gridSamplingConfig,
      singleJobConfig: singleJobConfig,
      runningSampling: runningSampling,
      numSamples: numSamples,
      selectedQoI: selectedQoI,
      runningJobCollection: runningJobCollection,
      fetchedJobCollections: fetchedJobCollections,
      selectedJobUids: selectedJobUids,
      isSuMoGenerated: isSuMoGenerated,
    });
  }, [
    currentView,
    funct,
    launchingSampling,
    runningSampling,
    lhsSamplingConfig,
    gridSamplingConfig,
    singleJobConfig,
    selectedJobUids,
    fetchedJobCollections,
    inputVars,
    distribution,
    numSamples,
    outputVars,
    selectedQoI,
    runningJobCollection,
    isSuMoGenerated,
    loading,
  ]);

  useEffect(() => {
    if(loading && persistence !== undefined) {
      console.info("Loading MMUX context state from persistence...", JSON.stringify(persistence), typeof persistence.currentView !== 'number');
      if(typeof persistence.currentView !== 'number') {
        console.info("Persistence file is empty, initializing with default values.");
        setLoading(false);
        return;
      }
      setFunct(persistence.selectedFunction);
      setDistribution(persistence.distribution);
      setInputVars(persistence.inputVars);
      setOutputVars(persistence.outputVars);
      setCurrentView(persistence.currentView);
      setLaunchingSampling(persistence.launchingSampling);
      setRunningSampling(persistence.runningSampling);
      setLhsSamplingConfig(persistence.lhsSamplingConfig);
      setGridSamplingConfig(persistence.gridSamplingConfig);
      setSingleJobConfig(persistence.singleJobConfig);
      setNumSamples(persistence.numSamples);
      setSelectedQoI(persistence.selectedQoI);
      setRunningJobCollection(persistence.runningJobCollection);
      setFetchedJobCollections(persistence.fetchedJobCollections);
      setSelectedJobUids(persistence.selectedJobUids);
      setIsSuMoGenerated(persistence.isSuMoGenerated);
      setLoading(false); // Set loading to false after loading the state
    }
  }, [persistence, loading]);

  const memoState = useMemo(() => {
    return {
      selectedFunction: funct,
      setSelectedFunction: handleSelectedFunction,
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
      allJobsList: allJobsList,
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
