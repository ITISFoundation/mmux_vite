import { describe, it, expect } from "vitest";
import { buildDakotaRequestKey, DakotaRequestKeyInput } from "./dakotaRequestKey";

const base: DakotaRequestKeyInput = {
  axes: ["x"],
  sliderValues: { y: 1, z: 2 },
  qoi: "out",
  fn: "fn-uid",
  jobList: ["job-a", "job-b"],
  logScale: false,
};

describe("buildDakotaRequestKey (V16 dedup)", () => {
  it("produces the same key for logically identical but recreated inputs", () => {
    const key1 = buildDakotaRequestKey(base);
    const key2 = buildDakotaRequestKey({
      // recreated objects, different insertion order, reordered jobList
      axes: ["x"],
      sliderValues: { z: 2, y: 1 },
      qoi: "out",
      fn: "fn-uid",
      jobList: ["job-b", "job-a"],
      logScale: false,
    });
    expect(key2).toBe(key1);
  });

  it("changes the key when a slider value changes", () => {
    expect(buildDakotaRequestKey({ ...base, sliderValues: { y: 9, z: 2 } })).not.toBe(buildDakotaRequestKey(base));
  });

  it("changes the key when the QoI changes", () => {
    expect(buildDakotaRequestKey({ ...base, qoi: "other" })).not.toBe(buildDakotaRequestKey(base));
  });

  it("changes the key when the function changes", () => {
    expect(buildDakotaRequestKey({ ...base, fn: "other-fn" })).not.toBe(buildDakotaRequestKey(base));
  });

  it("changes the key when the job list changes", () => {
    expect(buildDakotaRequestKey({ ...base, jobList: ["job-a"] })).not.toBe(buildDakotaRequestKey(base));
  });

  it("changes the key when the log-scale flag changes", () => {
    expect(buildDakotaRequestKey({ ...base, logScale: true })).not.toBe(buildDakotaRequestKey(base));
  });

  it("treats axes as positional (order matters)", () => {
    const a = buildDakotaRequestKey({ ...base, axes: ["x", "y"] });
    const b = buildDakotaRequestKey({ ...base, axes: ["y", "x"] });
    expect(a).not.toBe(b);
  });

  it("treats undefined QoI and fn as stable null sentinels", () => {
    const a = buildDakotaRequestKey({ ...base, qoi: undefined, fn: undefined });
    const b = buildDakotaRequestKey({ ...base, qoi: undefined, fn: undefined });
    expect(a).toBe(b);
    expect(a).not.toBe(buildDakotaRequestKey(base));
  });

  it("changes the key when an axis sampling range changes (#501)", () => {
    const a = buildDakotaRequestKey({ ...base, axisRanges: { x: [0, 1] } });
    const b = buildDakotaRequestKey({ ...base, axisRanges: { x: [0, 10] } });
    expect(a).not.toBe(b);
  });

  it("changes the key when the axis with the range changes (#501)", () => {
    const a = buildDakotaRequestKey({ ...base, axisRanges: { x: [0, 1] } });
    const b = buildDakotaRequestKey({ ...base, axisRanges: { y: [0, 1] } });
    expect(a).not.toBe(b);
  });

  it("is stable for identical ranges regardless of object identity/order (#501)", () => {
    const a = buildDakotaRequestKey({ ...base, axisRanges: { x: [0, 1], y: [2, 3] } });
    const b = buildDakotaRequestKey({ ...base, axisRanges: { y: [2, 3], x: [0, 1] } });
    expect(a).toBe(b);
  });

  it("treats omitted and empty axisRanges as equivalent (#501)", () => {
    const a = buildDakotaRequestKey(base);
    const b = buildDakotaRequestKey({ ...base, axisRanges: undefined });
    expect(a).toBe(b);
  });
});
