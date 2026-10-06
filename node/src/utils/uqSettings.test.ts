import { describe, expect, it } from "vitest";
import type { UQSettings } from "../context/types";
import { clampUQSettings, defaultUQSettings, migrateLegacyUQSettings } from "./uqSettings";

describe("migrateLegacyUQSettings", () => {
  it("migrates legacy per-function numSamples into full UQ settings", () => {
    expect(migrateLegacyUQSettings({ a: 100, b: 2 }, undefined)).toEqual({
      a: { numSamples: 100, nHistograms: 50, seed: 0 },
      b: { numSamples: 2, nHistograms: 50, seed: 0 },
    });
  });

  it("lets explicit uqSettings entries win over migrated legacy ones", () => {
    const explicit = { a: { numSamples: 9, nHistograms: 3, seed: 1 } };
    expect(migrateLegacyUQSettings({ a: 100, b: 2 }, explicit)).toEqual({
      a: explicit.a,
      b: { numSamples: 2, nHistograms: 50, seed: 0 },
    });
  });

  it("ignores non-numeric legacy values", () => {
    expect(migrateLegacyUQSettings({ a: "100", b: null }, undefined)).toEqual({});
  });

  it("returns an empty map for files with neither field", () => {
    expect(migrateLegacyUQSettings(undefined, undefined)).toEqual({});
  });

  it("clamps persisted values beyond the modal's ranges at load", () => {
    expect(migrateLegacyUQSettings({ legacy: 5_000_000 }, undefined)).toEqual({
      legacy: { numSamples: 1_000_000, nHistograms: 50, seed: 0 },
    });
    expect(migrateLegacyUQSettings(undefined, { a: { numSamples: -5, nHistograms: 9999, seed: -3 } })).toEqual({
      a: { numSamples: 1, nHistograms: 1000, seed: 0 },
    });
  });

  it("defaults malformed explicit entries field-by-field", () => {
    expect(migrateLegacyUQSettings(undefined, { a: { nHistograms: 60 } as unknown as UQSettings })).toEqual({
      a: { ...defaultUQSettings, nHistograms: 60 },
    });
  });
});

describe("clampUQSettings", () => {
  it("clamps each field to the range the modal declares", () => {
    expect(clampUQSettings({ numSamples: 0, nHistograms: 5000, seed: -3 })).toEqual({
      numSamples: 1,
      nHistograms: 1000,
      seed: 0,
    });
    expect(clampUQSettings({ numSamples: 2_000_000, nHistograms: 1, seed: 0 })).toEqual({
      numSamples: 1_000_000,
      nHistograms: 1,
      seed: 0,
    });
  });

  it("falls back to the default for non-finite values", () => {
    expect(clampUQSettings({ numSamples: NaN, nHistograms: 50, seed: 0 })).toEqual({
      ...defaultUQSettings,
      nHistograms: 50,
    });
  });
});
