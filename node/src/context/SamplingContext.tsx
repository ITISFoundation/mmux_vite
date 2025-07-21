import React, { createContext, useContext, useState, useEffect } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";
import { toast } from "react-toastify";

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

const defaultGRIDamplingConfig: GRIDSamplingConfig = [];

const defaultSingleJobConfig: SingleJobConfig[] = [];

export const SamplingContextProvider = ({ children }: Props) => {
  const { persistence, saveState, loading } = usePersistenceContext();
  const [ localLoading, setLocalLoading ] = useState(true);
  const [launchingSampling, setLaunchingSampling] = useState<boolean>(false);
  const [runningSampling, setRunningSampling] = useState<boolean>(false);
  const [lhsSamplingConfig, setLhsSamplingConfig] = useState<LHSamplingConfig>(
    defaultLHSamplingConfig
  );
  const [gridSamplingConfig, setGridSamplingConfig] =
    useState<GRIDSamplingConfig>(defaultGRIDamplingConfig);
  const [singleJobConfig, setSingleJobConfig] = useState<SingleJobConfig[]>(
    defaultSingleJobConfig
  );

  // show toast when sampling is running
  useEffect(() => {
    if (runningSampling) {
      toast.info("Sampling started running successfully, please wait for completion.");
    }
  }, [runningSampling]);

  useEffect(() => {
    if (localLoading === true) return; // Avoid saving state while loading
    console.info("Saving Sampling context state to persistence...");
    const newPersistence: PersistenceType = {
      ...(persistence as PersistenceType),
      launchingSampling,
      runningSampling,
      lhsSamplingConfig,
      gridSamplingConfig,
      singleJobConfig,
    };
    saveState(newPersistence);
  }, [
    launchingSampling,
    runningSampling,
    lhsSamplingConfig,
    gridSamplingConfig,
    singleJobConfig,
  ]);

  useEffect(() => {
    if (loading === false && persistence && persistence.launchingSampling !== undefined) {
      console.info("Loading Sampling context from persistence...");
      setLaunchingSampling(persistence.launchingSampling);
      setRunningSampling(persistence.runningSampling);
      setLhsSamplingConfig(persistence.lhsSamplingConfig);
      setGridSamplingConfig(persistence.gridSamplingConfig);
      setSingleJobConfig(persistence.singleJobConfig);
      setLocalLoading(false);
      return;
    } else if (loading === false && (persistence === undefined || persistence?.launchingSampling === undefined)) {
      // when this happens, the persistence is either broken or not yet initialized
      console.warn("Persistence is not initialized or broken, resetting to defaults.");
      setLaunchingSampling(false);
      setRunningSampling(false);
      setLhsSamplingConfig(defaultLHSamplingConfig);
      setGridSamplingConfig(defaultGRIDamplingConfig);
      setSingleJobConfig(defaultSingleJobConfig);
      setLocalLoading(false);
    }
  }, [loading]);

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
    ]
  );

  return (
    <SamplingContext.Provider value={memo}>{children}</SamplingContext.Provider>
  );
};

export const useSamplingContext = () => {
  const context = useContext(SamplingContext);
  if (context === undefined) {
    throw new Error(
      "useSamplingContext must be used within a SamplingContextProvider"
    );
  }
  return context;
};
