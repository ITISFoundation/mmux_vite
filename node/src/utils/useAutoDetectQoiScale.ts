import { useEffect, useMemo, useRef, useState } from "react";

import { requestJson } from "../api/client";
import { useFunctionContext } from "../context/FunctionContext";
import { useJobContext } from "../context/JobContext";
import { aggregateOutputValues } from "./functionUtils";

// V26/V27/T21: shared per-QoI "auto-detect better surrogate scale" hook, consumed by
// the UncertainUQ / SuMoValidation / MOGA results views (each mounted only under its
// own serviceMode). Fires /flask/dakota/sumo_cross_validation twice per candidate QoI
// (outputLogScales[qoi] = false, then true), compares RMSE in original units (lower
// wins), and applies the winner as an UNTOUCHED DEFAULT only: once a user manually
// toggles a QoI's scale (OutputVariableDist.tsx -> setOutputLogScaleUserSet),
// `outputLogScaleUserSet[uid][qoi]` locks that QoI and this hook never overrides it
// again, even as the job-set grows (V27).
//
// Eligibility (mirrors ../flaskapi/SPEC.md V16 + the CSV inference min>0 guard):
//   - >=5 completed jobs carry a numeric output for the QoI (matches the existing
//     `jobs.length < 5` gate used by SuMoValidation/JobContext).
//   - every one of those outputs is > 0 (log is undefined otherwise; also avoids
//     the backend's positivity rejection).
// Cached by (function uid, QoI, sorted job-uid list) (INV-006 pattern) so an
// unchanged job-set never re-fires the CV pair for a QoI it already resolved.

// Matches the flaskapi SumoCrossValidationRequest job validator and the FE's
// InsufficientDataWarning: completed jobs must number at least
// max(5, n_inputs + 1). A fixed 5 would fire the pair early for ≥5-input
// functions and get 422 on both CV calls (GH-Copilot #696 re-review).
export const minCvJobs = (numInputVars: number): number => Math.max(5, numInputVars + 1);

// Retries the hook schedules for a CV pair that failed or answered malformed,
// per (uid, QoI, job-set, scale) key, beyond the initial attempt. One
// transient blip heals on the first retry; the cap keeps a hard failure (dead
// endpoint, persistently bad payload) from hammering CV forever
// (GH-Copilot #706).
const maxCvRetries = 2;

// Single definition of the CV pair's cache key — the hook and the provenance
// UI both compute it, so "is this receipt current?" is a shared predicate
// rather than a re-implementation (GH-Copilot #696 re-review: a stale receipt
// must not render as the live verdict).
export const buildQoiScaleKey = (uid: string, qoi: string, sortedJobUids: string, inputScaleSignature: string): string =>
  `${uid}::${qoi}::${sortedJobUids}::${inputScaleSignature}`;

function computeRmse(actual: number[], predicted: number[]): number | undefined {
  const sumSquaredError = actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0);
  return Math.sqrt(sumSquaredError / actual.length);
}

async function fetchCvRmse(
  inputVars: string[],
  qoi: string,
  jobs: unknown[],
  logScale: boolean,
  inputLogScales: { [inputVar: string]: boolean },
  minJobs: number,
): Promise<number | undefined> {
  try {
    // V44eh re-port: the fork-era raw call site predates the shared client and
    // is rejected by the architecture guard's fetch allowlist; requestJson
    // throws on non-OK, which the catch below folds into the same undefined.
    const data = await requestJson<{ observed?: number[]; predicted?: number[]; error?: string }>(
      `/flask/dakota/sumo_cross_validation`,
      {
        method: "POST",
        body: {
          inputVars,
          output: qoi,
          FunctionJobs: jobs,
          // #665: score the surrogate under the CURRENT input scales, not an
          // all-linear strawman the user never asked for (GH-Copilot #663 audit)
          inputLogScales,
          outputLogScales: { [qoi]: logScale },
        },
      },
    );
    if (!data || data.error) return undefined;
    // Fixed-field CV contract (flaskapi SPEC V46jk): observed/predicted arrays.
    const actual = data.observed;
    const predicted = data.predicted;
    if (!Array.isArray(actual) || !Array.isArray(predicted)) return undefined;
    if (actual.length < minJobs || actual.length !== predicted.length) return undefined;
    return computeRmse(actual, predicted);
  } catch (error) {
    console.warn(`useAutoDetectQoiScale: CV fetch failed for "${qoi}" (log=${logScale})`, error);
    return undefined;
  }
}

