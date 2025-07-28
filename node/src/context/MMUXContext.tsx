/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";
import { GridSortModel } from "@mui/x-data-grid";

export interface MMUXContextType {
  numSamples: { [key: string]: number };
  setNumSamples: (ns: { [key: string]: number }) => void;
  selectedQoI: string | undefined;
  setSelectedQoI: (response: string | undefined) => void;
  isSuMoGenerated: boolean;
  setIsSuMoGenerated: (is: boolean) => void;
  weights: { [key: string]: number } | undefined;
  setWeights: (weights: { [key: string]: number } | undefined) => void;
  sortModel: GridSortModel | undefined;
  setSortModel: (sortModel: GridSortModel | undefined) => void;
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
  const [weights, setWeights] = useState<{ [key: string]: number }>();
  const [sortModel, setSortModel] = useState<GridSortModel>();

  // persist the state of the MMUX context using the persistenceContext provider every time any of the state variables change
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      numSamples: numSamples,
      selectedQoI: selectedQoI,
      isSuMoGenerated: isSuMoGenerated,
      weights: weights,
      sortModel: sortModel,
    };
    saveState(newPersistence);
  }, [
    numSamples,
    selectedQoI,
    isSuMoGenerated,
    weights,
    sortModel,
  ]);

  useEffect(() => {
    if (
      loading === false &&
      persistence &&
      persistence.currentView !== undefined
    ) {
      console.info("Loading MMUX context from persistence...");
      setNumSamples(persistence.numSamples);
      setSelectedQoI(persistence.selectedQoI);
      setIsSuMoGenerated(persistence.isSuMoGenerated);
      setWeights(persistence.weights);
      setSortModel(persistence.sortModel);
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
      weights: weights,
      setWeights: setWeights,
      sortModel: sortModel,
      setSortModel: setSortModel,
    };
  }, [
    numSamples,
    selectedQoI,
    isSuMoGenerated,
    weights,
    sortModel,
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
