import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QoISelector } from "./QoISelector";

/** The control is addressed by its `mmux-testid` (the repo's test-handle convention). */
function selectWrapper(testId: string): HTMLElement {
  return document.querySelector(`[mmux-testid="${testId}"]`) as HTMLElement;
}

/** The hidden native input mirrors what the Select currently holds. */
function hiddenValue(testId: string): string {
  return (selectWrapper(testId).querySelector("input") as HTMLInputElement).value;
}

describe("QoISelector", () => {
  afterEach(() => {
    cleanup();
  });

  it("labels the control, defaults its test handle and opens with no QoI selected", () => {
    const setSelectedQoI = vi.fn();
    render(<QoISelector outputVars={["y", "z"]} selectedQoI={undefined} setSelectedQoI={setSelectedQoI} />);

    expect(screen.getByText("Select Quantity of Interest")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Quantity of Interest" })).toBeInTheDocument();
    expect(selectWrapper("qoi-select")).toBeInTheDocument(); // testId default
    expect(hiddenValue("qoi-select")).toBe(""); // selectedQoI || "" — nothing picked yet
    expect(screen.queryByRole("option")).toBeNull(); // the menu mounts only when opened
  });

  it("shows the selected QoI and reports the choice through setSelectedQoI", () => {
    const setSelectedQoI = vi.fn();
    render(<QoISelector outputVars={["y", "z"]} selectedQoI="z" setSelectedQoI={setSelectedQoI} testId="validation-qoi" />);

    const combobox = screen.getByRole("combobox", { name: "Quantity of Interest" });
    expect(selectWrapper("validation-qoi")).toBeInTheDocument();
    expect(combobox).toHaveTextContent("z");

    fireEvent.mouseDown(combobox);
    fireEvent.click(screen.getByRole("option", { name: "y" }));
    expect(setSelectedQoI).toHaveBeenCalledWith("y");
  });

  it("renders an empty menu for a function without outputs", () => {
    const setSelectedQoI = vi.fn();
    render(<QoISelector outputVars={[]} selectedQoI={undefined} setSelectedQoI={setSelectedQoI} />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Quantity of Interest" }));
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    expect(screen.queryByRole("option")).toBeNull();
    expect(setSelectedQoI).not.toHaveBeenCalled();
  });
});
