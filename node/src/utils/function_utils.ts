import { toast } from "react-toastify";
import { Function, FunctionJob, FunctionJobCollection, ProjectFunctionJob } from '../osparc-api-ts-client';
import { PYTHON_DAKOTA_BACKEND } from './api_objects';
import { fetchWithRetry } from './fetch_retry';

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function createInputOutputSchema(vars: string[]) {
    return {
        "type": "object",
        "properties": vars.reduce((acc, curr) => {
            acc[curr] = { "type": "number" };
            return acc;
        }, {} as Record<string, unknown>),
        "required": vars,
    }
}

export async function getHealth(): Promise<number> {
    const result = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/health',
    )
    return result.status
}

export async function getPermissions(): Promise<string> {
    const result = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/permissions',
    )
    const permissionsJson = await result.json()
    return permissionsJson.permissions
}

export async function getServiceMode(): Promise<string> {
    const result = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/service-mode',
    )
    const serviceModeJson = await result.json()
    return serviceModeJson.service_mode
}

export async function listFunctions(): Promise<Function[]> {
    const result = await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/list_functions',
    )
    return result.json()
}

export async function listJobs(): Promise<FunctionJob[]> {
    return await fetchWithRetry(
        PYTHON_DAKOTA_BACKEND + '/flask/list_jobs',
    ).then(function (response) {
        return response.json()
    })
}

export async function getFunctionJob(jobUid: string): Promise<FunctionJob> {
    return await fetchWithRetry(
        PYTHON_DAKOTA_BACKEND + '/flask/get_function_job?jobUid=' + jobUid,
    ).then(function (response) {
        return response.json()
    })

}

export async function getFunctionJobStatus(jobUid: string): Promise<string> {
    return await fetchWithRetry(
        PYTHON_DAKOTA_BACKEND + '/flask/get_function_job_status?jobUid=' + jobUid,
    ).then(function (response) {
        return response.json()
    })
}

// export async function getFunctionJobOutputs(jobUid: string): Promise<FunctionJobOutputs> {
//     return await fetchWithRetry(
//         PYTHON_DAKOTA_BACKEND + '/flask/get_function_job_outputs?jobUid=' + jobUid,
//     ).then(function (response) {
//         return response.json()
//     })
// }

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
        PYTHON_DAKOTA_BACKEND + '/flask/list_function_job_collections_for_functionid?functionUid=' + functionUid,
    ).then(function (response) {
        return response.json()
    })
}

export async function getFunctionJobsFromFunctionJobCollection(JobCollectionUid: string): Promise<FunctionJob[]> {
    return await fetch(
        PYTHON_DAKOTA_BACKEND + '/flask/list_function_jobs_for_jobcollectionid?JobCollectionUid=' + JobCollectionUid,
    ).then(function (response) {
        return response.json()
    })
}

export function getSimplifiedHost(): string {
    const serviceAddress = window.location.href
    const url = new URL(serviceAddress);
    const simplifiedHost = url.hostname.replace(/^[^.]+\.services\./, ''); // get rid of the UUID and "services"
    return simplifiedHost
}

export function getDeploymentUrl(): string {
    const serviceAddress = window.location.href
    const url = new URL(serviceAddress);
    const simplifiedHost = url.hostname.replace(/^[^.]+\.services\./, ''); // get rid of the UUID and "services"
    const deploymentUrl = `${url.protocol}//${simplifiedHost}`; // add the protocol
    return deploymentUrl
}

export function openStudyUid(uid: string): void {
    const deploymentUrl = getDeploymentUrl()
    const serviceUrl = deploymentUrl + `/#/study/${uid}`
    const newWindow = window.open(serviceUrl);
    if (newWindow) {
        console.info("Window opened successfully")
    } else {
        toast.warning("Popup blocked! Please allow popups for this site to open the job in a new tab.");
    }
}

interface StudyType {
    uid: string;
    title: string;
    description: string;
}
export const createJobStudyCopy = async (functionName: string, job: ProjectFunctionJob) => {
    try {
        const projectJobId = job.projectJobId;
        const inputs = job.inputs
        const study: StudyType = await fetch(
            PYTHON_DAKOTA_BACKEND + "/flask/clone_job", {
            method: "POST",
            body: JSON.stringify({
                functionName: functionName, //
                projectJobId: projectJobId,
                projectInputs: inputs,
            }),
        }).then(function (response) {
            return response.json()
        })

        if (study && study.uid) {
            return study.uid
        } else {
            toast.error("Failed to open job copy: No UID returned");
        }
    } catch (error) {
        console.error("Error creating Job Copy for inspection:", error);
        toast.error("Error creating Job Copy for inspection");
    }
}


export function aggregateInputValues(jobs: FunctionJob[]): Record<string, number[]> {
    const inputValues: Record<string, number[]> = {};

    jobs.forEach(job => {
        if (job.inputs && typeof job.inputs === 'object') {
            Object.entries(job.inputs).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    if (!inputValues[key]) inputValues[key] = [];
                    inputValues[key].push(value);
                }
            });
        }
    });

    return inputValues;
}

export function aggregateOutputValues(jobs: FunctionJob[]): Record<string, number[]> {
    const outputValues: Record<string, number[]> = {};

    jobs.forEach(job => {
        if (job.outputs && typeof job.outputs === 'object') {
            Object.entries(job.outputs).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    if (!outputValues[key]) outputValues[key] = [];
                    outputValues[key].push(value);
                }
            });
        }
    });

    return outputValues;
} 