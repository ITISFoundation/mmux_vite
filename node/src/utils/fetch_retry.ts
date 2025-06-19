import { delay } from './function_utils'

export const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, wait = 150): Promise<Response> => {
  let response: Response | undefined = undefined;
  let ErrorToRetry: Error | undefined = undefined;

  for( let attempt = 0; attempt < retries; attempt++ ) {
    response = undefined; // Reset response for each attempt
    try {
      response = await fetch(url, options);
    } catch (error: unknown) {
      if (attempt >= retries) {
        ErrorToRetry = error as Error; // Re-throw the error after all retries have failed
      }
    }
    if( response && response.ok) {
      return response; // If the response is successful, return it immediately
    }

    await delay(wait * (attempt + 1)); // Wait before the next retry
  }

  // If we reach here, it means all retries failed
  throw ErrorToRetry; // Re-throw the last error encountered
}