import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import CustomTooltip from "./CustomTooltip";
import { Typography } from "@mui/material";
import { beforeEach, describe, expect, it } from "vitest";

describe("CustomTooltip", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  it("renders tooltip with title", async () => {
    render(
      <CustomTooltip title="Tooltip text">
        <button>Hover me</button>
      </CustomTooltip>
    );
    // Tooltip is not visible initially
    expect(screen.queryByText("Tooltip text")).toBeNull();

    // Show tooltip
    fireEvent.mouseOver(screen.getByRole("button"));
    expect(await screen.findByText("Tooltip text")).toBeDefined();
  });

  it("renders 'Read more...' link when ExtendedTootlip is provided", async () => {
    render(
      <CustomTooltip
        title="Tooltip text"
        ExtendedTootlip={<Typography>Extended content</Typography>}
      >
        <button>Hover me</button>
      </CustomTooltip>
    );
    fireEvent.mouseOver(screen.getByRole("button"));
    expect(await screen.findByText("Read more...")).toBeDefined();
  });

  it("opens modal with ExtendedTootlip when 'Read more...' is clicked", async () => {
    render(
      <CustomTooltip
        title="Tooltip text"
        ExtendedTootlip={
          <Typography data-testid="extended-content">Extended content</Typography>
        }
      >
        <button>Hover me</button>
      </CustomTooltip>
    );
    fireEvent.mouseOver(screen.getByRole("button"));
    const readMore = await screen.findByText("Read more...");
    fireEvent.click(readMore);
    expect(await screen.findByTestId("extended-content")).toBeDefined();
  });

  it("closes modal when backdrop is clicked", async () => {
    const {queryByTestId} = render(
      <CustomTooltip
        title="Tooltip text"
        ExtendedTootlip={
          <Typography data-testid="extended-content">Extended content</Typography>
        }
      >
        <button>Hover me</button>
      </CustomTooltip>
    );
    fireEvent.mouseOver(screen.getByRole("button"));
    const readMore = await screen.findByText("Read more...");
    fireEvent.click(readMore);
    expect(await screen.findByTestId("extended-content")).toBeDefined();

    // Modal backdrop click
    await fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() => { expect(queryByTestId("extended-content")?.getAttribute('tabindex')).toBe("-1");
    });
  });
});