import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UQSettingsModal from "./UQSettingsModal";
import { defaultUQSettings } from "../utils/uqSettings";

const mocks = vi.hoisted(() => ({
  uid: "fn-1",
  uqSettings: {} as Record<string, { numSamples: number; nHistograms: number; seed: number }>,
  setUQSettings: vi.fn(),
}));

vi.mock("../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: mocks.uid ? { uid: mocks.uid } : null }),
}));
vi.mock("../context/MMUXContext", () => ({
  useMMUXContext: () => ({ uqSettings: mocks.uqSettings, setUQSettings: mocks.setUQSettings }),
}));

beforeEach(() => {
  mocks.uid = "fn-1";
  mocks.uqSettings = {};
  mocks.setUQSettings.mockReset();
});

describe("UQSettingsModal", () => {
  it("renders nothing while closed", () => {
    // The modal marks itself with the app's custom `mmux-testid` attribute (UQSettingsModal.tsx:45),
    // which RTL's queryByTestId (data-testid) cannot see — query the attribute it actually renders.
    // The open dialog portals to document.body (outside RTL's container), so query at document
    // level, and prove presence-when-open so the closed-state null is a real regression detector.
    const { rerender } = render(<UQSettingsModal open={false} setOpen={vi.fn()} />);
    expect(document.querySelector('[mmux-testid="uq-settings-modal"]')).toBeNull();
    rerender(<UQSettingsModal open setOpen={vi.fn()} />);
    expect(document.querySelector('[mmux-testid="uq-settings-modal"]')).toBeInTheDocument();
  });

  it("seeds defaults for a function without stored settings", () => {
    render(<UQSettingsModal open setOpen={vi.fn()} />);
    expect(screen.getByLabelText("Number of UQ Samples")).toHaveValue(defaultUQSettings.numSamples);
    expect(screen.getByLabelText("Number of Histograms")).toHaveValue(50);
    expect(screen.getByLabelText("Seed")).toHaveValue(0);
  });

  it("merges persisted per-function settings over defaults", () => {
    mocks.uqSettings = { "fn-1": { numSamples: 250, nHistograms: 50, seed: 7 } };
    render(<UQSettingsModal open setOpen={vi.fn()} />);
    expect(screen.getByLabelText("Number of UQ Samples")).toHaveValue(250);
    expect(screen.getByLabelText("Seed")).toHaveValue(7);
  });

  it("coerces non-numeric and negative input to 0 while typing (save clamps)", () => {
    render(<UQSettingsModal open setOpen={vi.fn()} />);
    const samples = screen.getByLabelText("Number of UQ Samples");
    fireEvent.change(samples, { target: { value: "abc" } });
    expect(samples).toHaveValue(0);
    fireEvent.change(samples, { target: { value: "-5" } });
    expect(samples).toHaveValue(0);
    fireEvent.change(samples, { target: { value: "1200" } });
    expect(samples).toHaveValue(1200);
  });

  it("clamps to the declared ranges on save and closes", async () => {
    const user = userEvent.setup();
    const setOpen = vi.fn();
    render(<UQSettingsModal open setOpen={setOpen} />);
    fireEvent.change(screen.getByLabelText("Number of UQ Samples"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Seed"), { target: { value: "99999999" } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.setUQSettings).toHaveBeenCalledWith({
      "fn-1": { numSamples: 1, nHistograms: 50, seed: 1000000 },
    });
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("falls back to the empty-function key when no function is selected", async () => {
    const user = userEvent.setup();
    mocks.uid = "";
    render(<UQSettingsModal open setOpen={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.setUQSettings).toHaveBeenCalledWith({ "": defaultUQSettings });
  });

  it("closes via the modal Escape handler", () => {
    const setOpen = vi.fn();
    render(<UQSettingsModal open setOpen={setOpen} />);
    fireEvent.keyDown(screen.getByRole("presentation"), { key: "Escape" });
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