/**
 * Auto-detects, for each QoI in `qois`, whether log-scale surrogate training gives a
 * lower cross-validation RMSE than linear-scale, and applies the winner as the default
 * `outputLogScales[uid][qoi]` value — unless the user already locked that QoI manually.
 */
export function useAutoDetectQoiScale(qois: string[] | undefined) {
  const {
    selectedFunction,
    inputVars,
    distribution,
    setOutputLogScales,
    outputLogScaleUserSet,
    qoiScaleEvidence,
    setQoiScaleEvidence,
  } = useFunctionContext();
  const { filteredJobList } = useJobContext();
  // Kept in sync after every render (effect, not render-phase mutation, to
  // satisfy the lint rules) so in-flight async callbacks (below) always
  // re-check the LATEST lock state before applying, even if the user toggles
  // mid-flight.
  const outputLogScaleUserSetRef = useRef(outputLogScaleUserSet);
  useEffect(() => {
    outputLogScaleUserSetRef.current = outputLogScaleUserSet;
  });
  // Same pattern for the session evidence: read through a ref so writing a
  // receipt never re-triggers this effect.
  const qoiScaleEvidenceRef = useRef(qoiScaleEvidence);
  useEffect(() => {
    qoiScaleEvidenceRef.current = qoiScaleEvidence;
  });
  // (uid, qoi, sorted job-uid list) keys already attempted, so an unchanged job-set for
  // a QoI never re-fires the CV pair.
  const resolvedKeys = useRef<Set<string>>(new Set());
  // The key the LATEST effect generation believes is current per (uid, qoi).
  // A scale-flag change starts a SECOND CV pair while the first is still in
  // flight; whichever pair is captured under a key that is no longer current
  // must NOT commit its verdict (GH-Copilot #665 review — the same
  // stale-response class as node B23rv/T29sw, narrowed to this hook).
  const latestKeyByQoi = useRef<{ [uidQoi: string]: string }>({});
  // Failed-pair self-heal (GH-Copilot #706): refunding a key alone never
  // re-fires the effect — refs don't render — so a failure also bumps this
  // nonce (it is in the effect deps below). Attempts are counted per cache
  // key so a persistent failure gives up at maxCvRetries instead of looping.
  const [retryNonce, setRetryNonce] = useState(0);
  const cvAttemptsByCacheKey = useRef<Map<string, number>>(new Map());

  // Current per-input log flags — the CV pair must score the surrogate the
  // user's input scales actually imply, and a change to any flag invalidates
  // the cached verdict (GH-Copilot #663 audit: stale all-linear comparisons
  // could pick the wrong output scale and never re-detect).
  const inputLogScales = useMemo(
    () =>
      inputVars.reduce(
        (acc: { [key: string]: boolean }, key) => {
          acc[key] = distribution[selectedFunction?.uid || ""]?.[key]?.scale === "log";
          return acc;
        },
        {} as { [key: string]: boolean },
      ),
    [inputVars, distribution, selectedFunction],
  );
  const inputScaleSignature = useMemo(
    () => inputVars.map(v => (inputLogScales[v] ? "1" : "0")).join(""),
    [inputVars, inputLogScales],
  );

  useEffect(() => {
    const uid = selectedFunction?.uid;
    if (!uid || !qois || qois.length === 0) return;

    const sortedJobUids = filteredJobList
      .map(job => job.uid)
      .sort()
      .join(",");
    const outputsByVar = aggregateOutputValues(filteredJobList);

    qois.forEach(qoi => {
      if (outputLogScaleUserSetRef.current[uid]?.[qoi]) return; // locked by manual toggle (V27)

      const cacheKey = buildQoiScaleKey(uid, qoi, sortedJobUids, inputScaleSignature);
      // EVERY generation (even cached/skipped ones) marks this key current, so
      // a still-in-flight pair whose key equals the latest key stays valid,
      // while any pair superseded by a scale change is discarded on resolve.
      latestKeyByQoi.current[`${uid}::${qoi}`] = cacheKey;
      if (resolvedKeys.current.has(cacheKey)) return;
      // A receipt from an EARLIER mount (tab switch, sibling view) for exactly
      // this parameter set: the verdict stands — adopt it into this instance's
      // resolved set and do NOT re-fire the CV pair.
      if (qoiScaleEvidenceRef.current[uid]?.[qoi]?.key === cacheKey) {
        resolvedKeys.current.add(cacheKey);
        return;
      }

      const minJobs = minCvJobs(inputVars.length);
      const outputValues = outputsByVar[qoi] || [];
      // Positivity is checked BEFORE count: any ≤0 output makes an unlocked log
      // verdict actively invalid — the backend positivity guard rejects every
      // log(QoI) request — so invalidate it now instead of leaving it until a
      // pair this job-set can never score (GH-Copilot #696 re-review). Manual
      // locks are user data: leave them, the toggle tooltip footnotes instead.
      if (!outputValues.every(value => value > 0)) {
        setQoiScaleEvidence(prev => {
          if (prev[uid]?.[qoi] === undefined) return prev;
          const kept = Object.fromEntries(Object.entries(prev[uid]).filter(([name]) => name !== qoi));
          return { ...prev, [uid]: kept };
        });
        setOutputLogScales(prev => {
          if (prev[uid]?.[qoi] !== true) return prev; // linear/unset: nothing to invalidate
          return { ...prev, [uid]: { ...prev[uid], [qoi]: false } };
        });
        return;
      }
      if (outputValues.length < minJobs) return;

      resolvedKeys.current.add(cacheKey);

      (async () => {
        const [rmseLinear, rmseLog] = await Promise.all([
          fetchCvRmse(inputVars, qoi, filteredJobList, false, inputLogScales, minJobs),
          fetchCvRmse(inputVars, qoi, filteredJobList, true, inputLogScales, minJobs),
        ]);
        if (rmseLinear === undefined || rmseLog === undefined) {
          // A failed/malformed pair has nothing to commit, so it must not have
          // consumed its key (refund like the stale-discard path, GH-Copilot
          // #696 re-review). The refund ALONE is not a retry: refs never
          // re-render, so the tooltip sat on "Comparing…" until some unrelated
          // dep changed (GH-Copilot #706). Bump the nonce so this pair
          // re-fires.
          // Cap check FIRST (GH-Copilot #707 review): refunding before the
          // give-up return left the key unresolved, so every later effect run
          // — a fresh filteredJobList identity with identical content alone
          // suffices — re-armed a fresh pair, making the 1 + maxCvRetries
          // budget per effect-run instead of per key. At the cap the key stays
          // resolved: give-up is terminal for this key for the instance's
          // lifetime, the honest pending state stands, and recovery rides a
          // key change (jobs/scales) — the budget is per key by design.
          const attempts = cvAttemptsByCacheKey.current.get(cacheKey) ?? 1;
          if (attempts > maxCvRetries) return;
          resolvedKeys.current.delete(cacheKey);
          cvAttemptsByCacheKey.current.set(cacheKey, attempts + 1);
          setRetryNonce(nonce => nonce + 1);
          return;
        }
        if (outputLogScaleUserSetRef.current[uid]?.[qoi]) return; // re-check: may have been locked mid-flight
        if (latestKeyByQoi.current[`${uid}::${qoi}`] !== cacheKey) {
          // Superseded by a newer scale generation (GH-Copilot #665). UNCACHE the
          // discarded key: resolvedKeys is marked at KICK time, and this pair was
          // the only verdict attempt for that exact parameter set — without the
          // un-cache an A→B→A flip-flop leaves the A key permanently "resolved"
          // while nothing was ever committed for it (permanent silence; the
          // same-key pair that finally lands while latest==key commits, so this
          // refund cannot resurrect a genuinely superseded verdict).
          resolvedKeys.current.delete(cacheKey);
          return;
        }

        const preferLog = rmseLog < rmseLinear;
        // Receipt of WHAT this verdict measured, surfaced at the QoI toggle
        // (provenance chip + both CV errors). Written only after every guard
        // above passed — it describes exactly what is being committed.
        setQoiScaleEvidence(prev => ({
          ...prev,
          [uid]: { ...prev[uid], [qoi]: { rmseLinear, rmseLog, jobs: outputValues.length, key: cacheKey } },
        }));
        setOutputLogScales(prev => {
          if (prev[uid]?.[qoi] === preferLog) return prev; // no-op: avoid extra renders/persistence writes
          return { ...prev, [uid]: { ...prev[uid], [qoi]: preferLog } };
        });
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qois?.join(","), filteredJobList, selectedFunction?.uid, inputVars.join(","), inputScaleSignature, retryNonce]);
}
