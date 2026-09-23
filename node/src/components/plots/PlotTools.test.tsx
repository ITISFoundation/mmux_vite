import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreateSelect,
  CreateSlider,
  filterInputVars,
  filterOutConstantDistributionVars,
  filterOutConstantDataVars,
  GetUniqueValues,
  OutputSelect,
} from "./PlotTools";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "function-1" },
  inputVars: ["alpha", "beta"],
  distribution: {
    "function-1": {
      alpha: { distribution: "uniform", min: 0, max: 1 },
      beta: { distribution: "constant", value: 2 },
    },
  },
  jobs: [{ inputs: { alpha: 0, beta: 2 } }, { inputs: { alpha: 1, beta: 2 } }],
}));

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: mocks.selectedFunction,
    inputVars: mocks.inputVars,
    distribution: mocks.distribution,
  }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({ allJobsList: () => mocks.jobs }),
}));

describe("PlotTools", () => {
  beforeEach(cleanup);

  it("collects unique numeric input values", () => {
    const context = {
      selectedFunction: mocks.selectedFunction,
      inputVars: mocks.inputVars,
      distribution: mocks.distribution,
      allJobsList: () => mocks.jobs,
    } as unknown as Parameters<typeof GetUniqueValues>[0];
    const values = GetUniqueValues(context);

    expect([...values.alpha]).toEqual([0, 1]);
    expect([...values.beta]).toEqual([2]);
  });

  it("filters constant variables using sampled data and distribution", () => {
    const context = {
      selectedFunction: mocks.selectedFunction,
      inputVars: mocks.inputVars,
      distribution: mocks.distribution,
      allJobsList: () => mocks.jobs,
    } as unknown as Parameters<typeof GetUniqueValues>[0];
    expect(filterOutConstantDataVars(context)).toEqual(["alpha"]);
    expect(filterInputVars(context)).toEqual(["alpha"]);

    const noJobsContext = { ...context, allJobsList: () => [] };
    expect(filterInputVars(noJobsContext)).toEqual(["alpha"]);
    expect(filterOutConstantDistributionVars({ ...context, distribution: {} } as never)).toEqual(["alpha", "beta"]);
  });

  it("updates a slider value through keyboard input", () => {
    const setOtherAxis = vi.fn();
    render(
      <CreateSlider
        dist={{ distribution: "uniform", min: 0, max: 10 } as never}
        input="alpha"
        otherAxis={{}}
        setOtherAxis={setOtherAxis}
      />,
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(setOtherAxis).toHaveBeenCalledWith({ alpha: 7 });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(setOtherAxis).toHaveBeenCalled();
  });

  it("marks constant axes and prevents duplicate output selections", () => {
    const setAxis = vi.fn();
    render(<CreateSelect axis="" idx={1} setAxis={setAxis} />);
    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "beta - Constant" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("option", { name: "alpha" }));
    expect(setAxis).toHaveBeenCalledWith("alpha");

    cleanup();
    const setSelected = vi.fn();
    render(<OutputSelect values={["result", "other"]} selected={0} allSelected={["other"]} setSelected={setSelected} />);
    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "other" })).toHaveAttribute("aria-disabled", "true");
  });
});
