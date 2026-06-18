import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import { JSX } from "react/jsx-runtime";
import { RegisteredFunctionJobCollection, FunctionJob } from "osparc-api-ts-client";
import type { Function as OsparcFunction } from "osparc-api-ts-client";
import { FunctionContextType } from "../context/FunctionContext";
import { JobContextType } from "../context/JobContext";

// import the functions to be tested
import { pickCsv, readCsvData } from "./csvUtils";
import { fetchWithRetry } from "./fetchRetry";
import { getSamplingEndValue, getSamplingStartValue } from "./sampling";
import { stepValidator } from "./stepValidator";

// 1st test: get the file with a given path
describe("CSV Functions", () => {
  it("should pick the specified columns from a CSV string", async () => {
    const spy = vi
      .spyOn(fs.promises, "readFile")
      .mockImplementation(_path => Promise.resolve("name,age,city\nAlice,30,New York\nBob,25,Los Angeles"));
    const result: File = await pickCsv("path/to/file.csv");
    const data = await readCsvData(result);
    expect(spy).toHaveBeenCalled();
    expect(data).toBeDefined();
    expect(data).toEqual({
      headers: ["name", "age", "city"],
      rows: [
        ["Alice", "30", "New York"],
        ["Bob", "25", "Los Angeles"],
      ],
    });
  });
});

describe("fetchWithRetry", () => {
  it("should retry fetching data with exponential backoff", async () => {
    const mockResponse = { data: "test data", response: 200 };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result: Response = await fetchWithRetry("https://example.com/api", {}, 3, 100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      json: expect.any(Function),
    });
  });

  it("should throw an error after all retries fail", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("Network error")));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchWithRetry("https://example.com/api", {}, 3, 100)).rejects.toThrow(
      "fetchWithRetry: All retries failed and no error was captured.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("Sampling Functions", () => {
  it("should get the sampling start value", () => {
    const inputVar = "X";
    const distribution: InputVarSelection = { X: { distribution: "uniform", min: -10, max: 10 } };

    let startValue: number | string | undefined = getSamplingStartValue(inputVar, distribution);
    expect(startValue).toBeDefined();
    expect(typeof startValue).toBe("number");
    expect(startValue).toBe(-10);

    distribution.X.distribution = "constant";
    distribution.X.value = 5;
    startValue = getSamplingStartValue(inputVar, distribution);
    expect(startValue).toBeDefined();
    expect(typeof startValue).toBe("number");
    expect(startValue).toBe(5);

    distribution.X.distribution = "normal";
    distribution.X.mean = 5;
    distribution.X.std = 2;
    startValue = getSamplingStartValue(inputVar, distribution);
    expect(startValue).toBeDefined();
    expect(typeof startValue).toBe("number");
    expect(startValue).toBeLessThanOrEqual(0); // mean - 2.5 * std

    distribution.X.distribution = "log-normal";
    startValue = getSamplingStartValue(inputVar, distribution);
    expect(startValue).toBeDefined();
    expect(typeof startValue).toBe("string");
    expect(startValue).toBe("Error. Please contact support");

    distribution.X.distribution = "exponential";
    startValue = getSamplingStartValue(inputVar, distribution);
    expect(startValue).toBeDefined();
    expect(typeof startValue).toBe("number");
    expect(startValue).toBe(0);
  });

  it("should get the sampling end value", () => {
    const inputVar = "X";
    const distribution: InputVarSelection = { X: { distribution: "uniform", min: -10, max: 10 } };

    let endValue: number | string | undefined = getSamplingEndValue(inputVar, distribution);
    expect(endValue).toBeDefined();
    expect(typeof endValue).toBe("number");
    expect(endValue).toBe(10);

    distribution.X.distribution = "constant";
    distribution.X.value = 5;
    endValue = getSamplingEndValue(inputVar, distribution);
    expect(endValue).toBeDefined();
    expect(typeof endValue).toBe("number");
    expect(endValue).toBe(5);

    distribution.X.distribution = "normal";
    distribution.X.mean = 5;
    distribution.X.std = 2;
    endValue = getSamplingEndValue(inputVar, distribution);
    expect(endValue).toBeDefined();
    expect(typeof endValue).toBe("number");
    expect(endValue).toBeLessThanOrEqual(10); // mean + 2.5 * std

    distribution.X.distribution = "log-normal";
    endValue = getSamplingEndValue(inputVar, distribution);
    expect(endValue).toBeDefined();
    expect(typeof endValue).toBe("string");
    expect(endValue).toBe("Error. Please contact support");

    distribution.X.distribution = "exponential";
    endValue = getSamplingEndValue(inputVar, distribution);
    expect(endValue).toBeDefined();
    expect(typeof endValue).toBe("string");
    expect(endValue).toBe("Error. Please contact support");
  });
});

