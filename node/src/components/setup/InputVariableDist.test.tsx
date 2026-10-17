import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputVariableDist } from "./InputVariableDist";

const mocks = vi.hoisted(() => ({
  serviceMode: "SUMO",
  value: {
    selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
    inputVars: [] as string[],
    distribution: {} as Record<string, InputVarSelection>,
    setDistribution: vi.fn(),
  },
  filteredJobList: [] as Array<{ status?: string; inputs?: Record<string, unknown> | null }>,
}));

vi.mock("../../context/FunctionContext", () => ({ useFunctionContext: () => mocks.value }));
vi.mock("../../context/ServiceContext", () => ({ useServiceContext: () => ({ serviceMode: mocks.serviceMode }) }));
vi.mock("../../context/JobContext", () => ({ useJobContext: () => ({ filteredJobList: mocks.filteredJobList }) }));
vi.mock("../navigation/Header", () => ({ default: ({ tabTitle }: { tabTitle: string }) => <h2>{tabTitle}</h2> }));

function setup(
  serviceMode: string,
  inputVars: string[],
  persisted?: InputVarSelection,
  jobs?: Array<{ status?: string; inputs?: Record<string, unknown> | null }>,
) {
  mocks.serviceMode = serviceMode;
  mocks.filteredJobList = jobs ?? [];
  mocks.value = {
    ...mocks.value,
    inputVars,
    distribution: persisted ? { "fn-1": persisted } : {},
    setDistribution: vi.fn(),
  };
  return render(<InputVariableDist />);
}

function field(name: string) {
  // per-variable test ids (input-block-<var>-<Name>, hyphenated) from the
  // validation-QoI selector port; single-variable renderings make suffix
  // matching unambiguous
  const norm = name.replace(/ /g, "-");
  return document.querySelector(`[mmux-testid^="input-block-"][mmux-testid$="-${norm}"] input`) as HTMLInputElement;
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
    // #663 replay (B33/V40): log-normal is no longer a form in the menu; the
    // orthogonal Scale toggle carries it (uniform/normal only).
    expect(screen.queryByRole("option", { name: "LogNormal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Constant" }));

    expect(lastSaved()).toEqual({ x: { distribution: "constant" } });
    expect(screen.getByText("Empty value")).toBeInTheDocument();
  });

  it("shows a placeholder for an entry without a distribution form", () => {
    setup("SUMO", ["x"], { x: {} as never });
    expect(screen.getByText("not found")).toBeInTheDocument();
  });

  it("explains the data-driven shape/scale under the log toggle (SUMO uniform) when jobs are present", () => {
    // 10 evenly log-spaced samples across 9 decades (exactly at the shape-fit bar)
    // -> describeShapeFit reports the log-uniform winner, so the user sees WHY
    // scale:"log" is a good default.
    const jobs = Array.from({ length: 10 }, (_, i) => ({
      status: "SUCCESS",
      inputs: { x: 10 ** i },
    }));
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 1e9, scale: "log" } }, jobs);

    const note = document.querySelector('[mmux-testid="input-var-x-shape-fit-note"]') as HTMLElement;
    expect(note).not.toBeNull();
    expect(note.textContent).toMatch(/log-uniform/i);
  });

  it("omits the shape-fit note when there is no data to fit", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } }, []);
    expect(document.querySelector('[mmux-testid="input-var-x-shape-fit-note"]')).toBeNull();
  });

  // B52ij (owner): factor-10 span/scale mismatch is a warning symbol at the
  // Scale toggle — both directions — never an inference gate.
  const wideJobs = Array.from({ length: 10 }, (_, i) => ({ status: "SUCCESS", inputs: { x: 10 ** i } }));
  const narrowJobs = Array.from({ length: 10 }, (_, i) => ({ status: "SUCCESS", inputs: { x: 1 + i / 9 } }));

  it("warns when LINEAR is selected but the data spans more than a factor of 10", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 1e9, scale: "linear" } }, wideJobs);
    expect(document.querySelector('[mmux-testid="input-var-x-scale-advice"]')).not.toBeNull();
  });

  it("omits the warning when LOG is selected and the data genuinely spans more than a factor of 10", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 1e9, scale: "log" } }, wideJobs);
    expect(document.querySelector('[mmux-testid="input-var-x-scale-advice"]')).toBeNull();
  });

  it("warns (vice versa) when LOG is selected but the data spans at most a factor of 10", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2, scale: "log" } }, narrowJobs);
    expect(document.querySelector('[mmux-testid="input-var-x-scale-advice"]')).not.toBeNull();
  });

  it("omits the warning when LINEAR and a narrow span agree", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2, scale: "linear" } }, narrowJobs);
    expect(document.querySelector('[mmux-testid="input-var-x-scale-advice"]')).toBeNull();
  });

  it("no jobs, no advice (⊥ verdicts without data)", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 1e9, scale: "linear" } }, []);
    expect(document.querySelector('[mmux-testid="input-var-x-scale-advice"]')).toBeNull();
  });
});

