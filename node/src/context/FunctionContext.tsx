/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType, RegisteredFunction } from "./types";

export interface FunctionContextType {
  selectedFunction: RegisteredFunction | undefined;
  setSelectedFunction: (F: RegisteredFunction | undefined) => void;
  inputVars: string[];
  setInputVars: (vars: string[]) => void;
  outputVars: string[];
  setOutputVars: (vars: string[]) => void;
  distribution: { [key: string]: InputVarSelection };
  setDistribution: React.Dispatch<React.SetStateAction<{ [key: string]: InputVarSelection }>>;
  outputTargets: { [key: string]: OutputVarSelection };
  setOutputTargets: (d: { [key: string]: OutputVarSelection }) => void;
  outputLogScales: { [key: string]: { [varName: string]: boolean } };
  setOutputLogScales: (d: { [key: string]: { [varName: string]: boolean } }) => void;
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
    outputTargets: od,
    outputLogScales: ols,
  } = functionValues as Partial<PersistenceType>;
  const [selectedFunction, setSelectedFunction] = useState<RegisteredFunction | undefined>(isf);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>(id || {});
  const [inputVars, setInputVars] = useState<string[]>(iiv || []);
  const [outputVars, setOutputVars] = useState<string[]>(iov || []);
  const [outputTargets, setOutputTargets] = useState<{
    [key: string]: OutputVarSelection;
  }>(od || {});
  const [outputLogScales, setOutputLogScales] = useState<{
    [key: string]: { [varName: string]: boolean };
  }>(ols || {});

  useEffect(() => {
    if (loading === false) {
      setFunctionValues({
        selectedFunction,
        inputVars,
        outputVars,
        distribution,
        outputTargets,
        outputLogScales,
      });
    }
  }, [selectedFunction, inputVars, outputVars, distribution, outputTargets, outputLogScales]);

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
      outputTargets,
      setOutputTargets,
      outputLogScales,
      setOutputLogScales,
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
      outputTargets,
      setOutputTargets,
      outputLogScales,
      setOutputLogScales,
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
