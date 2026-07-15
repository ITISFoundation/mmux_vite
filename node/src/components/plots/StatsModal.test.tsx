import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import StatsModal from "./StatsModal";

describe("StatsModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and children when open", () => {
    render(
      <StatsModal open setOpen={vi.fn()} title="UQ Stats" testId="uq-stats-modal">
        <div>Modal content</div>
      </StatsModal>,
    );
    // MUI's Modal renders into a portal on document.body, not inside RTL's `container`.
    expect(document.querySelector('[mmux-testid="uq-stats-modal"]')).toBeInTheDocument();
    expect(screen.getByText("UQ Stats")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <StatsModal open={false} setOpen={vi.fn()} title="UQ Stats" testId="uq-stats-modal">
        <div>Modal content</div>
      </StatsModal>,
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });
});
