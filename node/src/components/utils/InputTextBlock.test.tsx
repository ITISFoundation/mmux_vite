import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { InputTextBlock } from "./InputTextBlock";

describe("InputTextBlock", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  const inputFieldDefaultSettings = {
    name: "Test Label",
    value: "123",
    onChange: vi.fn(),
  };

  it("renders the label and value", () => {
    render(<InputTextBlock {...inputFieldDefaultSettings} />);
    expect(screen.getByText(/Test Label:/)).toBeDefined();
    const input = screen.getByRole("spinbutton");
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).value).toBe("123");
  });

  it("calls onChange with the new value when input changes", () => {
    render(<InputTextBlock {...inputFieldDefaultSettings} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "456" } });
    expect(inputFieldDefaultSettings.onChange).toHaveBeenCalledWith("456");
  });

  it("renders with different props", () => {
    render(<InputTextBlock name="Another Label" value="42" onChange={vi.fn()} />);
    expect(screen.getByText(/Another Label:/)).toBeDefined();
    expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("42");
  });
});
