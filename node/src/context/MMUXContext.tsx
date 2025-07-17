import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FunctionJob,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";

export interface MMUXContextType {
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

export const MMUXContextProvider = ({ children }: Props) => {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<
    SelectedJobCollection[]
  >([]);
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>({});
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<
    RegisteredFunctionJobCollection | undefined
  >(undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(false);

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
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      numSamples: numSamples,
      selectedQoI: selectedQoI,
      runningJobCollection: runningJobCollection,
      fetchedJobCollections: fetchedJobCollections,
      selectedJobUids: selectedJobUids,
      isSuMoGenerated: isSuMoGenerated,
    };
    saveState(newPersistence);
  }, [
    selectedJobUids,
    fetchedJobCollections,
    numSamples,
    selectedQoI,
    runningJobCollection,
    isSuMoGenerated,
  ]);

  useEffect(() => {
    if (
      loading === false &&
      persistence &&
      persistence.launchingSampling !== undefined
    ) {
      console.info("Loading MMUX context from persistence...");
      setNumSamples(persistence.numSamples);
      setSelectedQoI(persistence.selectedQoI);
      setRunningJobCollection(persistence.runningJobCollection);
      setFetchedJobCollections(persistence.fetchedJobCollections);
      setSelectedJobUids(persistence.selectedJobUids);
      setIsSuMoGenerated(persistence.isSuMoGenerated);
      setLocalLoading(false);
    } else if (
      loading === false &&
      (persistence === undefined ||
        persistence?.launchingSampling === undefined)
    ) {
      // when this happens, the persistence is either broken or not yet initialized
      console.warn(
        "Persistence is not initialized or broken, resetting to defaults."
      );
      setNumSamples({});
      setSelectedQoI(undefined);
      setRunningJobCollection(undefined);
      setFetchedJobCollections([]);
      setSelectedJobUids([]);
      setIsSuMoGenerated(false);
      setLocalLoading(false);
    }
  }, [loading]);

  const memoState = useMemo(() => {
    return {
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
