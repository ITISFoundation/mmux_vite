import { useState, useEffect } from "react";
import { loadJSONState, saveJSONState } from "./json_state_utils";

interface PersistentJSONStateOptions<T> {
    defaultState: T;
    filePath: string;
    onStateLoaded?: (state: T) => void;
}

export function usePersistentJSONState<T>({
    defaultState,
    filePath,
    onStateLoaded,
}: PersistentJSONStateOptions<T>) {
    const [state, setState] = useState<T>(defaultState);

    useEffect(() => {
        async function initializeState() {
            console.log("Loading state from file ", filePath);
            const data = await loadJSONState(filePath);
            console.log("State loaded from file ", filePath);
            console.log("State loaded: ", data);
            if (data) {
                setState(data);
                onStateLoaded?.(data);
                console.log("State loaded: ", data);
            } else {
                setState(defaultState);
                console.log("No state found in file. Setting to default state.");
            }
        }
        initializeState();
    }, [filePath]);

    useEffect(() => {
        if (!filePath) return; // Avoid saving if filePath is not yet set
        console.log("State changed. Saving to file ", filePath);
        async function saveState() {
            await saveJSONState(state, filePath);
        }
        saveState();
    }, [state]);

    return [state, setState] as const;
}
export default usePersistentJSONState;