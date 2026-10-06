import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ValidationModal from "./ValidationModal";

const outputVars = ["y1", "y2"];

vi.mock("../context/FunctionContext", () => ({
  useFunctionContext: () => ({ outputVars }),
}));

const contextState = {
  selectedQoI: "y2",
  validationQoI: "y1" as string | undefined,
  setValidationQoI: vi.fn(),
};

vi.mock("../context/MMUXContext", () => ({
  useMMUXContext: () => contextState,
}));

vi.mock("../components/plots/SuMoValidation", () => ({
  default: ({ validationQoIOverride }: { validationQoIOverride?: string }) => (
    <div data-testid="su-mo-validation">{validationQoIOverride}</div>
  ),
}));

describe("ValidationModal", () => {
  beforeEach(() => {
    cleanup();
    contextState.selectedQoI = "y2";
    contextState.validationQoI = "y1";
    contextState.setValidationQoI.mockReset();
  });

  it("V48hz renders the SteppedPlotCard chrome: titled box with disabled Back/Next", () => {
    render(<ValidationModal open setOpen={vi.fn()} />);
    expect(document.querySelector('[mmux-testid="validation-modal"]')).not.toBeNull();
    expect(document.querySelector('[mmux-testid="header-title"]')?.textContent).toBe("Validation");
    const next = document.querySelector<HTMLButtonElement>('[mmux-testid="validation-plot-next"]');
    const back = document.querySelector<HTMLButtonElement>('[mmux-testid="validation-plot-back"]');
    expect(next).not.toBeNull();
    expect(back).not.toBeNull();
    expect(next?.disabled).toBe(true);
    expect(back?.disabled).toBe(true);
  });

  it("renders nothing while closed", () => {
    render(<ValidationModal open={false} setOpen={vi.fn()} />);
    expect(document.querySelector('[mmux-testid="validation-modal"]')).toBeNull();
  });

  it("binds the header selector and the CV content to validationQoI, not selectedQoI", () => {
    render(<ValidationModal open setOpen={vi.fn()} />);
    expect(document.querySelector('[mmux-testid="validation-qoi-select"]')).not.toBeNull();
    expect(screen.getByTestId("su-mo-validation").textContent).toBe("y1");
  });

  it("re-resolves a stale validation QoI that is absent from this function's outputs", () => {
    contextState.validationQoI = "gone";
    render(<ValidationModal open setOpen={vi.fn()} />);
    expect(contextState.setValidationQoI).toHaveBeenCalledWith("y2");
  });

  it("keeps a valid validation QoI untouched", () => {
    render(<ValidationModal open setOpen={vi.fn()} />);
    expect(contextState.setValidationQoI).not.toHaveBeenCalled();
  });
});
