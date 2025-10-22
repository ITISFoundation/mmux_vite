import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MOGASettingsContextProvider, useMOGASettingsContext, defaultMogaValues } from "./MOGASettingsContext";

// Mock PersistenceContext
const mockSaveState = vi.fn();
const mockPersistence = {
  currentView: "test",
  mogaSettings: { test: { ...defaultMogaValues } },
};
const mockUsePersistenceContext = vi.fn().mockReturnValue({
  persistence: mockPersistence,
  saveState: mockSaveState,
  loading: false,
});
vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => mockUsePersistenceContext(),
}));

function TestComponent() {
  const { mogaSettings, setMOGASettings } = useMOGASettingsContext();
  return (
    <div>
      <span data-testid="maxIterations">{mogaSettings.test?.maxIterations ?? "no-settings"}</span>
      <button
        type="button"
        data-testid="setMogaSettings"
        onClick={() =>
          setMOGASettings({
            test: {
              ...defaultMogaValues,
              maxIterations: 200,
            },
          })
        }
      >
        Update
      </button>
    </div>
  );
}

describe("MOGASettingsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides default mogaSettings from persistence", () => {
    const { getByTestId } = render(
      <MOGASettingsContextProvider>
        <TestComponent />
      </MOGASettingsContextProvider>,
    );
    expect(getByTestId("maxIterations").textContent).toBe("100");
  });

  it("updates mogaSettings and persists changes", () => {
    const { getByTestId } = render(
      <MOGASettingsContextProvider>
        <TestComponent />
      </MOGASettingsContextProvider>,
    );
    act(() => {
      screen.getByTestId("setMogaSettings").click();
    });
    expect(getByTestId("maxIterations").textContent).toBe("200");
    expect(mockSaveState).toHaveBeenCalledWith(
      expect.objectContaining({
        mogaSettings: {
          test: expect.objectContaining({ maxIterations: 200 }),
        },
      }),
    );
  });

  it("throws error if used outside provider", () => {
    // Suppress error output for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function ErrorComponent() {
      useMOGASettingsContext();
      return null;
    }
    expect(() => render(<ErrorComponent />)).toThrow("useMOGASettingsContext must be used within a MOGASettingsContextProvider");
    spy.mockRestore();
  });
});
