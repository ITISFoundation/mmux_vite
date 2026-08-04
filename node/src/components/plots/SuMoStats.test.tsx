import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SuMoStats from "./SuMoStats";

vi.mock("../../context/FunctionContext", () => {
  const functionContextValue = {
    selectedFunction: { uid: "fn-1", title: "Test Function" },
    inputVars: ["x1"],
    distribution: {},
  };
  return { useFunctionContext: () => functionContextValue };
});

vi.mock("../../context/MMUXContext", () => {
  const mmuxContextValue = { selectedQoI: "y" };
  return { useMMUXContext: () => mmuxContextValue };
});

const jobs = Array.from({ length: 5 }, (_, i) => ({
  uid: `job-${i}`,
  status: "completed",
  inputs: { x1: i },
  outputs: { y: i * 2 },
}));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    fetchedJobCollections: [],
    filteredJobList: jobs,
  }),
}));

const cvValidationResponse = {
  cvResults: {
    y: [1, 2, 3, 4, 5],
    y_hat: [1.1, 1.9, 3.2, 3.8, 5.1],
  },
};

function mockFetchImplementation(url: string) {
  if (url === "/flask/dakota/sumo_cross_validation") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(cvValidationResponse),
    });
  }
  return Promise.reject(new Error(`Unexpected fetch url: ${url}`));
}

describe("SuMoStats", () => {
  let globalFetch: typeof global.fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
    global.fetch = vi.fn(mockFetchImplementation) as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.clearAllMocks();
    cleanup();
  });

  it("renders MAE/RMSE/R\u00B2 stat cards once CV data is fetched", async () => {
    render(<SuMoStats />);

    await waitFor(() => {
      expect(screen.getByText("MAE")).toBeInTheDocument();
    });
    expect(screen.getByText("RMSE")).toBeInTheDocument();
    expect(screen.getByText("R\u00B2")).toBeInTheDocument();
  });
});
