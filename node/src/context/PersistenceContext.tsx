import React, { createContext, useContext, useState, useEffect } from 'react';
import { MMUXDataType } from './MMUXContext';
import { toast } from 'react-toastify';

const LOCAL_BASE_URL = "http://localhost:8888";
const DOCKER_BASE_URL = "http://67316004-27e9-4493-9885-23305dc65db3.services.10.43.103.168.nip.io:9081";
const BASE_URL = process.env.NODE_ENV === "development" ? LOCAL_BASE_URL : DOCKER_BASE_URL;
const COOKIE_NAME = "osparc-sc2";
const COOKIE_VALUE = "gAAAAABodgUAlkp8gMu1vJQ2BTAeRCPCwhDkEEJF1CK2pJcpCXQh5PNTNLF6bPIdYum4cDVUFYEwMXTdw2gRseN4p7mGvWi8NlJu6xA8EiXx0nvqDtzXzEXS9VWHYO-uLbpFHbqJLrCN1gfwH-CUcgxmncsy1KWCTDkUmQNCJm9EauHBw7WdcgbQnOuksYO2H71jHGKRGO1JUugqpHhM0Pr5IGjsP-EpvEwEj0-EcrL0hAILZNPtGrG1yFjgizA-K6Drn8EMnXjjfgEFr8V9cK12j3oWRBN9i6-_dgv3V8k97f6m9CTROUgRUtnyBADCkWjGiC7Gk0Go3JQ2THDp1dAISnRskwN9MLS8uSKvxa5hRpWANLvEx91IFxUxSZmWJopxWtWn0mv6jWK8035OzCCcY910V8w-Kb7FV7Un6jshMXqGVdVJIUHhZN7Oa4jvMeRTBZ9SgHBfu6GEIfjpB8bN8Lt-x7Gv6OJnA0vjUcQzEuUYABWHQZmwJ5dgNwPr3Herp6RqOrOxTND0JjU65eMPmZIW0Edn7Q==";


interface PersistenceContextType {
  persistence: MMUXDataType | undefined;
  saveState: (state: MMUXDataType) => Promise<void>;
}

export const PersistenceContext = createContext<PersistenceContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export const PersistenceContextProvider = ({ children }: Props) => {
  const [persistence, setPersistence] = useState<MMUXDataType | undefined>(undefined);

  const getHeaders = (contentType = true): HeadersInit => {
    return {
      ...(contentType ? { "Content-Type": "application/json" } : {}),
      "Cookie": `${COOKIE_NAME}=${COOKIE_VALUE}`
    };
  }

  const setFile = async (filename: string, content: string) => {
    const response = await fetch(`${BASE_URL}/flask/text-file`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ filename, content }),
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Failed to set file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { filename: string, status: string };
    if(data.status !== 'success' || data.filename !== filename) {
      throw new Error(`Failed to set file: ${data.status}`);
    }

    console.info(`File ${data.filename} saved successfully.`);
  }

  const getFile = async (filename: string): Promise<MMUXDataType | undefined> => {
    const response = await fetch(`${BASE_URL}/flask/text-file/${encodeURIComponent(filename)}`, {
      method: "GET",
      headers: getHeaders(false),
      credentials: "include"
    });

    if (!response.ok) {
      if( response.status === 404) {
        console.warn(`⚠️ Could not retrieve file (${response.status}): ${response.statusText}`);
        return {} as MMUXDataType; // Return empty object if file not found
      } else {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
    }

    const envelope = await response.json() as {content: string, filename: string};
    const data = JSON.parse(envelope.content) as MMUXDataType;
    console.info(`File ${filename} fetched successfully.`, data);
    return data;
  }

  const saveState = async (state: MMUXDataType) => {
    const content = JSON.stringify(state, null, 2);
    console.log("Saving state to persistence file:", content);
    try {
      await setFile('persistence.json', content);
      setPersistence(state);
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const persistenceFile = await getFile('persistence.json');
        if (persistenceFile === undefined) {
          console.info("No persistence file found, initializing with empty state.");
        } else {
          setPersistence(persistenceFile);
        }
      } catch (error) {
        console.error("Error when fetching persistence file:", error);
        toast.error("Failed to fetch user state, starting from scratch.");
      }
    };

    fetchFile();
  }, []);

  const memo = React.useMemo(() => ({
    persistence,
    saveState
  }), [persistence]);

  return (
    <PersistenceContext.Provider value={memo}>
      {children}
    </PersistenceContext.Provider>
  );
};

export const usePersistenceContext = () => {
  const context = useContext(PersistenceContext);
  if (context === undefined) {
    throw new Error('usePersistenceContext must be used within a PersistenceContextProvider');
  }
  return context;
}