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
const Consumer = () => {
  const ctx = useFunctionContext();
  return (
    <div>
      <span data-testid="selectedFunction">{ctx.selectedFunction?.title}</span>
      <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
      <span data-testid="outputVars">{ctx.outputVars.join(",")}</span>
      <span data-testid="distribution">
        {Object.keys(ctx.distribution).join(",")}
      </span>
    </div>
  );
};

describe("FunctionContextProvider", () => {
  beforeEach(() => {
    cleanup(); // 👈 removes rendered components from DOM
  });
  it("provides initial context values from persistence", () => {
    render(
      <FunctionContextProvider>
        <Consumer />
      </FunctionContextProvider>
    );
    expect(screen.getByTestId("selectedFunction").textContent).toBe(
      "Test Function"
    );
    expect(screen.getByTestId("inputVars").textContent).toBe("x,y");
    expect(screen.getByTestId("outputVars").textContent).toBe("z");
    expect(screen.getByTestId("distribution").textContent).toBe("x,y");
  });

  it("updates context values", async () => {
    const TestComponent = () => {
      const ctx = useFunctionContext();
      return (
        <div>
          <button
            onClick={() => ctx.setInputVars(["a", "b"])}
            data-testid="setInputVars"
          >
            Set Input Vars
          </button>
          <span data-testid="inputVars">{ctx.inputVars.join(",")}</span>
        </div>
      );
    };
    render(
      <FunctionContextProvider>
        <TestComponent />
      </FunctionContextProvider>
    );
    expect(screen.getByTestId("inputVars").textContent).toBe("x,y");
    await screen.getByTestId("setInputVars").click();
    expect(screen.getByTestId("inputVars").textContent).toBe("a,b");
  });

  it("throws error if used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => { });
    const BrokenConsumer = () => {
      useFunctionContext();
      return null;
    };
    expect(() => render(<BrokenConsumer />)).toThrow(
      /useFunctionContext must be used within a FunctionContextProvider/
    );
    spy.mockRestore();
  });
});
