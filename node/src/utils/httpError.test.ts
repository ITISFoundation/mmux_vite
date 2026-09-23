import { describe, expect, it } from "vitest";
import { getResponseErrorMessage } from "./httpError";

describe("getResponseErrorMessage", () => {
  it("uses the backend error field when present", async () => {
    const response = new Response(JSON.stringify({ error: "Input variables are missing" }), {
      status: 400,
      statusText: "Bad Request",
      headers: { "Content-Type": "application/json" },
    });

    await expect(getResponseErrorMessage(response)).resolves.toBe("Input variables are missing");
  });

  it("uses a text response when no JSON error field exists", async () => {
    const response = new Response("Dakota failed to build the surrogate", {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(getResponseErrorMessage(response)).resolves.toBe("Dakota failed to build the surrogate");
  });

  it("falls back to the HTTP status when the response body is empty", async () => {
    const response = new Response(null, { status: 502, statusText: "Bad Gateway" });

    await expect(getResponseErrorMessage(response)).resolves.toBe("Request failed: 502 Bad Gateway");
  });
});