// B33/V40 orthogonal scale + the #663 support guards: log needs strictly
// positive support (uniform min > 0, normal mean > 0), constant never scales.
describe("InputVariableDist scale toggle & log-support guards", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.value.selectedFunction = { uid: "fn-1" };
  });

  it("explains a log-scaled normal with its derived log-normal note and shape fit", () => {
    const jobs = Array.from({ length: 10 }, (_, i) => ({ status: "SUCCESS", inputs: { x: 10 ** i } }));
    setup("UQ", ["x"], { x: { distribution: "normal", mean: 2, std: 0.4, scale: "log" } }, jobs);

    // user enters LINEAR mean/std; the note shows the log-normal mapping (V40)
    expect(screen.getByText(/log-normal · median ≈/)).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="input-var-x-shape-fit-note"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "log" })).toBeEnabled();
  });

  it("drops the note and disables the toggle when a normal mean is not positive", () => {
    setup("UQ", ["x"], { x: { distribution: "normal", mean: -1, std: 0.4, scale: "log" } });
    expect(screen.queryByText(/log-normal/)).toBeNull();
    expect(screen.getByRole("button", { name: "log" })).toBeDisabled();
  });

  it("disables the toggle when a normal entry has no mean at all", () => {
    setup("UQ", ["x"], { x: { distribution: "normal", scale: "log" } });
    expect(screen.queryByText(/log-normal/)).toBeNull();
    expect(screen.getByRole("button", { name: "log" })).toBeDisabled();
  });

  it("shows unknown bounds for a log-uniform without min and keeps the toggle disabled", () => {
    setup("UQ", ["x"], { x: { distribution: "uniform", scale: "log" } });
    expect(screen.getByText("log-uniform in [?, ?]")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "log" })).toBeDisabled();
  });

  it("flips the UQ scale toggle both ways through handleSetScale", () => {
    setup("UQ", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } });
    fireEvent.click(screen.getByRole("button", { name: "log" }));
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 1, max: 2, scale: "log" } });
    fireEvent.click(screen.getByRole("button", { name: "linear" }));
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 1, max: 2, scale: "linear" } });
  });

  it("flips the SuMo sampling-scale toggle when a positive min is set", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 2 } });
    fireEvent.click(screen.getByRole("button", { name: "log" }));
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 1, max: 2, scale: "log" } });
    fireEvent.click(screen.getByRole("button", { name: "linear" }));
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 1, max: 2, scale: "linear" } });
  });

  it("gates the SuMo sampling-scale toggle until a positive min is set", () => {
    setup("SUMO", ["mystery"]); // seeded with NaN bounds
    expect(screen.getByRole("button", { name: "log" })).toBeDisabled();
  });

  it("clears a log scale when a uniform min stops being positive (#663 min path)", () => {
    setup("SUMO", ["x"], { x: { distribution: "uniform", min: 1, max: 10, scale: "log" } });
    commit("Min", "0");
    expect(lastSaved()).toEqual({ x: { distribution: "uniform", min: 0, max: 10, scale: "linear" } });
  });

  it("clears a log scale when a normal mean stops being positive (#663 mean path)", () => {
    setup("UQ", ["x"], { x: { distribution: "normal", mean: 2, std: 0.4, scale: "log" } });
    commit("Mean", "-1");
    expect(lastSaved()).toEqual({ x: { distribution: "normal", mean: -1, std: 0.4, scale: "linear" } });
  });

  it("keeps the log scale when the committed mean stays positive", () => {
    setup("UQ", ["x"], { x: { distribution: "normal", mean: 2, std: 0.4, scale: "log" } });
    commit("Mean", "5");
    expect(lastSaved()).toEqual({ x: { distribution: "normal", mean: 5, std: 0.4, scale: "log" } });
  });
});

