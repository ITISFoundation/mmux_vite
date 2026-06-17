// Stable logical request key for Dakota surrogate-model plot fetches (1D/2D/3D).
// V16 (INV-006): same logical request → no new fetch. The key is derived from the
// inputs that actually change the backend response: the plotted axes, the fixed
// slider values for the remaining inputs, the selected QoI, the function uid, the
// list of jobs the model is built from, and the log-scale flag. Re-creation of the
// surrounding objects (new array/object identity, key insertion order) must NOT
// change the key, so every collection is serialized deterministically.

export interface DakotaRequestKeyInput {
  axes: string[];
  sliderValues: { [key: string]: number };
  qoi: string | undefined;
  fn: string | undefined;
  jobList: string[];
  logScale: boolean;
}

const sortedRecordEntries = (record: { [key: string]: number }): [string, number][] =>
  Object.keys(record)
    .sort()
    .map(key => [key, record[key]] as [string, number]);

export function buildDakotaRequestKey({ axes, sliderValues, qoi, fn, jobList, logScale }: DakotaRequestKeyInput): string {
  // axes are positional (axis1/axis2/axis3) so order is meaningful and preserved.
  // sliderValues and jobList are order-independent, so they are sorted for stability.
  return JSON.stringify({
    axes,
    sliderValues: sortedRecordEntries(sliderValues),
    qoi: qoi ?? null,
    fn: fn ?? null,
    jobList: [...jobList].sort(),
    logScale,
  });
}
