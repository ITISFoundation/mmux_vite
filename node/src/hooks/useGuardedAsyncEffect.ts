import { useEffect, type DependencyList } from "react";

/**
 * V45gd: run an async effect so ONLY the newest generation may commit state.
 *
 * `run` receives `isStale()`; every post-await data/error/loading commit inside
 * it must be gated by it, so a slow older response (late resolve AND late
 * reject) can never clobber the results of a newer request (B25rc/B23rv
 * generalization, T29sw, issue #650). The rejection is absorbed at the seam —
 * run's own `.catch` chain is where callers surface errors, already gated.
 *
 * Deps are the underlying effect's dependency array, identical in meaning to
 * useEffect's second argument.
 */
export function useGuardedAsyncEffect(run: (isStale: () => boolean) => Promise<unknown>, deps: DependencyList): void {
  useEffect(() => {
    let active = true;
    void run(() => !active).catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
