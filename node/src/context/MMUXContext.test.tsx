import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MMUXContextProvider, useMMUXContext } from "./MMUXContext";

// Mock usePersistenceContext (mutable: tests can vary the loaded file shape)
const mocks = vi.hoisted(() => ({
  persistence: {} as Record<string, unknown>,
}));

vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => ({
    persistence: mocks.persistence,
    saveState: vi.fn(),
    loading: false,
  }),
}));

const basePersistence = {
  currentView: "testView",
  numSamples: { foo: 1 },
  selectedQoI: "QoI1",
  isSuMoGenerated: true,
  weights: { foo: 0.5 },
  sortModel: [{ field: "foo", sort: "asc" }],
};

// Dummy child component to consume context
function Consumer() {
  const ctx = useMMUXContext();
  return (
    <div>
      <span data-testid="numSamples">{JSON.stringify(ctx.numSamples)}</span>
      <span data-testid="selectedQoI">{ctx.selectedQoI}</span>
      <span data-testid="isSuMoGenerated">{ctx.isSuMoGenerated ? "yes" : "no"}</span>
      <span data-testid="uqSettings">{JSON.stringify(ctx.uqSettings)}</span>
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
    mocks.persistence = { ...basePersistence };
  });

  it("provides initial context values from persistence", async () => {
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );
    expect(screen.getByTestId("numSamples").textContent).toBe(JSON.stringify({ foo: 1 }));
    expect(screen.getByTestId("selectedQoI").textContent).toBe("QoI1");
    expect(screen.getByTestId("isSuMoGenerated").textContent).toBe("yes");
  });

  it("migrates legacy numSamples when the file has no uqSettings", async () => {
    // basePersistence above IS such a legacy file: numSamples { foo: 1 }, no uqSettings
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );
    expect(screen.getByTestId("uqSettings").textContent).toBe(
      JSON.stringify({ foo: { numSamples: 1, nHistograms: 50, seed: 0 } }),
    );
  });

  it("keeps explicit uqSettings entries over migrated legacy ones", async () => {
    mocks.persistence = {
      ...basePersistence,
      uqSettings: { foo: { numSamples: 4242, nHistograms: 7, seed: 9 } },
    };
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );
    expect(screen.getByTestId("uqSettings").textContent).toBe(
      JSON.stringify({ foo: { numSamples: 4242, nHistograms: 7, seed: 9 } }),
    );
  });

  it("updates context values when setters are called", async () => {
    render(
      <MMUXContextProvider>
        <Consumer />
      </MMUXContextProvider>,
    );

    act(() => {
      screen.getByText("setNumSamples").click();
      screen.getByText("setSelectedQoI").click();
      screen.getByText("setIsSuMoGenerated").click();
    });

    expect(screen.getByTestId("numSamples").textContent).toBe(JSON.stringify({ bar: 2 }));
    expect(screen.getByTestId("selectedQoI").textContent).toBe("QoI2");
    expect(screen.getByTestId("isSuMoGenerated").textContent).toBe("no");
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
