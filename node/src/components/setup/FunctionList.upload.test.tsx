/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Port of the single regression test kept from `DO-NOT-MERGE-feature/local-functions`
 * (fork JavierGOrdonnez/mmux_vite#17 per-test audit; node/SPEC.md T50ab).
 *
 * Pins the CONSUMER half of V13: `handleCsvUploadSuccess` must take the ONE
 * authoritative parse result and drive {select fn, prefill bounds} atomically —
 * the upload auto-selects the new function and merge-prefills the parsed
 * min/max + scale presets into `distribution`. The button-side half of V13
 * (1 authoritative parse → 1 onUploadSuccess result) stays pinned by
 * `UploadJobCollectionButton.test.tsx`.
 *
 * What is mocked:
 *   - API calls (listFunctions, getFunctionJobCollectionCounts, uploadJobCollectionCsv)
 *   - File picker (pickSingleCsvFile) → a duck-typed file backed by a CSV string
 *   - Secondary contexts (SamplingContext, JobContext) and PersistenceContext
 *   - react-toastify (side-effect-free stub) + @mui/x-data-grid (render stub)
 *
 * What runs for real:
 *   - FunctionContextProvider (state management under test)
 *   - parseJobCollectionCsv (the CSV analysis feeding the consumer)
 *   - FunctionList + UploadJobCollectionButton (the components under test)
 *
 * The consumer is inference-AGNOSTIC: expected presets are derived from
 * `parseJobCollectionCsv`'s own output at test time — ⊥ snapshot of shape/scale
 * verdicts (that algorithm is owned by the parser's own tests, incl. #714's
 * shape-fit replay). What is pinned here is FORWARDING + MERGE: the consumer
 * must carry the authoritative parse result into `distribution` — seeded
 * entries absent from the CSV survive (merge ⊥ replace), and the parser wins a
 * colliding variable. The second case pins a `scale:"log"` tag end-to-end via
 * the <10-sample >=2-decade low-confidence fallback verdict, which is kept
 * across inference regimes.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";
import { FunctionContextProvider, useFunctionContext } from "../../context/FunctionContext";
import { parseJobCollectionCsv } from "../../utils/jobCollectionCsv";

// Deterministic ARTIFICIAL import data — ⊥ real study data in-repo. 50 rows x
// 6 strictly-positive input columns + 1 output, spread so the parser has a
// realistic table to work on. Preset VALUES are never asserted (expectations
// derive from the parser below), so this stable pseudo-spread suffices.
const inputVars = Array.from({ length: 6 }, (_, j) => `v${j + 1}`);
const csvContent = [
  "# schema_version,2",
  "# source_job_collection_uid,synthetic_import_collection",
  "# source_job_collection_title,synthetic_import_collection",
  "# source_function_uid,",
  "",
  [...inputVars.map(v => `input__${v}`), "output__y"].join(","),
  ...Array.from({ length: 50 }, (_, i) =>
    [...inputVars.map((_, j) => (Math.exp(j * 1.7) * (1 + i * 0.37)).toFixed(4)), (i * 7).toFixed(2)].join(","),
  ),
].join("\n");

// The function the backend will return after the CSV is uploaded; the schema
// mirrors the generated input columns. One output property suffices: outputs
// are registered, never asserted — preset content is the parser's own suite's
// business, not the consumer's.
const uploadedFunction = {
  uid: "test-uid",
  title: "synthetic_import_fn",
  description: "",
  inputSchema: { schemaContent: { properties: Object.fromEntries(inputVars.map(v => [v, { type: "number" }])) } },
  outputSchema: { schemaContent: { properties: { y: { type: "number" } } } },
} as never;

// The function returned for the second, inline-CSV case (wide-span column).
const wideSpanFunction = {
  uid: "wide-uid",
  title: "wide_span_import",
  description: "",
  inputSchema: { schemaContent: { properties: { wide: { type: "number" }, narrow: { type: "number" } } } },
  outputSchema: { schemaContent: { properties: { y: { type: "number" } } } },
} as never;

const wideSpanCsv = ["input__wide,input__narrow,output__y", "1,2,10", "1000,4,20"].join("\n");

// ---- Module mocks ----

vi.mock("../../context/PersistenceContext", () => ({
  usePersistenceContext: () => ({
    getFunctionValues: () => persistenceSeed.values,
    setFunctionValues: () => {},
    loading: false,
  }),
}));

// vi.hoisted ensures these are available inside vi.mock factories (which are
// hoisted to file top). persistenceSeed is mutable so a test can control what
// FunctionContext is seeded with at mount (e.g. a pre-existing distribution).
const {
  persistenceSeed,
  mockListFunctions,
  mockGetFunctionJobCollectionCounts,
  mockGetFunctionJobCollectionsFanoutTripwire,
  mockUploadJobCollectionCsv,
  mockPickSingleCsvFile,
  mockSetSelectedJobUids,
  mockSetFetchedJobCollections,
  mockSetLhsSamplingConfig,
  mockSetGridSamplingConfig,
  mockSetSingleJobConfig,
  mockClearSampling,
} = vi.hoisted(() => ({
  persistenceSeed: { values: {} as Record<string, unknown> },
  mockListFunctions: vi.fn(),
  mockGetFunctionJobCollectionCounts: vi.fn(),
  // Kept only as a tripwire: the V49 aggregate endpoint replaced the per-function
  // fan-out, so any call to this util from the upload flow is a regression.
  mockGetFunctionJobCollectionsFanoutTripwire: vi.fn(),
  mockUploadJobCollectionCsv: vi.fn(),
  mockPickSingleCsvFile: vi.fn(),
  mockSetSelectedJobUids: vi.fn(),
  mockSetFetchedJobCollections: vi.fn(),
  mockSetLhsSamplingConfig: vi.fn(),
  mockSetGridSamplingConfig: vi.fn(),
  mockSetSingleJobConfig: vi.fn(),
  mockClearSampling: vi.fn(),
}));

vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    setLhsSamplingConfig: mockSetLhsSamplingConfig,
    setGridSamplingConfig: mockSetGridSamplingConfig,
    setSingleJobConfig: mockSetSingleJobConfig,
    clearSampling: mockClearSampling,
  }),
}));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    setSelectedJobUids: mockSetSelectedJobUids,
    setFetchedJobCollections: mockSetFetchedJobCollections,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

