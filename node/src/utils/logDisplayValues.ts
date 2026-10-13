/**
 * Display-only log painting helpers (node SPEC V12, B53kq).
 *
 * Traces whose quantity is NOT an axis — the 3D surface's z (height AND color)
 * and the isosurface's `value` — cannot get a log colorbar from any axis
 * `type`: Plotly scales their color LINEARLY in the raw numbers no matter what
 * the scene axes say. The only way to show them on a log display scale is to
 * paint log10(value) and relabel the colorbar with powers of 10.
 *
 * These helpers transform ONLY what is rendered: they never see a request body
 * or a session-cache key — the compute scale stays owned by the QoI card.
 */

/** True when every FINITE number in an arbitrarily nested numeric structure is > 0 (gaps — null/NaN — pass: Plotly leaves holes there). */
export function allPositive(values: unknown): boolean {
  if (Array.isArray(values)) return values.every(allPositive);
  if (typeof values === "number") return !Number.isFinite(values) || values > 0;
  return true;
}

/** log10 the finite numbers of a nested structure; gaps pass through. */
export function toLogDisplay<T>(values: T): T {
  if (Array.isArray(values)) return values.map(v => toLogDisplay(v)) as unknown as T;
  if (typeof values === "number") return (Number.isFinite(values) ? Math.log10(values) : values) as unknown as T;
  return values;
}

function powerLabel(exp: number): string {
  if (Number.isInteger(exp)) {
    const v = Math.pow(10, exp);
    if (exp >= -4 && exp <= 6) return String(v);
    return `1e${exp}`;
  }
  return String(Number(Math.pow(10, exp).toPrecision(3)));
}

function mantissaLabel(v: number): string {
  if (v >= 1e-4 && v < 1e7) return String(Number(v.toPrecision(6)));
  return v.toExponential().replace(/e([+-])0?(\d+)/, "e$1$2");
}

/**
 * Colorbar ticks for log10-painted values (input: the ORIGINAL pre-log values).
 * B55tm: `tickvals` REPLACES Plotly's auto ticks — a sparser list means fewer
 * labels, never interpolated ones — so the grid must always be dense enough to
 * read like a log axis: whole decades when ≥ 2 fit inside the span, else the
 * standard 1..9 mantissa sub-ticks, and only a span too narrow even for those
 * falls back to its endpoints. A log colorbar is never left bare.
 */
export function logColorbarTicks(values: unknown): { tickvals: number[]; ticktext: string[] } {
  let min = Infinity;
  let max = -Infinity;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "number" && Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  };
  walk(values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0) return { tickvals: [], ticktext: [] };
  const minExp = Math.log10(min);
  const maxExp = Math.log10(max);
  const decades: number[] = [];
  for (let e = Math.ceil(minExp); e <= Math.floor(maxExp); e += 1) decades.push(Math.pow(10, e));
  if (decades.length >= 2) {
    return { tickvals: decades.map(Math.log10), ticktext: decades.map(d => powerLabel(Math.round(Math.log10(d)))) };
  }
  const minors: number[] = [];
  for (let e = Math.floor(minExp); e <= Math.ceil(maxExp); e += 1) {
    for (let m = 1; m <= 9; m += 1) {
      const v = m * Math.pow(10, e);
      if (v >= min && v <= max) minors.push(v);
    }
  }
  const picks = minors.length >= 2 ? minors : [min, max];
  return { tickvals: picks.map(Math.log10), ticktext: picks.map(mantissaLabel) };
}
