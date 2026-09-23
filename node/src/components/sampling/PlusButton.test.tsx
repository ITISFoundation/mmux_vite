import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlusButton from "./PlusButton";

const mocks = vi.hoisted(() => ({ launchingSampling: false }));

vi.mock("../../context/SamplingContext", () => ({ useSamplingContext: () => ({ launchingSampling: mocks.launchingSampling }) }));

function Plot() {
  return <div>Plot content</div>;
}

describe("PlusButton", () => {
  beforeEach(() => {
    cleanup();
    mocks.launchingSampling = false;
  });

  it("opens and closes an enabled plot panel", () => {
    const onClickFun = vi.fn();
    render(<PlusButton enabled text="Add plot" onClickFun={onClickFun} plotFunComponent={Plot} mmmuxTestid="add-plot" />);

    const summary = screen.getByText("Add plot");
    fireEvent.click(summary);
    expect(screen.getByText("Plot content")).toBeInTheDocument();

    fireEvent.click(summary);
    expect(onClickFun).toHaveBeenCalledOnce();
  });

  it("does not open a disabled panel", () => {
    render(<PlusButton enabled={false} text="Unavailable" onClickFun={vi.fn()} plotFunComponent={Plot} />);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("closes an open panel after sampling finishes", () => {
    const { rerender } = render(<PlusButton enabled text="Refresh plot" onClickFun={vi.fn()} plotFunComponent={Plot} />);
    const summary = screen.getByRole("button", { name: "Refresh plot" });
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");

    mocks.launchingSampling = true;
    rerender(<PlusButton enabled text="Refresh plot" onClickFun={vi.fn()} plotFunComponent={Plot} />);
    mocks.launchingSampling = false;
    rerender(<PlusButton enabled text="Refresh plot" onClickFun={vi.fn()} plotFunComponent={Plot} />);

    expect(screen.getByRole("button", { name: "Refresh plot" })).toHaveAttribute("aria-expanded", "false");
  });
});
