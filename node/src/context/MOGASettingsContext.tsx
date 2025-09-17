/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePersistenceContext } from "./PersistenceContext";
import { PersistenceType } from "./types";



export type FitnessType = "layer_rank" | "domination_count";
export type ReplacementType = "elitist" | "roulette_wheel" | "unique_roulette_wheel" | "below_limit";

export interface MOGASettings {
    populationSize: number;
    iterations: number;
    fitnessType: FitnessType;
    replacementType: ReplacementType;
}

export interface MOGASettingsContextType {
    mogaSettings: MOGASettings;
    setMOGASettings: (settings: MOGASettings) => void;
}


export const MOGASettingsContext = createContext<MOGASettingsContextType | undefined>(undefined);

type Props = {
    children: React.ReactNode;
};


export function MOGASettingsContextProvider({ children }: Props) {
    const { persistence, saveState, loading } = usePersistenceContext();
    const [localLoading, setLocalLoading] = useState(true);
    const [mogaSettings, setMOGASettings] = useState<MOGASettings>({
        populationSize: 50,
        iterations: 100,
        fitnessType: "layer_rank",
        replacementType: "elitist",
    });

    // Persist mogaSettings inside PersistenceType
    useEffect(() => {
        if (localLoading) return;
        const newPersistence: PersistenceType = {
            ...(persistence as PersistenceType),
            mogaSettings,
        };
        saveState(newPersistence);
    }, [mogaSettings]);

    useEffect(() => {
        if (!loading && persistence && persistence.currentView !== undefined && persistence.mogaSettings) {
            setMOGASettings(persistence.mogaSettings);
            setLocalLoading(false);
        }
    }, [loading]);

    const memoState = useMemo<MOGASettingsContextType>(
        () => ({
            mogaSettings,
            setMOGASettings,
        }),
        [mogaSettings],
    );
    return <MOGASettingsContext.Provider value={memoState}>{children}</MOGASettingsContext.Provider>;
}

export const useMOGASettingsContext = () => {
    const context = useContext(MOGASettingsContext);
    if (context === undefined) {
        throw new Error("useMOGASettingsContext must be used within a MOGASettingsContextProvider");
    }
    return context;
};
