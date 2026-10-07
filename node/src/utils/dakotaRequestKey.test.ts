import { describe, it, expect } from "vitest";
import { buildAxisRanges, buildDakotaRequestKey, DakotaRequestKeyInput } from "./dakotaRequestKey";

const base: DakotaRequestKeyInput = {
  axes: ["x"],
  sliderValues: { y: 1, z: 2 },
  qoi: "out",
  fn: "fn-uid",
  jobList: ["job-a", "job-b"],
  inputLogScales: {},
  outputLogScaled: false,
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
      inputLogScales: { x: false },
      outputLogScaled: false,
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

  it("changes the key when a log-scale flag changes", () => {
    expect(buildDakotaRequestKey({ ...base, inputLogScales: { x: true } })).not.toBe(buildDakotaRequestKey(base));
    // key insertion order must not matter
    expect(buildDakotaRequestKey({ ...base, inputLogScales: { a: true, b: false } })).toBe(
      buildDakotaRequestKey({ ...base, inputLogScales: { b: false, a: true } }),
    );
    // the QoI's output flag must move the key on its own
    expect(buildDakotaRequestKey({ ...base, outputLogScaled: true })).not.toBe(buildDakotaRequestKey(base));
  });

  it("keeps input and output scale flags namespaced when an input shares the QoI's name", () => {
    // a merged { ...inputLogScales, [qoi]: flag } map would let one flag mask
    // the other's change here (same name, e.g. "out" as input AND QoI)
    const qoiNamed = { ...base, qoi: "out", inputLogScales: { out: false }, outputLogScaled: true };
    // input flag flips false -> true while the QoI flag is already true:
    expect(buildDakotaRequestKey({ ...qoiNamed, inputLogScales: { out: true } })).not.toBe(buildDakotaRequestKey(qoiNamed));
    // and the mirrored case: output flag flips while the input flag stays true
    const inputNamed = { ...base, qoi: "out", inputLogScales: { out: true }, outputLogScaled: false };
    expect(buildDakotaRequestKey({ ...inputNamed, outputLogScaled: true })).not.toBe(buildDakotaRequestKey(inputNamed));
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

  it.each<[string, Partial<DakotaRequestKeyInput>]>([
    ["a tiny slider change", { sliderValues: { y: 1 + 1e-12, z: 2 } }],
    ["an extra slider", { sliderValues: { y: 1, z: 2, w: 0 } }],
    ["a dropped slider", { sliderValues: { y: 1 } }],
    ["a slider variable moved onto an axis", { axes: ["x", "y"], sliderValues: { z: 2 } }],
    ["an empty job list", { jobList: [] }],
    ["a duplicated job uid", { jobList: ["job-a", "job-b", "job-b"] }],
    ["a QoI that differs only in case", { qoi: "OUT" }],
  ])("changes the key for %s", (_label, change) => {
    expect(buildDakotaRequestKey({ ...base, ...change })).not.toBe(buildDakotaRequestKey(base));
  });

  it("does not reorder the caller's job list", () => {
    const jobList = ["job-b", "job-a"];
    buildDakotaRequestKey({ ...base, jobList });
    expect(jobList).toEqual(["job-b", "job-a"]);
  });
});

describe("buildAxisRanges", () => {
  it("extracts only complete ranges for the requested axes", () => {
    const distribution = {
      x: { distribution: "uniform" as Distribution, min: 0, max: 1 },
      y: { distribution: "uniform" as Distribution, min: -1 },
    };

    expect(buildAxisRanges(distribution, ["x", "y", "z"])).toEqual({ x: [0, 1] });
  });

  it("returns undefined when no requested axis has a complete range", () => {
    expect(buildAxisRanges(undefined, ["x"])).toBeUndefined();
  });
});
