/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { Function as OsparcFunction } from "../osparc-api-ts-client";
import { PersistenceType } from "./types";

export interface FunctionContextType {
  selectedFunction: OsparcFunction | undefined;
  setSelectedFunction: (F: OsparcFunction | undefined) => void;
  inputVars: string[];
  setInputVars: (vars: string[]) => void;
  outputVars: string[];
  setOutputVars: (vars: string[]) => void;
  distribution: { [key: string]: InputVarSelection };
  setDistribution: (d: { [key: string]: InputVarSelection }) => void;
  outputTargets: { [key: string]: OutputVarSelection };
  setOutputTargets: (d: { [key: string]: OutputVarSelection }) => void;
  outputLogScales: { [uid: string]: { [varName: string]: boolean } };
  setOutputLogScales: (d: { [uid: string]: { [varName: string]: boolean } }) => void;
  reconcileFunctions: (functions: OsparcFunction[]) => void;
}

export const FunctionContext = createContext<FunctionContextType>(undefined!);

interface Props {
  children: React.ReactNode;
}

function pruneFunctionScopedState<T extends Record<string, unknown>>(state: T, liveFunctionIds: Set<string>): T {
  return Object.fromEntries(Object.entries(state).filter(([uid]) => liveFunctionIds.has(uid))) as T;
}

function sameFunctionScopedEntries<T extends Record<string, unknown>>(left: T, right: T): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(key => left[key] === right[key]);
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
  const [selectedFunction, setSelectedFunction] = useState<OsparcFunction | undefined>(isf);
  const [distribution, setDistribution] = useState<{
    [key: string]: InputVarSelection;
  }>(id || {});
  const [inputVars, setInputVars] = useState<string[]>(iiv || []);
  const [outputVars, setOutputVars] = useState<string[]>(iov || []);
  const [isHydrated, setIsHydrated] = useState<boolean>(loading === false);
  const [outputTargets, setOutputTargets] = useState<{
    [key: string]: OutputVarSelection;
  }>(od || {});
  const [outputLogScales, setOutputLogScales] = useState<{
    [uid: string]: { [varName: string]: boolean };
  }>(ols || {});

  useEffect(() => {
    if (loading === false && isHydrated === false) {
      const loadedValues = getFunctionValues() || {};
      setSelectedFunction(loadedValues.selectedFunction);
      setInputVars(loadedValues.inputVars || []);
      setOutputVars(loadedValues.outputVars || []);
      setDistribution(loadedValues.distribution || {});
      setOutputTargets(loadedValues.outputTargets || {});
      setOutputLogScales(loadedValues.outputLogScales || {});
      setIsHydrated(true);
    }
  }, [getFunctionValues, isHydrated, loading]);

  useEffect(() => {
    if (loading === true || isHydrated === false) {
      return;
    }

    setFunctionValues({
      selectedFunction,
      inputVars,
      outputVars,
      distribution,
      outputTargets,
      outputLogScales,
    });
  }, [
    distribution,
    inputVars,
    isHydrated,
    loading,
    outputLogScales,
    outputTargets,
    outputVars,
    selectedFunction,
    setFunctionValues,
  ]);

  const reconcileFunctions = useCallback(
    (functions: OsparcFunction[]) => {
      const liveFunctionIds = new Set(functions.map(fun => fun.uid).filter((uid): uid is string => Boolean(uid)));
      const nextDistribution = pruneFunctionScopedState(distribution, liveFunctionIds);
      const nextOutputTargets = pruneFunctionScopedState(outputTargets, liveFunctionIds);
      const nextOutputLogScales = pruneFunctionScopedState(outputLogScales, liveFunctionIds);

      if (!sameFunctionScopedEntries(distribution, nextDistribution)) {
        setDistribution(nextDistribution);
      }

      if (!sameFunctionScopedEntries(outputTargets, nextOutputTargets)) {
        setOutputTargets(nextOutputTargets);
      }

      if (!sameFunctionScopedEntries(outputLogScales, nextOutputLogScales)) {
        setOutputLogScales(nextOutputLogScales);
      }

      if (selectedFunction?.uid && !liveFunctionIds.has(selectedFunction.uid)) {
        setSelectedFunction(undefined);
        setInputVars([]);
        setOutputVars([]);
      }
    },
    [distribution, outputLogScales, outputTargets, selectedFunction],
  );

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
      reconcileFunctions,
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
      reconcileFunctions,
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
