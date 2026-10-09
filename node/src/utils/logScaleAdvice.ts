// §V13 advisory boundary (B52ij, owner decision 2026-10-08). A factor-10 span
// mismatch between a column's data and the SELECTED sampling scale is never a
// gate — pickDistributionPreset runs pure shape-fit; this module only turns the
// disagreement into an advisory warning next to the Scale toggle:
//   • linear selected & data spans MORE than a factor of 10 (max/min > 10)
//     → a log scale usually reads better;
//   • log selected & data spans a factor ≤ 10
//     → a log scale is visually near-indistinguishable from linear.
// ⊥ side effects, ⊥ inference changes: the verdict is displayed, the choice
// stays the user's. min ≤ 0 has no meaningful ratio (and log is ineligible
// there anyway — the toggle's own guard), so no advice is returned.
// camelCase per the lint-enforced module-constant convention (cf.
// distributionPreferenceMargin), ⊥ CONSTANT_CASE despite §C's naming line.
export const scaleSpanWarningFactor = 10;

export function scaleSpanAdvice(values: number[], scale: "linear" | "log"): string | undefined {
  if (values.length === 0) {
    return undefined;
  }
  // explicit loop, ⊥ Math.min(...values): spreading a large job collection's
  // values into function arguments can throw a RangeError (B25).
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue;
    }
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }
  if (!(min > 0) || !(max > 0)) {
    return undefined;
  }
  const factor = max / min;
  if (scale === "linear" && factor > scaleSpanWarningFactor) {
    // 2 sig digits: the advisory is qualitative, the exact ratio is not the message
    return `Data spans a factor of ${Number(factor.toPrecision(2))} (> ${scaleSpanWarningFactor}) — a log scale usually reads better for this variable.`;
  }
  if (scale === "log" && factor <= scaleSpanWarningFactor) {
    return `Data spans less than a factor of ${scaleSpanWarningFactor} — a log scale barely differs from linear for this variable.`;
  }
  return undefined;
}
