/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Behavior coverage for `FunctionList` beyond what FunctionList.test.tsx and
 * FunctionList.upload.test.tsx pin: the DataGrid cell/header renderers that the
 * coarser sibling stubs never invoke (per-row `renderCell`/`renderHeader`), the
 * function-kind column (solver / project / python-code / unknown), the invalid
 * schema guard in `showInputOutputSchema`, the Select→Unselect toggle against
 * the REAL FunctionContext, `onRowSelectionModelChange` (empty ids, id hit,
 * id miss), the uid-less `getRowId` fallback, the error view's retry button,
 * the header refresh, and both `handleCsvUploadSuccess` outcomes (target found
 * → merge-prefill; target missing → toast.error).
 *
 * Harness follows FunctionList.upload.test.tsx: real FunctionContextProvider
 * (state under test) over mocked Persistence/Sampling/Job contexts, mocked
 * fetch layer (functionUtils), side-effect-free react-toastify, and a
 * renderCell/renderHeader-aware DataGrid stub (same shape the JobSelector
 * tests use). console.error is re-cleared in tests with legitimate erroring
 * paths so src/test/setup.ts's global guard stays meaningful elsewhere.
 */
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";
import { FunctionContextProvider, useFunctionContext } from "../../context/FunctionContext";

// ---- Module mocks (hoisted) ----

const {
  persistenceSeed,
  uploadResults,
  mockListFunctions,
  mockGetFunctionJobCollections,
  mockToastInfo,
  mockToastError,
  mockSetSelectedJobUids,
  mockSetFetchedJobCollections,
  mockSetLhsSamplingConfig,
  mockSetGridSamplingConfig,
  mockSetSingleJobConfig,
  mockClearSampling,
} = vi.hoisted(() => ({
  persistenceSeed: { values: {} as Record<string, unknown> },
  uploadResults: {
    found: {
      targetFunctionUid: "fn-a",
      importedSamples: 5,
      inputVars: ["a1", "a2"],
      outputVars: ["b1"],
      inputPresets: { a1: { distribution: "uniform", min: 0, max: 10, scale: "linear" } },
    },
    missing: {
      targetFunctionUid: "ghost-fn",
      importedSamples: 1,
      inputVars: [],
      outputVars: [],
      inputPresets: {},
    },
  },
  mockListFunctions: vi.fn(),
  mockGetFunctionJobCollections: vi.fn(),
  mockToastInfo: vi.fn(),
  mockToastError: vi.fn(),
  mockSetSelectedJobUids: vi.fn(),
  mockSetFetchedJobCollections: vi.fn(),
  mockSetLhsSamplingConfig: vi.fn(),
  mockSetGridSamplingConfig: vi.fn(),
  mockSetSingleJobConfig: vi.fn(),
  mockClearSampling: vi.fn(),
}));

vi.mock("../../context/PersistenceContext", () => ({
  usePersistenceContext: () => ({
    getFunctionValues: () => persistenceSeed.values,
    setFunctionValues: () => {},
    loading: false,
  }),
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
  toast: { info: mockToastInfo, error: mockToastError, success: vi.fn(), warning: vi.fn() },
}));

vi.mock("../navigation/TutorialManualLinks", () => ({
  HelpContents: () => <span>Functions help</span>,
}));

vi.mock("../../utils/functionUtils", () => ({
  listFunctions: mockListFunctions,
  getFunctionJobCollections: mockGetFunctionJobCollections,
}));

// Stub upload button: two deterministic onUploadSuccess triggers (target found
// / target vanished) instead of the real file-picker + parse chain, which
// FunctionList.upload.test.tsx already owns.
vi.mock("../data/UploadJobCollectionButton", () => ({
  default: ({
    onUploadSuccess,
    existingFunctions,
  }: {
    onUploadSuccess: (result: unknown) => Promise<void> | void;
    existingFunctions: Array<{ uid: string }>;
  }) => (
    <>
      <button type="button" onClick={() => onUploadSuccess(uploadResults.found)}>
        upload-found
      </button>
      <button type="button" onClick={() => onUploadSuccess(uploadResults.missing)}>
        upload-missing
      </button>
      <span data-testid="existing-count">{existingFunctions.length}</span>
    </>
  ),
}));

