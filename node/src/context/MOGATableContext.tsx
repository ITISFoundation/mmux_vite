/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const weightsToastId = useRef<string | number>("");

  const checkAllWeightsZero = (w: { [key: string]: number }) => Object.values(w).every(v => v === 0) && Object.keys(w).length > 0;
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
      if (checkAllWeightsZero(persistence.weights)) {
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
      if (checkAllWeightsZero(weights) && weightsToastId.current === "") {
        console.warn("All weights are zero! Setting performance to NaN");
        weightsToastId.current = toast.warning("Not possible to calculate performance - all weights set to zero");
      }
      if (!checkAllWeightsZero(weights) && weightsToastId.current !== "") {
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
