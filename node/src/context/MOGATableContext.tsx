/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GridSortModel } from "@mui/x-data-grid";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";

export interface MOGATableContextType {
  weights: { [key: string]: number };
  setWeights: (weights: { [key: string]: number }) => void;
  sortModel: GridSortModel;
  setSortModel: (sortModel: GridSortModel) => void;
}

export const MOGATableContext = createContext<MOGATableContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function MOGATableContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [weights, setWeights] = useState<{ [key: string]: number }>({});
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  // Persist only weights and sortModel
  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      weights,
      sortModel,
    };
    saveState(newPersistence);
  }, [weights, sortModel]);

  useEffect(() => {
    if (!loading && persistence && persistence.currentView !== undefined) {
      setWeights(persistence.weights);
      setSortModel(Array.isArray(persistence.sortModel) ? persistence.sortModel : []);
      setLocalLoading(false);
    }
  }, [loading]);

  const memoState = useMemo<MOGATableContextType>(
    () => ({
      weights,
      setWeights,
      sortModel,
      setSortModel,
    }),
    [weights, sortModel],
  );
  return <MOGATableContext.Provider value={memoState}>{children}</MOGATableContext.Provider>;
}

export const useMOGATableContext = () => {
  const context = useContext(MOGATableContext);
  if (context === undefined) {
    throw new Error("useMOGATableContext must be used within a MOGATableContextProvider");
  }
  return context;
};