vi.mock("../navigation/TutorialManualLinks", () => ({
  HelpContents: () => <></>,
}));

vi.mock("../../utils/functionUtils", () => ({
  listFunctions: mockListFunctions,
  getFunctionJobCollectionCounts: mockGetFunctionJobCollectionCounts,
  getFunctionJobCollections: mockGetFunctionJobCollectionsFanoutTripwire,
  uploadJobCollectionCsv: mockUploadJobCollectionCsv,
}));

// Partial mock: keep parseJobCollectionCsv real; mock only the file-picker.
vi.mock("../../utils/jobCollectionCsv", async importOriginal => {
  const original = await importOriginal<typeof import("../../utils/jobCollectionCsv")>();
  return { ...original, pickSingleCsvFile: mockPickSingleCsvFile };
});

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: {
    rows: Array<{ uid: string; title: string; description: string; inputSchema: unknown; outputSchema: unknown }>;
    onRowSelectionModelChange: (model: { ids: Set<string> }) => void;
  }) => (
    <div data-testid="grid">
      {props.rows.map(row => (
        <button type="button" key={row.uid} onClick={() => props.onRowSelectionModelChange({ ids: new Set([row.uid]) })}>
          Select {row.title}
        </button>
      ))}
    </div>
  ),
}));

// ---- Context reader ----
// Renders FunctionContext values into the DOM so tests can assert on them.
function ContextReader() {
  const { selectedFunction, distribution } = useFunctionContext();
  return (
    <>
      <span data-testid="ctx-uid">{selectedFunction?.uid ?? ""}</span>
      <span data-testid="ctx-dist">{JSON.stringify(distribution)}</span>
    </>
  );
}

function readPresetsFor(uid: string): Record<string, unknown> {
  const distribution = JSON.parse(screen.getByTestId("ctx-dist").textContent ?? "{}") as Record<string, Record<string, unknown>>;
  return distribution[uid];
}

