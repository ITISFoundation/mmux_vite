import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { PersistenceType } from "./types";
import { fetchWithRetry } from "../utils/fetch_retry";

interface PersistenceContextType {
  persistence: PersistenceType | undefined;
  saveState: (state: PersistenceType) => Promise<void>;
  getFunctionValues: () => Partial<PersistenceType> | undefined;
  setFunctionValues: (values: Partial<PersistenceType>) => void;
  setHealthOK: (status: boolean) => void;
  loading: boolean;
}

export const PersistenceContext = createContext<PersistenceContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

const defaultPersistence: PersistenceType = {
  currentView: 0,
  numSamples: {},
  selectedQoI: undefined,
  isSuMoGenerated: false,
  selectedFunction: undefined,
  inputVars: [],
  outputVars: [],
  distribution: {},
  lhsSamplingConfig: {
    inputs: [],
    points: 0,
    seed: 0,
  },
  gridSamplingConfig: [],
  singleJobConfig: [],
  runningJobCollection: undefined,
  fetchedJobCollections: [],
  selectedJobUids: [],
  outputTargets: {},
  mogaSettings: {},
  weights: {},
  sortModel: [],
};

export function PersistenceContextProvider({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [healthOK, setHealthOK] = useState<boolean>(false);
  const [persistence, setPersistence] = useState<PersistenceType | undefined>(undefined);
  const [avoidPersisting, setAvoidPersisting] = useState<boolean>(false);

  // Validate persistence structure
  const isValidPersistenceFile = (value: unknown): value is PersistenceType => {
    const data = value as PersistenceType;
    return (
      data &&
      typeof data === "object" &&
      "currentView" in data &&
      "numSamples" in data &&
      "isSuMoGenerated" in data &&
      "inputVars" in data &&
      "outputVars" in data &&
      "distribution" in data &&
      "outputTargets" in data &&
      "lhsSamplingConfig" in data &&
      "gridSamplingConfig" in data &&
      "singleJobConfig" in data &&
      "fetchedJobCollections" in data &&
      "selectedJobUids" in data &&
      "mogaSettings" in data &&
      Object.keys(data).length <= Object.keys(defaultPersistence).length
    );
  };

  const getHeaders = (contentType = true): HeadersInit => (contentType ? { "Content-Type": "application/json" } : {});

  const setFile = async (filename: string, content: string) => {
    const response = await fetch("/flask/text-file", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ filename, content }),
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(`⚠️ Server error when setting the persistency file, with status (${response.status}): ${response.statusText}`);
      setAvoidPersisting(true);
      return;
    }

    const data = (await response.json()) as {
      filename: string;
      status: string;
    };
    if (data.status !== "success" || data.filename !== filename) {
      throw new Error(`Failed to set file: ${data.status}`);
    }

    console.info(`File ${data.filename} saved successfully.`);
  };

  const getFile = async (filename: string): Promise<PersistenceType | undefined> => {
    const response = await fetchWithRetry(`/flask/text-file/${encodeURIComponent(filename)}`, {
      method: "GET",
      headers: getHeaders(false),
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️ Could not retrieve file (${response.status}): ${response.statusText}`);
        return defaultPersistence; // Return default persistence if file not found
      }
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const envelope = (await response.json()) as {
      content: string;
      filename: string;
    };
    try {
      // console.debug("Fetched persistence:", envelope.content);
      const data = JSON.parse(envelope.content) as PersistenceType;
      console.info(`File ${filename} fetched successfully.`, data);
      return data;
    } catch (error) {
      console.error("Error parsing fetched data:", error);
      return {} as PersistenceType; // Return empty object on parse error
    }
  };

  const saveState = useCallback(async (state: PersistenceType) => {
    const content = JSON.stringify(state, null, 2);
    // console.debug("Saving state to persistence file:", state);
    if (avoidPersisting) {
      console.warn("⚠️ Skipping persistence due to avoidPersisting flag.");
      return;
    }
    try {
      await setFile("persistence.json", content);
      setPersistence(state);
    } catch (error) {
      console.error("Error saving state:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFunctionValues = useCallback((): Partial<PersistenceType> | undefined => {
    if (persistence !== undefined) {
      return {
        selectedFunction: persistence.selectedFunction,
        inputVars: persistence.inputVars,
        outputVars: persistence.outputVars,
        distribution: persistence.distribution,
        outputTargets: persistence.outputTargets,
      };
    }
    return undefined;
  }, [persistence]);

  const setFunctionValues = useCallback(
    ({ selectedFunction, inputVars, outputVars, distribution, outputTargets }: Partial<PersistenceType>) => {
      if (persistence !== undefined) {
        console.info("Persisting Function context state...");
        const newPersistence: PersistenceType = {
          ...persistence,
          selectedFunction,
          inputVars: inputVars || [],
          outputVars: outputVars || [],
          distribution: distribution || {},
          outputTargets: outputTargets || {},
        };
        saveState(newPersistence);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persistence],
  );

  useEffect(() => {
    if (persistence !== undefined) {
      setLoading(false);
    }
  }, [persistence]);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const persistenceFile = await getFile("persistence.json");
        if (persistenceFile === undefined) {
          console.info("No persistence file found, initializing with empty state.");
          setPersistence(defaultPersistence);
        } else if (isValidPersistenceFile(persistenceFile) === false) {
          console.warn(
            "Persistence file structure has changed, resetting to defaults.",
            Object.keys(persistenceFile).length,
            Object.keys(defaultPersistence).length,
          );
          setPersistence(defaultPersistence);
        } else {
          console.info("Persistence file loaded successfully.", persistenceFile);
          setPersistence(persistenceFile);
        }
      } catch (error) {
        console.error("Error when fetching persistence file:", error);
        toast.warn("Failed to fetch user state, contact support.");
      }
    };
    if (healthOK) {
      fetchFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthOK]);

  const memo = React.useMemo(
    () => ({
      persistence,
      saveState,
      getFunctionValues,
      setFunctionValues,
      loading,
      setHealthOK,
    }),
    [persistence, loading, saveState, getFunctionValues, setFunctionValues, setHealthOK],
  );

  return <PersistenceContext.Provider value={memo}>{children}</PersistenceContext.Provider>;
}

export const usePersistenceContext = () => {
  const context = useContext(PersistenceContext);
  if (context === undefined) {
    throw new Error("usePersistenceContext must be used within a PersistenceContextProvider");
  }
  return context;
};
