/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GridSortModel } from "@mui/x-data-grid";
import { toast } from "react-toastify";
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
  const weightsToastId = React.useRef<string | number>("");

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
      if (Object.values(persistence.weights).every(w => w === 0)) {
        console.warn("All weights are zero! Resetting to empty object");
        setWeights({});
      } else {
        setWeights(persistence.weights);
      }
      setSortModel(Array.isArray(persistence.sortModel) ? persistence.sortModel : []);
      setLocalLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (Object.values(weights).every(w => w === 0) && weightsToastId.current === "") {
        console.warn("All weights are zero! Setting performance to NaN");
        weightsToastId.current = toast.warning("Not possible to calculate performance - all weights set to zero");
      }
      if (!Object.values(weights).every(w => w === 0) && weightsToastId.current !== "") {
        toast.dismiss(weightsToastId.current);
        weightsToastId.current = "";
      }
    }
  }, [loading, weights]);

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
