import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import { PersistenceContextProvider, usePersistenceContext } from "./PersistenceContext";
import type { PersistenceType } from "./types";
import samplePersistence from "./samplePersistence.test.json";
import { fetchWithRetry } from "../utils/fetch_retry";

// Mock fetch and fetchWithRetry
vi.mock("../utils/fetch_retry", () => ({
  fetchWithRetry: vi.fn(),
}));

const mockPersistence: PersistenceType = samplePersistence as unknown as PersistenceType;

function TestComponent() {
  const { persistence, saveState, getFunctionValues, setFunctionValues, loading, setHealthOK } = usePersistenceContext();

  return (
    <div>
      <button type="button" onClick={() => setHealthOK(true)}>
        Set Health OK
      </button>
      <button
        type="button"
        onClick={() =>
          setFunctionValues({
            selectedFunction: undefined,
            inputVars: ["a"],
            outputVars: ["b"],
            distribution: undefined,
          })
        }
      >
        Set Function Values
      </button>
      <button
        type="button"
        onClick={async () => {
          await saveState(mockPersistence);
        }}
      >
        Save State
      </button>
      <div mmux-testid="loading">{loading ? "loading" : "loaded"}</div>
      <div mmux-testid="persistence">{persistence ? JSON.stringify(persistence) : "none"}</div>
      <div mmux-testid="functionValues">{JSON.stringify(getFunctionValues())}</div>
    </div>
  );
}
const mockFetchWithRetry = vi.mocked(fetchWithRetry);

describe("PersistenceContextProvider", () => {
  let globalFetch: typeof global.fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.clearAllMocks();
    cleanup(); // 👈 removes rendered components from DOM
  });

  it("provides default persistence if file not found", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));

    const { getByText, getByTestId } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("loaded");
    });

    const persistence = JSON.parse(getByTestId("persistence").textContent!);
    expect(persistence.currentView).toBe(0);
    expect(persistence.numSamples).toEqual({});
  });

  it("loads persistence from file if valid", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: JSON.stringify(mockPersistence),
          filename: "persistence.json",
        }),
        { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } },
      ),
    );

    const { getByText, getByTestId } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("loaded");
    });

    const persistence = JSON.parse(getByTestId("persistence").textContent!);
    expect(persistence.currentView).toBe(1);
    expect(persistence.numSamples).toEqual({});
  });

  it("resets to default if persistence file is invalid", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: JSON.stringify({ invalid: true }),
          filename: "persistence.json",
        }),
        { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } },
      ),
    );

    const { getByText, getByTestId } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("loaded");
    });

    const persistence = JSON.parse(getByTestId("persistence").textContent!);
    expect(persistence.currentView).toBe(0);
    expect(persistence.numSamples).toEqual({});
  });

  it("calls saveState and updates persistence", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: JSON.stringify(mockPersistence),
          filename: "persistence.json",
        }),
        { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } },
      ),
    );

    const { getByText, getByTestId } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("loaded");
    });

    act(() => {
      getByText("Save State").click();
    });

    await waitFor(() => {
      const persistence = JSON.parse(getByTestId("persistence").textContent!);
      expect(persistence.currentView).toBe(1);
      expect(persistence.numSamples).toEqual({});
    });
  });

  it("getFunctionValues and setFunctionValues work", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));

    const { getByText, getByTestId } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("loaded");
    });

    act(() => {
      getByText("Set Function Values").click();
    });

    await waitFor(() => {
      const functionValues = JSON.parse(getByTestId("functionValues").textContent!);
      expect(functionValues.selectedFunction).toBe(undefined);
      expect(functionValues.inputVars).toEqual([]);
      expect(functionValues.outputVars).toEqual([]);
      expect(functionValues.distribution).toEqual({});
    });
  });
});
