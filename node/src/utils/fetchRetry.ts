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
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    response = undefined;
    try {
      response = await fetch(url, options);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (response && !isRetryableStatus(response.status)) {
      return response;
    }

    if (attempt < retries - 1) {
      const exponentialWait = Math.min(baseWait * 2 ** attempt, maxWait);
      const jitter = Math.random() * (exponentialWait * 0.2);
      await delay(exponentialWait + jitter);
    }
  }

  if (response) return response;
  throw lastError ?? new Error("fetchWithRetry: All retries failed and no error was captured.");
};
