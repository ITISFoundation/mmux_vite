import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import { toast } from "react-toastify";
import { PersistenceContextProvider, usePersistenceContext } from "./PersistenceContext";
import type { PersistenceType } from "./types";
import samplePersistence from "./samplePersistence.test.json";
import { fetchWithRetry } from "../utils/fetchRetry";

vi.mock("react-toastify", () => ({ toast: { warn: vi.fn(), error: vi.fn() } }));
// Mock fetch and fetchWithRetry
vi.mock("../utils/fetchRetry", () => ({
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

  it("V15: saveState skips redundant writes when content is unchanged", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));
    const setFilePost = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ filename: "persistence.json", status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = setFilePost;

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

    // First save persists once (content differs from the hydrated default).
    act(() => {
      getByText("Save State").click();
    });
    await waitFor(() => {
      expect(setFilePost).toHaveBeenCalledTimes(1);
    });

    // Saving the SAME state again (recreated object reference) must NOT re-POST.
    act(() => {
      getByText("Save State").click();
    });
    await waitFor(() => {
      const persistence = JSON.parse(getByTestId("persistence").textContent!);
      expect(persistence.currentView).toBe(1);
    });
    expect(setFilePost).toHaveBeenCalledTimes(1);
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

  async function renderLoaded() {
    const view = render(
      <PersistenceContextProvider>
        <TestComponent />
      </PersistenceContextProvider>,
    );
    act(() => {
      view.getByText("Set Health OK").click();
    });
    await waitFor(() => expect(view.getByTestId("loading").textContent).toBe("loaded"));
    return view;
  }

  it("falls back to defaults without overwriting the server copy when loading fails", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response("db down", { status: 500 }));
    const post = vi.fn();
    global.fetch = post;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { getByText, getByTestId } = await renderLoaded();

    expect(JSON.parse(getByTestId("persistence").textContent!).currentView).toBe(0);
    expect(toast.warn).toHaveBeenCalledWith("Failed to fetch user state, contact support.");
    act(() => {
      getByText("Save State").click();
    });
    await act(async () => undefined);
    expect(post).not.toHaveBeenCalled();
    vi.mocked(console.error).mockClear();
  });

  it("stops persisting after the server rejects a save and does not mark it saved (V17)", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const post = vi.fn().mockResolvedValue(new Response("quota exceeded", { status: 507 }));
    global.fetch = post;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { getByText, getByTestId } = await renderLoaded();

    act(() => {
      getByText("Save State").click();
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(JSON.parse(getByTestId("persistence").textContent!).currentView).toBe(0);
    expect(new Headers((post.mock.calls[0][1] as RequestInit).headers).get("Content-Type")).toBe("application/json");

    act(() => {
      getByText("Set Function Values").click();
    });
    await act(async () => undefined);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("resets to defaults when the stored content is not valid JSON", async () => {
    mockFetchWithRetry.mockResolvedValueOnce(
      new Response(JSON.stringify({ content: "{truncated", filename: "persistence.json" }), { status: 200 }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { getByTestId } = await renderLoaded();

    expect(JSON.parse(getByTestId("persistence").textContent!).currentView).toBe(0);
    expect(console.error).toHaveBeenCalledWith("Error parsing fetched data:", expect.any(SyntaxError));
    vi.mocked(console.error).mockClear();
  });
});
