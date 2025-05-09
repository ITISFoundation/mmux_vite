import { describe, it, expect } from 'vitest';
import { FUNCTION_API } from '../src/components/api_objects';
import { findFunction, createInputOutputSchema } from '../src/components/function_utils';
import fs from 'fs';
import path from 'path';

export async function registerPythonFunction(funname: string): Promise<Function> {
    console.log(funname)
    const previous_funs = await FUNCTION_API.searchFunctionsByName(funname);
    if (previous_funs.length > 0) {
        if (previous_funs.length > 1) {
            throw new Error(`Multiple functions with the name "${funname}" are already registered.`);
        } else {
            return previous_funs[0];
        }
    }

    await FUNCTION_API.createFunction(
        {
            "name": funname,
            "type": "local.python",
            "url": "./examples/test_script/test_function1.py:test_function1",
            // "url": "./examples/test_script/test_function1_slow.py:test_function1",
            // when running, can use slow version to see how the "completion" interface works
            "description": "",
            "inputSchema": createInputOutputSchema(["x", "y"]),
            "outputSchema": createInputOutputSchema(["result"]),
            "tags": ["cacheable"],
        }
    );

    const fun = await findFunction(funname)
    console.log("Function registered successfully with id: ", fun.id);
    return fun;
};


describe('Register CSV Integration Test', () => {
    it('should check if the Functions API is available', async () => {
        const functions = await FUNCTION_API.listFunctions();
        expect(functions).toBeDefined();
        expect(Array.isArray(functions)).toBe(true);
    });

    it('register Python functions', async () => {
        // Ensure the file exists
        const funname = "Sinc Python Function"
        const fun = await registerPythonFunction(funname);
        expect(fun).toBeDefined();
        expect(fun.name).toBe(funname);
        console.log("Registered Python Function")
    });
});


