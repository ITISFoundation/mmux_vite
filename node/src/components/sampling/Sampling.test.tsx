import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sampling } from "./Sampling";

vi.mock("./LHSSampling", () => ({ default: () => <div>LHS content</div> }));
vi.mock("./GridSearchSampling", () => ({ default: () => <div>Grid content</div> }));
vi.mock("./RunSingleJob", () => ({ default: () => <div>Test run content</div> }));

describe("Sampling", () => {
  beforeEach(cleanup);

  it("starts on LHS sampling", () => {
    render(<Sampling />);

    expect(screen.getByRole("tab", { name: "LHS Sampling" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("LHS content")).toBeInTheDocument();
  });

  it("switches between sampling modes", () => {
    render(<Sampling />);

    fireEvent.click(screen.getByRole("tab", { name: "Grid Sampling" }));
    expect(screen.getByText("Grid content")).toBeInTheDocument();
    expect(screen.queryByText("LHS content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Test Run" }));
    expect(screen.getByText("Test run content")).toBeInTheDocument();
  });
});
