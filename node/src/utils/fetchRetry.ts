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
      if (attempt >= retries) {
        ErrorToRetry = error as Error; // Re-throw the error after all retries have failed
      }
    }
    if ((response && response.ok) || (response && response.status === 404)) {
      return response; // If the response is successful or not found, return it immediately
    }

    // Exponential backoff with jitter
    const exponentialWait = Math.min(baseWait * 2 ** attempt, maxWait);
    const jitter = Math.random() * (exponentialWait * 0.2);
    await delay(exponentialWait + jitter);
  }

  if (response) {
    return response;
  }

  // If we reach here, it means all retries failed
  throw ErrorToRetry ?? new Error("fetchWithRetry: All retries failed and no error was captured."); // Re-throw the last error encountered
};
