// V46sc (T36wx): tab-lifetime response cache for surrogate plot fetches.
//
// The key is derived from the request itself — url + canonical JSON body — NOT
// from hand-curated "parameters that matter", because every such curation has
// historically omitted a parameter that actually changes the response (B37rv:
// #501 axis ranges, numSamples/seed/distributions in the UQ/Sobol/CV endpoints).
// Every sent parameter enters the key by construction.
//
// Holds successes only (V18-aligned: a failure must neither be cached nor block
// the next identical retry). In-flight requests are deduplicated by the same
// key. Cached payloads are never handed out by reference: EVERY consumer —
// cache hit, first caller, and in-flight joiner — receives its own clone, so a
// plot mutating its data can poison neither the cache nor a concurrent sibling.
//
// Lives at module scope: the Map survives component unmount and is dropped when
// the tab closes (root V39xk). Entries beyond a fixed LRU cap evict least
// recently used first.

const cacheCap = 60;

const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

const isJobLike = (value: unknown): value is { uid: string } =>
  !!value && typeof value === "object" && typeof (value as { uid?: unknown }).uid === "string";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    // The backend builds models from job SETS: arrays of jobs (order-independent
    // at the API) canonicalize to their sorted uids; other arrays keep position.
    if (value.length > 0 && value.every(isJobLike)) {
      return { uids: value.map(job => job.uid).sort() };
    }
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, nested]) => [key, canonicalize(nested)]);
  }
  return value;
}

export function buildRequestCacheKey(url: string, body?: unknown): string {
  return `${url}|${JSON.stringify(canonicalize(body ?? null))}`;
}

/**
 * Return the cached response for (url, body) when one exists; otherwise run
 * `fetcher` exactly once per key, caching only the success. Concurrent callers
 * with the same key share the in-flight promise (zero duplicate network).
 */
export function getCachedOrFetch<T>(url: string, body: unknown, fetcher: () => Promise<T>): Promise<T> {
  const key = buildRequestCacheKey(url, body);

  const hit = cache.get(key);
  if (hit !== undefined) {
    cache.delete(key); // recency bump
    cache.set(key, hit);
    return Promise.resolve(structuredClone(hit) as T);
  }

  const live = inFlight.get(key);
  if (live) {
    // Joiners clone too: the shared promise resolves with the stored canonical
    // copy, and handing that out by reference would let one plot's mutation
    // corrupt the cache and every sibling consumer.
    return (live as Promise<T>).then(joined => structuredClone(joined) as T);
  }

  const request = fetcher()
    .then(payload => {
      const stored = structuredClone(payload);
      cache.set(key, stored);
      if (cache.size > cacheCap) {
        const oldest = cache.keys().next().value as string | undefined;
        if (oldest !== undefined) cache.delete(oldest);
      }
      return stored;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, request);
  // Every handout is a clone of the stored copy, so no consumer can reach the
  // cache's object no matter when its continuation runs.
  return request.then(stored => structuredClone(stored) as T);
}

/** Test seam: drop all cached/in-flight state so suites stay independent. */
export function clearSessionResponseCacheForTests(): void {
  cache.clear();
  inFlight.clear();
}
