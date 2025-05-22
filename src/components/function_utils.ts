import { Function, FunctionJob, FunctionJobCollection} from '../osparc-api-ts-client';
import { PYTHON_DAKOTA_BACKEND } from './api_objects';


export function createInputOutputSchema(vars: string[]) {
    return {
        "type": "object",
        "properties": vars.reduce((acc, curr) => {
            acc[curr] = { "type": "number" };
            return acc;
        }, {} as Record<string, any>),
        "required": vars,
    }
}

export async function listFunctions(): Promise<Function[]> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/list_functions',
    ).then(function (response) {
        return response.json()
    })
}

export async function listJobs(): Promise<FunctionJob[]> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/list_jobs',
    ).then(function (response) {
        return response.json()
    })
}

export async function getFunctionJob(jobUid: string): Promise<FunctionJob> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/get_function_job?jobUid=' + jobUid,
    ).then(function (response) {
        return response.json()
    })

}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<FunctionJob[]> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/list_function_jobs_for_functionid?functionUid=' + functionUid,
    ).then(function (response) {
        return response.json()
    })
    // return MOCKUP_JOBS
}

export async function getFunctionJobCollections(functionUid: string): Promise<FunctionJobCollection[]> {
    return await fetch(
        // PYTHON_DAKOTA_BACKEND + '/flask/list_function_job_collections_for_functionid?functionUid=' + functionUid,
        PYTHON_DAKOTA_BACKEND + '/flask/list_function_job_collections',
    ).then(function (response) {
        return response.json()
    })
}