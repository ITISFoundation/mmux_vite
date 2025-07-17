import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Function,
  FunctionJob,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";
import { PersistenceType, usePersistenceContext } from "./PersistenceContext";
import { useFunctionContext } from "./FunctionContext";

export interface MMUXContextType {
  distribution: { [key: string]: InputVarSelection };
  setDistribution: (d: { [key: string]: InputVarSelection }) => void;
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
  const { persistence, saveState } = usePersistenceContext();
  const { setSelectedFunction, setInputVars, setOutputVars } =
    useFunctionContext();
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(
    persistence?.launchingSampling || false
  );
  const [runningSampling, setRunningSampling] = useState<boolean>(
    persistence?.runningSampling || false
  );
  const [lhsSamplingConfig, setLhsSamplingConfig] = useState<LHSamplingConfig>(
    persistence?.lhsSamplingConfig || defaultLHSamplingConfig
  );
  const [gridSamplingConfig, setGridSamplingConfig] =
    useState<GRIDSamplingConfig>(
      persistence?.gridSamplingConfig || defaultGRIDamplingConfig
    );
  const [singleJobConfig, setSingleJobConfig] = useState<SingleJobConfig[]>(
    persistence?.singleJobConfig || defaultSingleJobConfig
  );
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>(
    persistence?.selectedJobUids || []
  );
  const [fetchedJobCollections, setFetchedJobCollections] = useState<
    SelectedJobCollection[]
  >(persistence?.fetchedJobCollections || []);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>(persistence?.distribution || {});
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>(
    persistence?.numSamples || {}
  );
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(
    persistence?.selectedQoI || undefined
  );
  const [runningJobCollection, setRunningJobCollection] = useState<
    RegisteredFunctionJobCollection | undefined
  >(persistence?.runningJobCollection || undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(
    persistence?.isSuMoGenerated || false
  );
  const [loading, setLoading] = useState<boolean>(true);

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
      (jobCollection) => jobCollection.subJobs.map((subJob) => subJob.job)
    );

    if (fetchedJobCollections.length !== 0 && response.length <= 4) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  };

  // persist the state of the MMUX context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (loading) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      distribution: distribution,
      launchingSampling: launchingSampling,
      runningSampling: runningSampling,
      lhsSamplingConfig: lhsSamplingConfig,
      gridSamplingConfig: gridSamplingConfig,
      singleJobConfig: singleJobConfig,
      numSamples: numSamples,
      selectedQoI: selectedQoI,
      runningJobCollection: runningJobCollection,
      fetchedJobCollections: fetchedJobCollections,
      selectedJobUids: selectedJobUids,
      isSuMoGenerated: isSuMoGenerated,
    };
    saveState(newPersistence);
  }, [
    launchingSampling,
    runningSampling,
    lhsSamplingConfig,
    gridSamplingConfig,
    singleJobConfig,
    selectedJobUids,
    fetchedJobCollections,
    distribution,
    numSamples,
    selectedQoI,
    runningJobCollection,
    isSuMoGenerated,
    loading,
  ]);

  useEffect(() => {
    if (loading && persistence !== undefined) {
      console.info(
        "Loading MMUX context state from persistence...",
        JSON.stringify(persistence),
        typeof persistence.launchingSampling !== "boolean"
      );
      if (typeof persistence.launchingSampling !== "boolean") {
        console.info(
          "Persistence file is empty, initializing with default values."
        );
        setLoading(false);
        return;
      }
      setDistribution(persistence.distribution);
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
  }, [loading]);

  const memoState = useMemo(() => {
    return {
      distribution: distribution,
      setDistribution: setDistribution,
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
    distribution,
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
