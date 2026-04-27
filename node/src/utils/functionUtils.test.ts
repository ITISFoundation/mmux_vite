import { afterEach, describe, expect, it, vi } from "vitest";
import { FunctionJob, ProjectFunctionJob } from "../osparc-api-ts-client";
import {
  createInputOutputSchema,
  createJobStudyCopy,
  downloadJobCollectionCsv,
  getFunctionJobCollections,
  getFunctionJobsFromFunctionJobCollection,
  getFunctionJobsFromFunctionUid,
  getHealth,
  getPermissions,
  getServiceMode,
  listFunctions,
  listJobs,
  uploadJobCollectionCsv,
} from "./functionUtils";

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

const mockFunctions = [{ uid: "func1" }, { uid: "func2" }];
const sampleJobs = [{ uid: "job1" }, { uid: "job2" }];
const mockCollections = [{ uid: "collection1" }, { uid: "collection2" }];
let fetchRetryListFunctionsResponse: unknown = mockFunctions;
let fetchRetryListJobsResponse: unknown = mockJobs;
let fetchRetryCollectionJobsResponse: unknown = sampleJobs;
let fetchRetryCollectionsResponse: unknown = mockCollections;

vi.mock("./fetchRetry.ts", () => ({
  fetchWithRetry: (path: string) => {
    let response: unknown;
    if (path.includes("list_jobs")) {
      response = fetchRetryListJobsResponse;
    } else if (path.includes("get_function_job")) {
      [response] = mockJobs;
    } else if (path.includes("list_functions")) {
      response = fetchRetryListFunctionsResponse;
    } else if (path.includes("list_function_jobs_for_jobcollectionid")) {
      response = fetchRetryCollectionJobsResponse;
    } else if (path.includes("list_function_job_collections")) {
      response = fetchRetryCollectionsResponse;
    } else if (path.includes("download_job_collection_csv")) {
      response = "# schema_version,2\nsource_job_uid,status\njob-1,SUCCESS\n";
    } else {
      response = "not mocked";
    }

    return Promise.resolve({
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(response),
    });
  },
}));

describe("Function Utils", () => {
  afterEach(() => {
    fetchRetryListFunctionsResponse = mockFunctions;
    fetchRetryListJobsResponse = mockJobs;
    fetchRetryCollectionJobsResponse = sampleJobs;
    fetchRetryCollectionsResponse = mockCollections;
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
    const response: Partial<Response> = {
      status: 200,
      ok: true,
      headers: new Headers(),
      redirected: false,
      json: () =>
        Promise.resolve({
          uid: "jobUID",
          title: "Test Job",
          description: "This is a test job",
        }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(response)),
    );
    const copy = await createJobStudyCopy("testJob", job);
    expect(copy).toBe("jobUID");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: 400,
          json: () => Promise.resolve({}),
        }),
      ),
    );
    const copy2 = await createJobStudyCopy("testJob", {} as ProjectFunctionJob);
    expect(copy2).toEqual(
      new Error("Error creating Job Copy for inspection", {
        cause: new Error("Failed to open job copy: undefined"),
      }),
    );
  });

  it("should get health status", async () => {
    const mockResponse = { status: 200 };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          status: mockResponse.status,
        }),
      ),
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
        }),
      ),
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
        }),
      ),
    );

    const serviceMode = await getServiceMode();
    expect(serviceMode).toBe(mockResponse.service_mode);
  });

  it("should list functions", async () => {
    const functions = await listFunctions();
    expect(functions).toEqual(mockFunctions);
  });

  it("should preserve variable-name keyspaces inside normalized function payloads", async () => {
    fetchRetryListFunctionsResponse = [
      {
        uid: "func-local",
        default_inputs: { pair_1_current: 0.1 },
        input_schema: {
          schema_content: {
            properties: {
              pair_1_current: { type: "number" },
            },
          },
        },
      },
    ];

    const functions = await listFunctions();
    expect(functions[0].defaultInputs).toEqual({ pair_1_current: 0.1 });
    expect(Object.keys(functions[0].inputSchema?.schemaContent?.properties || {})).toEqual(["pair_1_current"]);
  });

  it("should list all jobs", async () => {
    const jobs = await listJobs();
    expect(jobs).toEqual(mockJobs);
  });

  it("should get function jobs from function UID", async () => {
    const mockJobData = [{ uid: "job1" }, { uid: "job2" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockJobData),
        }),
      ),
    );

    const jobs = await getFunctionJobsFromFunctionUid("func1");
    expect(jobs).toEqual(mockJobData);
  });

  it("should preserve variable-name keyspaces inside normalized job payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                uid: "job-local-1",
                inputs: { pair_1_current: 0.1, pair_2_current: 0.2 },
                outputs: { selectivity_mean: 1.5 },
              },
            ]),
        }),
      ),
    );

    const jobs = await getFunctionJobsFromFunctionUid("func-local");
    expect(jobs[0].inputs).toEqual({ pair_1_current: 0.1, pair_2_current: 0.2 });
    expect(jobs[0].outputs).toEqual({ selectivity_mean: 1.5 });
  });

  it("should get function job collections", async () => {
    const collections = await getFunctionJobCollections("func1");
    expect(collections).toEqual(mockCollections);
  });

  it("should get function jobs from a job collection", async () => {
    const jobs = await getFunctionJobsFromFunctionJobCollection("collection1");
    expect(jobs).toEqual(sampleJobs);
  });

  it("should download a job collection CSV", async () => {
    const csv = await downloadJobCollectionCsv("jc-1");
    expect(csv).toContain("schema_version");
    expect(csv).toContain("job-1");
  });

  it("should upload a job collection CSV", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ targetFunctionUid: "func1", importedSamples: 2 }),
        }),
      ),
    );

    const response = await uploadJobCollectionCsv({
      csvContent: "schema_version,source_job_uid\n1,job-1\n",
      targetMode: "existing",
      targetFunctionUid: "func1",
    });
    expect(response.targetFunctionUid).toBe("func1");
    expect(response.importedSamples).toBe(2);
  });

  it("should throw when upload job collection CSV fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: "Bad Request",
          json: () => Promise.resolve({ error: "boom" }),
        }),
      ),
    );

    await expect(
      uploadJobCollectionCsv({
        csvContent: "schema_version,source_job_uid\n1,job-1\n",
        targetMode: "existing",
        targetFunctionUid: "func1",
      }),
    ).rejects.toThrow("boom");
  });
});
