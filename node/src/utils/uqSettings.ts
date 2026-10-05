import { UQSettings } from "../context/types";

export const defaultUQSettings: UQSettings = {
  numSamples: 10000,
  nHistograms: 50,
  seed: 0,
};

// Ranges the UQ settings modal declares on its fields; HTML min/max do not
// clamp typed input, so saving enforces them.
const ranges: Record<keyof UQSettings, [number, number]> = {
  numSamples: [1, 1000_000],
  nHistograms: [1, 1000],
  seed: [0, 1000_000],
};

export const clampUQSettings = (settings: UQSettings): UQSettings => {
  const clamped = {} as UQSettings;
  for (const field of Object.keys(ranges) as Array<keyof UQSettings>) {
    const [min, max] = ranges[field];
    const value = settings[field];
    clamped[field] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : defaultUQSettings[field];
  }
  return clamped;
};

// Legacy persistence files stored each function's configured UQ sample count
// in `numSamples` and have no `uqSettings`. Without migration those functions
// silently drop to defaultUQSettings.numSamples (10 000). Explicit
// `uqSettings` entries win over the migrated ones.
export const migrateLegacyUQSettings = (
  legacyNumSamples: { [key: string]: unknown } | undefined,
  uqSettings: { [key: string]: UQSettings } | undefined,
): { [key: string]: UQSettings } => {
  const migrated: { [key: string]: UQSettings } = {};
  for (const [uid, value] of Object.entries(legacyNumSamples ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) {
      migrated[uid] = { ...defaultUQSettings, numSamples: value };
    }
  }
  return { ...migrated, ...(uqSettings ?? {}) };
};
