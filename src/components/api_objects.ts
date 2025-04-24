import { FunctionApi, FunctionJobApi, ServerConfiguration, createConfiguration } from '../functions-api-ts-client';

// Function API server
const CONFIGURATION_FUNCTION_API = createConfiguration(
    { baseServer: new ServerConfiguration('http://127.0.0.1:8087', {}) }
)
export const FUNCTION_API = new FunctionApi(CONFIGURATION_FUNCTION_API);
export const JOB_API = new FunctionJobApi(CONFIGURATION_FUNCTION_API)

// Dakota local server

export const PYTHON_DAKOTA_BACKEND = 'http://127.0.0.1:5000'