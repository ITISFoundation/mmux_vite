import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MMUXContextProvider, useMMUXContext } from "./MMUXContext";

// Mock usePersistenceContext
vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => ({
    persistence: {
      currentView: "testView",
      numSamples: { foo: 1 },
      numIterations: { foo: 100 },
      crossover: { foo: 3 },
      selectedQoI: "QoI1",
      isSuMoGenerated: true,
      weights: { foo: 0.5 },
      sortModel: [{ field: "foo", sort: "asc" }],
    },
    saveState: vi.fn(),
    loading: false,
  }),
}));

// Dummy child component to consume context
function Consumer() {
  const ctx = useMMUXContext();
  return (
    <div>
      <span data-testid="numSamples">{JSON.stringify(ctx.numSamples)}</span>
      <span data-testid="selectedQoI">{ctx.selectedQoI}</span>
      <span data-testid="isSuMoGenerated">{ctx.isSuMoGenerated ? "yes" : "no"}</span>
      <button type="button" onClick={() => ctx.setNumSamples({ bar: 2 })}>
        setNumSamples
      </button>
      <button type="button" onClick={() => ctx.setSelectedQoI("QoI2")}>
        setSelectedQoI
      </button>
      <button type="button" onClick={() => ctx.setIsSuMoGenerated(false)}>
        setIsSuMoGenerated
      </button>
    </div>
  );
}

describe("MMUXContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides initial context values from persistence", async () => {
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );
    expect(screen.getByTestId("numSamples").textContent).toBe(JSON.stringify({ foo: 1 }));
    expect(screen.getByTestId("numIterations").textContent).toBe(JSON.stringify({ foo: 100 }));
    expect(screen.getByTestId("crossover").textContent).toBe(JSON.stringify({ foo: 3 }));
    expect(screen.getByTestId("selectedQoI").textContent).toBe("QoI1");
    expect(screen.getByTestId("isSuMoGenerated").textContent).toBe("yes");
    expect(screen.getByTestId("weights").textContent).toBe(JSON.stringify({ foo: 0.5 }));
    expect(screen.getByTestId("sortModel").textContent).toContain("foo");
  });

  it("updates context values when setters are called", async () => {
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );

    act(() => {
      screen.getByText("setNumSamples").click();
      screen.getByText("setNumIterations").click();
      screen.getByText("setCrossover").click();
      screen.getByText("setSelectedQoI").click();
      screen.getByText("setIsSuMoGenerated").click();
      screen.getByText("setWeights").click();
      screen.getByText("setSortModel").click();
    });

    expect(screen.getByTestId("numSamples").textContent).toBe(JSON.stringify({ bar: 2 }));
    expect(screen.getByTestId("numIterations").textContent).toBe(JSON.stringify({ bar: 20 }));
    expect(screen.getByTestId("crossover").textContent).toBe(JSON.stringify({ bar: 200 }));
    expect(screen.getByTestId("selectedQoI").textContent).toBe("QoI2");
    expect(screen.getByTestId("isSuMoGenerated").textContent).toBe("no");
    expect(screen.getByTestId("weights").textContent).toBe(JSON.stringify({ bar: 0.8 }));
    expect(screen.getByTestId("sortModel").textContent).toContain("bar");
  });

  it("throws error if useMMUXContext is used outside provider", () => {
    // Suppress error output for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Broken() {
      useMMUXContext();
      return null;
    }
    expect(() => render(<Broken />)).toThrow("useMMUXContext must be used within a MMUXContextProvider");
    spy.mockRestore();
  });
});
