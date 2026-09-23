import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, requestJson } from "./client";
import { jsonResponse, malformedJsonResponse, networkError, stubFetch, textResponse } from "../test/fetchStub";

vi.mock("../utils/delay", () => ({ delay: () => Promise.resolve() }));

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the request to reject");
}

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs and parses JSON", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: 1 }));
    await expect(requestJson<{ ok: number }>("/flask/x")).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/flask/x", expect.objectContaining({ method: "GET" }));
  });

  it("POSTs a JSON body with a JSON content type", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    await requestJson("/flask/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("maps a non-OK response to an http error carrying status and body", async () => {
    stubFetch(textResponse("N must be <= 50", 422));
    const error = await caught(requestJson("/flask/sampling/lhs", { method: "POST", body: {} }));
    expect(error).toMatchObject({ kind: "http", status: 422, body: "N must be <= 50" });
    expect(error.message).toBe("POST /flask/sampling/lhs failed with 422: N must be <= 50");
  });

  it("maps a rejected fetch to a network error", async () => {
    stubFetch(networkError());
    const error = await caught(requestJson("/flask/x"));
    expect(error).toMatchObject({ kind: "network", status: undefined });
    expect(error.message).toBe("GET /flask/x failed: Failed to fetch");
  });

  it("maps an unparsable body to a parse error", async () => {
    stubFetch(malformedJsonResponse());
    const error = await caught(requestJson("/flask/x"));
    expect(error).toMatchObject({ kind: "parse", status: 200 });
  });

  it("retries transient failures when asked to", async () => {
    const fetchMock = stubFetch(textResponse("busy", 503), networkError(), jsonResponse([1]));
    await expect(requestJson("/flask/x", { retry: true })).resolves.toEqual([1]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry client errors", async () => {
    const fetchMock = stubFetch(textResponse("bad input", 422), jsonResponse([1]));
    const error = await caught(requestJson("/flask/x", { retry: true }));
    expect(error).toMatchObject({ kind: "http", status: 422 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