// Picker mock + the upload ritual. handleOpen only reads .name and awaits
// .text() (File.text() is not available in jsdom), so a duck-typed object
// suffices. Confirm drives the real chain: uploadJobCollectionCsv (mock) +
// parseJobCollectionCsv (real) → onUploadSuccess → handleCsvUploadSuccess.
// The loading-state "Upload Data" button is a DIFFERENT node than the
// empty-state one, so the grid must unmount before clicking.
async function uploadAndImport(name: string, csv: string) {
  mockPickSingleCsvFile.mockImplementation(async () => ({ name, text: () => Promise.resolve(csv) }));
  await waitFor(() => expect(screen.queryByTestId("grid")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Upload Data" }));
  fireEvent.click(await screen.findByRole("button", { name: /^import$/i }));
}

// ---- Tests ----

describe("FunctionList — CSV upload consumer wiring (V13 port from fork#17)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    persistenceSeed.values = {};

    // Call sequence for listFunctions:
    //   1st call – initial fetchFunctions on mount → empty list
    //   2nd+ call – fetchFunctions inside handleCsvUploadSuccess → the new function
    // Counts arrive as ONE aggregate map (V49), not a per-function fan-out.
    mockGetFunctionJobCollectionCounts.mockResolvedValue({ "test-uid": { campaignCount: 1, evaluationCount: 2 } });
  });

  it("uploads CSV, auto-selects the new function, and MERGE-prefills the parsed presets into distribution", async () => {
    // Seed a pre-existing distribution: `legacy_var` is absent from the CSV and
    // must survive the merge; `v1` collides with a CSV variable and must be
    // replaced by the parser's authoritative preset.
    const seededPresets = {
      legacy_var: { distribution: "uniform", min: 0, max: 1, scale: "linear" },
      v1: { distribution: "uniform", min: -5, max: 42, scale: "linear" },
    };
    persistenceSeed.values = { distribution: { "test-uid": seededPresets } };

    mockListFunctions.mockResolvedValueOnce([]).mockResolvedValue([uploadedFunction]);
    mockUploadJobCollectionCsv.mockResolvedValue({ targetFunctionUid: "test-uid", importedSamples: 50 });

    render(
      <FunctionContextProvider>
        <FunctionList />
        <ContextReader />
      </FunctionContextProvider>,
    );

    await uploadAndImport("synthetic_jobs.csv", csvContent);

    // Wait for the full async chain: the uploaded function must be auto-selected.
    await waitFor(() => {
      expect(screen.getByTestId("ctx-uid").textContent).toBe("test-uid");
    });

    // The consumer must FORWARD the authoritative parse result as a MERGE into
    // the existing entry: the seeded CSV-absent var survives, seeded collisions
    // are replaced by the parser's presets, and all 6 CSV vars arrive.
    // Expectations are derived from the parser itself — this pins forwarding +
    // merge semantics, ⊥ any inference verdict (shape/scale belongs to the
    // parser's own tests and stays honest under #714's shape-fit replay).
    const expectedPresets = parseJobCollectionCsv(csvContent).inputPresets;
    expect(readPresetsFor("test-uid")).toEqual({ ...seededPresets, ...expectedPresets });

    expect(mockUploadJobCollectionCsv).toHaveBeenCalledTimes(1);
    // V49/#498: the upload-success re-fetch takes the same 2-request contract
    // (empty-list mount fetches no counts; the post-upload fetch pulls ONE map).
    expect(mockGetFunctionJobCollectionCounts).toHaveBeenCalledTimes(1);
    expect(mockGetFunctionJobCollectionsFanoutTripwire).not.toHaveBeenCalled();
  });

  it("prefills a log scale tag through the same consumer via the <10-sample >=2-decade fallback verdict", async () => {
    // wide spans 3 decades, narrow ~0.3: `log`/`linear` respectively under BOTH
    // develop's current pure-span heuristic and #714's <10-sample >=2-decade
    // fallback verdict — regime-agnostic — proving the `scale` tag survives the
    // round trip parse → onUploadSuccess → distribution.
    mockListFunctions.mockResolvedValueOnce([]).mockResolvedValue([wideSpanFunction]);
    mockUploadJobCollectionCsv.mockResolvedValue({ targetFunctionUid: "wide-uid", importedSamples: 2 });

    render(
      <FunctionContextProvider>
        <FunctionList />
        <ContextReader />
      </FunctionContextProvider>,
    );

    await uploadAndImport("wide_span.csv", wideSpanCsv);

    await waitFor(() => {
      expect(screen.getByTestId("ctx-uid").textContent).toBe("wide-uid");
    });

    const presets = readPresetsFor("wide-uid");
    expect(presets.wide).toMatchObject({ distribution: "uniform", min: 1, max: 1000, scale: "log" });
    expect(presets.narrow).toMatchObject({ distribution: "uniform", min: 2, max: 4, scale: "linear" });
  });
});
