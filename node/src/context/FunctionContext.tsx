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
  setOutputLogScales: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: boolean } }>>;
  // V27: locks a (uid, QoI) pair once manually toggled, so useAutoDetectQoiScale never
  // overrides it again.
  outputLogScaleUserSet: { [key: string]: { [varName: string]: boolean } };
  setOutputLogScaleUserSet: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: boolean } }>>;
  // B32/V40: true once a variable's distribution entry has been manually edited (vs
  // auto-inferred/refreshed). Gates the existing-mode CSV-upload merge so user edits
  // are preserved, and drives the blue "user-modified" marker. Orthogonal to `distribution`.
  distributionUserModified: { [key: string]: { [varName: string]: boolean } };
  setDistributionUserModified: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: boolean } }>>;
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
    outputLogScaleUserSet: olsUserSet,
    distributionUserModified: dum,
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
  const [outputLogScaleUserSet, setOutputLogScaleUserSet] = useState<{
    [key: string]: { [varName: string]: boolean };
  }>(olsUserSet || {});
  const [distributionUserModified, setDistributionUserModified] = useState<{
    [key: string]: { [varName: string]: boolean };
  }>(dum || {});

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
        distributionUserModified,
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
      distributionUserModified,
      setDistributionUserModified,
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
      distributionUserModified,
      setDistributionUserModified,
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
