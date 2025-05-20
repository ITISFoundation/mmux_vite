import { createConfiguration, FunctionsApi, FunctionJobsApi, ServerConfiguration } from '../osparc-api-ts-client';
import config from '../../osparc-master.conf.json';
// Function API server
const CONFIGURATION_FUNCTION_API = createConfiguration(
    {
        baseServer: new ServerConfiguration(config.host, {}),
        authMethods: {
            "HTTPBasic": {
                username: config.username,
                password: config.password
            }
        },
    }
);
export const FUNCTION_API = new FunctionsApi(CONFIGURATION_FUNCTION_API);
export const JOB_API = new FunctionJobsApi(CONFIGURATION_FUNCTION_API)

// Dakota local server

export const PYTHON_DAKOTA_BACKEND = 'http://127.0.0.1:5000'