import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuMo from "./SuMo";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "fn-1", title: "TI surrogate" } as { uid: string; title: string } | null,
  outputVars: ["y1"] as string[],
  setSelectedQoI: vi.fn(),
}));

vi.mock("../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction, outputVars: mocks.outputVars }),
}));
vi.mock("../context/MMUXContext", () => ({
  useMMUXContext: () => ({ setSelectedQoI: mocks.setSelectedQoI }),
}));
vi.mock("../components/navigation/MetaModelingUX", () => ({
  default: (props: { tabTitle?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{props.tabTitle}</h1>
      {props.children}
    </div>
  ),
}));
vi.mock("../components/plots/SuMoPlotsSteps", () => ({
  default: (props: { onInspectModel?: () => void }) => (
    <button onClick={() => props.onInspectModel?.()}>open-plots-inspect</button>
  ),
}));
vi.mock("../components/data/JobsLoading", () => ({
  ["JobsLoading"]: (props: { jobProgress: number; message?: string }) => (
    <div data-testid="jobs-loading">{`${props.message}:${props.jobProgress}`}</div>
  ),
}));
vi.mock("./ValidationModal", () => ({
  default: (props: { open: boolean }) => <div data-testid="validation-modal">{String(props.open)}</div>,
}));
vi.mock("../components/sampling/JobSampling", () => ({
  ["JobSampling"]: (props: { setLoading: (v: boolean) => void; setJobProgress: (v: number) => void }) => (
    <div>
      <button onClick={() => props.setJobProgress(42)}>progress</button>
      <button onClick={() => props.setLoading(false)}>jobs-done</button>
    </div>
  ),
}));

beforeEach(() => {
  mocks.selectedFunction = { uid: "fn-1", title: "TI surrogate" };
  mocks.outputVars = ["y1"];
  mocks.setSelectedQoI.mockReset();
});

describe("SuMo view", () => {
  it("auto-selects the first output as QoI", () => {
    render(<SuMo />);
    expect(mocks.setSelectedQoI).toHaveBeenCalledWith("y1");
  });

  it("shows the loading surface with progress until JobSampling completes", async () => {
    const user = userEvent.setup();
    render(<SuMo />);
    expect(screen.getByTestId("jobs-loading")).toHaveTextContent("Creating AI model");
    expect(screen.getByTestId("jobs-loading")).toHaveTextContent(":0");

    await user.click(screen.getByText("progress"));
    expect(screen.getByTestId("jobs-loading")).toHaveTextContent("42");

    await user.click(screen.getByText("jobs-done"));
    expect(screen.queryByTestId("jobs-loading")).toBeNull();
    expect(screen.getByText("open-plots-inspect")).toBeDefined();
  });

  it("plots-header Inspect Model opens the validation modal", async () => {
    const user = userEvent.setup();
    render(<SuMo />);
    await user.click(screen.getByText("jobs-done"));
    await user.click(screen.getByText("open-plots-inspect"));
    expect(screen.getByTestId("validation-modal")).toHaveTextContent("true");
  });

  it("names the header after the selected function", () => {
    render(<SuMo />);
    expect(screen.getByRole("heading", { name: "Response Surface Modeling: TI surrogate" })).toBeDefined();
  });
});
