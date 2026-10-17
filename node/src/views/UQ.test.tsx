import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UQ from "./UQ";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "fn-1", title: "TI surrogate" } as { uid: string; title: string } | null,
  outputVars: ["y1", "y2"] as string[],
  selectedQoI: "",
  setSelectedQoI: vi.fn(),
  setLoading: null as ((v: boolean) => void) | null,
}));

vi.mock("../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction, outputVars: mocks.outputVars }),
}));
vi.mock("../context/MMUXContext", () => ({
  useMMUXContext: () => ({ selectedQoI: mocks.selectedQoI, setSelectedQoI: mocks.setSelectedQoI }),
}));
vi.mock("../components/navigation/MetaModelingUX", () => ({
  default: (props: { tabTitle?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{props.tabTitle}</h1>
      {props.children}
    </div>
  ),
}));
vi.mock("../components/plots/UQPlotsSteps", () => ({
  default: (props: { loading: boolean; qoiSelector?: React.ReactNode; onOpenSettings?: () => void }) => (
    <div>
      <div data-testid="plots-loading">{String(props.loading)}</div>
      {props.qoiSelector}
      <button onClick={() => props.onOpenSettings?.()}>open-settings</button>
    </div>
  ),
}));
vi.mock("../components/plots/QoISelector", () => ({
  ["QoISelector"]: (props: { testId?: string }) => <div data-testid={props.testId}>qoi</div>,
}));
vi.mock("./ValidationModal", () => ({
  default: (props: { open: boolean }) => <div data-testid="validation-modal">{String(props.open)}</div>,
}));
vi.mock("./UQSettingsModal", () => ({
  default: (props: { open: boolean }) => <div data-testid="uq-settings-modal">{String(props.open)}</div>,
}));
vi.mock("../components/sampling/JobSampling", () => ({
  ["JobSampling"]: (props: { setLoading: (v: boolean) => void }) => {
    mocks.setLoading = props.setLoading;
    return <button onClick={() => props.setLoading(false)}>jobs-done</button>;
  },
}));

beforeEach(() => {
  mocks.selectedFunction = { uid: "fn-1", title: "TI surrogate" };
  mocks.outputVars = ["y1", "y2"];
  mocks.selectedQoI = "";
  mocks.setSelectedQoI.mockReset();
  mocks.setLoading = null;
});

const inspectButton = () => document.querySelector('[mmux-testid="inspect-model-button"]') as HTMLButtonElement;

describe("UQ view", () => {
  it("auto-selects the first output variable as QoI (V12 scale-detector anchor)", () => {
    render(<UQ />);
    expect(mocks.setSelectedQoI).toHaveBeenCalledWith("y1");
  });

  it("does not select a QoI while no outputs are known", () => {
    mocks.outputVars = [];
    render(<UQ />);
    expect(mocks.setSelectedQoI).not.toHaveBeenCalled();
  });

  it("names the header after the selected function", () => {
    render(<UQ />);
    expect(screen.getByRole("heading", { name: "Uncertainty Quantification: TI surrogate" })).toBeDefined();
  });

  it("gates Inspect Model on loading, then opens the validation modal", async () => {
    const user = userEvent.setup();
    render(<UQ />);
    expect(screen.getByTestId("plots-loading")).toHaveTextContent("true");
    expect(inspectButton()).toBeDisabled();

    await user.click(screen.getByText("jobs-done"));
    expect(inspectButton()).toBeEnabled();
    await user.click(inspectButton());
    expect(screen.getByTestId("validation-modal")).toHaveTextContent("true");
  });

  it("keeps Inspect Model disabled without a selected function even after loading", async () => {
    mocks.selectedFunction = null;
    render(<UQ />);
    await act(async () => {
      mocks.setLoading?.(false);
    });
    expect(inspectButton()).toBeDisabled();
  });

  it("opens the UQ settings modal from the plots header", async () => {
    const user = userEvent.setup();
    render(<UQ />);
    await user.click(screen.getByText("open-settings"));
    expect(screen.getByTestId("uq-settings-modal")).toHaveTextContent("true");
  });
});
