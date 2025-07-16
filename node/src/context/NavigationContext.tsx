import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
  currentView: number;
  setCurrentView: (view: number) => void;
  steps: Step[];
}

export const NavigationContext = createContext<NavigationContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export const NavigationContextProvider = ({ children }: Props) => {
  const [currentView, setCurrentView] = useState(0);
  const steps: Step[] = [
    { id: 0, label: "Setup" },
    { id: 1, label: "Results" },
  ];

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
  }), [currentView, setCurrentView, steps]);

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