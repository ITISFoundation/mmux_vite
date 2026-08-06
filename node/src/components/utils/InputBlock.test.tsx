import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InputBlock } from "./InputBlock";

describe("InputBlock", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  const defaultProps: InputBlockProps = {
    name: "Test Input",
    value: 42,
    error: false,
    type: "number",
    minmax: { min: -1e9, max: 1e9 },
    onChange: vi.fn(),
  };

  it("renders with correct label and value", () => {
    const { getByText, getByDisplayValue } = render(<InputBlock {...defaultProps} />);
    expect(getByText(/Test Input:/)).toBeTruthy();
    expect(getByDisplayValue("42")).toBeTruthy();
  });

  it("calls onChange with new value on blur", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<InputBlock {...defaultProps} onChange={onChange} />);
    const input = getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "55" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(55);
  });

  it("shows error state when error prop is true", () => {
    const customProps: InputBlockProps = {
      name: "Test Input",
      value: 100,
      type: "number",
      error: false,
      minmax: { min: -1e9, max: 1e9 },
      onChange: vi.fn(),
    };
    const { getByRole } = render(<InputBlock {...customProps} error />);
    const input = getByRole("spinbutton") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("shows empty value if currentValue is NaN", () => {
    const { getByRole } = render(<InputBlock {...defaultProps} value={NaN} />);
    const input = getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("uses type prop if provided", () => {
    const customProps: InputBlockProps = {
      name: "Test Input",
      value: 100,
      type: "text",
      error: false,
      minmax: { min: -1e9, max: 1e9 },
      onChange: vi.fn(),
    };
    const { getByRole } = render(<InputBlock {...customProps} />);
    const input = getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveProperty("type", "text");
  });

  it("re-syncs displayed value when the value prop changes after mount (B27/B28/B29 stale-prop fix)", () => {
    const { getByDisplayValue, rerender } = render(<InputBlock {...defaultProps} value={42} />);
    expect(getByDisplayValue("42")).toBeTruthy();

    rerender(<InputBlock {...defaultProps} value={7} />);
    expect(getByDisplayValue("7")).toBeTruthy();
  });

  it("does not render a refresh button when onRefresh is not provided", () => {
    const { queryByRole } = render(<InputBlock {...defaultProps} />);
    expect(queryByRole("button", { name: `Refresh ${defaultProps.name}` })).not.toBeInTheDocument();
  });

  it("renders a refresh button and calls onRefresh when clicked (T25)", () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(<InputBlock {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(getByRole("button", { name: `Refresh ${defaultProps.name}` }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
