import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "./fetchRetry";

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([400, 404, 422])("returns a %s response without retrying", async status => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response("client error", { status })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry("/flask/test", {}, 3, 0);

    expect(response.status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient responses and returns the final response", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response("busy", { status: 503 })));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry("/flask/test", {}, 3, 0);

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries network failures and throws the last error", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("network error")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("/flask/test", {}, 3, 0)).rejects.toThrow("network error");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
