import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SplashScreen from "./SplashScreen";

describe("SplashScreen", () => {
  it("renders the branded startup card with a progress bar", () => {
    render(<SplashScreen />);
    expect(document.querySelector('[mmux-testid="splash-screen"]')).not.toBeNull();
    expect(screen.getByAltText("MetaModelingUX Logo")).toBeDefined();
    expect(screen.getByText("Starting up service")).toBeDefined();
    expect(screen.getByRole("progressbar")).toBeDefined();
  });
});
