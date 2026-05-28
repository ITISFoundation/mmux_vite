import { describe, expect, it, vi } from "vitest";
import { FunctionJob, ProjectFunctionJob } from "../osparc-api-ts-client";
import {
  camelToSnakeCase,
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
  normalizePayloadToCamelCase,
  toBackendVarNames,
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

vi.mock("./fetchRetry.ts", () => ({
  fetchWithRetry: (path: string) => {
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

    return Promise.resolve({
      json: () => Promise.resolve(response),
    });
  },
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

  it("should get function job collections", async () => {
    const collections = await getFunctionJobCollections("func1");
    expect(collections).toEqual(mockCollections);
  });

  it("should get function jobs from a job collection", async () => {
    const jobs = await getFunctionJobsFromFunctionJobCollection("collection1");
    expect(jobs).toEqual(sampleJobs);
  });
});

describe("camelToSnakeCase", () => {
  it("converts camelCase to snake_case", () => {
    expect(camelToSnakeCase("angleWidth")).toBe("angle_width");
    expect(camelToSnakeCase("peakAveragedField")).toBe("peak_averaged_field");
    expect(camelToSnakeCase("tissueConduc")).toBe("tissue_conduc");
  });

  it("leaves already-snake_case strings unchanged", () => {
    expect(camelToSnakeCase("angle_width")).toBe("angle_width");
    expect(camelToSnakeCase("simple")).toBe("simple");
  });

  it("converts mixed-case variable names correctly", () => {
    expect(camelToSnakeCase("someField")).toBe("some_field");
    // Consecutive uppercase letters: only the transition from lower→upper inserts _
    expect(camelToSnakeCase("myHTMLParser")).toBe("my_htmlparser");
  });
});

describe("toBackendVarNames", () => {
  it("converts an array of camelCase names to snake_case", () => {
    expect(toBackendVarNames(["angleWidth", "peakField", "tissueConduc"])).toEqual([
      "angle_width",
      "peak_field",
      "tissue_conduc",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(toBackendVarNames([])).toEqual([]);
  });
});

describe("normalizePayloadToCamelCase", () => {
  it("converts top-level snake_case keys to camelCase", () => {
    const payload = { some_field: 1, another_key: "hello" };
    expect(normalizePayloadToCamelCase(payload)).toEqual({ someField: 1, anotherKey: "hello" });
  });

  it("converts nested regular keys to camelCase", () => {
    const payload = { user_info: { email_address: "a@b.com" } };
    expect(normalizePayloadToCamelCase(payload)).toEqual({ userInfo: { emailAddress: "a@b.com" } });
  });

  it("preserves variable-name keys under 'inputs' subtree (V13)", () => {
    const payload = { inputs: { angleWidth: 1.0, peak_Averaged_Field: 2.0 } };
    const result = normalizePayloadToCamelCase<{ inputs: Record<string, number> }>(payload);
    // 'inputs' itself is converted to camelCase (it is already)
    expect(result.inputs).toEqual({ angleWidth: 1.0, peak_Averaged_Field: 2.0 });
  });

  it("preserves variable-name keys under 'outputs' subtree (V13)", () => {
    const payload = { outputs: { dragForce: 42.0, lift_coefficient: 3.14 } };
    const result = normalizePayloadToCamelCase<{ outputs: Record<string, number> }>(payload);
    expect(result.outputs).toEqual({ dragForce: 42.0, lift_coefficient: 3.14 });
  });

  it("preserves variable-name keys under 'properties' subtree (V13)", () => {
    const payload = { properties: { myVar: 1, another_var: 2 } };
    const result = normalizePayloadToCamelCase<{ properties: Record<string, number> }>(payload);
    expect(result.properties).toEqual({ myVar: 1, another_var: 2 });
  });

  it("preserves variable-name keys under 'default_inputs' subtree (V13)", () => {
    const payload = { default_inputs: { angleWidth: 0.5 } };
    const result = normalizePayloadToCamelCase<{ defaultInputs: Record<string, number> }>(payload);
    expect(result.defaultInputs).toEqual({ angleWidth: 0.5 });
  });

  it("preserves variable-name keys under predictions but converts their nested values (V13)", () => {
    const payload = {
      predictions: {
        angleWidth: { some_field: [1.0, 2.0] },
        peakField: { other_value: [3.0] },
      },
    };
    const result = normalizePayloadToCamelCase<{ predictions: Record<string, Record<string, number[]>> }>(payload);
    // Variable-name keys preserved
    expect(Object.keys(result.predictions)).toEqual(["angleWidth", "peakField"]);
    // Nested field-level keys still converted
    expect(result.predictions.angleWidth).toHaveProperty("someField");
    expect(result.predictions.peakField).toHaveProperty("otherValue");
  });

  it("converts array items recursively", () => {
    const payload = [{ some_field: 1 }, { other_key: 2 }];
    expect(normalizePayloadToCamelCase(payload)).toEqual([{ someField: 1 }, { otherKey: 2 }]);
  });

  it("returns primitives unchanged", () => {
    expect(normalizePayloadToCamelCase(42)).toBe(42);
    expect(normalizePayloadToCamelCase("hello")).toBe("hello");
    expect(normalizePayloadToCamelCase(null)).toBeNull();
  });
});
