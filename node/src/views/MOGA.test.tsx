import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MOGA from "./MOGA";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "fn-1", title: "TI surrogate" } as { uid: string; title: string } | null,
  jobSamplingDisabled: undefined as boolean | undefined,
}));

vi.mock("../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction }),
}));
vi.mock("../components/navigation/MetaModelingUX", () => ({
  default: (props: { tabTitle?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{props.tabTitle}</h1>
      {props.children}
    </div>
  ),
}));
vi.mock("../components/plots/MOGAPareto", () => ({
  ["MOGAPareto"]: (props: { setCalculating: (v: boolean) => void }) => (
    <button onClick={() => props.setCalculating(true)}>pareto-calc</button>
  ),
}));
vi.mock("./ValidationModal", () => ({
  default: (props: { open: boolean }) => <div data-testid="validation-modal">{String(props.open)}</div>,
}));
vi.mock("./MOGAModal", () => ({
  default: (props: { open: boolean }) => <div data-testid="moga-modal">{String(props.open)}</div>,
}));
vi.mock("../components/sampling/JobSampling", () => ({
  ["JobSampling"]: (props: { setLoading: (v: boolean) => void; disabled?: boolean }) => {
    mocks.jobSamplingDisabled = props.disabled;
    return <button onClick={() => props.setLoading(false)}>jobs-done</button>;
  },
}));

const buttonByTestId = (id: string) => document.querySelector(`[mmux-testid="${id}"]`) as HTMLButtonElement | null;

beforeEach(() => {
  mocks.selectedFunction = { uid: "fn-1", title: "TI surrogate" };
  mocks.jobSamplingDisabled = undefined;
});

describe("MOGA view", () => {
  it("names the header after the selected function", () => {
    render(<MOGA />);
    expect(screen.getByRole("heading", { name: "Multi Objective Genetic Algorithm: TI surrogate" })).toBeDefined();
  });

  it("gates both action buttons on loading and function selection", async () => {
    const user = userEvent.setup();
    render(<MOGA />);
    const optimize = screen.getByRole("button", { name: "Optimization Settings" });
    const inspect = buttonByTestId("inspect-model-button");
    expect(optimize).toBeDisabled();
    expect(inspect).toBeDisabled();

    await user.click(screen.getByText("jobs-done"));
    expect(optimize).toBeEnabled();
    expect(inspect).toBeEnabled();
  });

  it("opens Optimization Settings → MOGAModal and Inspect Model → ValidationModal", async () => {
    const user = userEvent.setup();
    render(<MOGA />);
    await user.click(screen.getByText("jobs-done"));
    await user.click(screen.getByRole("button", { name: "Optimization Settings" }));
    expect(screen.getByTestId("moga-modal")).toHaveTextContent("true");
    await user.click(buttonByTestId("inspect-model-button") as HTMLElement);
    expect(screen.getByTestId("validation-modal")).toHaveTextContent("true");
  });

  it("disables sampling while the Pareto surface reports calculating", async () => {
    const user = userEvent.setup();
    render(<MOGA />);
    expect(mocks.jobSamplingDisabled).toBe(false);
    await user.click(screen.getByText("pareto-calc"));
    expect(mocks.jobSamplingDisabled).toBe(true);
  });

  it("keeps buttons disabled without a selected function", () => {
    mocks.selectedFunction = null;
    render(<MOGA />);
    expect(screen.getByRole("button", { name: "Optimization Settings" })).toBeDisabled();
  });
});
