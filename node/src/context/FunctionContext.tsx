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
  const { persistence, saveState, loading } = usePersistenceContext();
  const [ localLoading, setLocalLoading ] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<
    Function | undefined
  >(persistence?.selectedFunction);
  const [inputVars, setInputVars] = useState<string[]>([]);
  const [outputVars, setOutputVars] = useState<string[] | undefined>([]);

  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving Function context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      selectedFunction,
      inputVars,
      outputVars,
    };
    saveState(newPersistence);
  }, [selectedFunction, inputVars, outputVars]);

  useEffect(() => {
    if (loading === false && persistence && persistence.launchingSampling !== undefined) {
      console.info("Loading Function context from persistence...");
      setSelectedFunction(persistence.selectedFunction);
      setInputVars(persistence.inputVars);
      setOutputVars(persistence.outputVars);
      setLocalLoading(false);
      return;
    } else if (loading === false && (persistence === undefined || persistence?.launchingSampling === undefined)) {
      // when this happens, the persistence is either broken or not yet initialized
      console.warn("Persistence is not initialized or broken, resetting to defaults.");
      setSelectedFunction(undefined);
      setInputVars([]);
      setOutputVars(undefined);
      setLocalLoading(false);
    }
  }, [loading]);

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
