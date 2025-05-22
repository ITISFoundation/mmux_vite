import { createContext } from 'react';
import { Function } from '../osparc-api-ts-client';

export interface MMUXContextType {
    selectedFunction: Function | undefined;
    setSelectedFunction: (F: Function) => void;
    currentView: number;
    setCurrentView: (i: number) => void;
    launchingSampling: boolean,
    setLaunchingSampling: (b: boolean) => void;
    runningSampling: boolean,
    setRunningSampling: (b: boolean) => void;
    // TODO should I also store here the (Registered)JobCollection (uid) itself?
}

const MMUXContext = createContext<MMUXContextType | undefined>(undefined)

export default MMUXContext;