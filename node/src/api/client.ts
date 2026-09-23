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
    throw new ApiError(
      "http",
      `${method} ${url} failed with ${response.status}${text ? `: ${text}` : ""}`,
      response.status,
      text,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("parse", `${method} ${url} returned invalid JSON`, response.status);
  }
}
