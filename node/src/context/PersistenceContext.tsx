import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { PersistenceType } from "./types";
import { ApiError, requestJson } from "../api/client";

interface PersistenceContextType {
  persistence: PersistenceType | undefined;
  saveState: (state: PersistenceType) => Promise<void>;
  getFunctionValues: () => Partial<PersistenceType> | undefined;
  setFunctionValues: (values: Partial<PersistenceType>) => void;
  setHealthOK: (status: boolean) => void;
  loading: boolean;
}

const PersistenceContext = createContext<PersistenceContextType>(undefined!);

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
  // A ref (not state) so the memoized saveState always sees the latest value.
  const avoidPersisting = useRef<boolean>(false);
  // V15 (INV-005): track the last serialized state actually persisted so that
  // setters re-invoked with a recreated-but-equal object do not retrigger a save
  // (avoids duplicate Dakota/persistence fan-out).
  const lastSavedContent = useRef<string | undefined>(undefined);

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

  const setFile = async (filename: string, content: string): Promise<boolean> => {
    let data: { filename: string; status: string };
    try {
      data = await requestJson("/flask/text-file/", { method: "POST", body: { filename, content } });
    } catch (error) {
      if (!(error instanceof ApiError && error.kind === "http")) throw error;
      console.warn(`⚠️ Server error when setting the persistency file, with status (${error.status}): ${error.body}`);
      avoidPersisting.current = true;
      return false;
    }
    if (data.status !== "success" || data.filename !== filename) {
      throw new Error(`Failed to set file: ${data.status}`);
    }

    console.info(`File ${data.filename} saved successfully.`);
    return true;
  };

  const getFile = async (filename: string): Promise<PersistenceType | undefined> => {
    let envelope: { content: string; filename: string };
    try {
      envelope = await requestJson(`/flask/text-file/${encodeURIComponent(filename)}`, { retry: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        console.warn(`⚠️ Could not retrieve file (404): ${filename}`);
        return defaultPersistence;
      }
      throw error;
    }
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
    if (avoidPersisting.current) {
      console.warn("⚠️ Skipping persistence due to avoidPersisting flag.");
      return;
    }
    // V15: equality guard — skip identical writes so object-recreation alone never
    // retriggers persistence (and the downstream Dakota fan-out it would cause).
    if (content === lastSavedContent.current) {
      return;
    }
    try {
      if (!(await setFile("persistence.json", content))) return;
      lastSavedContent.current = content;
      setPersistence(state);
    } catch (error) {
      console.error("Error saving state:", error);
    }
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
        const loaded =
          persistenceFile === undefined || isValidPersistenceFile(persistenceFile) === false
            ? defaultPersistence
            : persistenceFile;
        if (persistenceFile === undefined) {
          console.info("No persistence file found, initializing with empty state.");
        } else if (isValidPersistenceFile(persistenceFile) === false) {
          console.warn(
            "Persistence file structure has changed, resetting to defaults.",
            Object.keys(persistenceFile).length,
            Object.keys(defaultPersistence).length,
          );
        } else {
          console.info("Persistence file loaded successfully.", persistenceFile);
        }
        // Seed the equality guard with the loaded state so hydration does not
        // immediately re-persist identical content (V15).
        lastSavedContent.current = JSON.stringify(loaded, null, 2);
        setPersistence(loaded);
      } catch (error) {
        console.error("Error when fetching persistence file:", error);
        toast.warn("Failed to fetch user state, contact support.");
        // Keep the app usable, but never overwrite a server copy we could not read.
        avoidPersisting.current = true;
        setPersistence(defaultPersistence);
      }
    };
    if (healthOK) {
      fetchFile();
    }
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
