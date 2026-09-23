import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";
import { listFunctions, getFunctionJobCollections } from "../../utils/functionUtils";

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
    vi.mocked(getFunctionJobCollections).mockResolvedValueOnce([{ uid: "collection-1", jobIds: ["job-1"] }] as never);

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
});
