import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { JobsLoading } from "./JobsLoading";

describe("JobsLoading", () => {
  beforeEach(cleanup);

  it("renders the message and progress percentage", () => {
    render(<JobsLoading jobProgress={42.4} message="Loading jobs" />);

    expect(screen.getByText("Loading jobs")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("clamps progress above 100 percent", () => {
    render(<JobsLoading jobProgress={125} message="Complete" />);

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