// Render-capable DataGrid stub (JobSelector.test.tsx pattern, extended): every
// column's renderHeader + per-row renderCell run for real, getRowId provides
// the row key, and per-row buttons replay onRowSelectionModelChange the way a
// physical row click would (ids from getRowId / a ghost id / an empty set).
type StubRow = { uid?: string; title?: string; description?: string };
vi.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: {
    rows: StubRow[];
    loading?: boolean;
    getRowId: (row: StubRow) => string;
    columns: Array<{
      field: string;
      renderHeader?: () => React.ReactNode;
      renderCell?: (params: { row: never }) => React.ReactNode;
    }>;
    onRowSelectionModelChange: (model: { ids: Set<string> }) => void;
  }) => (
    <div data-testid="grid" data-loading={String(Boolean(props.loading))}>
      {props.columns.map(column => (
        <div key={column.field}>
          {column.renderHeader?.()}
          {props.rows.map((row, index) => (
            <span data-testid={`cell-${column.field}-${index}`} key={`${column.field}-${index}`}>
              {column.renderCell?.({ row: row as never })}
            </span>
          ))}
        </div>
      ))}
      {props.rows.map((row, index) => (
        <button
          type="button"
          key={props.getRowId(row)}
          data-testid={`row-click-${index}`}
          onClick={() => props.onRowSelectionModelChange({ ids: new Set([props.getRowId(row)]) })}
        >
          row {index}
        </button>
      ))}
      <button
        type="button"
        data-testid="ghost-selection"
        onClick={() => props.onRowSelectionModelChange({ ids: new Set(["no-such-id"]) })}
      >
        ghost
      </button>
      <button type="button" data-testid="clear-selection" onClick={() => props.onRowSelectionModelChange({ ids: new Set() })}>
        clear
      </button>
    </div>
  ),
}));

// ---- Fixtures ----

const schema = (props: string[]) => ({
  schemaContent: { properties: Object.fromEntries(props.map(p => [p, { type: "number" }])) },
});

const solverFunction = {
  uid: "fn-solver",
  title: "Solver Fn",
  description: "solver based",
  inputSchema: schema(["a1", "a2"]),
  outputSchema: schema(["y"]),
  solverKey: "sim4life.life/registry/solver-x",
  solverVersion: "1.2",
} as never;

const projectFunction = {
  uid: "fn-project",
  title: "Project Fn",
  description: "study based",
  inputSchema: schema(["a1"]),
  outputSchema: schema(["y"]),
  projectId: "project-uuid-1",
} as never;

const pythonFunction = {
  uid: "fn-python",
  title: "Python Fn",
  description: "code based",
  inputSchema: schema(["a1"]),
  outputSchema: schema(["y"]),
  codeUrl: "https://gitlab.example.com/fn.git",
} as never;

const unknownFunction = {
  uid: "fn-unknown",
  title: "Mystery Fn",
  description: "no source info",
  inputSchema: schema(["a1"]),
  outputSchema: schema(["y"]),
} as never;

const functionA = {
  uid: "fn-a",
  title: "Function A",
  description: "first",
  inputSchema: schema(["a1", "a2"]),
  outputSchema: schema(["b1"]),
} as never;

// Selected-safe "no content" function: the schemas exist but carry no
// schemaContent, so setRowSelection must fall back to [] input/output vars.
const functionB = {
  uid: "fn-b",
  title: "Function B",
  description: "second",
  inputSchema: {},
  outputSchema: {},
} as never;

// ---- Context reader ----

function ContextReader() {
  const { selectedFunction, inputVars, outputVars, distribution } = useFunctionContext();
  return (
    <>
      <span data-testid="ctx-uid">{selectedFunction?.uid ?? ""}</span>
      <span data-testid="ctx-title">{selectedFunction?.title ?? ""}</span>
      <span data-testid="ctx-inputs">{inputVars.join(",")}</span>
      <span data-testid="ctx-outputs">{outputVars.join(",")}</span>
      <span data-testid="ctx-dist">{JSON.stringify(distribution)}</span>
    </>
  );
}

function renderWithReader() {
  return render(
    <FunctionContextProvider>
      <FunctionList />
      <ContextReader />
    </FunctionContextProvider>,
  );
}

async function readTestId(testId: string): Promise<string> {
  let value = "";
  await waitFor(() => {
    value = screen.getByTestId(testId).textContent ?? "";
    expect(value).toBeDefined();
  });
  return value;
}

async function readDistribution(): Promise<Record<string, Record<string, unknown>>> {
  await waitFor(() => expect(screen.getByTestId("ctx-dist")).toBeInTheDocument());
  return JSON.parse(screen.getByTestId("ctx-dist").textContent ?? "{}") as Record<string, Record<string, unknown>>;
}

