// CodSpeed benchmark for the Function viewer's counts fetch (ITISFoundation#498).
//
// Every FunctionList mount (initial load, Refresh, post-upload refetch) fills
// its "Campaigns / evaluations" column in TWO requests now: listFunctions()
// plus ONE getFunctionJobCollectionCounts() aggregate (slice B of #498). This
// benchmark runs the mount's real data path (functionUtils -> requestJson ->
// fetchWithRetry -> fetch -> JSON parse -> normalizePayloadToCamelCase) against
// a canned Response stub, so it measures exactly the browser-side cost of that
// request pattern: 2 response parses and 2 camelCase normalizations, plus
// building the two count maps. Before slice B this same benchmark measured the
// historical 1 + N fan-out (N response parses/normalizations over ~150 KB of
// collections); the fan-out numbers live in CodSpeed's baseline from fork PR
// #751, and the delta on the #739 PR report IS the proof of the speedup.
//
// The request-count contract itself (browser volume = 2 for any N) is pinned by
// the FunctionList unit tests; this benchmark adds the continuous CodSpeed cost
// signal.
//
// IMPORTANT: the test name and the bench() label are this benchmark's identity
// in CodSpeed. Never rename the test or the label (which embeds the scale
// constants below), or CodSpeed can no longer compare the two request patterns
// and the measured speedup is lost.

import { afterAll, test } from "vitest";
import { getFunctionJobCollectionCounts, listFunctions } from "./functionUtils";

// Deterministic scale, mirrored by flaskapi/benchmarks/test_bench_function_counts.py.
// Both PR sides of this benchmark pair must keep these constants identical:
// the bench() label below embeds them, and the label is the CodSpeed
// benchmark identity -- changing it detaches the benchmark from the baseline
// recorded by fork PR #751 and the measured speedup is lost.
const functionCount = 25;
// 25 collections per function: the V50tj-paginated per-function endpoint (like
// this aggregate one) reports the full count.
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

// The exact camelCase JSON the aggregate endpoint's response transform emits
// (uid keys are never snake_case, so they survive the FE normalization).
const aggregateCountsJson = JSON.stringify(
  Object.fromEntries(
    Array.from({ length: functionCount }, (_value, index) => [
      functionUid(index),
      { campaignCount: collectionsPerFunction, evaluationCount: collectionsPerFunction * jobsPerCollection },
    ]),
  ),
);

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
  const url = String(input);
  const body = url.includes("get_function_job_collection_counts")
    ? aggregateCountsJson
    : url.includes("list_functions")
      ? functionsJson
      : undefined;
  // No fan-out route: if the mount ever regresses to per-function requests,
  // this throws and the benchmark fails loudly (the request-count contract is
  // node/SPEC.md V51cs).
  if (body === undefined) {
    throw new Error(`functionListCounts.bench: unexpected request ${url}`);
  }
  return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
};
afterAll(() => {
  globalThis.fetch = originalFetch;
});

// FunctionList.fetchFunctions' data layer, verbatim (state setters aside):
// the two count maps this builds are what the rows render.
async function fetchAllCounts(): Promise<Array<{ uid: string; campaignCount: number; evaluationCount: number }>> {
  const functions = await listFunctions();
  const counts = await getFunctionJobCollectionCounts();
  const jcCount: { [key: string]: number } = {};
  const jCount: { [key: string]: number } = {};
  Object.entries(counts).forEach(([uid, { campaignCount, evaluationCount }]) => {
    jcCount[uid] = campaignCount;
    jCount[uid] = evaluationCount;
  });
  return functions.map(fun => ({ uid: fun.uid, campaignCount: jcCount[fun.uid], evaluationCount: jCount[fun.uid] }));
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
