// CodSpeed benchmark for the Function viewer's counts fetch (ITISFoundation#498).
//
// Every FunctionList mount (initial load, Refresh, post-upload refetch) fills
// its "Campaigns / evaluations" column via listFunctions() followed by ONE
// getFunctionJobCollections() per function -- an N+1 request fan-out. This
// benchmark runs the mount's real data path (functionUtils -> requestJson ->
// fetchWithRetry -> fetch -> JSON parse -> normalizePayloadToCamelCase) against
// a canned Response stub, so it measures exactly the browser-side cost of that
// request pattern: N+1 response parses and N+1 camelCase normalizations over
// production-shaped payloads, plus the Promise fan-out bookkeeping. The wire
// volume (25 functions x 25 collections x 4 jobs) is itself the payload the
// #498 aggregate endpoint exists to collapse.
//
// The request-count contract itself (browser volume N+1) is pinned by the
// FunctionList unit tests; this benchmark adds the continuous CodSpeed cost
// signal.
//
// IMPORTANT: the test name and the bench() label are this benchmark's identity
// in CodSpeed. The #498 scalability slice rewrites the body below in place to
// the aggregate getFunctionJobCollectionCounts() path (2 requests for any N) --
// do not rename the test or the label, or CodSpeed can no longer compare the
// two request patterns and the measured speedup is lost.

import { afterAll, test } from "vitest";
import { getFunctionJobCollections, listFunctions } from "./functionUtils";

// Deterministic scale, mirrored by flaskapi/benchmarks/test_bench_function_counts.py.
const functionCount = 25;
// 25 collections per function: the V50tj-paginated per-function endpoint (like
// the aggregate one that replaces it) reports the full count. Both PR sides of
// this benchmark pair must keep these constants identical: the bench() label
// below embeds them, and the label is the CodSpeed benchmark identity.
const collectionsPerFunction = 25;
const jobsPerCollection = 4;

const irregularVars = [
  "sigma blood",
  "TissueConduc",
  "electrode radius (mm)",
  "pulse width [us]",
  "Amplitude*Gain",
  "fiber diameter",
  "myelin thickness",
  "node length",
];
const inputVars = irregularVars.concat(
  Array.from({ length: 32 }, (_value, index) => `input_var_${irregularVars.length + index}`),
);
const outputVars = ["-AFpeak", "activation threshold", "energy (uJ)"];

function functionUid(index: number): string {
  return `11111111-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

// The exact camelCase JSON the Flask API's response transform emits.
const functionsJson = JSON.stringify(
  Array.from({ length: functionCount }, (_value, index) => ({
    uid: functionUid(index),
    title: `Function ${String(index).padStart(2, "0")}`,
    description: "A demo function benchmarked for viewer-list scalability",
    inputSchema: {
      schemaContent: {
        type: "object",
        properties: Object.fromEntries(inputVars.map(name => [name, { type: "number" }])),
        required: inputVars,
      },
    },
    outputSchema: {
      schemaContent: {
        type: "object",
        properties: Object.fromEntries(outputVars.map(name => [name, { type: "number" }])),
        required: outputVars,
      },
    },
    createdAt: "2026-01-01T00:00:00.000Z",
  })),
);

const jobCollectionsJson = JSON.stringify(
  Array.from({ length: collectionsPerFunction }, (_value, index) => ({
    uid: `22222222-00-${String(index).padStart(2, "0")}-4000-800000000000`,
    name: `Campaign ${String(index).padStart(2, "0")}`,
    jobIds: Array.from(
      { length: jobsPerCollection },
      (_job, job) => `33333333-00-${String(index).padStart(2, "0")}-${String(job).padStart(2, "0")}-800000000000`,
    ),
    createdAt: "2026-01-01T00:00:00.000Z",
  })),
);

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
  const url = String(input);
  const body = url.includes("list_function_job_collections_for_functionid")
    ? jobCollectionsJson
    : url.includes("list_functions")
      ? functionsJson
      : undefined;
  if (body === undefined) {
    throw new Error(`functionListCounts.bench: unexpected request ${url}`);
  }
  return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
};
afterAll(() => {
  globalThis.fetch = originalFetch;
});

// FunctionList.fetchFunctions' data layer, verbatim (state setters aside):
// the counts this fan-out computes are what the rows render.
async function fetchAllCounts(): Promise<Array<{ uid: string; campaignCount: number; evaluationCount: number }>> {
  const functions = await listFunctions();
  return Promise.all(
    functions.map(async fun => {
      const jobCollections = await getFunctionJobCollections(fun.uid);
      return {
        uid: fun.uid,
        campaignCount: jobCollections.length,
        evaluationCount: jobCollections.reduce((acc, jc) => acc + (jc.jobIds?.length ?? 0), 0),
      };
    }),
  );
}

test("FunctionList counts fetch", async ({ bench, expect }) => {
  const counts = await fetchAllCounts();
  expect(counts).toHaveLength(functionCount);
  expect(counts[0]).toEqual({
    uid: functionUid(0),
    campaignCount: collectionsPerFunction,
    evaluationCount: collectionsPerFunction * jobsPerCollection,
  });

  await bench(`${functionCount} functions / ${collectionsPerFunction} collections each`, async () => {
    await fetchAllCounts();
  }).run();
});
