import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePersistenceContext } from './PersistenceContext';
import { PersistenceType } from './types';
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

export const NavigationContextProvider = ({ children }: Props) => {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [currentView, setCurrentView] = useState(0);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving navigation context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      currentView,
    };
    saveState(newPersistence);
  }, [currentView]);

  useEffect(() => {
    if (loading === false && persistence && persistence.currentView !== undefined) {
      console.info("Loading navigation context from persistence...");
      setCurrentView(persistence.currentView);
      setLocalLoading(false);
      return;
    } else if (loading === false && (persistence === undefined || persistence?.currentView === undefined)) {
      // when this happens, the persistence is either broken or not yet initialized
      console.warn("Persistence is not initialized or broken, resetting to defaults.");
      setCurrentView(0);
      setLocalLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setCurrentView(0);
      } catch (error) {
        console.error("Backend is not responding with permissions:", error);
      }
    };

    fetchStatus();
  }, []);

  const memo = React.useMemo(() => ({
    currentView,
    setCurrentView,
    steps,
  }), [currentView, setCurrentView]);

  return (
    <NavigationContext.Provider value={memo}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationContextProvider');
  }
  return context;
}