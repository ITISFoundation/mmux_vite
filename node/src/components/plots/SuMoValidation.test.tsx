import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuMoValidation from "./SuMoValidation";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "function-1" },
  inputVars: ["alpha"],
  distribution: "uniform",
  selectedQoI: "result",
  fetchedJobCollections: [{ uid: "collection-1" }],
  filteredJobList: [] as unknown[],
}));

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: mocks.selectedFunction,
    inputVars: mocks.inputVars,
    distribution: mocks.distribution,
  }),
}));
vi.mock("../../context/MMUXContext", () => ({ useMMUXContext: () => ({ selectedQoI: mocks.selectedQoI }) }));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ fetchedJobCollections: mocks.fetchedJobCollections, filteredJobList: mocks.filteredJobList }),
}));
vi.mock("react-plotly.js", () => ({ default: () => <div>Plot output</div> }));
vi.mock("./Metric", () => ({ default: ({ metricName }: { metricName: string }) => <span>{metricName}</span> }));
vi.mock("./MetricRow", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("./CalculatingWarning", () => ({ default: () => <div>Calculating</div> }));
vi.mock("./InsufficientDataWarning", () => ({ default: () => <div>Insufficient data</div> }));

const jobs = Array.from({ length: 5 }, (_, index) => ({ uid: `job-${index}` }));

describe("SuMoValidation", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.filteredJobList = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
      },
    );
  });

  it("shows insufficient data without calling the backend", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<SuMoValidation />);

    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recovers from a validation backend failure", async () => {
    mocks.filteredJobList = jobs;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "failed" }) }));
    render(<SuMoValidation />);

    await waitFor(() => expect(screen.getByText("Insufficient data")).toBeInTheDocument());
    expect(screen.queryByText("Plot output")).not.toBeInTheDocument();
  });

  it("renders plot metrics for a valid validation response", async () => {
    mocks.filteredJobList = jobs;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: [1, 2, 3, 4, 5], resultHat: [1, 3, 2, 5, 4] }),
      }),
    );
    render(<SuMoValidation />);

    await waitFor(() => expect(screen.getByText("Plot output")).toBeInTheDocument());
    expect(screen.getAllByText("Mean")).toHaveLength(2);
    expect(screen.getByText("MAE")).toBeInTheDocument();
    expect(screen.getByText("RMSE")).toBeInTheDocument();
  });
});
