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
  selectedFunction: { uid: "function-1" } as { uid: string } | undefined,
  inputVars: ["alpha", "beta"],
  distribution: {
    "function-1": {
      alpha: { distribution: "uniform", min: 0, max: 1 },
      beta: { distribution: "constant", value: 2 },
    },
  },
  jobs: [{ inputs: { alpha: 0, beta: 2 } }, { inputs: { alpha: 1, beta: 2 } }] as Array<{
    inputs?: Record<string, unknown> | null;
  }>,
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

type PlotContext = Parameters<typeof GetUniqueValues>[0];

const baseJobs = () => [{ inputs: { alpha: 0, beta: 2 } }, { inputs: { alpha: 1, beta: 2 } }];

describe("PlotTools", () => {
  beforeEach(() => {
    cleanup();
    // Renders mutate these (no-function arms, extra vars); never leak between tests.
    mocks.selectedFunction = { uid: "function-1" };
    mocks.inputVars = ["alpha", "beta"];
    mocks.jobs = baseJobs();
  });

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

  it("skips jobs without inputs and non-numeric input values", () => {
    const context = {
      selectedFunction: mocks.selectedFunction,
      inputVars: mocks.inputVars,
      distribution: mocks.distribution,
      allJobsList: () => [
        { inputs: null }, // job still queued: no input payload yet
        { inputs: { alpha: "0", beta: 2 } }, // string alpha is not a sample
        { inputs: { alpha: 1, beta: 2 } },
      ],
    } as unknown as PlotContext;
    const values = GetUniqueValues(context);

    expect([...values.alpha]).toEqual([1]);
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

  it("keeps varying data when the selected function is missing (restored persistence)", () => {
    // distribution keyed by the "" fallback uid; gamma is absent from the
    // (optional) distribution entry entirely
    const context = {
      selectedFunction: undefined,
      inputVars: ["alpha", "beta", "gamma"],
      distribution: { "": { alpha: { distribution: "uniform", min: 0, max: 1 } } },
      allJobsList: () => [{ inputs: { alpha: 0, beta: 2, gamma: 3 } }, { inputs: { alpha: 1, beta: 2, gamma: 4 } }],
    } as unknown as PlotContext;

    expect(filterOutConstantDataVars(context)).toEqual(["alpha", "gamma"]);
    expect(filterOutConstantDistributionVars({ ...context, distribution: {} } as PlotContext)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
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

  it("centers a normal slider on its mean and commits drags & keystrokes", () => {
    const setOtherAxis = vi.fn();
    render(
      <CreateSlider
        dist={{ distribution: "normal", mean: 5, std: 2 } as never}
        input="alpha"
        otherAxis={{}}
        setOtherAxis={setOtherAxis}
      />,
    );

    const spin = screen.getByRole("spinbutton");
    expect(spin).toHaveValue(5); // val = mean; min/max = mean ± 2.5 std

    fireEvent.keyDown(spin, { key: "ArrowUp" });
    expect(setOtherAxis).toHaveBeenLastCalledWith({ alpha: 5.1 });

    fireEvent.blur(spin, { target: { value: "6.5" } });
    expect(setOtherAxis).toHaveBeenLastCalledWith({ alpha: 6.5 });

    // The hidden range input (role=slider) drives MUI keyboard interaction:
    // ArrowRight fires onChange AND onChangeCommitted -> changeOtherAxis.
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(setOtherAxis.mock.lastCall?.[0].alpha).toBeCloseTo(6.6, 5);
  });

  it.each([
    [{ distribution: "normal" }, 0], // normal without a mean
    [{ distribution: "normal", mean: 5 }, 0], // normal without a std
    [{ distribution: "uniform" }, 0], // uniform without min/max, value undefined -> 0
    [{ distribution: "constant", value: 3 }, 3], // neither shape: value ± 1
  ])("falls back to value ± 1 when %j is incomplete", (dist, expected) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<CreateSlider dist={dist as never} input="alpha" otherAxis={{}} setOtherAxis={vi.fn()} />);
    expect(console.warn).toHaveBeenCalledWith("Could not define max & min for variable ", "alpha", dist);
    expect(screen.getByRole("spinbutton")).toHaveValue(expected);
  });

  it("disables a constant-data slider without re-bracketing a constant distribution", () => {
    render(
      <CreateSlider dist={{ distribution: "constant", value: 2 } as never} input="beta" otherAxis={{}} setOtherAxis={vi.fn()} />,
    );

    expect(screen.getByText("beta - constant:")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled();
    // distribution === "constant" keeps the value-based bracket 2 ± 1 untouched
    expect(slider).toHaveAttribute("aria-valuemin", "1");
    expect(slider).toHaveAttribute("aria-valuemax", "3");
  });

  it("brackets a non-constant variable around its single sampled value", () => {
    render(
      <CreateSlider
        dist={{ distribution: "uniform", min: 0, max: 1 } as never}
        input="beta"
        otherAxis={{}}
        setOtherAxis={vi.fn()}
      />,
    );

    // beta never varies in the job data -> slider disabled, range ±10% of 2
    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled();
    expect(Number(slider.getAttribute("aria-valuemin"))).toBeCloseTo(1.8);
    expect(Number(slider.getAttribute("aria-valuemax"))).toBeCloseTo(2.2);
  });

  it("brackets 0..1 with a warning when a variable has no numeric job data", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.inputVars = ["alpha", "beta", "gamma"];
    render(
      <CreateSlider
        dist={{ distribution: "uniform", min: 0, max: 1 } as never}
        input="gamma"
        otherAxis={{}}
        setOtherAxis={vi.fn()}
      />,
    );

    expect(console.warn).toHaveBeenCalledWith("No values found for variable", "gamma", "setting default min and max to 0 and 1");
    expect(screen.getByText("gamma - constant:")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "1");
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

  it("lists every input as selectable without a selected function or jobs", () => {
    // freshly restored persistence: the function is not resolved and no jobs
    // ran, so nothing can be proven constant -> no idx prop either
    mocks.selectedFunction = undefined;
    mocks.jobs = [];
    const setAxis = vi.fn();
    render(<CreateSelect axis="" setAxis={setAxis} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "alpha" })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: "beta" })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("switches an output selection to an unclaimed value", () => {
    const setSelected = vi.fn();
    render(<OutputSelect values={["result", "other", "third"]} selected={0} allSelected={["other"]} setSelected={setSelected} />);
    fireEvent.mouseDown(screen.getByRole("combobox"));
    // "other" is claimed elsewhere, "result" is the current value, "third" is free
    expect(screen.getByRole("option", { name: "other" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: "result" })).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("option", { name: "third" }));
    expect(setSelected).toHaveBeenCalledWith("third");
  });
});
