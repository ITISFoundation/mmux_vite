import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MOGATableContextProvider, useMOGATableContext } from "./MOGATableContext";

// Mock usePersistenceContext
const mockSaveState = vi.fn();
const mockPersistence = {
  weights: { a: 1 },
  sortModel: [{ field: "a", sort: "asc" }],
  currentView: "view1",
};
const mockUsePersistenceContext = vi.fn(() => ({
  persistence: mockPersistence,
  saveState: mockSaveState,
  loading: false,
}));

vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => mockUsePersistenceContext(),
}));

function TestConsumer() {
  const { weights, setWeights, sortModel, setSortModel } = useMOGATableContext();
  return (
    <div>
      <span data-testid="weights">{JSON.stringify(weights)}</span>
      <span data-testid="sortModel">{JSON.stringify(sortModel)}</span>
      <button type="button" data-testid="setWeights" onClick={() => setWeights({ b: 2 })}>
        Set Weights
      </button>
      <button type="button" data-testid="setSortModel" onClick={() => setSortModel([{ field: "b", sort: "desc" }])}>
        Set Sort Model
      </button>
    </div>
  );
}

describe("MOGATableContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides initial context values from persistence", () => {
    const { getByTestId } = render(
      <MOGATableContextProvider>
        <TestConsumer />
      </MOGATableContextProvider>,
    );
    expect(getByTestId("weights").textContent).toBe(JSON.stringify({ a: 1 }));
    expect(getByTestId("sortModel").textContent).toBe(JSON.stringify([{ field: "a", sort: "asc" }]));
  });

  it("updates weights and calls saveState", async () => {
    const { getByTestId } = render(
      <MOGATableContextProvider>
        <TestConsumer />
      </MOGATableContextProvider>,
    );
    await act(() => getByTestId("setWeights").click());
    expect(getByTestId("weights").textContent).toBe(JSON.stringify({ b: 2 }));
    expect(mockSaveState).toHaveBeenCalledWith(expect.objectContaining({ weights: { b: 2 } }));
  });

  it("updates sortModel and calls saveState", async () => {
    const { getByTestId } = render(
      <MOGATableContextProvider>
        <TestConsumer />
      </MOGATableContextProvider>,
    );
    await act(() => getByTestId("setSortModel").click());
    expect(getByTestId("sortModel").textContent).toBe(JSON.stringify([{ field: "b", sort: "desc" }]));
    expect(mockSaveState).toHaveBeenCalledWith(expect.objectContaining({ sortModel: [{ field: "b", sort: "desc" }] }));
  });

  it("throws error if useMOGATableContext is used outside provider", () => {
    // Suppress error output for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow("useMOGATableContext must be used within a MOGATableContextProvider");
    spy.mockRestore();
  });
});
