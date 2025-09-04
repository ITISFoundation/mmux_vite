/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";

interface NavigationContextType {
  currentView: number;
  setCurrentView: (view: number) => void;
  steps: Step[];
}

export const NavigationContext = createContext<NavigationContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

const steps: Step[] = [
  { id: 0, label: "Setup" },
  { id: 1, label: "Results" },
];

export function NavigationContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [currentView, setCurrentView] = useState(0);
  const [localLoading, setLocalLoading] = useState(true);

  const setPersistence = useCallback(() => {
    console.info("Saving navigation context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      currentView,
    };
    saveState(newPersistence);
  }, [persistence, currentView]);

  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    setPersistence();
  }, [currentView]);

  useEffect(() => {
    if (loading === false && persistence && persistence.currentView !== undefined) {
      console.info("Loading navigation context from persistence...");
      setCurrentView(persistence.currentView);
      setLocalLoading(false);
    }
  }, [loading]);

  const memo = React.useMemo(
    () => ({
      currentView,
      setCurrentView,
      steps,
    }),
    [currentView, setCurrentView],
  );

  return <NavigationContext.Provider value={memo}>{children}</NavigationContext.Provider>;
}

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigationContext must be used within a NavigationContextProvider");
  }
  return context;
};
