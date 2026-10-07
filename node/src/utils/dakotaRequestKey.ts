// Stable logical request key for Dakota surrogate-model plot fetches (1D/2D/3D).
// V16 (INV-006): same logical request → no new fetch. The key is derived from the
// inputs that actually change the backend response: the plotted axes, the fixed
// slider values for the remaining inputs, the selected QoI, the function uid, the
// list of jobs the model is built from, and the per-variable log-scale flags
// (inputLogScales + the QoI's output flag). Re-creation of the surrounding
// objects (new array/object identity, key insertion order) must NOT change the
// key, so every collection is serialized deterministically.

export interface DakotaRequestKeyInput {
  axes: string[];
  sliderValues: { [key: string]: number };
  qoi: string | undefined;
  fn: string | undefined;
  jobList: string[];
  inputLogScales: { [key: string]: boolean };
  outputLogScaled: boolean;
  axisRanges?: { [key: string]: [number, number] };
}

export function buildAxisRanges(
  distribution: InputVarSelection | undefined,
  axes: string[],
): { [key: string]: [number, number] } | undefined {
  const entries = axes.flatMap(axis => {
    const range = distribution?.[axis];
    return range?.min !== undefined && range.max !== undefined ? [[axis, [range.min, range.max] as [number, number]]] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

const sortedRecordEntries = (record: { [key: string]: number }): [string, number][] =>
  Object.keys(record)
    .sort()
    .map(key => [key, record[key]] as [string, number]);

const sortedRangeEntries = (record: { [key: string]: [number, number] } | undefined): [string, [number, number]][] =>
  Object.keys(record ?? {})
    .sort()
    .map(key => [key, record![key]] as [string, [number, number]]);

const sortedLogScales = (record: { [key: string]: boolean }): [string, boolean][] =>
  // only flagged entries reach the backend meaningfully ({x:false} ≡ {}
  // for PreprocessingSpec folding), so unflagged entries must not churn the key
  Object.keys(record)
    .filter(key => Boolean(record[key]))
    .sort()
    .map(key => [key, true] as [string, boolean]);

export function buildDakotaRequestKey({
  axes,
  sliderValues,
  qoi,
  fn,
  jobList,
  inputLogScales,
  outputLogScaled,
  axisRanges,
}: DakotaRequestKeyInput): string {
  // axes are positional (axis1/axis2/axis3) so order is meaningful and preserved.
  // sliderValues, inputLogScales and jobList are order-independent, so they are
  // sorted for stability. The input and output scale flags are NEVER merged into
  // one name-keyed map: a backend input and the QoI may share a name, and a
  // spread would let one flag silently mask the other's change, suppressing a
  // refetch the backend response does depend on. The QoI's own name already
  // rides in `qoi`, so its flag alone is the discriminator.
  return JSON.stringify({
    axes,
    sliderValues: sortedRecordEntries(sliderValues),
    qoi: qoi ?? null,
    fn: fn ?? null,
    jobList: [...jobList].sort(),
    inputLogScales: sortedLogScales(inputLogScales),
    outputLogScaled,
    axisRanges: sortedRangeEntries(axisRanges),
  });
}
