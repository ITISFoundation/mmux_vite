import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UQPlotsSteps from "./UQPlotsSteps";

vi.mock("./UncertainUQ", () => ({
  default: () => <div data-testid="uncertain-uq">UncertainUQ content</div>,
}));

vi.mock("./CorrelationIndicesPlot", () => ({
  default: () => <div data-testid="correlation-plot">CorrelationIndicesPlot content</div>,
}));

vi.mock("./SobolIndicesPlot", () => ({
  default: () => <div data-testid="sobol-plot">SobolIndicesPlot content</div>,
}));

const defaultProps = {
  loading: false,
  jobProgress: 0,
  colsFetched: { current: 0 },
  jobsFetched: { current: 0 },
};

describe("UQPlotsSteps", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders 3 named step titles", () => {
    render(<UQPlotsSteps {...defaultProps} />);
    expect(screen.getByText("Histogram")).toBeDefined();
    expect(screen.getByTestId("uncertain-uq")).toBeDefined();
  });

  it("shows Histogram content on first step", () => {
    render(<UQPlotsSteps {...defaultProps} />);
    expect(screen.getByTestId("uncertain-uq")).toBeDefined();
    expect(screen.queryByTestId("correlation-plot")).toBeNull();
    expect(screen.queryByTestId("sobol-plot")).toBeNull();
  });

  it("navigates to Correlation step on Next click", async () => {
    render(<UQPlotsSteps {...defaultProps} />);
    await userEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Correlation")).toBeDefined();
    expect(screen.getByTestId("correlation-plot")).toBeDefined();
    expect(screen.queryByTestId("uncertain-uq")).toBeNull();
    expect(screen.queryByTestId("sobol-plot")).toBeNull();
  });

  it("navigates to Sobol' step on second Next click", async () => {
    render(<UQPlotsSteps {...defaultProps} />);
    await userEvent.click(screen.getByText("Next"));
    await userEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Sobol' Indices")).toBeDefined();
    expect(screen.getByTestId("sobol-plot")).toBeDefined();
    expect(screen.queryByTestId("uncertain-uq")).toBeNull();
    expect(screen.queryByTestId("correlation-plot")).toBeNull();
  });

  it("navigates back to previous step", async () => {
    render(<UQPlotsSteps {...defaultProps} />);
    await userEvent.click(screen.getByText("Next"));
    expect(screen.getByTestId("correlation-plot")).toBeDefined();
    await userEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("uncertain-uq")).toBeDefined();
    expect(screen.queryByTestId("correlation-plot")).toBeNull();
  });

  it("disables Back on first step", () => {
    render(<UQPlotsSteps {...defaultProps} />);
    const backButton = screen.getByText("Back").closest("button");
    expect(backButton).toHaveProperty("disabled", true);
  });

  it("shows the Stats button only on the Histogram step", async () => {
    const onStatsClick = vi.fn();
    render(<UQPlotsSteps {...defaultProps} onStatsClick={onStatsClick} />);
    expect(screen.getByText("Stats")).toBeDefined();

    await userEvent.click(screen.getByText("Next"));
    expect(screen.queryByText("Stats")).toBeNull();
  });

  it("calls onStatsClick when the Stats button is clicked", async () => {
    const onStatsClick = vi.fn();
    render(<UQPlotsSteps {...defaultProps} onStatsClick={onStatsClick} />);
    await userEvent.click(screen.getByText("Stats"));
    expect(onStatsClick).toHaveBeenCalledTimes(1);
  });

  it("disables Next on last step (Sobol')", async () => {
    render(<UQPlotsSteps {...defaultProps} />);
    await userEvent.click(screen.getByText("Next"));
    await userEvent.click(screen.getByText("Next"));
    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toHaveProperty("disabled", true);
  });
});
