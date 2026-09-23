import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import CalculatingWarning from "./CalculatingWarning";
import InsufficientDataWarning from "./InsufficientDataWarning";

describe("plot warning states", () => {
  beforeEach(cleanup);

  it("shows calculating text unless text is suppressed", () => {
    render(<CalculatingWarning height={240} />);
    expect(screen.getByText("Calculating...")).toBeInTheDocument();

    cleanup();
    render(<CalculatingWarning dontShowText />);
    expect(screen.queryByText("Calculating...")).not.toBeInTheDocument();
  });

  it("explains when there is no fetched data", () => {
    render(<InsufficientDataWarning fetchedJobCollections={undefined} filteredJobList={[]} numInputVars={2} />);

    expect(screen.getByText("No data available. Please create more Samples.")).toBeInTheDocument();
  });

  it("explains the sample minimum for high-dimensional inputs", () => {
    render(<InsufficientDataWarning fetchedJobCollections={[{} as never]} filteredJobList={[]} numInputVars={6} />);

    expect(
      screen.getByText("You need at least 7 samples (one more than your 6 input variables) to avoid an underdetermined system."),
    ).toBeInTheDocument();
  });
});
