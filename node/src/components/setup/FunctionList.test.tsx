import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";
import { listFunctions, getFunctionJobCollectionCounts, getFunctionJobCollections } from "../../utils/functionUtils";

const mocks = vi.hoisted(() => ({
  setSelectedFunction: vi.fn(),
  setInputVars: vi.fn(),
  setOutputVars: vi.fn(),
  setDistribution: vi.fn(),
  setLhsSamplingConfig: vi.fn(),
  setGridSamplingConfig: vi.fn(),
  setSingleJobConfig: vi.fn(),
  clearSampling: vi.fn(),
  setSelectedJobUids: vi.fn(),
  setFetchedJobCollections: vi.fn(),
}));

vi.mock("../../utils/functionUtils", () => ({
  listFunctions: vi.fn(),
  getFunctionJobCollectionCounts: vi.fn(),
  // Remains on the module surface only as a regression tripwire: FunctionList must
  // NEVER call it again (V49 aggregate endpoint replaced the per-function fan-out).
  getFunctionJobCollections: vi.fn(),
}));

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({
    selectedFunction: undefined,
    setSelectedFunction: mocks.setSelectedFunction,
    setInputVars: mocks.setInputVars,
    setOutputVars: mocks.setOutputVars,
    setDistribution: mocks.setDistribution,
  }),
}));

vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    setLhsSamplingConfig: mocks.setLhsSamplingConfig,
    setGridSamplingConfig: mocks.setGridSamplingConfig,
    setSingleJobConfig: mocks.setSingleJobConfig,
    clearSampling: mocks.clearSampling,
  }),
}));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    setSelectedJobUids: mocks.setSelectedJobUids,
    setFetchedJobCollections: mocks.setFetchedJobCollections,
  }),
}));

vi.mock("../data/UploadJobCollectionButton", () => ({
  default: () => <button type="button">Upload Data</button>,
}));

vi.mock("../navigation/TutorialManualLinks", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HelpContents: () => <span>Functions help</span>,
}));

vi.mock("@mui/x-data-grid", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DataGrid: (props: {
    rows: Array<{ uid: string; title: string; description: string; inputSchema: unknown; outputSchema: unknown }>;
    onRowSelectionModelChange: (model: { ids: Set<string> }) => void;
  }) => (
    <div>
      {props.rows.map(row => (
        <button type="button" key={row.uid} onClick={() => props.onRowSelectionModelChange({ ids: new Set([row.uid]) })}>
          Select {row.title}
        </button>
      ))}
    </div>
  ),
}));

const functionFixture = {
  uid: "function-1",
  title: "Demo Function",
  description: "A demo function",
  inputSchema: { schemaContent: { properties: { input_a: { type: "number" } } } },
  outputSchema: { schemaContent: { properties: { output_b: { type: "number" } } } },
  solverKey: "solver/demo",
  solverVersion: "1.0",
} as never;

describe("FunctionList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads functions and selects a function into the workflow", async () => {
    vi.mocked(listFunctions).mockResolvedValueOnce([functionFixture]);
    vi.mocked(getFunctionJobCollectionCounts).mockResolvedValueOnce({});

    render(<FunctionList />);
    const selectButton = await screen.findByRole("button", { name: "Select Demo Function" });
    fireEvent.click(selectButton);

    expect(mocks.setSelectedFunction).toHaveBeenCalledWith(functionFixture);
    expect(mocks.setInputVars).toHaveBeenCalledWith(["input_a"]);
    expect(mocks.setOutputVars).toHaveBeenCalledWith(["output_b"]);
    expect(mocks.setSelectedJobUids).toHaveBeenCalledWith([]);
    expect(mocks.clearSampling).toHaveBeenCalled();
  });

  it("shows a recoverable error when function loading fails", async () => {
    vi.mocked(listFunctions).mockRejectedValueOnce(new Error("backend unavailable"));

    render(<FunctionList />);

    expect(
      await screen.findByText("Error fetching functions from the server. Please try again after some time."),
    ).toBeInTheDocument();
    vi.mocked(console.error).mockClear();
    expect(screen.getByRole("button", { name: "Upload Data" })).toBeInTheDocument();
  });

  it("shows the upload-only empty state when no functions are available", async () => {
    vi.mocked(listFunctions).mockResolvedValueOnce([]);

    render(<FunctionList />);

    await waitFor(() => expect(screen.getByText("Functions help")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Upload Data" })).toBeInTheDocument();
  });

  // V49 / ITISFoundation#498: the mount-time request volume ! grow with the function
  // count — exactly list_functions + get_function_job_collection_counts, ∀N.
  it("fetches campaign counts with ONE aggregate request, never a per-function fan-out", async () => {
    const baseFunction = functionFixture as unknown as Record<string, unknown>;
    const manyFunctions = [1, 2, 3].map(i => ({
      ...baseFunction,
      uid: `function-${i}`,
      title: `Fn ${i}`,
    })) as never[];
    vi.mocked(listFunctions).mockResolvedValueOnce(manyFunctions);
    vi.mocked(getFunctionJobCollectionCounts).mockResolvedValueOnce({
      "function-1": { campaignCount: 1, evaluationCount: 2 },
      "function-2": { campaignCount: 0, evaluationCount: 0 },
      "function-3": { campaignCount: 3, evaluationCount: 7 },
    });

    render(<FunctionList />);
    await screen.findByRole("button", { name: "Select Fn 3" });

    expect(listFunctions).toHaveBeenCalledTimes(1);
    expect(getFunctionJobCollectionCounts).toHaveBeenCalledTimes(1);
    expect(getFunctionJobCollections).not.toHaveBeenCalled();
  });

  it("keeps the function list usable when the counts request fails", async () => {
    vi.mocked(listFunctions).mockResolvedValueOnce([functionFixture]);
    vi.mocked(getFunctionJobCollectionCounts).mockRejectedValueOnce(new Error("counts unavailable"));

    render(<FunctionList />);

    expect(await screen.findByRole("button", { name: "Select Demo Function" })).toBeInTheDocument();
    expect(screen.queryByText(/Error fetching functions from the server/)).toBeNull();
  });
});
