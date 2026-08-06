import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InputVariableDist } from "./InputVariableDist";

function getInputBlockField(name: string): HTMLInputElement {
  const container = document.querySelector(`[mmux-testid="input-block-${name}"]`);
  if (!container) throw new Error(`input-block-${name} not found`);
  const input = container.querySelector("input");
  if (!input) throw new Error(`input-block-${name} has no <input>`);
  return input;
}

const setDistribution = vi.fn();
const setDistributionUserModified = vi.fn();
let distributionState: { [key: string]: InputVarSelection } = {};

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: { uid: "fn-1", name: "Test Function" },
    inputVars: ["x1"],
    distribution: distributionState,
    setDistribution,
    distributionUserModified: {},
    setDistributionUserModified,
  }),
}));

vi.mock("../../context/ServiceContext", () => ({
  useServiceContext: () => ({ serviceMode: "UQ", permissions: "WRITE" }),
}));

const filteredJobListState = vi.hoisted(() => ({ jobs: [] as unknown[] }));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ filteredJobList: filteredJobListState.jobs }),
}));

describe("InputVariableDist - distribution form (constant/normal/uniform + linear|log scale, B32/V40)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    filteredJobListState.jobs = [];
    distributionState = { "fn-1": { x1: { distribution: "normal", mean: 0, std: 1, scale: "linear" } } };
  });

  it("offers Constant / Normal / Uniform options and no longer offers LogNormal or Exponential", async () => {
    render(<InputVariableDist />);

    fireEvent.mouseDown(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "Constant" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Normal (Gaussian)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Uniform" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "LogNormal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Exponential" })).not.toBeInTheDocument();
  });

  it("renders Mean / Std inputs (not the stale Log Mean / Log Std fields) when normal is selected", async () => {
    render(<InputVariableDist />);

    expect(getInputBlockField("Mean")).toHaveValue(0);
    expect(getInputBlockField("Standard Deviation")).toHaveValue(1);
    expect(document.querySelector('[mmux-testid="input-block-Log Mean"]')).not.toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="input-block-Log Std"]')).not.toBeInTheDocument();
  });

  it("selecting 'Normal (Gaussian)' from the dropdown switches the variable's distribution to normal and marks it user-modified", async () => {
    distributionState = { "fn-1": { x1: { distribution: "uniform", min: 0, max: 1, scale: "linear" } } };
    render(<InputVariableDist />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const normalOption = await screen.findByRole("option", { name: "Normal (Gaussian)" });
    fireEvent.click(normalOption);

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({ x1: expect.objectContaining({ distribution: "normal" }) }),
        }),
      ),
    );
    expect(setDistributionUserModified).toHaveBeenCalled();
  });

  it("updating Mean persists to FunctionContext", async () => {
    distributionState = { "fn-1": { x1: { distribution: "normal", mean: 1, std: 0.5, scale: "linear" } } };
    render(<InputVariableDist />);

    const meanInput = getInputBlockField("Mean");
    fireEvent.change(meanInput, { target: { value: "2" } });
    fireEvent.blur(meanInput);

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({ x1: expect.objectContaining({ mean: 2 }) }),
        }),
      ),
    );
  });
});

// Ten evenly-spread, non-log-shaped values for x1 (mirrors a realistic uploaded-job-collection
// value range): reliably picked as "enough samples" + "uniform"-like shape by the auto-inference
// heuristics, and available to computeDistributionParamsForType for every distribution type.
function makeCompletedJobs(values: number[]): unknown[] {
  return values.map((v, i) => ({ status: "completed", uid: `job-${i}`, inputs: { x1: v }, outputs: {} }));
}

describe("InputVariableDist - manual type switch re-infers defaults from data (fix B27)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    filteredJobListState.jobs = makeCompletedJobs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    distributionState = { "fn-1": { x1: { distribution: "normal", mean: 0, std: 1 } } };
  });

  it("switching to 'Uniform' fills in min/max from job data instead of leaving them empty", async () => {
    render(<InputVariableDist />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const uniformOption = await screen.findByRole("option", { name: "Uniform" });
    fireEvent.click(uniformOption);

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({
            x1: expect.objectContaining({
              distribution: "uniform",
              min: expect.any(Number),
              max: expect.any(Number),
            }),
          }),
        }),
      ),
    );
    const lastCall = setDistribution.mock.calls[setDistribution.mock.calls.length - 1][0];
    expect(Number.isNaN(lastCall["fn-1"].x1.min)).toBe(false);
    expect(Number.isNaN(lastCall["fn-1"].x1.max)).toBe(false);
  });

  it("switching to 'Constant' fills in value from job data instead of leaving it empty", async () => {
    render(<InputVariableDist />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const constantOption = await screen.findByRole("option", { name: "Constant" });
    fireEvent.click(constantOption);

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({
            x1: expect.objectContaining({ distribution: "constant", value: expect.any(Number) }),
          }),
        }),
      ),
    );
  });
});

describe("InputVariableDist - per-field refresh button (T25)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    filteredJobListState.jobs = makeCompletedJobs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    distributionState = { "fn-1": { x1: { distribution: "normal", mean: 999, std: 999 } } };
  });

  it("clicking the 'Refresh Mean' button recomputes just that field from job data", async () => {
    render(<InputVariableDist />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh Mean" }));

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({
            x1: expect.objectContaining({ mean: 5.5, std: 999 }),
          }),
        }),
      ),
    );
  });
});

describe("InputVariableDist - refresh-all confirmation dialog (T25)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    filteredJobListState.jobs = makeCompletedJobs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    distributionState = { "fn-1": { x1: { distribution: "normal", mean: 999, std: 999 } } };
  });

  it("clicking the top-level refresh button opens a confirmation dialog warning about ALL variables", async () => {
    render(<InputVariableDist />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh all parameter distributions" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/ALL/);
    expect(setDistribution).not.toHaveBeenCalled();
  });

  it("cancelling the dialog does not change any distributions", async () => {
    render(<InputVariableDist />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh all parameter distributions" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(setDistribution).not.toHaveBeenCalled();
  });

  it("confirming the dialog re-infers distributions for all variables from job data", async () => {
    render(<InputVariableDist />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh all parameter distributions" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Refresh all" }));

    await waitFor(() =>
      expect(setDistribution).toHaveBeenCalledWith(
        expect.objectContaining({
          "fn-1": expect.objectContaining({
            x1: expect.objectContaining({ distribution: expect.any(String) }),
          }),
        }),
      ),
    );
    const lastCall = setDistribution.mock.calls[setDistribution.mock.calls.length - 1][0];
    expect(lastCall["fn-1"].x1.mean).not.toBe(999);
  });
});
