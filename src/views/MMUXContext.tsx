import { createContext } from 'react';
import { Function } from '../functions-api-ts-client';

interface MMUXContextType {
    selectedFunction: Function | undefined;
    setSelectedFunction: (F: Function) => void;
    currentView: number;
    setCurrentView: (i: number) => void;
    // previousView: number[]
}

const MMUXContext = createContext<MMUXContextType | undefined>(undefined)

export default MMUXContext;