import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOGAPlotModal } from "./MOGAPlotModal";

const mocks = vi.hoisted(() => ({
  updatePlot: vi.fn(),
  setSelectedOptVars: vi.fn(),
}));

vi.mock("../navigation/Header", () => ({
  default: ({ tabTitle }: { tabTitle?: string }) => <h4>{tabTitle}</h4>,
}));
vi.mock("./PlotTools", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OutputSelect: ({
    values,
    selected,
    allSelected,
    setSelected,
  }: {
    values: string[];
    selected: number;
    allSelected: string[];
    setSelected: (v: string) => void;
  }) => (
    // mirrors the real OutputSelect: an objective already taken by another axis
    // is disabled there, exactly what makes the modal's swap branch reachable
    <div data-testid={`output-select-${values[selected] ?? "none"}`}>
      {values.map(v => (
        <button
          key={v}
          type="button"
          aria-label={`pick-${v}`}
          disabled={allSelected.includes(v) && values[selected] !== v}
          onClick={() => setSelected(v)}
        >
          {v}
        </button>
      ))}
    </div>
  ),
}));

const jobs = [{ uid: "job-1" }] as never;
const tableData = { inputs: ["x1"], outputs: ["y", "y2"], raw: {}, rows: [] } as never;

const setup = (overrides: Record<string, unknown> = {}) => {
  const props = {
    plotType: { dimensionType: "2D", scaleType: "linear" } as PlotConfig | undefined,
    tableData,
    updatePlot: mocks.updatePlot,
    filteredJobList: jobs,
    optVars: ["y", "y2"],
    selectedOptVars: ["y", "y2"],
    setSelectedOptVars: mocks.setSelectedOptVars,
    ...overrides,
  };
  render(<MOGAPlotModal {...(props as Parameters<typeof MOGAPlotModal>[0])} />);
};

const openModal = () => {
  fireEvent.click(screen.getByRole("button", { name: /PLOT SETTINGS/i }));
  expect(screen.getByText("Plot Configuration")).toBeInTheDocument();
};

const axisSelect = (axis: "X" | "Y" | "Z") => {
  const label = Array.from(document.querySelectorAll("label")).find(l =>
    (l.textContent ?? "").startsWith(`${axis} Axis:`),
  ) as HTMLElement;
  return within(label);
};

// the toggle's first button inside an <InputLabel> gets the whole label text as
// its accessible name (implicit-label association), so match it by text instead
const toggleButton = (text: string) => {
  const btn = screen.getAllByRole("button").find(b => (b.textContent ?? "") === text);
  if (!btn) throw new Error(`toggle button "${text}" not found`);
  return btn;
};

