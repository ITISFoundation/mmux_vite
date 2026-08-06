import { useEffect, useRef } from "react";
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
// Eligibility (mirrors ../flaskapi/SPEC.md V34 + distributionDiagnostics.ts's min>0 guard):
//   - >=5 completed jobs carry a numeric output for the QoI (matches the existing
//     `jobs.length < 5` gate used by SuMoValidation/JobContext).
//   - every one of those outputs is > 0 (log is undefined otherwise; also avoids the
//     backend's 400 rejection).
// Cached by (function uid, QoI, sorted job-uid list) (INV-006 pattern) so an unchanged
// job-set never re-fires the CV pair for a QoI it already resolved (or gave up on).

const minCompletedJobs = 5;

function computeRmse(actual: number[], predicted: number[]): number | undefined {
  if (actual.length === 0 || actual.length !== predicted.length) return undefined;
  const sumSquaredError = actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0);
  return Math.sqrt(sumSquaredError / actual.length);
}

async function fetchCvRmse(inputVars: string[], qoi: string, jobs: unknown[], logScale: boolean): Promise<number | undefined> {
  try {
    const response = await fetch(`/flask/dakota/sumo_cross_validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputVars,
        output: qoi,
        FunctionJobs: jobs,
        outputLogScales: { [qoi]: logScale },
      }),
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    if (!data || data.error) return undefined;
    const actual = data[qoi];
    const predicted = data[`${qoi}Hat`];
    if (!Array.isArray(actual) || !Array.isArray(predicted)) return undefined;
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
  const { selectedFunction, inputVars, setOutputLogScales, outputLogScaleUserSet } = useFunctionContext();
  const { filteredJobList } = useJobContext();
  // Kept in sync every render so in-flight async callbacks (below) always re-check the
  // LATEST lock state before applying, even if the user toggles mid-flight.
  const outputLogScaleUserSetRef = useRef(outputLogScaleUserSet);
  outputLogScaleUserSetRef.current = outputLogScaleUserSet;
  // (uid, qoi, sorted job-uid list) keys already attempted, so an unchanged job-set for
  // a QoI never re-fires the CV pair.
  const resolvedKeys = useRef<Set<string>>(new Set());

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

      const cacheKey = `${uid}::${qoi}::${sortedJobUids}`;
      if (resolvedKeys.current.has(cacheKey)) return;

      const outputValues = outputsByVar[qoi] || [];
      if (outputValues.length < minCompletedJobs) return;
      if (!outputValues.every(value => value > 0)) return; // mirrors ../flaskapi/SPEC.md V34

      resolvedKeys.current.add(cacheKey);

      (async () => {
        const [rmseLinear, rmseLog] = await Promise.all([
          fetchCvRmse(inputVars, qoi, filteredJobList, false),
          fetchCvRmse(inputVars, qoi, filteredJobList, true),
        ]);
        if (rmseLinear === undefined || rmseLog === undefined) return;
        if (outputLogScaleUserSetRef.current[uid]?.[qoi]) return; // re-check: may have been locked mid-flight

        const preferLog = rmseLog < rmseLinear;
        setOutputLogScales(prev => {
          if (prev[uid]?.[qoi] === preferLog) return prev; // no-op: avoid extra renders/persistence writes
          return { ...prev, [uid]: { ...prev[uid], [qoi]: preferLog } };
        });
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qois?.join(","), filteredJobList, selectedFunction?.uid, inputVars.join(",")]);
}
