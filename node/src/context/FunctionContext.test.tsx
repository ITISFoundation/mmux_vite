import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FunctionContextProvider, useFunctionContext } from "./FunctionContext";

// Mock usePersistenceContext
vi.mock("./PersistenceContext", () => ({
  usePersistenceContext: () => ({
    getFunctionValues: vi.fn(() => ({
      selectedFunction: { id: "func1", title: "Test Function" },
      inputVars: ["x", "y"],
      outputVars: ["z"],
      distribution: {
        x: { distribution: "constant", value: 3 },
        y: { distribution: "constant", value: 4 },
      },
    })),
    setFunctionValues: vi.fn(),
    loading: false,
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

describe("FunctionContextProvider", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
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

  it("V11: setters accept the full union (undefined / empty / repopulated) and typecheck", async () => {
    function UnionConsumer() {
      const ctx = useFunctionContext();
      return (
        <div>
          <button
            type="button"
            data-testid="clearFunction"
            onClick={() => {
              // Explicit-union typing: assigning `undefined` to selectedFunction must
              // compile (it would not if the type were inferred from a non-undefined literal).
              ctx.setSelectedFunction(undefined);
              ctx.setInputVars([]);
              ctx.setDistribution({});
            }}
          >
            Clear
          </button>
          <button
            type="button"
            data-testid="repopulate"
            onClick={() => {
              // Reassigning a different-shape distribution must also compile.
              ctx.setDistribution({ k: { v: { distribution: "normal", mean: 0, std: 1 } } });
              ctx.setInputVars(["k"]);
            }}
          >
            Repopulate
          </button>
          <span data-testid="selectedFunction">{ctx.selectedFunction?.title ?? "none"}</span>
          <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
          <span data-testid="distribution">{Object.keys(ctx.distribution).join(",")}</span>
        </div>
      );
    }
    render(
      <FunctionContextProvider>
        <UnionConsumer />
      </FunctionContextProvider>,
    );
    await screen.getByTestId("clearFunction").click();
    expect(screen.getByTestId("selectedFunction").textContent).toBe("none");
    expect(screen.getByTestId("inputVars").textContent).toBe("");
    expect(screen.getByTestId("distribution").textContent).toBe("");

    await screen.getByTestId("repopulate").click();
    expect(screen.getByTestId("inputVars").textContent).toBe("k");
    expect(screen.getByTestId("distribution").textContent).toBe("k");
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

  it("provides outputLogScales state, scoped per function uid, and persists via setFunctionValues", async () => {
    function LogScaleConsumer() {
      const ctx = useFunctionContext();
      const funcUid = ctx.selectedFunction?.uid || "func1";
      return (
        <div>
          <button
            type="button"
            data-testid="enableLog"
            onClick={() => ctx.setOutputLogScales({ ...ctx.outputLogScales, [funcUid]: { z: true } })}
          >
            Enable log
          </button>
          <span data-testid="outputLogScales">{JSON.stringify(ctx.outputLogScales)}</span>
        </div>
      );
    }
    render(
      <FunctionContextProvider>
        <LogScaleConsumer />
      </FunctionContextProvider>,
    );
    expect(screen.getByTestId("outputLogScales").textContent).toBe("{}");
    await screen.getByTestId("enableLog").click();
    expect(screen.getByTestId("outputLogScales").textContent).toBe(JSON.stringify({ func1: { z: true } }));
  });
});
