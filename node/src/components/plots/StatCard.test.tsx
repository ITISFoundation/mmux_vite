import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders a label and formatted value", () => {
    render(<StatCard label="RMSE" value={1.234567} />);

    expect(screen.getByText("RMSE")).toBeDefined();
    expect(screen.getByText("1.2346")).toBeDefined();
  });
});