describe("stepValidator", () => {
  it("should validate steps correctly", () => {
    const functionContext: FunctionContextType = {
      selectedFunction: {
        uid: "func1",
        inputSchema: {},
        outputSchema: {},
        defaultInputs: {},
        solverKey: "mockSolverKey",
        solverVersion: "1.0.0",
      },
      distribution: {
        func1: {
          x: { distribution: "uniform", min: 0, max: 10 },
          y: { distribution: "normal", mean: 5, std: 2 },
        },
      },
      outputTargets: {},
      setSelectedFunction: (_F: OsparcFunction | undefined): void => {
        throw new Error("Function not implemented.");
      },
      inputVars: [],
      setInputVars: (_vars: string[]): void => {
        throw new Error("Function not implemented.");
      },
      outputVars: [],
      setOutputVars: (_vars: string[]): void => {
        throw new Error("Function not implemented.");
      },
      setDistribution: (_d: { [key: string]: InputVarSelection }): void => {
        throw new Error("Function not implemented.");
      },
      setOutputTargets(_d: { [key: string]: OutputVarSelection }): void {
        throw new Error("Function not implemented.");
      },
    };

    const jobContext: JobContextType = {
      selectedJobUids: ["job1", "job2"],
      runningJobCollection: undefined,
      setRunningJobCollection: (_jc: RegisteredFunctionJobCollection | undefined): void => {
        throw new Error("Function not implemented.");
      },
      fetchedJobCollections: [],
      setFetchedJobCollections: (_jc: SelectedJobCollection[] | undefined): void => {
        throw new Error("Function not implemented.");
      },
      setSelectedJobUids: (_selectedJobs: string[]): void => {
        throw new Error("Function not implemented.");
      },
      allJobsList: (): FunctionJob[] => {
        throw new Error("Function not implemented.");
      },
      filteredJobList: [],
      requestForceFetch: (): void => {
        throw new Error("Function not implemented.");
      },
      parseStatus: (_jobStatus: string, _outputArray: Record<string, unknown>): string | JSX.Element[] => {
        throw new Error("Function not implemented.");
      },
    };

    expect(stepValidator(functionContext, jobContext, "", 0)).toBe(true);
    expect(stepValidator(functionContext, jobContext, "", 1)).toBe(true);
    expect(stepValidator(functionContext, jobContext, "", 2)).toBe(true);
    expect(stepValidator(functionContext, jobContext, "MOGA", 0)).toBe(false);
    expect(stepValidator(functionContext, jobContext, "MOGA", 1)).toBe(true);
    expect(stepValidator(functionContext, jobContext, "MOGA", 2)).toBe(true);
    functionContext.distribution = {};
    jobContext.selectedJobUids = [];
    expect(stepValidator(undefined, jobContext, "", 0)).toBe(false);
    expect(stepValidator(undefined, jobContext, "MOGA", 0)).toBe(false);
    expect(stepValidator(functionContext, jobContext, "", 0)).toBe(false);
    expect(stepValidator(functionContext, jobContext, "", 1)).toBe(false);
  });
});
