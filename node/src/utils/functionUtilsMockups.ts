import {
  Function as OsparcFunction,
  FunctionJob,
  FunctionJobCollection,
  JSONFunctionInputSchema,
  JSONFunctionOutputSchema,
  SolverFunction,
  SolverFunctionJob,
} from "osparc-api-ts-client";

const mockupFunctions: OsparcFunction[] = [new SolverFunction()];
mockupFunctions[0].title = "Mockup Function";
mockupFunctions[0].description = "A simple mockup Function for FrontEnd development & testing";
mockupFunctions[0].uid = "asdfasdfasdf";
mockupFunctions[0].inputSchema = new JSONFunctionInputSchema();
mockupFunctions[0].inputSchema.schemaContent = {
  type: "object",
  properties: {
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["x", "y"],
};
mockupFunctions[0].outputSchema = new JSONFunctionOutputSchema();
mockupFunctions[0].outputSchema.schemaContent = {
  type: "object",
  properties: { result: { type: "number" } },
  required: ["result"],
};

/// //////////////////////////////

function jobGenerator(fun: OsparcFunction, uuid: string): FunctionJob {
  const j = new SolverFunctionJob();
  j.functionUid = fun.uid;
  j.inputs = { x: 0.0, y: 0.0 };
  j.outputs = { result: 0.0 };
  j.solverJobId = uuid;
  j.uid = uuid; // TODO diff types of jobs have different UID fields?? problematic
  j.status = "COMPLETED";
  return j;
}
const mockupJobs: FunctionJob[] = [
  jobGenerator(mockupFunctions[0], "aaa"),
  jobGenerator(mockupFunctions[0], "bbb"),
  jobGenerator(mockupFunctions[0], "ccc"),
  jobGenerator(mockupFunctions[0], "ddd"),
];

/// //////////////////////////////

const mockupJobCollections: FunctionJobCollection[] = [new FunctionJobCollection()]; // TODO fill up the first JobCOllection w the MOCKUP_JOBS
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

export async function listFunctions(): Promise<OsparcFunction[]> {
  return mockupFunctions;
}

export async function listJobs(): Promise<FunctionJob[]> {
  return mockupJobs;
}

export async function getFunctionJob(jobUid: string): Promise<FunctionJob> {
  // get the MOCKUP_JOB with the right UID
  const j = mockupJobs.find(k => k.uid === jobUid);
  if (!j) {
    // console.debug("Job with ID " + jobUid + " not found");
    return mockupJobs[0];
  }
  return j;
}

export async function getFunctionJobsFromFunctionUid(_functionUid: string): Promise<FunctionJob[]> {
  return mockupJobs;
}

export async function getFunctionJobCollections(_functionUid: string): Promise<FunctionJobCollection[]> {
  return mockupJobCollections;
}
