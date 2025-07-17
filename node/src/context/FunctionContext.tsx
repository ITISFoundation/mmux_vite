import React, { createContext, useContext, useState, useEffect } from "react";
import { PersistenceType, usePersistenceContext } from "./PersistenceContext";
import { Function } from "../osparc-api-ts-client";

interface FunctionContextType {
  selectedFunction: Function | undefined;
  setSelectedFunction: (F: Function | undefined) => void;
  inputVars: string[];
  setInputVars: (vars: string[]) => void;
  outputVars: string[] | undefined;
  setOutputVars: (vars: string[]) => void;
}

export const FunctionContext = createContext<FunctionContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export const FunctionContextProvider = ({ children }: Props) => {
  const { persistence, saveState } = usePersistenceContext();
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<
    Function | undefined
  >(persistence?.selectedFunction);
  const [inputVars, setInputVars] = useState<string[]>(
    persistence?.inputVars || []
  );
  const [outputVars, setOutputVars] = useState<string[] | undefined>(
    persistence?.outputVars || undefined
  );

  useEffect(() => {
    if (loading) return; // Avoid saving state while loading
    console.info("Saving MMUX context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      selectedFunction,
      inputVars,
      outputVars,
    };
    saveState(newPersistence);
  }, [selectedFunction, inputVars, outputVars, saveState, loading]);

  useEffect(() => {
    if (loading && persistence !== undefined) {
      if (typeof persistence.launchingSampling !== "boolean") {
        console.info(
          "Persistence file is empty, initializing with default values."
        );
        setLoading(false);
        return;
      }
      setSelectedFunction(persistence.selectedFunction);
      setInputVars(persistence.inputVars);
      setOutputVars(persistence.outputVars);
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // setCurrentView(0);
      } catch (error) {
        // console.error("Backend is not responding with permissions:", error);
      }
    };

    fetchStatus();
  }, []);

  const memo = React.useMemo(
    () => ({
      selectedFunction,
      setSelectedFunction,
      inputVars,
      setInputVars,
      outputVars,
      setOutputVars,
    }),
    [
      selectedFunction,
      setSelectedFunction,
      inputVars,
      setInputVars,
      outputVars,
      setOutputVars,
    ]
  );

  return (
    <FunctionContext.Provider value={memo}>{children}</FunctionContext.Provider>
  );
};

export const useFunctionContext = () => {
  const context = useContext(FunctionContext);
  if (context === undefined) {
    throw new Error(
      "useFunctionContext must be used within a FunctionContextProvider"
    );
  }
  return context;
};
