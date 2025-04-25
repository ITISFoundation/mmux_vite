import { createContext } from 'react';
import { Function } from '../functions-api-ts-client';

interface FunctionContextType {
    function: Function | undefined;
    setFunction: (F: Function) => void;
}

const FunctionContext = createContext<FunctionContextType | undefined>(undefined)

export default FunctionContext;