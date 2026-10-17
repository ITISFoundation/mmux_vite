import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuMoPlotsSteps from "./SuMoPlotsSteps";

const mocks = vi.hoisted(() => ({
  inputVars: [] as Array<{ name: string }>,
  outputVars: ["y1"] as string[],
  filteredJobList: [] as Array<{ uid: string }>,
  selectedJobUids: [] as string[],
  filterInputVars: vi.fn(),
  setSelectedQoI: vi.fn(),
  onInspectModel: undefined as (() => void) | undefined,
}));

vi.mock("./Curves1DPlot", () => ({ default: () => <div data-testid="curves" /> }));
vi.mock("./Surface2DPlot", () => ({ default: () => <div data-testid="surface" /> }));
vi.mock("./IsoSurface3DPlot", () => ({ default: () => <div data-testid="iso" /> }));
vi.mock("./QoISelector", () => ({
  ["QoISelector"]: (props: { testId?: string }) => <div data-testid={props.testId} />,
}));
vi.mock("./PlotTools", () => ({ filterInputVars: mocks.filterInputVars }));
vi.mock("../../utils/useAutoDetectQoiScale", () => ({ useAutoDetectQoiScale: vi.fn() }));
vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    inputVars: mocks.inputVars,
    selectedFunction: { uid: "fn-1" },
    distribution: {},
    outputVars: mocks.outputVars,
  }),
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    filteredJobList: mocks.filteredJobList,
    selectedJobUids: mocks.selectedJobUids,
  }),
}));
vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => ({ selectedQoI: "y1", setSelectedQoI: mocks.setSelectedQoI }),
}));

const vars = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `x${i + 1}` }));

const nextButton = () => document.querySelector('[mmux-testid="sumo-plot-next"]') as HTMLElement;

beforeEach(() => {
  mocks.inputVars = vars(3);
  mocks.filteredJobList = [];
  mocks.selectedJobUids = [];
  mocks.filterInputVars.mockReset();
  mocks.filterInputVars.mockImplementation((args: { inputVars: Array<{ name: string }> }) => args.inputVars);
  mocks.setSelectedQoI.mockReset();
});

describe("SuMoPlotsSteps", () => {
  it("shows all three stepped plots with the 1D content first (no jobs → raw inputVars)", () => {
    render(<SuMoPlotsSteps />);
    expect(screen.getByText("1D Curves")).toBeDefined();
    expect(screen.getByTestId("curves")).toBeDefined();
    expect(screen.queryByTestId("surface")).toBeNull();
    expect(mocks.filterInputVars).not.toHaveBeenCalled();
  });

  it("renders the QoI selector and the inspect button, invoking the callback", async () => {
    const user = userEvent.setup();
    mocks.onInspectModel = vi.fn();
    render(<SuMoPlotsSteps onInspectModel={mocks.onInspectModel} />);
    expect(screen.getByTestId("sumo-plot-qoi-select")).toBeDefined();
    await user.click(screen.getByText("Inspect Model"));
    expect(mocks.onInspectModel).toHaveBeenCalledTimes(1);
  });

  it("omits the Inspect Model button without a callback", () => {
    render(<SuMoPlotsSteps />);
    expect(screen.queryByText("Inspect Model")).toBeNull();
  });

  it("filters through JobContext when jobs exist and steps through 2D", async () => {
    const user = userEvent.setup();
    mocks.filteredJobList = [{ uid: "j1" }];
    mocks.selectedJobUids = ["j1"];
    mocks.filterInputVars.mockImplementation(() => vars(2));
    render(<SuMoPlotsSteps />);
    expect(mocks.filterInputVars).toHaveBeenCalled();
    // two usable inputs → 1D + 2D only; navigate forward to the surface
    await user.click(nextButton());
    expect(screen.getByText("2D Surface")).toBeDefined();
    expect(screen.getByTestId("surface")).toBeDefined();
    expect(screen.queryByTestId("iso")).toBeNull();
  });

  it("gates content away when no input variables survive", () => {
    mocks.inputVars = [];
    render(<SuMoPlotsSteps />);
    expect(screen.queryByTestId("curves")).toBeNull();
    expect(screen.queryByTestId("surface")).toBeNull();
  });

  it("gates content when filtering drops every variable despite jobs", () => {
    mocks.filteredJobList = [{ uid: "j1" }];
    mocks.filterInputVars.mockImplementation(() => []);
    render(<SuMoPlotsSteps />);
    expect(mocks.filterInputVars).toHaveBeenCalled();
    expect(screen.queryByTestId("curves")).toBeNull();
  });

  it("clamps back from step 2 when a job change shrinks the usable inputs", async () => {
    const user = userEvent.setup();
    mocks.filteredJobList = [{ uid: "j1" }];
    mocks.filterInputVars.mockImplementation(() => vars(2));
    const { rerender } = render(<SuMoPlotsSteps />);
    await user.click(nextButton());
    expect(screen.getByText("2D Surface")).toBeDefined();

    mocks.filterInputVars.mockImplementation(() => vars(1));
    mocks.filteredJobList = [{ uid: "j1" }, { uid: "j2" }];
    mocks.selectedJobUids = ["j1", "j2"];
    // rerender the SAME instance (a fresh render() would mount at step 0 and
    // stay green even with the clamp effect removed) — the changed
    // selectedJobUids/filteredJobList deps must re-run the clamp: the active
    // 2D surface disappears and the step falls back to the 1D curves.
    rerender(<SuMoPlotsSteps />);
    expect(screen.queryByText("2D Surface")).toBeNull();
    expect(screen.queryByTestId("surface")).toBeNull();
    expect(screen.getByText("1D Curves")).toBeDefined();
    expect(screen.getByTestId("curves")).toBeDefined();
  });
});
