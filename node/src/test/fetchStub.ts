import { vi } from "vitest";

type Reply = Response | Error | (() => Promise<Response>);

// Each fetch call consumes the next reply; the last reply repeats for any further calls.
export function stubFetch(...replies: Reply[]) {
  let call = 0;
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    const reply = replies[Math.min(call, replies.length - 1)];
    call += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    if (typeof reply === "function") return reply();
    return Promise.resolve(reply.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const textResponse = (body: string, status: number) => new Response(body, { status });

export const malformedJsonResponse = (status = 200) =>
  new Response("{not json", { status, headers: { "Content-Type": "application/json" } });

export const networkError = () => new TypeError("Failed to fetch");

export const hang = () => () => new Promise<Response>(() => undefined);
