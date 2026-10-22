import { UQSettings } from "../context/types";

/**
 * THE single source of UQ defaults. Consumers (UQ histogram propagation, correlation and
 * Sobol panels, the settings modal) read these numbers — they ⊥ re-declare the literals,
 * because a copy that drifts makes the modal show one number while the request carries
 * another (node V49ub).
 *
 * `numSamples` is 2 000 by owner decision 2026-10-22: the previous 10 000 was arbitrary
 * (never derived from a convergence requirement), the Sobol design uses its own fixed
 * rule and is ⊥ user-customizable, and per-function stored settings keep their explicit
 * values through `migrateLegacyUQSettings` — so only FRESH state gets the lower default.
 */
export const defaultUQSettings: UQSettings = {
  numSamples: 2000,
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

/**
 * The effective UQ settings for one function: stored entry (already clamped by
 * `migrateLegacyUQSettings` at load) filled field-by-field from `defaultUQSettings`.
 *
 * Every consumer that builds a UQ-shaped request body (histogram propagation, correlation,
 * Sobol') and the settings modal itself go through this, so the numbers a request carries
 * and the numbers the modal displays cannot diverge — the failure mode three inline `|| 10000`
 * copies used to allow (node V49ub).
 */
export const uqSettingsFor = (
  uqSettings: { [key: string]: UQSettings } | undefined,
  functionId: string | undefined,
): UQSettings => ({
  ...defaultUQSettings,
  ...(uqSettings?.[functionId || ""] ?? {}),
});

// Legacy persistence files stored each function's configured UQ sample count
// in `numSamples` and have no `uqSettings`. Without migration those functions
// silently drop to defaultUQSettings.numSamples (2 000 — see the default's note on
// why that number is what it is). Explicit
// `uqSettings` entries win over the migrated ones.
//
// Load-boundary enforcement (Copilot #687): clampUQSettings runs at modal
// SAVE, but persisted files predate it or were written around it, and
// consumers post loaded settings straight to the UQ/Sobol/correlation
// endpoints (a negative seed violates the backend's seed >= 0). This is the
// only load path (MMUXContext), so EVERY entry leaving here — migrated and
// explicit alike — is clamped to the modal's ranges.
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
  const loaded = { ...migrated, ...(uqSettings ?? {}) };
  for (const uid of Object.keys(loaded)) {
    loaded[uid] = clampUQSettings(loaded[uid]);
  }
  return loaded;
};
