import { describe, expect, it, vi } from "vitest";
import { ProjectFunctionJob } from "osparc-api-ts-client";
import { OsparcFunctionJob } from "../context/types";
import { fetchWithRetry } from "./fetchRetry";
import {
  createInputOutputSchema,
  createJobStudyCopy,
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

const mockJobs: OsparcFunctionJob[] = [
  {
    uid: "job1",
    functionUid: "func1",
    inputs: {},
    outputs: {},
    status: "COMPLETED",
  },
  {
    uid: "job2",
    functionUid: "func2",
    inputs: {},
    outputs: {},
    status: "PENDING",
  },
];

const mockFunctions = [{ uid: "func1" }, { uid: "func2" }];
const sampleJobs = [{ uid: "job1" }, { uid: "job2" }];
const mockCollections = [{ uid: "collection1" }, { uid: "collection2" }];

vi.mock("./fetchRetry.ts", () => ({
  fetchWithRetry: vi.fn((path: string) => {
    let response: unknown;
    if (path.includes("list_jobs")) {
      response = mockJobs;
    } else if (path.includes("get_function_job")) {
      [response] = mockJobs;
    } else if (path.includes("list_functions")) {
      response = [{ uid: "func1" }, { uid: "func2" }];
    } else if (path.includes("list_function_jobs_for_jobcollectionid")) {
      response = sampleJobs;
    } else if (path.includes("list_function_job_collections")) {
      response = mockCollections;
    } else {
      response = "not mocked";
    }

    return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
  }),
}));

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
    // Cast: the fixture carries app-side fields (uid/status) that the raw generated
    // ProjectFunctionJob type does not declare; this is test data, not API output.
    const job = {
      uid: "job1",
      functionUid: "func1",
      inputs: { x: 1, y: 2 },
      outputs: { z: 3 },
      title: "Test Job",
      description: "This is a test job",
      functionClass: undefined,
      projectJobId: "proj1",
      status: "COMPLETED",
    } as unknown as ProjectFunctionJob;
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
      vi.fn(() => Promise.resolve(new Response("{}", { status: 400 }))),
    );
    const copy2 = await createJobStudyCopy("testJob", {} as ProjectFunctionJob);
    expect(copy2).toBeInstanceOf(Error);
    expect((copy2 as Error).message).toBe("Error creating Job Copy for inspection");
    expect((copy2 as Error).cause).toMatchObject({ kind: "http", status: 400 });
    vi.mocked(console.error).mockClear();
  });

  it("should get health status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ status: "healthy" }), { status: 200 }))),
    );

    const status = await getHealth();
    expect(status).toBe(200);
  });

  it("reports an unhealthy backend's status and rethrows network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("starting", { status: 503 }))),
    );
    expect(await getHealth()).toBe(503);

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    await expect(getHealth()).rejects.toMatchObject({ kind: "network" });
  });

  it("should get permissions", async () => {
    const mockResponse = { permissions: "read,write" };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      ),
    );

    const permissions = await getPermissions();
    expect(permissions).toBe(mockResponse.permissions);
  });

  it("should reject when permissions response is not OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 503 }))),
    );

    await expect(getPermissions()).rejects.toMatchObject({ kind: "http", status: 503 });
  });

  it("should get service mode", async () => {
    const mockResponse = { service_mode: "production" };
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      ),
    );

    const serviceMode = await getServiceMode();
    expect(serviceMode).toBe(mockResponse.service_mode);
  });

  it("should reject when service mode response is not OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 503 }))),
    );

    await expect(getServiceMode()).rejects.toMatchObject({ kind: "http", status: 503 });
  });

  it("should list functions", async () => {
    const functions = await listFunctions();
    expect(functions).toEqual(mockFunctions);
  });

  it("should list all jobs", async () => {
    const jobs = await listJobs();
    expect(jobs).toEqual(mockJobs);
  });

  it("should get function jobs from function UID", async () => {
    const mockJobData = [{ uid: "job1" }, { uid: "job2" }];
    vi.mocked(fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJobData),
    } as Response);

    const jobs = await getFunctionJobsFromFunctionUid("func1");
    expect(jobs).toEqual(mockJobData);
  });

  it("should retry function-job lookup failures", async () => {
    const error = new Error("temporary failure");
    vi.mocked(fetchWithRetry).mockRejectedValueOnce(error);

    await expect(getFunctionJobsFromFunctionUid("func1")).rejects.toThrow("temporary failure");
    expect(fetchWithRetry).toHaveBeenCalledWith(
      "/flask/osparc/list_function_jobs_for_functionid?functionUid=func1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should get function job collections", async () => {
    const collections = await getFunctionJobCollections("func1");
    expect(collections).toEqual(mockCollections);
  });

  it("should get function jobs from a job collection", async () => {
    const jobs = await getFunctionJobsFromFunctionJobCollection("collection1");
    expect(jobs).toEqual(sampleJobs);
  });

  it.each([
    ["listFunctions", () => listFunctions()],
    ["listJobs", () => listJobs()],
    ["getFunctionJobCollections", () => getFunctionJobCollections("func1")],
    ["getFunctionJobsFromFunctionJobCollection", () => getFunctionJobsFromFunctionJobCollection("jc1")],
  ])("%s rejects a failed response instead of returning its error body as data", async (_name, call) => {
    vi.mocked(fetchWithRetry).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "oSPARC unreachable" }), { status: 503 }),
    );
    await expect(call()).rejects.toMatchObject({ kind: "http", status: 503 });
  });

  it("should upload a job-collection CSV and normalize the response to camelCase (§T6)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              target_function_uid: "func-new",
              imported_samples: 3,
              job_collection: { uid: "jc-new" },
            }),
        }),
      ),
    );

    const result = await uploadJobCollectionCsv({ csvContent: "csv-body", targetMode: "new" });
    expect(result).toEqual({
      targetFunctionUid: "func-new",
      importedSamples: 3,
      jobCollection: { uid: "jc-new" },
    });
  });

  it("should throw with the server error message when upload fails (§T6)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: "Incompatible function schema" }), { status: 400 }))),
    );

    await expect(uploadJobCollectionCsv({ csvContent: "csv-body", targetMode: "new" })).rejects.toThrow(
      "Incompatible function schema",
    );
    vi.mocked(console.error).mockClear();
  });

  it("falls back to a generic message when a failed upload has no error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("<html>502</html>", { status: 502 }))),
    );

    await expect(uploadJobCollectionCsv({ csvContent: "csv-body", targetMode: "new" })).rejects.toThrow(
      "Failed to upload JobCollection CSV",
    );
  });

  it("preserves snake_case variable identifiers in schema properties/defaultInputs (B18, V24)", async () => {
    // Regression for the "Tissue Conductivity Uncertainty" oSPARC function
    // (UID ddfc5b42-...): variable names like "sigma_blood" were being
    // camelCased to "sigmaBlood" inside `properties`/`defaultInputs`, while
    // the sibling `required` string array (untouched by key-casing) kept
    // "sigma_blood" — the mismatch that broke every downstream inference
    // request (validation/1D-2D-3D plots/UQ propagation) with 400s.
    const rawFunction = {
      uid: "func-uq-nerve",
      title: "Tissue Conductivity Uncertainty",
      default_inputs: { sigma_blood: 0.7, sigma_conn: 0.35 },
      input_schema: {
        schema_content: {
          type: "object",
          properties: {
            sigma_blood: { type: "number" },
            sigma_conn: { type: "number" },
          },
          required: ["sigma_blood", "sigma_conn"],
        },
      },
    };
    vi.mocked(fetchWithRetry).mockResolvedValueOnce(new Response(JSON.stringify([rawFunction]), { status: 200 }));

    const [fun] = await listFunctions();

    expect(Object.keys(fun.inputSchema.schemaContent!.properties)).toEqual(fun.inputSchema.schemaContent!.required);
    expect(fun.defaultInputs).toEqual(rawFunction.default_inputs);
  });
});
