import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import UQStatsModal from "./UQStatsModal";

vi.mock("../../context/FunctionContext", () => {
  const functionContextValue = {
    selectedFunction: { uid: "fn-1", title: "Test Function" },
    inputVars: ["x1"],
    distribution: { "fn-1": {} },
  };
  return { useFunctionContext: () => functionContextValue };
});

vi.mock("../../context/MMUXContext", () => {
  const mmuxContextValue = { selectedQoI: "y", numSamples: { "fn-1": 1000 } };
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

const uqStatsResponse = {
  mean: 4,
  std: 2.5,
  min: 0,
  max: 8,
  p1: 0.1,
  p5: 0.5,
  q1: 2,
  median: 4,
  q3: 6,
  p95: 7.5,
  p99: 7.9,
};

function mockFetchImplementation(url: string) {
  if (url === "/flask/dakota/manual_uq_propagation_with_uncertainty") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(uqStatsResponse),
    });
  }
  return Promise.reject(new Error(`Unexpected fetch url: ${url}`));
}

describe("UQStatsModal", () => {
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

  it("fetches and renders percentile stat cards when open", async () => {
    render(<UQStatsModal open setOpen={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Median")).toBeInTheDocument();
    });
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("P99")).toBeInTheDocument();
    expect(screen.getByText(/Epistemic uncertainty: coming soon/)).toBeInTheDocument();
    expect(screen.getByText(/Aleatoric uncertainty: coming soon/)).toBeInTheDocument();
  });
});