describe("MOGAPlotModal", () => {
  // the modal's dimensions.map returns a bare <></> for hidden axes (no key),
  // so React logs a once-per-stack missing-key warning — legit source noise,
  // swallowed per repo convention (spy + restore keeps the global guard intact)
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("opens the plot configuration modal with the axes of the current view", () => {
    setup();
    expect(screen.getByRole("button", { name: /PLOT SETTINGS/i })).toBeEnabled();
    openModal();

    expect(screen.getByText("Plot Scale Type:")).toBeInTheDocument();
    expect(screen.getByText("Plot Dimension Type:")).toBeInTheDocument();
    // a 2D view exposes X and Y only — the Z selector stays hidden
    expect(axisSelect("X").getByRole("button", { name: "pick-y" })).toBeInTheDocument();
    expect(axisSelect("Y").getByRole("button", { name: "pick-y2" })).toBeInTheDocument();
    expect(screen.queryByText(/^Z Axis:$/)).toBeNull();
  });

  it("applies the log scale as a new plot config and closes", () => {
    setup();
    openModal();

    fireEvent.click(screen.getByRole("button", { name: "log" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(mocks.setSelectedOptVars).toHaveBeenCalledWith(["y", "y2"]);
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "2D", scaleType: "log" }, ["y", "y2"]);
    expect(screen.queryByText("Plot Configuration")).toBeNull();
  });

  it("toggles the scale back to linear before applying", () => {
    setup();
    openModal();

    fireEvent.click(screen.getByRole("button", { name: "log" }));
    // the "linear" option is the label's first control — its accessible name is
    // the whole InputLabel text, so match it by text
    fireEvent.click(toggleButton("linear"));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "2D", scaleType: "linear" }, ["y", "y2"]);
  });

  it("discards local edits and reopens on the incoming props", () => {
    setup();
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "log" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(mocks.updatePlot).not.toHaveBeenCalled();
    expect(mocks.setSelectedOptVars).not.toHaveBeenCalled();
    expect(screen.queryByText("Plot Configuration")).toBeNull();

    // reopen: the discarded "log" is gone — resetFields reseeded from props
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "2D", scaleType: "linear" }, ["y", "y2"]);
  });

  it("shows only selectable dimensions and disables the ones the objectives cannot fill", () => {
    setup();
    openModal();

    // two objectives cannot paint a 3D plot
    expect((screen.getByRole("button", { name: "3D" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(toggleButton("1D"));
    // 1D paints a single objective: only the X axis selector remains...
    expect(screen.queryByText(/^Y Axis:$/)).toBeNull();
    // ...and it is unrestricted (allSelected = []), so every objective is pickable
    expect(axisSelect("X").getByRole("button", { name: "pick-y2" })).toBeEnabled();
    // the 3D option is still out of reach
    expect((screen.getByRole("button", { name: "3D" }) as HTMLButtonElement).disabled).toBe(true);

    // clicking the backdrop closes the modal without touching the plot
    const backdrop = document.querySelector(".MuiBackdrop-root") as HTMLElement;
    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);
    expect(screen.queryByText("Plot Configuration")).toBeNull();
    expect(mocks.updatePlot).not.toHaveBeenCalled();
  });

  it("unlocks the 3D dimension when a third objective exists", () => {
    setup({ optVars: ["y", "y2", "y3"], selectedOptVars: ["y", "y2", "y3"] });
    openModal();

    expect((screen.getByRole("button", { name: "3D" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(screen.getByText(/^Z Axis:$/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "3D", scaleType: "linear" }, [
      "y",
      "y2",
      "y3",
    ]);
  });

  it("swaps objectives when an axis picks one another axis already owns", () => {
    setup();
    openModal();

    // in 2D the Y-owned objective is disabled on the X axis
    expect(axisSelect("X").getByRole("button", { name: "pick-y2" })).toBeDisabled();

    // in 1D the single axis is unrestricted: picking y2 into X must swap it out
    // of the still-tracked Y slot instead of duplicating it
    fireEvent.click(toggleButton("1D"));
    fireEvent.click(axisSelect("X").getByRole("button", { name: "pick-y2" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "1D", scaleType: "linear" }, ["y2", "y"]);
  });

  it("sets a fresh objective directly on the chosen axis", () => {
    setup({ optVars: ["y", "y2", "y3"], selectedOptVars: ["y", "y2"] });
    openModal();

    // y3 is unused, so it lands on X without displacing Y
    fireEvent.click(axisSelect("X").getByRole("button", { name: "pick-y3" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "2D", scaleType: "linear" }, ["y3", "y2"]);
  });

  it("falls back to the 2D linear default when no plot type is provided", () => {
    setup({ plotType: undefined });
    openModal();

    // edits are still reseedable: Discard resets onto the built-in default too
    fireEvent.click(screen.getByRole("button", { name: "log" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    openModal();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(mocks.updatePlot).toHaveBeenCalledWith(jobs, tableData, { dimensionType: "2D", scaleType: "linear" }, ["y", "y2"]);
  });

  it("disables the settings entry point when there are no objectives", () => {
    setup({ optVars: [], selectedOptVars: [] });
    expect((screen.getByRole("button", { name: /PLOT SETTINGS/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Plot Configuration")).toBeNull();
  });
});
