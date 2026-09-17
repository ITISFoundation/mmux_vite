/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType, UQSettings } from "./types";

export interface MMUXContextType {
  numSamples: { [key: string]: number };
  setNumSamples: (ns: { [key: string]: number }) => void;
  selectedQoI: string | undefined;
  setSelectedQoI: (response: string | undefined) => void;
  validationQoI: string | undefined;
  setValidationQoI: (response: string | undefined) => void;
  uqSettings: { [key: string]: UQSettings };
  setUQSettings: (settings: { [key: string]: UQSettings }) => void;
  isSuMoGenerated: boolean;
  setIsSuMoGenerated: (is: boolean) => void;
}

export const MMUXContext = createContext<MMUXContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function MMUXContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>({});
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(undefined);
  const [validationQoI, setValidationQoI] = useState<string | undefined>(undefined);
  const [uqSettings, setUQSettings] = useState<{ [key: string]: UQSettings }>({});
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(false);

  // persist the state of the MMUX context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      numSamples,
      selectedQoI,
      validationQoI,
      uqSettings,
      isSuMoGenerated,
    };
    saveState(newPersistence);
  }, [numSamples, selectedQoI, validationQoI, uqSettings, isSuMoGenerated]);

  useEffect(() => {
    if (loading === false && persistence && persistence.currentView !== undefined) {
      console.info("Loading MMUX context from persistence...");
      setNumSamples(persistence.numSamples);
      setSelectedQoI(persistence.selectedQoI);
      setValidationQoI(persistence.validationQoI ?? persistence.selectedQoI);
      setUQSettings(persistence.uqSettings ?? {});
      setIsSuMoGenerated(persistence.isSuMoGenerated);
      setLocalLoading(false);
    }
  }, [loading]);

  const memoState = useMemo(
    () => ({
      numSamples,
      setNumSamples,
      selectedQoI,
      setSelectedQoI,
      validationQoI,
      setValidationQoI,
      uqSettings,
      setUQSettings,
      isSuMoGenerated,
      setIsSuMoGenerated,
    }),
    [numSamples, selectedQoI, validationQoI, uqSettings, isSuMoGenerated],
  );
  return <MMUXContext.Provider value={memoState}>{children}</MMUXContext.Provider>;
}

export const useMMUXContext = () => {
  const context = useContext(MMUXContext);
  if (context === undefined) {
    throw new Error("useMMUXContext must be used within a MMUXContextProvider");
  }
  return context;
};
