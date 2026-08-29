import {
  RegisteredSolverFunction,
  RegisteredFunctionJobCollection,
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
} from "osparc-api-ts-client";
import { RegisteredFunction, OsparcFunctionJob } from "../context/types";

// Mockups model *registered* functions because the app only ever handles registered
// functions (they carry `uid`). The bare generated `SolverFunction` has no `uid`.
const mockupFunctions: RegisteredFunction[] = [{} as RegisteredSolverFunction];
mockupFunctions[0].title = "Mockup Function";
mockupFunctions[0].description = "A simple mockup Function for FrontEnd development & testing";
mockupFunctions[0].uid = "asdfasdfasdf";
mockupFunctions[0].inputSchema = {} as JSONFunctionInputSchema;
mockupFunctions[0].inputSchema.schemaContent = {
  type: "object",
  properties: {
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["x", "y"],
};
mockupFunctions[0].outputSchema = {} as JSONFunctionOutputSchema;
mockupFunctions[0].outputSchema.schemaContent = {
  type: "object",
  properties: { result: { type: "number" } },
  required: ["result"],
};

/// //////////////////////////////

// Builds the app's normalized job shape directly: the generated job classes
// (Registered*FunctionJob) have NO `status` field — status only exists on the
// `*WithStatus` variants as an object. App code expects status as a plain string
// (see src/context/types.d.ts OsparcFunctionJob), so we construct that shape here.
function jobGenerator(fun: RegisteredFunction, uuid: string): OsparcFunctionJob {
  return {
    functionUid: fun.uid,
    inputs: { x: 0.0, y: 0.0 },
    outputs: { result: 0.0 },
    uid: uuid,
    status: "COMPLETED",
  };
}
const mockupJobs: OsparcFunctionJob[] = [
  jobGenerator(mockupFunctions[0], "aaa"),
  jobGenerator(mockupFunctions[0], "bbb"),
  jobGenerator(mockupFunctions[0], "ccc"),
  jobGenerator(mockupFunctions[0], "ddd"),
];

/// //////////////////////////////

const mockupJobCollections: RegisteredFunctionJobCollection[] = [{} as RegisteredFunctionJobCollection]; // TODO fill up the first JobCOllection w the MOCKUP_JOBS
mockupJobCollections[0].uid = "mockup-job-collection-1";
mockupJobCollections[0].title = "Mockup Job Campaign 1";
mockupJobCollections[0].description = "A simple mockup for a Job Collection of a Solver Function";
mockupJobCollections[0].jobIds = mockupJobs.map(j => j.uid);

export function createInputOutputSchema(vars: string[]) {
  return {
    type: "object",
    properties: vars.reduce(
      (acc, curr) => {
        acc[curr] = { type: "number" };
        return acc;
      },
      {} as Record<string, unknown>,
    ),
    required: vars,
  };
}

export async function listFunctions(): Promise<RegisteredFunction[]> {
  return mockupFunctions;
}

export async function listJobs(): Promise<OsparcFunctionJob[]> {
  return mockupJobs;
}

export async function getFunctionJob(jobUid: string): Promise<OsparcFunctionJob> {
  // get the MOCKUP_JOB with the right UID
  const j = mockupJobs.find(k => k.uid === jobUid);
  if (!j) {
    // console.debug("Job with ID " + jobUid + " not found");
    return mockupJobs[0];
  }
  return j;
}

export async function getFunctionJobsFromFunctionUid(_functionUid: string): Promise<OsparcFunctionJob[]> {
  return mockupJobs;
}

export async function getFunctionJobCollections(_functionUid: string): Promise<RegisteredFunctionJobCollection[]> {
  return mockupJobCollections;
}
