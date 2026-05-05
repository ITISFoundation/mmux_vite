import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FunctionContextProvider, useFunctionContext } from "./FunctionContext";

// Explicit types keep the field types wide enough for the reassignments in beforeEach,
// where selectedFunction can be undefined and distribution can have arbitrary keys.
type MockPersistenceValues = {
  selectedFunction: Record<string, unknown> | undefined;
  inputVars: string[];
  outputVars: string[];
  distribution: Record<string, unknown>;
  outputTargets: Record<string, unknown>;
  outputLogScales: { [uid: string]: { [varName: string]: boolean } };
};

const persistenceState = {
  loading: false,
  values: {
    selectedFunction: { id: "func1", title: "Test Function" } as Record<string, unknown> | undefined,
    inputVars: ["x", "y"] as string[],
    outputVars: ["z"] as string[],
    distribution: {
      x: { distribution: "constant" as Distribution, value: 3 },
      y: { distribution: "constant" as Distribution, value: 4 },
    } as Record<string, unknown>,
    outputTargets: {} as Record<string, unknown>,
    outputLogScales: {} as { [uid: string]: { [varName: string]: boolean } },
  } as MockPersistenceValues,
  setFunctionValues: vi.fn(),
};

// Mock usePersistenceContext
vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => ({
    getFunctionValues: vi.fn(() => persistenceState.values),
    setFunctionValues: persistenceState.setFunctionValues,
    loading: persistenceState.loading,
  }),
}));

// Test consumer
function Consumer() {
  const ctx = useFunctionContext();
  return (
    <div>
      <span data-testid="selectedFunction">{ctx.selectedFunction?.title}</span>
      <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
      <span data-testid="outputVars">{ctx.outputVars.join(",")}</span>
      <span data-testid="distribution">{Object.keys(ctx.distribution).join(",")}</span>
    </div>
  );
}

function ReconcileConsumer() {
  const ctx = useFunctionContext();
  return (
    <div>
      <button
        type="button"
        data-testid="reconcile"
        onClick={() => ctx.reconcileFunctions([{ uid: "live-func", title: "Live Function" } as never])}
      >
        Reconcile
      </button>
      <span data-testid="selectedFunction">{ctx.selectedFunction?.title}</span>
      <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
      <span data-testid="distribution">{Object.keys(ctx.distribution).join(",")}</span>
    </div>
  );
}

describe("FunctionContextProvider", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
    persistenceState.loading = false;
    persistenceState.values = {
      selectedFunction: { id: "func1", title: "Test Function" },
      inputVars: ["x", "y"],
      outputVars: ["z"],
      distribution: {
        x: { distribution: "constant", value: 3 },
        y: { distribution: "constant", value: 4 },
      },
      outputTargets: {},
      outputLogScales: {},
    };
    persistenceState.setFunctionValues = vi.fn();
  });
  it("provides initial context values from persistence", () => {
    render(
      <FunctionContextProvider>
        <Consumer />
      </FunctionContextProvider>,
    );
    expect(screen.getByTestId("selectedFunction").textContent).toBe("Test Function");
    expect(screen.getByTestId("inputVars").textContent).toBe("x,y");
    expect(screen.getByTestId("outputVars").textContent).toBe("z");
    expect(screen.getByTestId("distribution").textContent).toBe("x,y");
  });

  it("updates context values", async () => {
    function TestComponent() {
      const ctx = useFunctionContext();
      return (
        <div>
          <button type="button" onClick={() => ctx.setInputVars(["a", "b"])} data-testid="setInputVars">
            Set Input Vars
          </button>
          <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
        </div>
      );
    }
    render(
      <FunctionContextProvider>
        <TestComponent />
      </FunctionContextProvider>,
    );
    expect(screen.getByTestId("inputVars").textContent).toBe("x,y");
    await screen.getByTestId("setInputVars").click();
    expect(screen.getByTestId("inputVars").textContent).toBe("a,b");
  });

  it("throws error if used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function BrokenConsumer() {
      useFunctionContext();
      return null;
    }
    expect(() => render(<BrokenConsumer />)).toThrow(/useFunctionContext must be used within a FunctionContextProvider/);
    spy.mockRestore();
  });

  it("hydrates from persistence after loading completes without overwriting saved values", async () => {
    persistenceState.loading = true;
    persistenceState.values = {
      selectedFunction: undefined,
      inputVars: [],
      outputVars: [],
      distribution: {},
      outputTargets: {},
      outputLogScales: {},
    };

    const { rerender } = render(
      <FunctionContextProvider>
        <Consumer />
      </FunctionContextProvider>,
    );

    expect(screen.getByTestId("selectedFunction").textContent).toBe("");

    persistenceState.loading = false;
    persistenceState.values = {
      selectedFunction: { id: "func2", title: "Uploaded Function" },
      inputVars: ["bone_cancellous"],
      outputVars: ["score"],
      distribution: {
        bone_cancellous: { distribution: "uniform", min: 0.006563, max: 0.191365, logScale: true },
      },
      outputTargets: {},
      outputLogScales: {},
    };

    rerender(
      <FunctionContextProvider>
        <Consumer />
      </FunctionContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selectedFunction").textContent).toBe("Uploaded Function");
      expect(screen.getByTestId("inputVars").textContent).toBe("bone_cancellous");
      expect(screen.getByTestId("distribution").textContent).toBe("bone_cancellous");
    });
  });

  it("does not rehydrate from later persistence updates after initial load", async () => {
    function TestComponent() {
      const ctx = useFunctionContext();
      return (
        <div>
          <button type="button" data-testid="setInputVars" onClick={() => ctx.setInputVars(["local", "state"])}>
            Set Input Vars
          </button>
          <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
        </div>
      );
    }

    render(
      <FunctionContextProvider>
        <TestComponent />
      </FunctionContextProvider>,
    );

    expect(screen.getByTestId("inputVars").textContent).toBe("x,y");
    await screen.getByTestId("setInputVars").click();
    expect(screen.getByTestId("inputVars").textContent).toBe("local,state");

    persistenceState.values = {
      selectedFunction: { id: "func3", title: "Stale Persistence" },
      inputVars: ["stale"],
      outputVars: ["stale_output"],
      distribution: {
        stale: { distribution: "uniform", min: 0, max: 1 },
      },
      outputTargets: {},
      outputLogScales: {},
    };

    render(
      <FunctionContextProvider>
        <TestComponent />
      </FunctionContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("inputVars")[0].textContent).toBe("local,state");
    });
  });

  it("reconciles stale persisted functions against the live function list", async () => {
    persistenceState.values = {
      selectedFunction: { uid: "stale-func", title: "Stale Function" },
      inputVars: ["legacy_input"],
      outputVars: ["legacy_output"],
      distribution: {
        "live-func": {
          conductivity: { distribution: "uniform", min: 0, max: 1 },
        },
        "stale-func": {
          legacy_input: { distribution: "uniform", min: 2, max: 3 },
        },
      },
      outputTargets: {
        "stale-func": { legacy_output: "maximize" },
      },
      outputLogScales: {
        "stale-func": { legacy_output: true },
      },
    };

    render(
      <FunctionContextProvider>
        <ReconcileConsumer />
      </FunctionContextProvider>,
    );

    await screen.getByTestId("reconcile").click();

    await waitFor(() => {
      expect(screen.getByTestId("selectedFunction").textContent).toBe("");
      expect(screen.getByTestId("inputVars").textContent).toBe("");
      expect(screen.getByTestId("distribution").textContent).toBe("live-func");
    });
  });
});
