/* eslint-disable @typescript-eslint/naming-convention */
import { render, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";

const persistedFunction = {
  uid: "local-func-persisted",
  title: "Persisted Function",
  description: "Uploaded function",
  inputSchema: {
    schemaContent: {
      properties: {
        conductivity: { type: "number" },
      },
    },
  },
  outputSchema: {
    schemaContent: {
      properties: {
        score: { type: "number" },
      },
    },
  },
};

const setSelectedFunction = vi.fn();
const setInputVars = vi.fn();
const setOutputVars = vi.fn();
const setDistribution = vi.fn();
const reconcileFunctions = vi.fn();
const clearSampling = vi.fn();
const setLhsSamplingConfig = vi.fn();
const setGridSamplingConfig = vi.fn();
const setSingleJobConfig = vi.fn();
const setSelectedJobUids = vi.fn();
const setFetchedJobCollections = vi.fn();

vi.mock("../../utils/functionUtils", () => ({
  listFunctions: vi.fn(async () => [persistedFunction]),
  getFunctionJobCollections: vi.fn(async () => []),
}));

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: persistedFunction,
    setSelectedFunction,
    inputVars: ["conductivity"],
    setInputVars,
    outputVars: ["score"],
    setOutputVars,
    distribution: {},
    setDistribution,
    reconcileFunctions,
  }),
}));

vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    setLhsSamplingConfig,
    setGridSamplingConfig,
    setSingleJobConfig,
    clearSampling,
  }),
}));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    setSelectedJobUids,
    setFetchedJobCollections,
  }),
}));

vi.mock("../data/UploadJobCollectionButton", () => ({
  default: () => <button type="button">Upload Data</button>,
}));

describe("FunctionList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not clear the persisted function before rows finish loading", async () => {
    render(<FunctionList />);

    await waitFor(() => {
      expect(reconcileFunctions).toHaveBeenCalledWith([persistedFunction]);
      expect(setSelectedFunction).not.toHaveBeenCalledWith(undefined);
    });
  });
});
