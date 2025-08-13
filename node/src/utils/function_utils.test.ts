import { describe, it, expect, vi } from "vitest";

// import the functions to be tested
import {
  createInputOutputSchema,
  createJobStudyCopy,
  getHealth,
  getPermissions,
  getServiceMode,
  listFunctions,
  listJobs,
  getFunctionJob,
  getFunctionJobsFromFunctionUid,
  getFunctionJobCollections,
  getFunctionJobsFromFunctionJobCollection,
  getSimplifiedHost,
  getDeploymentUrl,
  openStudyUid,
} from "./function_utils";
import { FunctionJob } from "../osparc-api-ts-client";

describe("Function Utils", () => {

  vi.mock("./fetch_retry.ts", () => {
      return {
        fetchWithRetry: (path: string) => {
          const mockJobs: FunctionJob[] = [
            {
              uid: "job1",
              functionUid: "func1",
              inputs: {},
              outputs: {},
              solverJobId: "solver1",
              status: "COMPLETED",
            },
            {
              uid: "job2",
              functionUid: "func2",
              inputs: {},
              outputs: {},
              solverJobId: "solver2",
              status: "PENDING",
            },
          ];
          const mockJob: FunctionJob = {
            uid: "job1",
            functionUid: "func1",
            inputs: {},
            outputs: {},
            solverJobId: "solver1",
            status: "COMPLETED",
          };
          let response: unknown;
          if(path.includes("list_jobs")) {
            response = mockJobs;
          } else if (path.includes("get_function_job")) {
            response = mockJob;
          }

          return Promise.resolve({
            json: () => Promise.resolve(response),
          });
        },
      };
    });


  it("should create an input-output schema", () => {
    const vars = ["x", "y"];
    const schema = createInputOutputSchema(vars);
    expect(schema).toEqual({
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
      },
      required: vars,
    });
  });

  it("should get health status", async () => {
    const mockResponse = { status: 200 };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: mockResponse.status,
      })
    ) as unknown as typeof fetch;

    const status = await getHealth();
    expect(status).toBe(200);
  });

  it("should get permissions", async () => {
    const mockResponse = { permissions: "read,write" };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as unknown as typeof fetch;

    const permissions = await getPermissions();
    expect(permissions).toBe(mockResponse.permissions);
  });

  it("should get service mode", async () => {
    const mockResponse = { service_mode: "production" };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as unknown as typeof fetch;

    const serviceMode = await getServiceMode();
    expect(serviceMode).toBe(mockResponse.service_mode);
  });

  it("should list functions", async () => {
    const mockFunctions = [{ uid: "func1" }, { uid: "func2" }];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockFunctions),
      })
    ) as unknown as typeof fetch;

    const functions = await listFunctions();
    expect(functions).toEqual(mockFunctions);
  });

  it("should list all jobs", async () => {
    const mockJobs: FunctionJob[] = [
      {
        uid: "job1",
        functionUid: "func1",
        inputs: {},
        outputs: {},
        solverJobId: "solver1",
        status: "COMPLETED",
      },
      {
        uid: "job2",
        functionUid: "func2",
        inputs: {},
        outputs: {},
        solverJobId: "solver2",
        status: "PENDING",
      },
    ];

    const jobs = await listJobs();
    expect(jobs).toEqual(mockJobs);
  });

  it("should get a function job by UID", async () => {
    const mockJob: FunctionJob = {
      uid: "job1",
      functionUid: "func1",
      inputs: {},
      outputs: {},
      solverJobId: "solver1",
      status: "COMPLETED",
    };

    const job = await getFunctionJob("job1");
    expect(job).toEqual(mockJob);
  });

  it("should get function jobs from function UID", async () => {
    const mockJobs = [{ uid: "job1" }, { uid: "job2" }];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockJobs),
      })
    ) as unknown as typeof fetch;

    const jobs = await getFunctionJobsFromFunctionUid("func1");
    expect(jobs).toEqual(mockJobs);
  });

  it("should get function job collections", async () => {
    const mockCollections = [{ uid: "collection1" }, { uid: "collection2" }];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCollections),
      })
    ) as unknown as typeof fetch;

    const collections = await getFunctionJobCollections("func1");
    expect(collections).toEqual(mockCollections);
  });

  it("should get function jobs from a job collection", async () => {
    const mockJobs = [{ uid: "job1" }, { uid: "job2" }];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockJobs),
      })
    ) as unknown as typeof fetch;

    const jobs = await getFunctionJobsFromFunctionJobCollection("collection1");
    expect(jobs).toEqual(mockJobs);
  });
});
