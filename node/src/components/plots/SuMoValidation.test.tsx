import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SuMoValidation from "./SuMoValidation";

vi.mock("react-plotly.js", () => ({
  default: () => <div data-testid="plot-stub" />,
}));

const selectedFunction = { uid: "fn-1" };
const inputVars = ["x1"];
const distribution = {};

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction,
    inputVars,
    distribution,
  }),
}));

const filteredJobList = Array.from({ length: 5 }, (_, i) => ({ uid: `job-${i}` }));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    fetchedJobCollections: [],
    filteredJobList,
  }),
}));

vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ validationQoI: "y" }),
}));

describe("SuMoValidation", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("V30ab renders CV metrics from the fixed {observed,predicted} response contract", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ observed: [1, 2, 3], predicted: [1.1, 1.9, 3.2] }),
      }),
    );

    render(<SuMoValidation />);

    // observed=[1,2,3], predicted=[1.1,1.9,3.2] -> MAE = mean(|diffs|) = 0.1333
    await waitFor(() => expect(screen.getByText("0.1333")).toBeDefined());
    expect(screen.getByTestId("plot-stub")).toBeDefined();
  });
});
