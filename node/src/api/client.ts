import { fetchWithRetry } from "../utils/fetchRetry";

export type ApiErrorKind = "http" | "network" | "parse";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  readonly status?: number;

  readonly body?: string;

  constructor(kind: ApiErrorKind, message: string, status?: number, body?: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  retry?: boolean;
};

// Single entry point for `/flask/*` JSON calls: every failure surfaces as a typed ApiError.
export async function requestJson<T>(url: string, { method = "GET", body, retry = false }: RequestOptions = {}): Promise<T> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = retry ? await fetchWithRetry(url, init) : await fetch(url, init);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ApiError("network", `${method} ${url} failed: ${reason}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // V44eh: the BE error surface is always JSON {"error": <str>} (flaskapi's
    // api_endpoint + JSON error handlers); surface it verbatim, fall back to the
    // generic dialect message only for bodies that are not that shape.
    let userMessage = "";
    try {
      const payload = JSON.parse(text) as { error?: unknown };
      if (typeof payload?.error === "string" && payload.error.trim()) {
        userMessage = payload.error;
      }
    } catch {
      // not JSON; fall back below
    }
    const message = userMessage || `${method} ${url} failed with ${response.status}${text ? `: ${text}` : ""}`;
    throw new ApiError("http", message, response.status, text);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("parse", `${method} ${url} returned invalid JSON`, response.status);
  }
}
