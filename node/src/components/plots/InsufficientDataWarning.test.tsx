import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import InsufficientDataWarning from "./InsufficientDataWarning";

describe("InsufficientDataWarning", () => {
  it("shows an explicit request error instead of the generic support message", () => {
    render(
      <InsufficientDataWarning
        fetchedJobCollections={undefined}
        filteredJobList={[]}
        numInputVars={3}
        errorMessage="Input variables are missing from completed job inputs: internal_gap_max_mm"
      />,
    );

    expect(screen.getByText(/Input variables are missing/)).toBeInTheDocument();
    expect(screen.queryByText("Error during calculation, please contact support.")).toBeNull();
  });
});
