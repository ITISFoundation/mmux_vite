/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { Function } from "../osparc-api-ts-client";
import { PersistenceType } from "./types";

export interface FunctionContextType {
  selectedFunction: Function | undefined;
  setSelectedFunction: (F: Function | undefined) => void;
  inputVars: string[];
  setInputVars: (vars: string[]) => void;
  outputVars: string[];
  setOutputVars: (vars: string[]) => void;
  distribution: { [key: string]: InputVarSelection };
  setDistribution: (d: { [key: string]: InputVarSelection }) => void;
  outputDistribution: { [key: string]: OutputVarSelection };
  setOutputDistribution: (d: { [key: string]: OutputVarSelection }) => void;
}

export const FunctionContext = createContext<FunctionContextType>(undefined!);

interface Props {
  children: React.ReactNode;
}

export function FunctionContextProvider({ children }: Props) {
  const { getFunctionValues, setFunctionValues, loading } = usePersistenceContext();
  const functionValues = getFunctionValues() || {};
  const {
    selectedFunction: isf,
    inputVars: iiv,
    outputVars: iov,
    distribution: id,
    outputDistribution: od,
  } = functionValues as Partial<PersistenceType>;
  const [selectedFunction, setSelectedFunction] = useState<Function | undefined>(isf);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>(id || {});
  const [inputVars, setInputVars] = useState<string[]>(iiv || []);
  const [outputVars, setOutputVars] = useState<string[]>(iov || []);
  const [outputDistribution, setOutputDistribution] = useState<{
    [key: string]: OutputVarSelection;
  }>(od || {});

  useEffect(() => {
    if (loading === false) {
      setFunctionValues({
        selectedFunction,
        inputVars,
        outputVars,
        distribution,
        outputDistribution,
      });
    }
  }, [selectedFunction, inputVars, outputVars, distribution, outputDistribution]);

  const memo = React.useMemo(
    () => ({
      selectedFunction,
      setSelectedFunction,
      inputVars,
      setInputVars,
      outputVars,
      setOutputVars,
      distribution,
      setDistribution,
      outputDistribution,
      setOutputDistribution,
    }),
    [
      selectedFunction,
      setSelectedFunction,
      inputVars,
      setInputVars,
      outputVars,
      setOutputVars,
      distribution,
      setDistribution,
      outputDistribution,
      setOutputDistribution,
    ],
  );

  return <FunctionContext.Provider value={memo}>{children}</FunctionContext.Provider>;
}

export const useFunctionContext = () => {
  const context = useContext(FunctionContext);
  if (context === undefined) {
    throw new Error("useFunctionContext must be used within a FunctionContextProvider");
  }
  return context;
};