describe("InputVariableDist seeding presets", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.value.selectedFunction = { uid: "fn-1" };
  });

  it("seeds SuMo geometry presets case-insensitively", () => {
    setup("SUMO", ["gap", "SiliconeExtra", "interElectrodeSpacing"]);
    expect(lastSaved()).toEqual({
      gap: { distribution: "uniform", min: 0.2, max: 2 },
      SiliconeExtra: { distribution: "uniform", min: 0.5, max: 2.5 },
      interElectrodeSpacing: { distribution: "uniform", min: 0.2, max: 2 },
    });
  });

  it("seeds every UQ tissue-property preset", () => {
    setup("UQ", ["sigma_conn", "sigma_fasc_lon", "sigma_fasc_tra", "sigma_nerve", "sigma_saline"]);
    expect(lastSaved()).toEqual({
      sigma_conn: { distribution: "normal", mean: 0.08, std: 0.016 },
      sigma_fasc_lon: { distribution: "normal", mean: 0.57, std: 0.114 },
      sigma_fasc_tra: { distribution: "normal", mean: 0.16, std: 0.032 },
      sigma_nerve: { distribution: "normal", mean: 0.34, std: 0.068 },
      sigma_saline: { distribution: "normal", mean: 2, std: 0.4 },
    });
  });

  it("falls back to a normal distribution for an unknown UQ input", () => {
    setup("UQ", ["zzz"]);
    expect(lastSaved()).toEqual({ zzz: { distribution: "normal", mean: NaN, std: NaN, min: NaN, max: NaN } });
  });

  it("shows the dev-default 0/1 fields for a normal entry without parameters", () => {
    setup("UQ", ["x"], { x: { distribution: "normal" } });
    expect(field("Mean")).toHaveValue(0);
    expect(field("Standard Deviation")).toHaveValue(1);
    expect(screen.getByText("Empty value")).toBeInTheDocument();
  });

  it("shows empty fields and an error for a uniform entry without bounds", () => {
    setup("UQ", ["x"], { x: { distribution: "uniform" } });
    expect(field("Min").value).toBe("");
    expect(field("Max").value).toBe("");
    expect(screen.getByText("Empty value")).toBeInTheDocument();
  });

  it("renders the UQ form selector with an empty value for an entry with no form", () => {
    setup("UQ", ["x"], { x: {} as never });
    expect(screen.getByText("not found")).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="input-var-x-distribution-selector"]')).not.toBeNull();
    expect(screen.queryByText("Scale")).toBeNull(); // no scale box without a form
  });

  it("seeds locally without a selected function, persisting nothing", () => {
    mocks.serviceMode = "SUMO";
    mocks.filteredJobList = [];
    mocks.value = {
      selectedFunction: undefined,
      inputVars: ["x"],
      distribution: {},
      setDistribution: vi.fn(),
    };
    render(<InputVariableDist />);

    expect(screen.getByText("Parameter Ranges")).toBeInTheDocument();
    expect(field("Min").value).toBe(""); // x was seeded into local state only
    expect(mocks.value.setDistribution).not.toHaveBeenCalled();
  });

  it("treats a persisted variable absent from inputVars as having no job data", () => {
    setup("SUMO", ["x"], { y: { distribution: "uniform", min: 1, max: 2 } });
    expect(screen.getByText("y")).toBeInTheDocument();
    expect(document.querySelector('[mmux-testid="input-var-y-scale-advice"]')).toBeNull();
    expect(mocks.value.setDistribution).not.toHaveBeenCalled(); // persisted map is kept
  });
});
