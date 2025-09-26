import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { beforeEach, describe, expect, it } from "vitest";
import { DisplayMessage } from "./DisplayMessage";

describe("DisplayMessage", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it("renders the message", () => {
    renderWithTheme(<DisplayMessage mssg="Hello, world!" />);
    expect(screen.getByText("Hello, world!")).toBeDefined();
  });

  it("renders children", () => {
    renderWithTheme(
      <DisplayMessage mssg="Parent">
        <div data-testid="child">Child</div>
      </DisplayMessage>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Child")).toBeDefined();
  });

  it("applies the default height when height is not provided", () => {
    renderWithTheme(<DisplayMessage mssg="Height test" />);
    const box = screen.getByText("Height test").parentElement as HTMLDivElement;
    const style = window.getComputedStyle(box);
    expect(box).toBeDefined();
    expect(style.height).toBe("400px");
  });

  it("applies the given height when height is provided", () => {
    renderWithTheme(<DisplayMessage mssg="Height test" height={250} />);
    const box = screen.getByText("Height test").parentElement as HTMLDivElement;
    const style = window.getComputedStyle(box);
    expect(box).toBeDefined();
    expect(style.height).toBe("250px");
  });
});
