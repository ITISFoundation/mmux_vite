import { Function, FunctionJob, FunctionJobCollection, JSONFunctionInputSchema, JSONFunctionOutputSchema } from '../osparc-api-ts-client';
import { SolverFunction, SolverFunctionJob } from '../osparc-api-ts-client';

const MOCKUP_FUNCTIONS: Function[] = [
    new SolverFunction(),
]
MOCKUP_FUNCTIONS[0].title = "Mockup Function"
MOCKUP_FUNCTIONS[0].description = "A simple mockup Function for FrontEnd development & testing"
MOCKUP_FUNCTIONS[0].uid = "asdfasdfasdf"
MOCKUP_FUNCTIONS[0].inputSchema = new JSONFunctionInputSchema()
MOCKUP_FUNCTIONS[0].inputSchema.schemaContent = {
    "type": "object",
    "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" },
    },
    "required": ["x", "y"],
}
MOCKUP_FUNCTIONS[0].outputSchema = new JSONFunctionOutputSchema()
MOCKUP_FUNCTIONS[0].outputSchema.schemaContent = {
    "type": "object",
    "properties": { "result": { "type": "number" } },
    "required": ["result"],
}

/////////////////////////////////

function jobGenerator(fun: Function, uuid: string): FunctionJob {
    let j = new SolverFunctionJob()
    j.functionUid = fun.uid
    j.inputs = { "x": 0.0, "y": 0.0 }
    j.outputs = { "result": 0.0 }
    j.solverJobId = uuid
    j.uid = uuid // TODO diff types of jobs have different UID fields?? problematic
    j.status = "COMPLETED"
    return j
}
const MOCKUP_JOBS: FunctionJob[] = [
    jobGenerator(MOCKUP_FUNCTIONS[0], "aaa"),
    jobGenerator(MOCKUP_FUNCTIONS[0], "bbb"),
    jobGenerator(MOCKUP_FUNCTIONS[0], "ccc"),
    jobGenerator(MOCKUP_FUNCTIONS[0], "ddd")
]

/////////////////////////////////

const MOCKUP_JOB_COLLECTIONS: FunctionJobCollection[] = [
    new FunctionJobCollection(),
] // TODO fill up the first JobCOllection w the MOCKUP_JOBS
MOCKUP_JOB_COLLECTIONS[0].title = "Mockup Job Campaign 1"
MOCKUP_JOB_COLLECTIONS[0].description = "A simple mockup for a Job Collection of a Solver Function"
MOCKUP_JOB_COLLECTIONS[0].jobIds = MOCKUP_JOBS.map(j => j.uid)


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
    return MOCKUP_FUNCTIONS
}

export async function listJobs(): Promise<FunctionJob[]> {
    return MOCKUP_JOBS
}

export async function getFunctionJob(jobUid: string): Promise<FunctionJob> {
    // get the MOCKUP_JOB with the right UID
    const j = MOCKUP_JOBS.find(j => j.uid === jobUid);
    if (!j) {
        console.log("Job with ID " + jobUid + " not found");
        return MOCKUP_JOBS[0];
    } else {
        return j;
    }
}

export async function getFunctionJobsFromFunctionUid(functionUid: string): Promise<FunctionJob[]> {
    return MOCKUP_JOBS
}

export async function getFunctionJobCollections(functionUid: string): Promise<FunctionJobCollection[]> {
    return MOCKUP_JOB_COLLECTIONS
}