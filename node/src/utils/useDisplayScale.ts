import { useState } from "react";

/**
 * Panel DISPLAY axis scale (§V12). Defaults to the QoI's computation scale so the
 * plot opens in the space the surrogate actually lives in, but a per-panel toggle
 * can override that for VIEWING ONLY. The override is dropped whenever `resetKey`
 * (the selected function+QoI identity) changes, so a view choice made for one
 * quantity never silently persists onto another. The value is consumed ONLY as
 * the Plotly axis `type`: it never enters a request body or a cache key — the
 * computation scale stays owned by the QoI Surrogate-scale card.
 */
export function useDisplayScale(computeLog: boolean, resetKey: string): [boolean, (log: boolean) => void] {
  const [override, setOverride] = useState<boolean | undefined>(undefined);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Render-phase state adjustment (React's "derive state from props" pattern):
  // the stale override is dropped the same render the identity changes.
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setOverride(undefined);
  }

  return [override ?? computeLog, setOverride];
}
