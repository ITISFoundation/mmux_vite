import { delay } from "./delay";

const isRetryableStatus = (status: number) => status >= 500 || status === 408 || status === 429;

export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 5,
  baseWait = 150,
  maxWait = 3000,
): Promise<Response> => {
  let response: Response | undefined;
  let ErrorToRetry: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    response = undefined; // Reset response for each attempt
    try {
      response = await fetch(url, options);
    } catch (error: unknown) {
      ErrorToRetry = error instanceof Error ? error : new Error(String(error));
    }
    if (response && !isRetryableStatus(response.status)) {
      return response;
    }

    // Exponential backoff with jitter
    const exponentialWait = Math.min(baseWait * 2 ** attempt, maxWait);
    const jitter = Math.random() * (exponentialWait * 0.2);
    await delay(exponentialWait + jitter);
  }

  // Hand back the last HTTP failure so callers can report its status; only a network failure throws.
  if (response) return response;
  throw ErrorToRetry ?? new Error("fetchWithRetry: All retries failed and no error was captured.");
};
