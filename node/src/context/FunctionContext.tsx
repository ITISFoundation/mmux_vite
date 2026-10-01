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
  // Per-function, per-QoI "fit the surrogate on log(QoI)" flag consumed by the
  // dakota payloads (outputLogScales). V26/V27 (branch lineage): auto-detection
  // (useAutoDetectQoiScale) may SET it, but a manual toggle in
  // OutputVariableDist locks the pair via outputLogScaleUserSet and detection
  // never overrides a locked pair again.
  outputLogScales: { [key: string]: { [varName: string]: boolean } };
  setOutputLogScales: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: boolean } }>>;
  outputLogScaleUserSet: { [key: string]: { [varName: string]: boolean } };
  setOutputLogScaleUserSet: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: boolean } }>>;
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
    outputLogScales: iols,
    outputLogScaleUserSet: iolsUserSet,
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
  }>(iols || {});
  const [outputLogScaleUserSet, setOutputLogScaleUserSet] = useState<{
    [key: string]: { [varName: string]: boolean };
  }>(iolsUserSet || {});

  useEffect(() => {
    if (loading === false) {
      setFunctionValues({
        selectedFunction,
        inputVars,
        outputVars,
        distribution,
        outputTargets,
        outputLogScales,
        outputLogScaleUserSet,
      });
    }
  }, [selectedFunction, inputVars, outputVars, distribution, outputTargets, outputLogScales, outputLogScaleUserSet]);

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
      outputLogScaleUserSet,
      setOutputLogScaleUserSet,
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
      outputLogScaleUserSet,
      setOutputLogScaleUserSet,
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
