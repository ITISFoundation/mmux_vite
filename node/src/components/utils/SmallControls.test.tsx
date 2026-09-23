import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OptionSelector from "./OptionSelect";
import { CustomAnimatedToggle } from "./CustomAnimatedToggle";

describe("small utility controls", () => {
  beforeEach(cleanup);

  it("selects an option and supports an optional title", () => {
    const setCurrentValue = vi.fn();
    render(
      <OptionSelector
        property="Mode"
        possibleValues={[
          { key: "fast", label: "Fast" },
          { key: "safe", label: "Safe" },
        ]}
        currentValue="fast"
        setCurrentValue={setCurrentValue}
        title="Choose mode"
      />,
    );

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Safe" }));
    expect(setCurrentValue).toHaveBeenCalledWith("safe");
  });

  it("handles boolean and per-option disabled toggle states", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CustomAnimatedToggle disabled={false} data={["A", "B"]} value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith(1);

    rerender(<CustomAnimatedToggle disabled={[false, true]} data={["A", "B"]} value={1} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled();

    rerender(<CustomAnimatedToggle disabled={[true, true]} data={["A", "B"]} value={0} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled();
  });
});
