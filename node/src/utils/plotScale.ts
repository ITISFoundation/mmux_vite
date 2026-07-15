// Shared axis-scale helpers for the Sobol'/Correlation single-plot sensitivity views (#502).
// Sobol' indices live in [0, 1] (mostly non-negative, small negative MC noise possible per
// §V32) so a plain log scale works; correlation coefficients live in [-1, 1] and can be
// negative, so they need a symlog-style transform. Both scales share the same floor so the
// two plots stay visually comparable: values with |v| < LOG_FLOOR are indistinguishable from
// zero and are clamped to the floor instead of blowing up the axis.

export const logFloor = 1e-2;
const logFloorExponent = Math.log10(logFloor); // -2

/** log10(value), clamped to logFloor — for non-negative values (Sobol' indices). */
export function toLogSafe(value: number): number {
  return Math.log10(Math.max(value, logFloor));
}

/**
 * Symlog transform for signed values (correlation coefficients): values inside
 * the floor band `(-logFloor, logFloor)` collapse to exactly 0 (indistinguishable
 * from noise at this precision, so no point spreading them out visually),
 * log-scaled magnitude beyond it. Monotonic (non-decreasing) across zero, unlike
 * a plain log scale which cannot represent negative values; NOT continuous at
 * ±logFloor by design (a deliberate visual gap separating "zero" from "real
 * effect", T39). The jump at the boundary is deliberately kept small
 * (`zeroBandWidth`, far narrower than a full decade's width of 1) so the
 * collapsed "zero" region doesn't visually eat up as much axis space as an
 * actual decade of real data would (T40).
 */
const zeroBandWidth = 0.3;
export function symlogTransform(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude < logFloor) {
    return 0;
  }
  return Math.sign(value) * (zeroBandWidth + Math.log10(magnitude / logFloor));
}

/** Tick positions (in transformed symlog space) and labels (original values) spanning -1..1. */
export function symlogTicks(): { tickvals: number[]; ticktext: string[] } {
  // Decades from 1 down to logFloor (e.g. [1, 0.1, 0.01] for logFloor=1e-2) —
  // derived from logFloorExponent so this stays in sync if the floor changes.
  const numDecades = Math.round(-logFloorExponent);
  const magnitudes = Array.from({ length: numDecades + 1 }, (_, i) => 10 ** -i);
  const positive = magnitudes.map(m => ({ val: symlogTransform(m), text: String(m) }));
  const negative = magnitudes.map(m => ({ val: symlogTransform(-m), text: String(-m) }));
  const all = [...negative.reverse(), { val: 0, text: "0" }, ...positive];
  return {
    tickvals: all.map(t => t.val),
    ticktext: all.map(t => t.text),
  };
}

/** Fixed axis ranges so plots for different QoIs stay visually comparable. */
export const sobolLinearRange: [number, number] = [0, 1];
// Plotly log-axis `range` is expressed in log10 units, so [1e-3, 1] → [-3, 0].
export const sobolLogRange: [number, number] = [logFloorExponent, 0];

export const correlationLinearRange: [number, number] = [-1, 1];
export const correlationSymlogRange: [number, number] = [symlogTransform(-1), symlogTransform(1)];
// abs(correlation) on a native Plotly log axis — same floor/range as Sobol' indices, since
// both are in [0, 1] once the sign is dropped.
export const correlationAbsLogRange: [number, number] = [logFloorExponent, 0];

export type ScaleType = "linear" | "log";
export type CorrelationScaleType = "linear" | "symlog" | "abslog";
