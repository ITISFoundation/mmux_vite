import React, { useReducer } from "react";

const loadedProperty = "__loaded";

// Define action type
type Action = {
    type: string;
    i: number;
};

// Define options interface
interface Options<T> {
    reducer?: (state: T[], action: Action) => T[];
}

const reducer = <T extends Record<string, any>>(state: T[], {i, type}: Action): T[] => {
    switch (type) {
        case "ready":
            const copy = [...state];
            copy[i] = { ...copy[i], [loadedProperty]: true };
            return copy;
        default:
            return state;
    }
};

const defaults: Options<any> = {};

export const useSequentialRenderer = <T extends Record<string, React.ReactNode>>(
    input: T[], 
    options: Options<T> = defaults as Options<T>
) => {
    const [state, dispatch] = useReducer(
        options.reducer || reducer<T>, 
        input
    );

    const index = state.findIndex(a => !a[loadedProperty]);
    const sliced = index < 0 ? state.slice() : state.slice(0, index + 1);

    const items = sliced.map((item, i) => {
        function done(): number {
            dispatch({ type: "ready", i });
            return i; 
        }

        return { ...item, done };
    });

    return { items };
};

