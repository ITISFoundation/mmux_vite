import { delay } from "./delay";

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
      ErrorToRetry = error as Error; // Capture the error so it can be re-thrown below
    }
    if ((response && response.ok) || (response && response.status === 404)) {
      return response; // If the response is successful or not found, return it immediately
    }

    // Exponential backoff with jitter; skip after the final attempt.
    if (attempt < retries - 1) {
      const exponentialWait = Math.min(baseWait * 2 ** attempt, maxWait);
      const jitter = Math.random() * (exponentialWait * 0.2);
      await delay(exponentialWait + jitter);
    }
  }

  if (response) {
    return response;
  }

  // If we reach here, it means all retries failed
  throw ErrorToRetry ?? new Error("fetchWithRetry: All retries failed and no error was captured."); // Re-throw the last error encountered
};
