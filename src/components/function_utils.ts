import { FUNCTION_API, JOB_API } from './api_objects';
import { Function, FunctionJob, FunctionJobCollection } from '../functions-api-ts-client';

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
export async function findFunction(name: string): Promise<Function> {
    // FIXME avoid registering duplicate functions should be in the API
    // this is a temporary patch
    const funs = await FUNCTION_API.searchFunctionsByName(name)
    if (funs.length !== 1) {
        console.error(`Expected exactly 1 function, but found ${funs.length}`);
    }
    const fun = funs[0]
    console.log("funId: ", fun.id);
    console.log("fun: ", fun)
    return fun
}

export async function getJobStatus(job: FunctionJob | FunctionJobCollection): Promise<string> {
    const jobId = job.id
    if (!jobId) {
        console.log("jobId not found")
        throw new Error("Job ID not found in the provided job object.");
    }
    let response = await JOB_API.getJobsStatus([jobId])
    let jobStatus = response[0]?.status ?? "UNKNOWN";
    console.log("Job status: ", jobStatus)
    return jobStatus
}

export async function waitJobCompletion(job: FunctionJob | FunctionJobCollection): Promise<string> {
    let jobStatus = await getJobStatus(job)
    while (!jobStatus.includes("COMPLETED") && !jobStatus.includes("FAILED")) {
        console.log(`Job status: ${jobStatus}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 1 second
        jobStatus = await getJobStatus(job);
    }
    console.log(jobStatus, job) // for some reason, JobCollection status is not updated, Job is
    return jobStatus
}
