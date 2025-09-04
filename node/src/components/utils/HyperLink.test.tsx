import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { beforeEach, describe, expect, it } from "vitest";
import StyledHyperLink from "./HyperLink";

describe("StyledHyperLink", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme({
      palette: {
        primary: { main: "#1976d2" },
      },
    });
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it("renders the link with provided text and href", () => {
    renderWithTheme(<StyledHyperLink text="Google" link="https://google.com" />);
    const link = screen.getByRole("link", { name: "Google" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://google.com");
    expect(link.getAttribute("style")).toEqual("color: rgb(25, 118, 210); text-decoration: underline;");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("renders the link with # when link is undefined", () => {
    renderWithTheme(<StyledHyperLink text="No Link" link={undefined} />);
    const link = screen.getByRole("link", { name: "No Link" });
    expect(link.getAttribute("href")).toBe("#");
  });

  it("renders the correct text", () => {
    renderWithTheme(<StyledHyperLink text="Test Text" link="https://example.com" />);
    expect(screen.getByText("Test Text")).toBeDefined();
  });
});
