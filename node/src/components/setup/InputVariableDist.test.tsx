import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputVariableDist } from "./InputVariableDist";

const mocks = vi.hoisted(() => ({
  serviceMode: "SUMO",
  value: {
    selectedFunction: { uid: "fn-1" },
    inputVars: [] as string[],
    distribution: {} as Record<string, InputVarSelection>,
    setDistribution: vi.fn(),
  },
}));

vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => mocks.value }));
vi.mock("../../context/ServiceContext", () => ({ useServiceContext: () => ({ serviceMode: mocks.serviceMode }) }));
vi.mock("../navigation/Header", () => ({ default: ({ tabTitle }: { tabTitle: string }) => <h2>{tabTitle}</h2> }));

function setup(serviceMode: string, inputVars: string[], persisted?: InputVarSelection) {
  mocks.serviceMode = serviceMode;
  mocks.value = {
    ...mocks.value,
    inputVars,
    distribution: persisted ? { "fn-1": persisted } : {},
    setDistribution: vi.fn(),
  };
  return render(<InputVariableDist />);
}

function field(name: string) {
  return document.querySelector(`[mmux-testid="input-block-${name}"] input`) as HTMLInputElement;
}

function commit(name: string, value: string) {
  fireEvent.change(field(name), { target: { value } });
  fireEvent.blur(field(name), { target: { value } });
}

const lastSaved = () => {
  const calls = mocks.value.setDistribution.mock.calls;
  return calls[calls.length - 1][0]["fn-1"] as InputVarSelection;
};

describe("InputVariableDist", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("renders nothing when the function has no inputs", () => {
    const { container } = setup("SUMO", []);
    expect(container).toBeEmptyDOMElement();
  });

  it("seeds known SuMo geometry ranges and leaves unknown inputs empty with an error", () => {
    setup("SUMO", ["angle", "mystery"]);

    expect(screen.getByText("Parameter Ranges")).toBeInTheDocument();
    expect(mocks.value.setDistribution).toHaveBeenCalledWith({
      "fn-1": {
        angle: { distribution: "uniform", min: 30, max: 300 },
        mystery: { distribution: "uniform", mean: NaN, std: NaN, min: NaN, max: NaN },
      },
    });
    const mysteryBox = document.querySelector('[mmux-testid="input-var-box-1"]') as HTMLElement;
    expect(within(mysteryBox).getByText("Empty value")).toBeInTheDocument();
  });

  it("seeds known UQ tissue properties as normal distributions", () => {
    setup("UQ", ["Sigma_Blood"]);
    expect(screen.getByText("Parameter Distributions")).toBeInTheDocument();
    expect(lastSaved()).toEqual({ Sigma_Blood: { distribution: "normal", mean: 0.662, std: 0.13 } });
  });

  it("falls back to an empty uniform range for an unknown service mode", () => {
    setup("BOGUS", ["x"]);
    expect(console.warn).toHaveBeenCalledWith("Unknown serviceMode:", "BOGUS", "for inputDistribution default!");
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", mean: NaN, std: NaN, min: NaN, max: NaN } });
  });

  it("keeps a persisted distribution instead of re-seeding it", () => {
    setup("MOGA", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } });
    expect(mocks.value.setDistribution).not.toHaveBeenCalled();
    expect(field("Min")).toHaveValue(1);
    expect(field("Max")).toHaveValue(2);
    expect(screen.queryByText(/Min >= Max|Empty value|Out of range/)).toBeNull();
  });

  it.each([
    ["Min", "5", "Min >= Max"],
    ["Max", "1", "Min >= Max"],
    ["Min", "-2e9", "Out of range (-1e9, 1e9)"],
    ["Max", "2e9", "Out of range (-1e9, 1e9)"],
    ["Min", "", "Empty value"],
  ])("flags uniform %s=%s with '%s'", (name, value, message) => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } });
    commit(name, value);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("stores committed uniform bounds for the selected function", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } });
    commit("Max", "7");
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 1, max: 7 } });
  });

  it.each([
    ["Standard Deviation", "0", "Out of range (>0, 1e9)"],
    ["Standard Deviation", "-1", "Out of range (>0, 1e9)"],
    ["Mean", "2e9", "Out of range (-1e9, 1e9)"],
    ["Mean", "", "Empty value"],
  ])("flags normal %s=%s with '%s'", (name, value, message) => {
    setup("UQ", ["x"], { x: { distribution: "normal", mean: 0, std: 1 } });
    commit(name, value);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it.each([
    ["", "Empty value"],
    ["2e9", "Out of range (-1e9, 1e9)"],
  ])("flags constant value %s with '%s'", (value, message) => {
    setup("UQ", ["x"], { x: { distribution: "constant", value: 3 } });
    commit("Value", value);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("resets the parameters when the UQ distribution form changes", () => {
    setup("UQ", ["x"], { x: { distribution: "normal", mean: 0, std: 1 } });

    const selector = document.querySelector('[mmux-testid="input-var-x-distribution-selector"]') as HTMLElement;
    fireEvent.mouseDown(within(selector).getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Constant" }));

    expect(lastSaved()).toEqual({ x: { distribution: "constant" } });
    expect(screen.getByText("Empty value")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "LogNormal", hidden: true })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a placeholder for an entry without a distribution form", () => {
    setup("SUMO", ["x"], { x: {} as never });
    expect(screen.getByText("not found")).toBeInTheDocument();
  });
});
