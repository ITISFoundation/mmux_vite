import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";

export interface MMUXContextType {
  numSamples: { [key: string]: number };
  setNumSamples: (ns: { [key: string]: number }) => void;
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
  const [numSamples, setNumSamples] = useState<{ [key: string]: number }>({});
  const [selectedQoI, setSelectedQoI] = useState<string | undefined>(undefined);
  const [isSuMoGenerated, setIsSuMoGenerated] = useState<boolean>(false);

  // persist the state of the MMUX context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      numSamples: numSamples,
      selectedQoI: selectedQoI,
      isSuMoGenerated: isSuMoGenerated,
    };
    saveState(newPersistence);
  }, [
    numSamples,
    selectedQoI,
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
      isSuMoGenerated: isSuMoGenerated,
      setIsSuMoGenerated: setIsSuMoGenerated,
    };
  }, [
    numSamples,
    selectedQoI,
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
