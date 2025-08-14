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
} from "./function_utils";
import { FunctionJob, ProjectFunctionJob } from "../osparc-api-ts-client";
import { title } from "process";

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

vi.mock("./fetch_retry.ts", () => {
  return {
    fetchWithRetry: (path: string) => {
      let response: unknown;
      if (path.includes("list_jobs")) {
        response = mockJobs;
      } else if (path.includes("get_function_job")) {
        response = mockJobs[0];
      }

      return Promise.resolve({
        json: () => Promise.resolve(response),
      });
    },
  };
});

describe("Function Utils", () => {
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

  it("should create a job study copy", async () => {
    const job: ProjectFunctionJob = {
      uid: "job1",
      functionUid: "func1",
      inputs: { x: 1, y: 2 },
      outputs: { z: 3 },
      title: "Test Job",
      description: "This is a test job",
      functionClass: undefined,
      projectJobId: "proj1",
      status: "COMPLETED",
    };
    const response = {
      uid: "jobUID",
      title: "Test Job",
      description: "This is a test job",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(response),
        })
      )
    );
    const copy = await createJobStudyCopy("testJob", job);
    expect(copy).toEqual("jobUID");
  });

  it("should get health status", async () => {
    const mockResponse = { status: 200 };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: mockResponse.status,
        })
      )
    );

    const status = await getHealth();
    expect(status).toBe(200);
  });

  it("should get permissions", async () => {
    const mockResponse = { permissions: "read,write" };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse),
        })
      )
    );

    const permissions = await getPermissions();
    expect(permissions).toBe(mockResponse.permissions);
  });

  it("should get service mode", async () => {
    const mockResponse = { service_mode: "production" };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse),
        })
      )
    );

    const serviceMode = await getServiceMode();
    expect(serviceMode).toBe(mockResponse.service_mode);
  });

  it("should list functions", async () => {
    const mockFunctions = [{ uid: "func1" }, { uid: "func2" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockFunctions),
        })
      )
    );

    const functions = await listFunctions();
    expect(functions).toEqual(mockFunctions);
  });

  it("should list all jobs", async () => {
    const jobs = await listJobs();
    expect(jobs).toEqual(mockJobs);
  });

  it("should get a function job by UID", async () => {
    const job = await getFunctionJob("job1");
    expect(job).toEqual(mockJobs[0]);
  });

  it("should get function jobs from function UID", async () => {
    const mockJobs = [{ uid: "job1" }, { uid: "job2" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockJobs),
        })
      )
    );

    const jobs = await getFunctionJobsFromFunctionUid("func1");
    expect(jobs).toEqual(mockJobs);
  });

  it("should get function job collections", async () => {
    const mockCollections = [{ uid: "collection1" }, { uid: "collection2" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockCollections),
        })
      )
    );

    const collections = await getFunctionJobCollections("func1");
    expect(collections).toEqual(mockCollections);
  });

  it("should get function jobs from a job collection", async () => {
    const mockJobs = [{ uid: "job1" }, { uid: "job2" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockJobs),
        })
      )
    );

    const jobs = await getFunctionJobsFromFunctionJobCollection("collection1");
    expect(jobs).toEqual(mockJobs);
  });
});
