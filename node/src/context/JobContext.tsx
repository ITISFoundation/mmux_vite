/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, JSX, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { FunctionJob, RegisteredFunctionJobCollection } from "../osparc-api-ts-client";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";
import {
  getFunctionJobCollections,
  getFunctionJobsFromFunctionJobCollection,
  isFinalStatus,
  extractJobStatus,
  extractJobOutputs,
  AllowedJobStatus,
} from "../utils/function_utils";

export interface JobContextType {
  runningJobCollection: RegisteredFunctionJobCollection | undefined;
  setRunningJobCollection: (jc: RegisteredFunctionJobCollection | undefined) => void;
  fetchedJobCollections: SelectedJobCollection[] | undefined;
  setFetchedJobCollections: (jc: SelectedJobCollection[] | undefined) => void;
  selectedJobUids: string[];
  setSelectedJobUids: (selectedJobs: string[]) => void;
  allJobsList: () => FunctionJob[];
  filteredJobList: FunctionJob[];
  requestForceFetch: (functionUID: string, progress: (progress: number) => void) => void;
  getOutputsForTable: (job: FunctionJob | SubJob) => string | JSX.Element[];
}

export const JobContext = createContext<JobContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function JobContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedJobUids, setSelectedJobUids] = useState<Array<string>>([]);
  const [filteredJobList, setFilteredJobList] = useState<Array<FunctionJob>>([]);
  const [fetchedJobCollections, setFetchedJobCollections] = useState<SelectedJobCollection[] | undefined>(undefined);
  const [runningJobCollection, setRunningJobCollection] = useState<RegisteredFunctionJobCollection | undefined>(undefined);

  // TODO change all calls to this function!! bfr Alex was passing status + outputs -- here, just pass job
  const getOutputsForTable = (job: FunctionJob | SubJob): string | JSX.Element[] => {
    const jobStatus: AllowedJobStatus = extractJobStatus(job);
    const outputArray: Record<string, unknown> = extractJobOutputs(job);
    
    let outputs: string | JSX.Element[];
    if (jobStatus === "SUCCESS") {
      outputs = Object.entries(outputArray).map(([key, value]) => (
        <Box key={`job-row-output-${key}`} display="inline">
          {key} : {(value as number).toPrecision(3)}
          {", "}
        </Box>
      ));
    } else if (jobStatus === "RUNNING") {
      outputs = [
        <Box key={0} display="inline">
          Running...
        </Box>,
      ];
    } else if (jobStatus === "FAILED") {
      outputs = "Failed - no outputs";
    } else if (jobStatus === "PENDING") {
      outputs = "Pending to run";
    } else if (jobStatus === "UNKNOWN") {
      outputs = "Unknown status, please try again later";
    } else {
      outputs = "Unknown status, please contact support";
    }
    return outputs;
  };

  const updateJobCollections = useCallback(
    async (functionUid: string, progress: (progress: number) => void) => {
      console.info("Fetching jobCollections for function: ", functionUid);

      const jobsC = (await getFunctionJobCollections(functionUid as string)) as FunctionJobCollection[];

      if (jobsC.length === 0) {
        console.info("No job collections found for function: ", functionUid);
        setFetchedJobCollections([]);
        return;
      }

      // Build a Map for fast lookup of fetchedJobCollections by uid
      const fetchedJCMap = new Map(fetchedJobCollections && fetchedJobCollections.map(fjc => [fjc.jobCollection.uid, fjc]));
      const equalJC: boolean[] = jobsC.map(jc => {
        const fetchedJC = fetchedJCMap.get(jc.uid);
        const statusList = fetchedJC ? fetchedJC.subJobs.map(j => extractJobStatus(j)) : [];
        return (
          fetchedJC !== undefined &&
          fetchedJC.subJobs.map(j => j.job.uid).every(jcUID => jc.jobIds.includes(jcUID)) &&
          fetchedJC.subJobs.length === jc.jobIds.length &&
          statusList.every(s => isFinalStatus(s))
        );
      });

      if (equalJC.every(v => v === true)) {
        console.info("Job collections already fetched, skipping fetch.");
        return;
      }

      progress(0);
      const totalSubs = jobsC.reduce((acc, jc) => acc + jc.jobIds.length, 0);
      console.info("Going to update not equal JC: ", equalJC);

      const newJobCollections: SelectedJobCollection[] = [];
      let jobsFetched = 0;

      for (let jcIdx = 0; jcIdx < jobsC.length; jcIdx += 1) {
        const jc = jobsC[jcIdx];
        if (equalJC[jcIdx] === false) {
          const functionJobs = await getFunctionJobsFromFunctionJobCollection(jc.uid);
          const oldSubJobs = fetchedJCMap.get(jc.uid)?.subJobs || [];
          const subJobs = [];
          for (let subJobIdx = 0; subJobIdx < functionJobs.length; subJobIdx += 1) {
            const job: FunctionJob = functionJobs[subJobIdx];
            const jobStatus = extractJobStatus(job);
            jobsFetched += 1;
            const jobsProg = (jobsFetched / totalSubs) * 100;
            progress(jobsProg);
            const existingSelected = oldSubJobs.find(sj => sj.job.uid === job.uid)?.selected;
            subJobs.push({
              selected: existingSelected !== undefined ? existingSelected : jobStatus === "SUCCESS",
              job,
            });
          }
          console.info("Fetched subJobs for jobCollection: ", jobsFetched, jc.uid);
          newJobCollections.push({
            jobCollection: jc,
            selected: subJobs.some(j => j.selected === true),
            subJobs,
          });
        } else {
          newJobCollections.push(fetchedJobCollections?.find(fjc => fjc.jobCollection.uid === jc.uid) as SelectedJobCollection);
        }
      }

      console.log("new jobCollections: ", newJobCollections);
      setFetchedJobCollections(newJobCollections);
      progress(100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchedJobCollections],
  );

  const requestForceFetch = (functionUID: string, progress: (progress: number) => void) => {
    updateJobCollections(functionUID, progress);
  };

  // Update filteredJobList when selectedJobUids or fetchedJobCollections change
  useEffect(() => {
    if (fetchedJobCollections === undefined) return;
    const response: FunctionJob[] = (fetchedJobCollections || [])
      .map(jobCollection =>
        jobCollection.subJobs.filter(subJob => selectedJobUids.includes(subJob.job.uid)).map(subJob => subJob.job),
      )
      .flat();
    const nochange =
      filteredJobList.length === response.length && filteredJobList.every((value, index) => value === response[index]);
    if (nochange) {
      return;
    }
    if (response.length <= 4) {
      setFilteredJobList([]); // 5 samples are necessary to avoid Dakota crashing
      return;
    }
    setFilteredJobList(response);
  }, [selectedJobUids, fetchedJobCollections]);

  // Return all jobs from all fetchedJobCollections
  const allJobsList = useCallback(() => {
    const response: FunctionJob[] = (fetchedJobCollections || []).flatMap(jobCollection =>
      jobCollection.subJobs.map(subJob => subJob.job),
    );

    if (fetchedJobCollections && fetchedJobCollections.length !== 0 && response.length <= 4) {
      return []; // 5 samples are necessary to avoid Dakota crashing
    }
    return response;
  }, [fetchedJobCollections]);

  // persist the state of the Job context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving Job context state to persistence...");
    if (!persistence) return;
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
      requestForceFetch,
      getOutputsForTable,
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
      requestForceFetch,
      getOutputsForTable,
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