describe("FunctionList — grid cell behavior", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    persistenceSeed.values = {};
    mockGetFunctionJobCollections.mockResolvedValue([]);
  });

  it("renders solver/project/python/unknown cells, campaign counts, and a per-function Loading state", async () => {
    const fetchError = new Error("job collections unavailable");
    mockListFunctions.mockResolvedValue([solverFunction, projectFunction, pythonFunction, unknownFunction]);
    mockGetFunctionJobCollections.mockImplementation(async (uid: string) => {
      if (uid === "fn-unknown") {
        throw fetchError;
      }
      // Mixed collections: one with jobIds, one without (the `jobIds ? … : 0` arm).
      return [{ uid: "jc-1", jobIds: ["j1", "j2"] }, { uid: "jc-2" }] as never;
    });
    const postMessage = vi.spyOn(window.parent, "postMessage").mockImplementation(() => undefined);
    const user = userEvent.setup();

    renderWithReader();

    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    // The failed per-function fetch logs but must skip (never poison) the count maps.
    expect(console.error).toHaveBeenCalledWith(fetchError);
    vi.mocked(console.error).mockClear();

    // Function-kind column: solver slug:version / project info button / code URL / Unknown.
    expect(screen.getByText("solver-x:1.2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open function" })).toBeInTheDocument();
    expect(screen.getByText("https://gitlab.example.com/fn.git")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();

    // Counts column: loaded rows show totals (2 collections, 2+0 evaluations);
    // fn-unknown's failed fetch leaves it on "Loading...".
    expect(screen.getAllByText("Campaigns: 2 (2 total evaluations)")).toHaveLength(3);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // The project-function info button posts an openFunction message to the parent frame.
    await user.click(screen.getByRole("button", { name: "Open function" }));
    expect(postMessage).toHaveBeenCalledWith(
      { type: "openFunction", message: { functionId: "project-uuid-1", uuid: "fn-project" } },
      "*",
    );
  });

  it("flags invalid schemas in the Inputs/Outputs cells but still renders valid ones", async () => {
    const noSchemaFunction = {
      uid: "fn-noschema",
      title: "No Schema",
      description: "inputSchema missing entirely",
      outputSchema: schema(["y"]),
    } as never;
    const emptySchemaFunction = {
      uid: "fn-empty",
      title: "Empty Schema",
      description: "no schemaContent / no properties",
      inputSchema: {},
      outputSchema: { schemaContent: {} },
    } as never;
    mockListFunctions.mockResolvedValue([noSchemaFunction, emptySchemaFunction, functionA]);

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    // Valid schema still renders its joined property list.
    expect(screen.getByText("a1, a2")).toBeInTheDocument();

    // Three invalid cells (missing schema, missing schemaContent, missing properties)
    // each hit the guard on every re-render triggered by the async loads.
    const invalidCalls = vi.mocked(console.error).mock.calls.filter(call => call[0] === "Invalid schema:");
    expect(invalidCalls.length).toBeGreaterThanOrEqual(3);
    vi.mocked(console.error).mockClear();
  });
});

describe("FunctionList — selection behavior", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    persistenceSeed.values = {};
    mockGetFunctionJobCollections.mockResolvedValue([]);
  });

  it("selects, unselects, and re-selects through the button toggle and sampling/jobs reset", async () => {
    mockListFunctions.mockResolvedValue([functionA, functionB]);
    const user = userEvent.setup();

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    // Select A: context receives the function + its registered vars, and the
    // sampling/job-selection state is reset for the new function.
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe("fn-a"));
    expect(screen.getByTestId("ctx-inputs").textContent).toBe("a1,a2");
    expect(screen.getByTestId("ctx-outputs").textContent).toBe("b1");
    expect(mockSetSelectedJobUids).toHaveBeenCalledWith([]);
    expect(mockSetFetchedJobCollections).toHaveBeenCalledWith(undefined);
    expect(mockSetLhsSamplingConfig).toHaveBeenCalledWith({ inputs: [], points: 50, seed: 0 });
    expect(mockSetGridSamplingConfig).toHaveBeenCalledWith([]);
    expect(mockSetSingleJobConfig).toHaveBeenCalledWith([]);
    expect(mockClearSampling).toHaveBeenCalled();

    // Same row now reads "Unselect"; clicking it clears function AND vars.
    await user.click(screen.getByRole("button", { name: "Unselect" }));
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe(""));
    expect(screen.getByTestId("ctx-title").textContent).toBe("");
    expect(screen.getByTestId("ctx-inputs").textContent).toBe("");
    expect(screen.getByTestId("ctx-outputs").textContent).toBe("");

    // Selecting a different function (B) while none/some is selected keeps B;
    // B's schemas carry no schemaContent → vars must fall back to [].
    await user.click(screen.getAllByRole("button", { name: "Select" })[1]);
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe("fn-b"));
    expect(screen.getByTestId("ctx-inputs").textContent).toBe("");
    expect(screen.getByTestId("ctx-outputs").textContent).toBe("");

    vi.mocked(console.error).mockClear(); // fn-b's schema-less cells log via showInputOutputSchema
  });

  it("routes grid row selection through getRowId: hit, uid-less fallback, ghost miss, empty set", async () => {
    const uidLessFunction = {
      title: "Orphan",
      description: " fn",
      inputSchema: schema(["c1"]),
      outputSchema: schema(["y"]),
    } as never;
    mockListFunctions.mockResolvedValue([functionA, uidLessFunction]);
    const user = userEvent.setup();

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    // Row click on the uid-less function: the id is the `${title}${description}`
    // fallback and the list lookup must still resolve the row.
    await user.click(screen.getByTestId("row-click-1"));
    await waitFor(() => expect(screen.getByTestId("ctx-title").textContent).toBe("Orphan"));
    expect(screen.getByTestId("ctx-inputs").textContent).toBe("c1");

    // Switching to the uid'd row while the uid-less one is selected takes the
    // different-function path (no deselection).
    await user.click(screen.getByTestId("row-click-0"));
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe("fn-a"));

    // A model id that matches no row must clear the selection completely.
    await user.click(screen.getByTestId("ghost-selection"));
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe(""));
    expect(mockSetSelectedJobUids).toHaveBeenCalledWith([]);

    // An empty selection model is a no-op (no handler, no clearing).
    mockSetSelectedJobUids.mockClear();
    await user.click(screen.getByTestId("clear-selection"));
    expect(mockSetSelectedJobUids).not.toHaveBeenCalled();
    expect(await readTestId("ctx-uid")).toBe("");
  });
});

