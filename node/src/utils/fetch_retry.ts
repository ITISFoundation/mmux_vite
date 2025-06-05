import { delay } from './function_utils'

export const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, wait = 100): Promise<Response> => {
  let attempt = 0;
  let response: Response | undefined = undefined;
  let ErrorToRetry: Error | undefined = undefined;

  do {
    response = undefined; // Reset response for each attempt
    try {
      response = await fetch(url, options);
    } catch (error: unknown) {
      if (attempt >= retries) {
        ErrorToRetry = error as Error; // Re-throw the error after all retries have failed
      }
    }
    await delay(wait); // Wait before the next retry

    if( response && response.ok) {
      return response; // If the response is successful, return it immediately
    }
    attempt++;
  } while (attempt < retries);

  if (response && response.ok) {
    return response; // Return the successful response
  }
  if (ErrorToRetry) {
    throw ErrorToRetry; // Re-throw the last error encountered
  }
  // If we reach here, it means all retries failed

  throw new Error('Fetch failed after maximum retries');
}