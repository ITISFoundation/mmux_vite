import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDisplayScale } from "./useDisplayScale";

describe("useDisplayScale (panel view-only axis scale, §V12)", () => {
  it("defaults to the compute scale and tracks it while un-overridden", () => {
    const { result, rerender } = renderHook(({ computeLog, key }) => useDisplayScale(computeLog, key), {
      initialProps: { computeLog: false, key: "fn|y" },
    });
    expect(result.current[0]).toBe(false);

    // auto-detect commits a log verdict for the SAME QoI -> un-overridden view follows
    rerender({ computeLog: true, key: "fn|y" });
    expect(result.current[0]).toBe(true);
  });

  it("a manual override wins over the compute scale", () => {
    const { result } = renderHook(() => useDisplayScale(false, "fn|y"));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it("changing the resetKey (function/QoI) drops a stale override", () => {
    const { result, rerender } = renderHook(({ computeLog, key }) => useDisplayScale(computeLog, key), {
      initialProps: { computeLog: false, key: "fn|y" },
    });
    act(() => result.current[1](true)); // view log for y
    expect(result.current[0]).toBe(true);

    // switch to another QoI whose compute scale is linear: the y-specific view choice resets
    rerender({ computeLog: false, key: "fn|z" });
    expect(result.current[0]).toBe(false);
  });
});
