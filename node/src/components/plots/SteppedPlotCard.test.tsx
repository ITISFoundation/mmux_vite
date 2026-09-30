import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SteppedPlotCard, { type SteppedStep } from "./SteppedPlotCard";

const makeSteps = (count: number): SteppedStep[] =>
  Array.from({ length: count }, (_, i) => ({
    title: `Step ${i + 1}`,
    content: <div data-testid={`content-${i + 1}`}>Content for step {i + 1}</div>,
  }));

describe("SteppedPlotCard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders the active step title", () => {
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={0} maxSteps={3} onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText("Step 1")).toBeDefined();
  });

  it("renders the active step content", () => {
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={1} maxSteps={3} onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId("content-2")).toBeDefined();
    expect(screen.queryByTestId("content-1")).toBeNull();
  });

  it("calls onNext when Next button is clicked", async () => {
    const onNext = vi.fn();
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={0} maxSteps={3} onNext={onNext} onBack={vi.fn()} />);
    await userEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when Back button is clicked", async () => {
    const onBack = vi.fn();
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={1} maxSteps={3} onNext={vi.fn()} onBack={onBack} />);
    await userEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("disables Back on first step", () => {
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={0} maxSteps={3} onNext={vi.fn()} onBack={vi.fn()} />);
    const backButton = screen.getByText("Back").closest("button");
    expect(backButton).toHaveProperty("disabled", true);
  });

  it("disables Next on last step", () => {
    render(<SteppedPlotCard steps={makeSteps(3)} activeStep={2} maxSteps={3} onNext={vi.fn()} onBack={vi.fn()} />);
    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toHaveProperty("disabled", true);
  });

  it("renders qoiSelector when provided", () => {
    render(
      <SteppedPlotCard
        steps={makeSteps(2)}
        activeStep={0}
        maxSteps={2}
        onNext={vi.fn()}
        onBack={vi.fn()}
        qoiSelector={<div data-testid="qoi-selector">QoI Selector</div>}
      />,
    );
    expect(screen.getByTestId("qoi-selector")).toBeDefined();
  });

  it("updates title and content when activeStep changes", () => {
    const { rerender } = render(
      <SteppedPlotCard
        steps={[
          { title: "First", content: <div data-testid="content-1">First content</div> },
          { title: "Second", content: <div data-testid="content-2">Second content</div> },
          { title: "Third", content: <div data-testid="content-3">Third content</div> },
        ]}
        activeStep={0}
        maxSteps={3}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("First")).toBeDefined();
    expect(screen.getByTestId("content-1")).toBeDefined();

    rerender(
      <SteppedPlotCard
        steps={[
          { title: "First", content: <div data-testid="content-1">First content</div> },
          { title: "Second", content: <div data-testid="content-2">Second content</div> },
          { title: "Third", content: <div data-testid="content-3">Third content</div> },
        ]}
        activeStep={1}
        maxSteps={3}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("Second")).toBeDefined();
    expect(screen.getByTestId("content-2")).toBeDefined();
    expect(screen.queryByTestId("content-1")).toBeNull();
  });

  it("passes custom testids to buttons", () => {
    const { container } = render(
      <SteppedPlotCard
        steps={makeSteps(2)}
        activeStep={0}
        maxSteps={2}
        onNext={vi.fn()}
        onBack={vi.fn()}
        nextTestId="custom-next"
        backTestId="custom-back"
      />,
    );
    expect(container.querySelector('[mmux-testid="custom-next"]')).not.toBeNull();
    expect(container.querySelector('[mmux-testid="custom-back"]')).not.toBeNull();
  });
});
