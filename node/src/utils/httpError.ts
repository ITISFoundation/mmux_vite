export async function getResponseErrorMessage(response: Response): Promise<string> {
  const responseCopy = response.clone();
  try {
    const payload: unknown = await responseCopy.json();
    if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
      const message = payload.error.trim();
      if (message) return message;
    }
  } catch {
    // Fall back to a plain-text body below.
  }

  try {
    const text = (await response.clone().text()).trim();
    if (text) return text;
  } catch {
    // Use the HTTP status when the body cannot be read.
  }

  return `Request failed: ${response.status} ${response.statusText}`.trim();
}
