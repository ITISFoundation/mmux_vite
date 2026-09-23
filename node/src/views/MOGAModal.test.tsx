import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MOGAModal from "./MOGAModal";

const mocks = vi.hoisted(() => ({
  selectedFunction: { uid: "fn-1" } as { uid: string } | undefined,
  mogaSettings: {} as Record<string, unknown>,
  setMOGASettings: vi.fn(),
}));

vi.mock("../context/FunctionContext", () => ({ useFunctionContext: () => ({ selectedFunction: mocks.selectedFunction }) }));
vi.mock("../context/MOGASettingsContext", async importOriginal => ({
  ...(await importOriginal<typeof import("../context/MOGASettingsContext")>()),
  useMOGASettingsContext: () => ({ mogaSettings: mocks.mogaSettings, setMOGASettings: mocks.setMOGASettings }),
}));
vi.mock("../components/navigation/Header", () => ({ default: () => null }));
vi.mock("../components/utils/CustomTooltip", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("../components/utils/OptionSelect", () => ({
  default: ({ property, setCurrentValue }: { property: string; setCurrentValue: (v: string) => void }) => (
    <button type="button" onClick={() => setCurrentValue(`${property}-picked`)}>
      {property}
    </button>
  ),
}));

const input = (label: string) => screen.getByLabelText(label).querySelector("input") as HTMLInputElement;
const apply = () => screen.getByRole("button", { name: "Apply" });

function renderModal() {
  const setOpen = vi.fn();
  render(<MOGAModal open setOpen={setOpen} />);
  return setOpen;
}

describe("MOGAModal", () => {
  beforeEach(() => {
    mocks.selectedFunction = { uid: "fn-1" };
    mocks.mogaSettings = { other: { seed: 99 } };
    mocks.setMOGASettings = vi.fn();
  });

  it("gives every numeric field its own accessible name", () => {
    renderModal();
    for (const label of ["Population Size", "Iterations", "Seed", "Number of Seeds"]) {
      expect(screen.getAllByLabelText(label)).toHaveLength(1);
    }
  });

  it("applies edited settings for the selected function without touching other functions", () => {
    const setOpen = renderModal();
    fireEvent.change(input("Population Size"), { target: { value: "64" } });
    fireEvent.change(input("Number of Seeds"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Fitness Type" }));
    fireEvent.click(apply());

    expect(mocks.setMOGASettings).toHaveBeenCalledWith({
      other: { seed: 99 },
      "fn-1": expect.objectContaining({ populationSize: 64, numberSeeds: 3, fitnessType: "Fitness Type-picked" }),
    });
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("discards edits back to the saved settings without saving", () => {
    mocks.mogaSettings = { "fn-1": { populationSize: 10, maxIterations: 20, seed: 5 } };
    const setOpen = renderModal();
    fireEvent.change(input("Population Size"), { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(mocks.setMOGASettings).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(input("Population Size")).toHaveValue(10);
  });

  it.each([
    ["Population Size", "0"],
    ["Population Size", ""],
    ["Population Size", "2000000"],
    ["Iterations", "0"],
    ["Iterations", ""],
    ["Seed", "0"],
    ["Seed", ""],
    ["Seed", "2000000"],
    ["Number of Seeds", "0"],
    ["Number of Seeds", ""],
  ])("blocks Apply when %s is %j", (label, value) => {
    renderModal();
    expect(apply()).toBeEnabled();
    fireEvent.change(input(label), { target: { value } });
    expect(apply()).toBeDisabled();
  });

  it("blocks Apply when no function is selected", () => {
    mocks.selectedFunction = undefined;
    renderModal();
    expect(apply()).toBeDisabled();
  });
});
