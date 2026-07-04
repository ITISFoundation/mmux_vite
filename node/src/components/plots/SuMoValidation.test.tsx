import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SuMoValidation from "./SuMoValidation";

// jsdom does not implement ResizeObserver (used for the plot width tracking box).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Plotly does not render meaningfully under jsdom; replace with a lightweight stub that
// still lets us assert on the data/traces passed to it.
vi.mock("react-plotly.js", () => ({
  default: (props: { data: unknown[] }) => <div data-testid="plotly-mock">{JSON.stringify(props.data)}</div>,
}));

// Return stable object/array references from the mocked hooks: SuMoValidation's effects
// depend on `inputVars`/`distribution`, and a fresh literal on every call would change
// identity each render, triggering an infinite fetch → setState → re-render loop.
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
  y: [1, 2, 3, 4, 5],
  yHat: [1.1, 1.9, 3.2, 3.8, 5.1],
};

function mockFetchImplementation(url: string) {
  if (url === "/flask/dakota/sumo_cross_validation") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(cvValidationResponse),
    });
  }
  if (url === "/flask/dakota/get_sumo_cv_accuracy_metrics") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          metrics: { y: { rootMeanSquared: 0.2, sumAbs: 1.0, meanAbs: 0.2, maxAbs: 0.3 } },
          tTest: { statistic: 3.5, pValue: 0.02 },
          convergence: [
            { nSamples: 5, metric: 0.4 },
            { nSamples: 10, metric: 0.2 },
          ],
        }),
    });
  }
  return Promise.reject(new Error(`Unexpected fetch url: ${url}`));
}

describe("SuMoValidation", () => {
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

  it("renders the paired t-test bias banner when significant bias is detected", async () => {
    render(<SuMoValidation />);

    await waitFor(() => {
      expect(screen.getByText(/Statistically significant bias detected/)).toBeInTheDocument();
    });
    expect(screen.getByText(/p=0.020/)).toBeInTheDocument();
  });

  it("renders the convergence curve plot once data is fetched", async () => {
    render(<SuMoValidation />);

    await waitFor(() => {
      const plots = screen.getAllByTestId("plotly-mock");
      expect(plots.some(plot => plot.textContent?.includes("RMSE vs N"))).toBe(true);
    });
  });

  it("shows a no-significant-bias banner when p-value is above the threshold", async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === "/flask/dakota/get_sumo_cv_accuracy_metrics") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              metrics: { y: { rootMeanSquared: 0.2, sumAbs: 1.0, meanAbs: 0.2, maxAbs: 0.3 } },
              tTest: { statistic: 0.4, pValue: 0.42 },
              convergence: [{ nSamples: 5, metric: 0.3 }],
            }),
        });
      }
      return mockFetchImplementation(url);
    }) as unknown as typeof global.fetch;

    render(<SuMoValidation />);

    await waitFor(() => {
      expect(screen.getByText(/No significant bias detected/)).toBeInTheDocument();
    });
  });
});
