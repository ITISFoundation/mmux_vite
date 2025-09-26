import React from "react";
import { render, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NavigationContextProvider, useNavigationContext } from "./NavigationContext";

// Mock usePersistenceContext
const mockSaveState = vi.fn();
const mockUsePersistenceContext = vi.fn();

vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => mockUsePersistenceContext(),
}));

function TestComponent() {
  const { currentView, setCurrentView, steps } = useNavigationContext();
  return (
    <div>
      <span data-testid="currentView">{currentView}</span>
      <span data-testid="steps">{steps.length}</span>
      <button type="button" onClick={() => setCurrentView(1)}>
        Set View 1
      </button>
    </div>
  );
}

describe("NavigationContext", () => {
  beforeEach(() => {
    mockSaveState.mockClear();
    mockUsePersistenceContext.mockReset();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides default currentView and steps", () => {
    mockUsePersistenceContext.mockReturnValue({
      persistence: {},
      saveState: mockSaveState,
      loading: false,
    });

    const { getByTestId } = render(
      <NavigationContextProvider>
        <TestComponent />
      </NavigationContextProvider>,
    );

    expect(getByTestId("currentView").textContent).toBe("0");
    expect(getByTestId("steps").textContent).toBe("2");
  });

  it("loads currentView from persistence", () => {
    mockUsePersistenceContext.mockReturnValue({
      persistence: { currentView: 1 },
      saveState: mockSaveState,
      loading: false,
    });

    const { getByTestId } = render(
      <NavigationContextProvider>
        <TestComponent />
      </NavigationContextProvider>,
    );

    expect(getByTestId("currentView").textContent).toBe("1");
  });

  it("calls saveState when currentView changes", () => {
    mockUsePersistenceContext.mockReturnValue({
      persistence: { currentView: 0 },
      saveState: mockSaveState,
      loading: false,
    });

    const { getByText } = render(
      <NavigationContextProvider>
        <TestComponent />
      </NavigationContextProvider>,
    );

    act(() => {
      getByText("Set View 1").click();
    });

    expect(mockSaveState).toHaveBeenCalled();
    expect(mockSaveState.mock.calls[0][0].currentView).toBe(1);
  });

  it("throws error if useNavigationContext is used outside provider", () => {
    // Suppress error output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => useNavigationContext()).toThrow();
    spy.mockRestore();
  });
});
