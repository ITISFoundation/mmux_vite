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
  // What the auto-detect CV pair actually measured, so the UI can show WHY a QoI
  // scale is what it is (OutputVariableDist provenance chip + error tooltip).
  // Session-only by design: NOT in PersistenceType — a receipt goes stale the
  // moment the job-set or an input flag changes, and useAutoDetectQoiScale
  // re-derives it per cache key anyway.
  qoiScaleEvidence: { [key: string]: { [varName: string]: QoiScaleEvidence } };
  setQoiScaleEvidence: React.Dispatch<React.SetStateAction<{ [key: string]: { [varName: string]: QoiScaleEvidence } }>>;
}

export interface QoiScaleEvidence {
  rmseLinear: number;
  rmseLog: number;
  jobs: number;
  // The exact cache key (uid::qoi::jobUids::inputScaleSignature) the pair was
  // computed under — the receipt doubles as a cross-remount dedup key: a fresh
  // hook mount skips a QoI whose current key already has evidence.
  key: string;
}

const FunctionContext = createContext<FunctionContextType>(undefined!);

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
  // Session-only (see FunctionContextType.qoiScaleEvidence): deliberately NOT
  // wired into the persistence fan-out effect below.
  const [qoiScaleEvidence, setQoiScaleEvidence] = useState<{
    [key: string]: { [varName: string]: QoiScaleEvidence };
  }>({});

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
      qoiScaleEvidence,
      setQoiScaleEvidence,
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
      qoiScaleEvidence,
      setQoiScaleEvidence,
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
