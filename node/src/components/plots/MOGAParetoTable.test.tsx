import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MogaParetoTable from "./MOGAParetoTable";

// jsdom has no ResizeObserver; @mui/x-data-grid measures its viewport with one.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// §B B60px regression: the Performance column had TWO writers — this table's own
// [weights] effect wrote a naive direction-blind raw sum (Σ wᵢ·xᵢ) over the parent's
// normalized `row.performance`, and with the e2e-seeded empty weights the override
// produced a second, timing-dependent render ("-" / "0.00" vs the resolved score).
// The parent MOGAPareto [weights] effect is the single writer; the table must render
// the score it is GIVEN, untouched.

const setWeights = vi.fn();
const setSortModel = vi.fn();

vi.mock("../../context/MOGATableContext", () => ({
  useMOGATableContext: () => ({ weights: {}, setWeights, sortModel: [], setSortModel }),
}));
vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: { uid: "fn-1" } }),
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({ setLaunchingSampling: vi.fn() }),
}));
vi.mock("./PerformanceModal", () => ({ default: () => null }));
vi.mock("../navigation/Header", () => ({ default: () => null }));
vi.mock("../sampling/RunSamplingButton", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RunSamplingButton: () => null,
}));

const tableData: MogaDataType = {
  inputs: ["x1"],
  outputs: ["y"],
  raw: { y: [2, 4] },
  rows: [
    { x1: 1, y: 2, performance: 0.9123, ndi: 0 },
    { x1: 2, y: 4, performance: 0.5, ndi: 1 },
  ],
};

describe("MOGAParetoTable Performance column", () => {
  it("renders the parent-computed score verbatim and never recomputes it (B60px single source)", async () => {
    render(<MogaParetoTable tableData={tableData} hovered={null} setHovered={vi.fn()} />);

    // The given normalized scores reach the grid (toPrecision(2)).
    await expect(screen.findByText("0.91")).resolves.toBeVisible();
    await expect(screen.findByText("0.50")).resolves.toBeVisible();
    // Neither override signature reaches the grid: the "-" NaN placeholder nor
    // the raw-sum result the child used to write with the seeded empty weights.
    expect(screen.queryByText("-")).toBeNull();
    expect(screen.queryByText("0.00")).toBeNull();

    // The table still seeds default weights for fresh output sets (unchanged job).
    await waitFor(() => expect(setWeights).toHaveBeenCalledWith({ y: 0.5 }));
  });
});
