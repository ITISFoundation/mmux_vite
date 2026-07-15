import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders the label and a precision-formatted numeric value", () => {
    render(<StatCard label="MAE" value={0.123456} precision={4} />);
    expect(screen.getByText("MAE")).toBeInTheDocument();
    expect(screen.getByText((0.123456).toPrecision(4))).toBeInTheDocument();
  });

  it("renders a string value as-is", () => {
    render(<StatCard label="Status" value="coming soon" />);
    expect(screen.getByText("coming soon")).toBeInTheDocument();
  });
});