describe("FunctionList — loading, error and empty outcomes", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    persistenceSeed.values = {};
    mockGetFunctionJobCollections.mockResolvedValue([]);
  });

  it("recovers from a failed fetch through the error view's Refresh button", async () => {
    const fetchError = new Error("backend unavailable");
    mockListFunctions.mockRejectedValueOnce(fetchError).mockResolvedValue([functionA]);
    const user = userEvent.setup();

    renderWithReader();
    expect(
      await screen.findByText("Error fetching functions from the server. Please try again after some time."),
    ).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith("Error fetching functions. Please try again later.");
    expect(console.error).toHaveBeenCalledWith("Error fetching functions:", fetchError);

    // Retry: the same fetch now succeeds and the grid replaces the error view.
    await user.click(screen.getByRole("button", { name: "Refresh functions" }));
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());
    expect(mockListFunctions).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Error fetching functions from the server. Please try again after some time.")).toBeNull();

    vi.mocked(console.error).mockClear();
  });

  it("refetches when the grid header refresh button is clicked", async () => {
    mockListFunctions.mockResolvedValue([functionA]);
    const user = userEvent.setup();

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());
    expect(mockListFunctions).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Refresh functions" }));
    await waitFor(() => expect(mockListFunctions).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("grid")).toBeInTheDocument();
  });

  it("shows the help + upload empty state and toasts when no functions exist", async () => {
    mockListFunctions.mockResolvedValue([]);

    renderWithReader();

    await waitFor(() => expect(screen.getByText("Functions help")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "upload-found" })).toBeInTheDocument();
    expect(mockToastInfo).toHaveBeenCalledWith("No functions available. Please create a function first.");
    expect(mockGetFunctionJobCollections).not.toHaveBeenCalled();
    expect(screen.queryByTestId("grid")).toBeNull();
  });
});

describe("FunctionList — CSV upload consumer outcomes", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    persistenceSeed.values = {};
    mockGetFunctionJobCollections.mockResolvedValue([]);
  });

  it("auto-selects the uploaded function and merge-prefills presets into its distribution entry", async () => {
    const seededLegacy = { distribution: "uniform", min: -1, max: 1, scale: "linear" };
    const seededCollision = { distribution: "normal", min: 0, max: 1, scale: "log" };
    persistenceSeed.values = { distribution: { "fn-a": { legacy_var: seededLegacy, a1: seededCollision } } };
    mockListFunctions.mockResolvedValue([functionA]);
    const user = userEvent.setup();

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "upload-found" }));

    // fetchFunctions re-ran and the uploaded target function is selected + registered.
    await waitFor(() => expect(screen.getByTestId("ctx-uid").textContent).toBe("fn-a"));
    expect(mockListFunctions).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("ctx-inputs").textContent).toBe("a1,a2");

    // Merge semantics: the CSV-absent seeded var survives; the colliding var is
    // replaced by the upload's authoritative preset.
    const distribution = await readDistribution();
    expect(distribution["fn-a"]).toEqual({
      legacy_var: seededLegacy,
      a1: uploadResults.found.inputPresets.a1,
    });
  });

  it("toasts and leaves the selection untouched when the uploaded function cannot be found", async () => {
    mockListFunctions.mockResolvedValue([functionA]);
    const user = userEvent.setup();

    renderWithReader();
    await waitFor(() => expect(screen.getByTestId("grid")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "upload-missing" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Uploaded function could not be found after creation."));
    expect(mockListFunctions).toHaveBeenCalledTimes(2); // it refetched before searching
    expect(screen.getByTestId("ctx-uid").textContent).toBe("");
    expect(screen.getByTestId("ctx-dist").textContent).toBe("{}");
  });
});
