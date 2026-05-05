import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import { PersistenceContextProvider, usePersistenceContext } from "./PersistenceContext";
import type { PersistenceType } from "./types";
import samplePersistence from "./samplePersistence.test.json";
import { fetchWithRetry } from "../utils/fetchRetry";

// Mock fetch and fetchWithRetry
vi.mock("../utils/fetchRetry", () => ({
  fetchWithRetry: vi.fn(),
}));

const mockPersistence: PersistenceType = samplePersistence as unknown as PersistenceType;
const alternatePersistence: PersistenceType = {
  ...mockPersistence,
  currentView: 2,
};

const createSaveResponse = () =>
  new Response(JSON.stringify({ filename: "persistence.json", status: "success" }), {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" },
  });

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
      <button
        type="button"
        onClick={async () => {
          await saveState(alternatePersistence);
        }}
      >
        Save Alternate State
      </button>
      <div data-testid="loading">{loading ? "loading" : "loaded"}</div>
      <div data-testid="persistence">{persistence ? JSON.stringify(persistence) : "none"}</div>
      <div data-testid="functionValues">{JSON.stringify(getFunctionValues())}</div>
    </div>
  );
}
const mockFetchWithRetry = vi.mocked(fetchWithRetry);

describe("PersistenceContextProvider", () => {
  let globalFetch: typeof global.fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async () => createSaveResponse());
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.clearAllMocks();
    vi.useRealTimers();
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

    vi.useFakeTimers();

    act(() => {
      getByText("Save Alternate State").click();
    });

    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const persistence = JSON.parse(getByTestId("persistence").textContent!);
    expect(persistence.currentView).toBe(2);
    expect(persistence.numSamples).toEqual({});

    expect(global.fetch).toHaveBeenCalledWith(
      "/flask/text-file/",
      expect.objectContaining({
        method: "POST",
      }),
    );
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
      expect(functionValues.inputVars).toEqual(["a"]);
      expect(functionValues.outputVars).toEqual(["b"]);
      expect(functionValues.distribution).toEqual({});
    });
  });

  it("batches rapid saveState calls into one write", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));

    const { getByText } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByText("Save State")).toBeTruthy();
    });

    vi.useFakeTimers();

    act(() => {
      getByText("Save State").click();
      getByText("Save Alternate State").click();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0];
    const requestBody = JSON.parse(String(requestInit?.body)) as { content: string };
    expect(requestInit).toMatchObject({ method: "POST" });
    expect(JSON.parse(requestBody.content).currentView).toBe(2);
  });

  it("stops persisting after a failed save", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));
    vi.mocked(global.fetch)
      .mockImplementationOnce(async () => new Response(null, { status: 500, statusText: "Server Error" }))
      .mockImplementation(async () => createSaveResponse());

    const { getByText } = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );

    act(() => {
      getByText("Set Health OK").click();
    });

    await waitFor(() => {
      expect(getByText("Save Alternate State")).toBeTruthy();
    });

    vi.useFakeTimers();

    act(() => {
      getByText("Save State").click();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      getByText("Save Alternate State").click();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
