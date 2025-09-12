/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FunctionJob, RegisteredFunctionJobCollection } from "../osparc-api-ts-client";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";

export interface JobContextType {
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void;
  fetchedJobCollections: SelectedJobCollection[];
  setFetchedJobCollections: (jc: SelectedJobCollection[]) => void;
  selectedJobUids: string[];
  setSelectedJobUids: (selectedJobs: string[]) => void;
  allJobsList: () => FunctionJob[];
  filteredJobList: FunctionJob[];
}

export const JobContext = createContext<JobContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function JobContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<SelectedJobCollection[]>([]);
  const [runningJobCollection, setRunningJobCollection] = useState<RegisteredFunctionJobCollection | undefined>(undefined);

  const filteredJobList = useMemo(() => {
    const localff = [...fetchedJobCollections];
    const response: FunctionJob[] = localff
      .map(jobCollection => jobCollection.subJobs.filter(subJob => subJob.selected === true).map(subJob => subJob.job))
      .flat();
    if (response.length < 5) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  }, [fetchedJobCollections]);

  const allJobsList = useCallback(() => {
    const response: FunctionJob[] = fetchedJobCollections.flatMap(jobCollection =>
      jobCollection.subJobs.map(subJob => subJob.job),
    );

    if (fetchedJobCollections.length !== 0 && response.length <= 4) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  }, [fetchedJobCollections]);

  // persist the state of the Job context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving Job context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      runningJobCollection,
      fetchedJobCollections,
      selectedJobUids,
    };
    saveState(newPersistence);
  }, [selectedJobUids, fetchedJobCollections, runningJobCollection]);

  useEffect(() => {
    if (loading === false && persistence && persistence.currentView !== undefined) {
      console.info("Loading Job context from persistence...");
      setRunningJobCollection(persistence.runningJobCollection);
      setFetchedJobCollections(persistence.fetchedJobCollections);
      setSelectedJobUids(persistence.selectedJobUids);
      setLocalLoading(false);
    }
  }, [loading]);

  const memoState = useMemo(
    () => ({
      runningJobCollection,
      setRunningJobCollection,
      fetchedJobCollections,
      setFetchedJobCollections,
      selectedJobUids,
      setSelectedJobUids,
      allJobsList,
      filteredJobList,
    }),
    [
      runningJobCollection,
      fetchedJobCollections,
      selectedJobUids,
      setRunningJobCollection,
      setFetchedJobCollections,
      setSelectedJobUids,
      allJobsList,
      filteredJobList,
    ],
  );
  return <JobContext.Provider value={memoState}>{children}</JobContext.Provider>;
}

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobContext must be used within a JobContextProvider");
  }
  return context;
};
