/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { usePersistenceContext } from "./PersistenceContext";
import { useFunctionContext } from "./FunctionContext";
import { PersistenceType } from "./types";

export interface SamplingContextType {
  launchingSampling: boolean;
  setLaunchingSampling: (b: boolean) => void;
  runningSampling: boolean;
  setRunningSampling: (b: boolean) => void;
  lhsSamplingConfig: LHSamplingConfig;
  setLhsSamplingConfig: (config: LHSamplingConfig) => void;
  gridSamplingConfig: GRIDSamplingConfig;
  setGridSamplingConfig: (config: GRIDSamplingConfig) => void;
  singleJobConfig: SingleJobConfig[];
  setSingleJobConfig: (config: SingleJobConfig[]) => void;
  clearSampling: () => void;
}

export const SamplingContext = createContext<SamplingContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

const defaultLHSamplingConfig: LHSamplingConfig = {
  inputs: [],
  points: 50,
  seed: 0,
};

const defaultGRIDSamplingConfig: GRIDSamplingConfig = [];

const defaultSingleJobConfig: SingleJobConfig[] = [];

export function SamplingContextProvider({ children }: Props) {
  const { persistence, saveState, loading } = usePersistenceContext();
  const { selectedFunction } = useFunctionContext();
  const [localLoading, setLocalLoading] = useState(true);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false);
  const [runningSampling, setRunningSampling] = useState<boolean>(false);
  const [lhsSamplingConfig, setLhsSamplingConfig] = useState<LHSamplingConfig>(defaultLHSamplingConfig);
  const [gridSamplingConfig, setGridSamplingConfig] = useState<GRIDSamplingConfig>(defaultGRIDSamplingConfig);
  const [singleJobConfig, setSingleJobConfig] = useState<SingleJobConfig[]>(defaultSingleJobConfig);

  const clearSampling = useCallback(() => {
    setLaunchingSampling(false);
    setRunningSampling(false);
    setLhsSamplingConfig(defaultLHSamplingConfig);
    setGridSamplingConfig(defaultGRIDSamplingConfig);
    setSingleJobConfig(defaultSingleJobConfig);
  }, [setLaunchingSampling, setRunningSampling, setLhsSamplingConfig, setGridSamplingConfig, setSingleJobConfig]);

  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving Sampling context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      lhsSamplingConfig,
      gridSamplingConfig,
      singleJobConfig,
    };
    saveState(newPersistence);
  }, [lhsSamplingConfig, gridSamplingConfig, singleJobConfig]);

  useEffect(() => {
    if (loading === false && persistence && persistence.currentView !== undefined) {
      console.info("Loading Sampling context from persistence...");
      setLhsSamplingConfig(persistence.lhsSamplingConfig);
      setGridSamplingConfig(persistence.gridSamplingConfig);
      setSingleJobConfig(persistence.singleJobConfig);
      setLocalLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    console.info("Reloading job collections after functions run");
    if (selectedFunction !== undefined && launchingSampling === false && runningSampling === true) {
      (async () => {
        toast.success("Sampling started running successfully, please wait for completion.");
      })();
    }
  }, [selectedFunction, launchingSampling, runningSampling]);

  const memo = React.useMemo(
    () => ({
      launchingSampling,
      setLaunchingSampling,
      runningSampling,
      setRunningSampling,
      lhsSamplingConfig,
      setLhsSamplingConfig,
      gridSamplingConfig,
      setGridSamplingConfig,
      singleJobConfig,
      setSingleJobConfig,
      clearSampling,
    }),
    [
      launchingSampling,
      setLaunchingSampling,
      runningSampling,
      setRunningSampling,
      lhsSamplingConfig,
      setLhsSamplingConfig,
      gridSamplingConfig,
      setGridSamplingConfig,
      singleJobConfig,
      setSingleJobConfig,
      clearSampling,
    ],
  );

  return <SamplingContext.Provider value={memo}>{children}</SamplingContext.Provider>;
}

export const useSamplingContext = () => {
  const context = useContext(SamplingContext);
  if (context === undefined) {
    throw new Error("useSamplingContext must be used within a SamplingContextProvider");
  }
  return context;
};
