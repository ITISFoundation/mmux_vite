import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ValueConfig from "./ValueConfig";
import VariableConfig from "./VariableConfig";

describe("setup configuration inputs", () => {
  beforeEach(cleanup);

  it("renders a value field and forwards blur changes", () => {
    const handleInputChange = vi.fn();
    render(<ValueConfig inputVar={{ variable: "alpha", value: 1 } as never} index={0} handleInputChange={handleInputChange} />);

    const input = screen.getByRole("spinbutton", { name: /Value/ });
    expect(input).toHaveValue(1);
    fireEvent.change(input, { target: { value: "2.5" } });
    fireEvent.blur(input);
    expect(handleInputChange).toHaveBeenCalledWith(0, "value", 2.5);
  });

  it("marks negative single-job values as invalid", () => {
    render(<ValueConfig inputVar={{ variable: "alpha", value: -1 } as never} index={0} handleInputChange={vi.fn()} />);

    expect(screen.getByRole("spinbutton", { name: /Value/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("renders range fields and forwards start/end changes", () => {
    const handleInputChange = vi.fn();
    render(
      <VariableConfig
        inputVar={{ variable: "alpha", start: 0, end: 1 } as never}
        index={1}
        handleInputChange={handleInputChange}
      />,
    );

    const start = screen.getByRole("spinbutton", { name: /Start/ });
    const end = screen.getByRole("spinbutton", { name: /End/ });
    fireEvent.change(start, { target: { value: "-2" } });
    fireEvent.blur(start);
    fireEvent.change(end, { target: { value: "3" } });
    fireEvent.blur(end);

    expect(handleInputChange).toHaveBeenNthCalledWith(1, 1, "start", -2);
    expect(handleInputChange).toHaveBeenNthCalledWith(2, 1, "end", 3);
  });

  it("flags a range start below the allowed minimum", () => {
    render(
      <VariableConfig inputVar={{ variable: "alpha", start: -1e10, end: 1 } as never} index={0} handleInputChange={vi.fn()} />,
    );

    expect(screen.getByRole("spinbutton", { name: /Start/ })).toHaveAttribute("aria-invalid", "true");
  });
});
