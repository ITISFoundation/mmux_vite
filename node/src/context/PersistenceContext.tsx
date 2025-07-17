import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Function,
  RegisteredFunctionJobCollection,
} from "../osparc-api-ts-client";

export interface PersistenceType {
  selectedFunction: Function | undefined;
  inputVars: string[];
  outputVars: string[] | undefined;
  distribution: { [key: string]: InputVarSelection };
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

interface PersistenceContextType {
  persistence: PersistenceType | undefined;
  saveState: (state: PersistenceType) => Promise<void>;
  loading: boolean;
}

export const PersistenceContext = createContext<PersistenceContextType>(
  undefined!
);

type Props = {
  children: React.ReactNode;
};

export const PersistenceContextProvider = ({ children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [persistence, setPersistence] = useState<PersistenceType>();

  const getHeaders = (contentType = true): HeadersInit => {
    return contentType ? { "Content-Type": "application/json" } : {};
  };

  const setFile = async (filename: string, content: string) => {
    const response = await fetch("/flask/text-file", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ filename, content }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to set file: ${response.status} ${response.statusText}`
      );
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

  const getFile = async (
    filename: string
  ): Promise<PersistenceType | undefined> => {
    const response = await fetch(
      `/flask/text-file/${encodeURIComponent(filename)}`,
      {
        method: "GET",
        headers: getHeaders(false),
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(
          `⚠️ Could not retrieve file (${response.status}): ${response.statusText}`
        );
        return {} as PersistenceType; // Return empty object if file not found
      } else {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        );
      }
    }

    const envelope = (await response.json()) as {
      content: string;
      filename: string;
    };
    const data = JSON.parse(envelope.content) as PersistenceType;
    console.info(`File ${filename} fetched successfully.`, data);
    return data;
  };

  const saveState = async (state: PersistenceType) => {
    const content = JSON.stringify(state, null, 2);
    console.log("Saving state to persistence file:", content);
    try {
      await setFile("persistence.json", content);
      setPersistence(state);
    } catch (error) {
      console.error("Error saving state:", error);
    }
  };

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const persistenceFile = await getFile("persistence.json");
        if (persistenceFile === undefined) {
          console.info(
            "No persistence file found, initializing with empty state."
          );
        } else {
          setPersistence(persistenceFile);
        }
      } catch (error) {
        console.error("Error when fetching persistence file:", error);
        toast.error("Failed to fetch user state, starting from scratch.");
      }
      setLoading(false);
    };

    fetchFile();
  }, []);

  const memo = React.useMemo(
    () => ({
      persistence,
      saveState,
      loading
    }),
    [persistence, loading, saveState]
  );

  return (
    <PersistenceContext.Provider value={memo}>
      {children}
    </PersistenceContext.Provider>
  );
};

export const usePersistenceContext = () => {
  const context = useContext(PersistenceContext);
  if (context === undefined) {
    throw new Error(
      "usePersistenceContext must be used within a PersistenceContextProvider"
    );
  }
  return context;
};
