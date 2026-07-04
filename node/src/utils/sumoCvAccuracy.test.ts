import { describe, it, expect } from "vitest";
import { formatBiasBanner, defaultBiasSignificanceThreshold } from "./sumoCvAccuracy";

describe("formatBiasBanner", () => {
  it("flags significant bias below the default threshold", () => {
    const banner = formatBiasBanner({ statistic: 4.2, pValue: 0.03 });
    expect(banner).toBeDefined();
    expect(banner?.significant).toBe(true);
    expect(banner?.text).toContain("Statistically significant bias detected");
    expect(banner?.text).toContain("0.030");
  });

  it("reports no significant bias above the default threshold", () => {
    const banner = formatBiasBanner({ statistic: 0.5, pValue: 0.42 });
    expect(banner).toBeDefined();
    expect(banner?.significant).toBe(false);
    expect(banner?.text).toContain("No significant bias detected");
    expect(banner?.text).toContain("0.420");
  });

  it("treats p-value exactly at the threshold as not significant", () => {
    const banner = formatBiasBanner({ statistic: 1.0, pValue: defaultBiasSignificanceThreshold });
    expect(banner?.significant).toBe(false);
  });

  it("respects a custom threshold", () => {
    const banner = formatBiasBanner({ statistic: 1.0, pValue: 0.08 }, 0.1);
    expect(banner?.significant).toBe(true);
  });

  it("returns undefined when tTest is missing", () => {
    expect(formatBiasBanner(undefined)).toBeUndefined();
  });

  it("returns undefined when pValue is NaN", () => {
    expect(formatBiasBanner({ statistic: 1.0, pValue: NaN })).toBeUndefined();
  });
});
