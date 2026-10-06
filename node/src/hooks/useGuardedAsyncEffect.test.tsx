import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGuardedAsyncEffect } from "./useGuardedAsyncEffect";

// V45gd staleness semantics: the newest generation owns the commits.
describe("useGuardedAsyncEffect", () => {
  it("marks a superseded generation stale and keeps the newest fresh", async () => {
    const seen: Array<{ gen: number; isStale: () => boolean }> = [];
    let gen = 0;
    const { rerender } = renderHook(
      ({ k }) => useGuardedAsyncEffect(isStale => Promise.resolve().then(() => void seen.push({ gen: ++gen, isStale })), [k]),
      {
        initialProps: { k: 1 },
      },
    );
    rerender({ k: 2 });

    await vi.waitFor(() => expect(seen).toHaveLength(2));
    expect(seen[0].isStale()).toBe(true);
    expect(seen[1].isStale()).toBe(false);
  });

  it("a late resolve of the stale generation is gated out by isStale", async () => {
    const commits: string[] = [];
    let releaseFirst: () => void = () => undefined;
    let gen = 0;

    const run = (isStale: () => boolean) => {
      const current = ++gen;
      return new Promise<void>(resolve => {
        if (current === 1) {
          releaseFirst = resolve;
        } else {
          resolve();
        }
      }).then(() => {
        if (!isStale()) commits.push(`gen${current}`);
      });
    };

    const { rerender } = renderHook(({ k }) => useGuardedAsyncEffect(run, [k]), { initialProps: { k: 1 } });
    rerender({ k: 2 });
    releaseFirst();

    await vi.waitFor(() => expect(commits).toContain("gen2"));
    expect(commits).not.toContain("gen1");
  });

  it("a late rejection of the stale generation neither commits nor throws unhandled", async () => {
    const commits: string[] = [];
    let rejectFirst: (error: unknown) => void = () => undefined;
    let gen = 0;
    const uncaught: unknown[] = [];
    const onError = (event: PromiseRejectionEvent) => uncaught.push(event.reason);
    window.addEventListener("unhandledrejection", onError);

    const run = (isStale: () => boolean) => {
      const current = ++gen;
      return new Promise<void>((_resolve, reject) => {
        if (current === 1) {
          rejectFirst = reject;
        } else {
          _resolve();
        }
      })
        .then(() => {
          if (!isStale()) commits.push(`ok${current}`);
        })
        .catch(error => {
          if (!isStale()) commits.push(`err${current}`);
          throw error;
        });
    };

    try {
      const { rerender } = renderHook(({ k }) => useGuardedAsyncEffect(run, [k]), { initialProps: { k: 1 } });
      rerender({ k: 2 });
      rejectFirst(new Error("late reject"));

      await vi.waitFor(() => expect(commits).toContain("ok2"));
      expect(commits).not.toContain("err1");
      expect(uncaught).toEqual([]);
    } finally {
      window.removeEventListener("unhandledrejection", onError);
    }
  });
});
