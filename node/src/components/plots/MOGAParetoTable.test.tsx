import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MogaParetoTable from "./MOGAParetoTable";

const mocks = vi.hoisted(() => ({
  weights: undefined as Record<string, number> | undefined,
  sortModel: undefined as Array<{ field: string; sort: string }> | undefined,
  setWeights: vi.fn(),
  setSortModel: vi.fn(),
  setLaunchingSampling: vi.fn(),
  runSingleJob: vi.fn().mockResolvedValue(undefined),
  gridSortModels: [] as Array<Array<{ field: string; sort: string }>>,
  gridStyles: undefined as Record<string, string> | undefined,
  gridValues: [] as Array<unknown>,
}));

vi.mock("../../context/MOGATableContext", () => ({
  // LIVE holders: both effects key on the weights identity, so a test can swap
  // it between rerenders exactly like the context provider would on setWeights.
  useMOGATableContext: () => ({
    weights: mocks.weights,
    setWeights: mocks.setWeights,
    sortModel: mocks.sortModel,
    setSortModel: mocks.setSortModel,
  }),
}));
vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => ({ selectedFunction: { uid: "fn-1" } }),
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({ setLaunchingSampling: mocks.setLaunchingSampling }),
}));
vi.mock("../../utils/samplingUtils", () => ({ runSingleJob: mocks.runSingleJob }));
vi.mock("../navigation/Header", () => ({
  default: ({ tabTitle }: { tabTitle?: string }) => <h4>{tabTitle}</h4>,
}));
vi.mock("./PerformanceModal", () => ({
  default: ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) =>
    open ? (
      <div role="dialog">
        performance modal
        <button type="button" onClick={() => setOpen(false)}>
          close-performance
        </button>
      </div>
    ) : null,
}));
vi.mock("../sampling/RunSamplingButton", () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RunSamplingButton: ({
    testId,
    disabled,
    handleRunSampling,
  }: {
    testId?: string;
    disabled?: boolean;
    handleRunSampling: () => Promise<void>;
  }) => (
    <button type="button" data-testid={testId} disabled={disabled} onClick={() => void handleRunSampling()}>
      run
    </button>
  ),
}));
vi.mock("@mui/x-data-grid", async () => {
  const { useTheme: muiUseTheme } = await import("@mui/material");
  type StubCell = { id: number; field: string; row: Record<string, number> };
  type StubProps = {
    rows: Array<Record<string, number>>;
    columns: Array<{
      field: string;
      headerName?: string;
      renderHeader?: () => React.ReactNode;
      renderCell?: (p: StubCell) => React.ReactNode;
      valueGetter?: (value: unknown, row: Record<string, number>) => unknown;
    }>;
    loading: boolean;
    sx: (theme: ReturnType<typeof muiUseTheme>) => Record<string, string>;
    getRowId: (row: Record<string, number>) => number;
    sortModel: Array<{ field: string; sort: string }>;
    slotProps?: {
      row?: { onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void; onMouseLeave?: () => void };
    };
  };
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DataGrid: (props: StubProps) => {
      // evaluate the theme callback like the real grid does so the theme-aware
      // row tints run for real (both palette modes are exercised in tests)
      mocks.gridStyles = props.sx(muiUseTheme());
      mocks.gridSortModels.push(props.sortModel);
      const rowHandlers = props.slotProps?.row;
      return (
        <div data-testid="data-grid" data-loading={String(props.loading)}>
          {props.columns.map((column, columnIndex) => (
            <div key={`${column.field}-${columnIndex}`}>
              {column.renderHeader ? column.renderHeader() : column.headerName}
              {props.rows.map(row => {
                const id = props.getRowId(row);
                // the real grid resolves valueGetters for sorting/filtering
                mocks.gridValues.push(column.valueGetter ? column.valueGetter(row[column.field], row) : undefined);
                return (
                  <div key={id} data-id={id} onMouseEnter={rowHandlers?.onMouseEnter} onMouseLeave={rowHandlers?.onMouseLeave}>
                    {column.renderCell ? column.renderCell({ id, field: column.field, row }) : String(row[column.field])}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    },
  };
});

const tableData = {
  inputs: ["x1"],
  outputs: ["y", "y2"],
  raw: {},
  // parent MOGAPareto hands rows whose performance is already computed; NaN is
  // what it emits while every weight is zero
  rows: [
    { x1: 12.345, y: 5, y2: 2, performance: NaN, ndi: 3 },
    { x1: 0.25, y: 1.5, y2: 8, performance: 0.5, ndi: 7 },
  ] as Array<{ x1: number; y: number; y2: number; performance: number; ndi: number }>,
};

const defaultProps = { tableData: tableData as never, hovered: null, setHovered: vi.fn() };

// the DataGrid sx callback returns nested style objects; read the tint strings out
const tintOf = (selector: string) =>
  ((mocks.gridStyles as never as Record<string, { backgroundColor: string }>)[selector] ?? { backgroundColor: "" })
    .backgroundColor;
const rowHoverTint = () => tintOf("& .MuiDataGrid-row:hover");
const selectedTint = () => tintOf("& .MuiDataGrid-row.Mui-selected");
const selectedHoverTint = () => tintOf("& .MuiDataGrid-row.Mui-selected:hover");

describe("MogaParetoTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.weights = { y: 1, y2: 1 };
    mocks.sortModel = undefined;
    mocks.gridSortModels = [];
    mocks.gridStyles = undefined;
    mocks.gridValues = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds formatted columns, keeps NaN performance as a dash and wires hover", async () => {
    const setHovered = vi.fn();
    render(<MogaParetoTable {...defaultProps} setHovered={setHovered} />);

    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));
    expect(screen.getByText("Pareto-Optimal MOGA Samples")).toBeInTheDocument();
    expect(screen.getByText("X1")).toBeInTheDocument();
    expect(screen.getByText("Y2")).toBeInTheDocument();
    // input/output cells render 3 significant digits
    expect(screen.getByText("12.3")).toBeInTheDocument();
    expect(screen.getByText("0.250")).toBeInTheDocument();
    // NaN performance (all-zero weights upstream) renders as a dash, finite as 2 digits
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByText("0.50")).toBeInTheDocument();
    // valueGetters expose the raw row values to the grid (sorting), NaN included
    expect(mocks.gridValues).toEqual(expect.arrayContaining([12.345, 0.25, 5, 1.5, NaN, 0.5]));

    // sort resets to the default performance-desc model on mount
    expect(mocks.setSortModel).toHaveBeenCalledWith([{ field: "performance", sort: "desc" }]);
    // row hover feeds the plot through setHovered with the numeric getRowId value
    fireEvent.mouseEnter(screen.getByText("12.3").closest("[data-id]") as HTMLElement);
    expect(setHovered).toHaveBeenCalledWith(3);
    fireEvent.mouseLeave(screen.getByText("12.3").closest("[data-id]") as HTMLElement);
    expect(setHovered).toHaveBeenLastCalledWith(null);
    // light palette tints hover rows with the white mix
    expect(rowHoverTint()).toContain("white");
  });

  it("realigns weights to the objective set, keeping already-configured values", async () => {
    mocks.weights = { y: 0.7 }; // stale set: y2 never configured
    render(<MogaParetoTable {...defaultProps} />);

    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));
    expect(mocks.setWeights).toHaveBeenCalledWith({ y: 0.7, y2: 0.5 });
  });

  it("recomputes the performance column on weight changes, skipping unknown keys", async () => {
    const { rerender } = render(<MogaParetoTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));
    // aligned weights: nothing to realign
    expect(mocks.setWeights).not.toHaveBeenCalled();

    // weights change: performance = 2*y + 0*y2, the unknown "ghost" key is skipped
    mocks.weights = { y: 2, y2: 0, ghost: 1 };
    rerender(<MogaParetoTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
    expect(screen.getByText("3.0")).toBeInTheDocument();
    // the sort must reset to the default performance-desc model again
    expect(mocks.setSortModel).toHaveBeenLastCalledWith([{ field: "performance", sort: "desc" }]);
    // the mismatched key set now gets realigned to the objectives
    expect(mocks.setWeights).toHaveBeenCalledWith({ y: 2, y2: 0 });
  });

  it("opens the performance editor from the header and closes it again", async () => {
    render(<MogaParetoTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit performance settings" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close-performance"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("launches a single job from a row with the per-input payload", async () => {
    render(<MogaParetoTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));

    const runButton = screen.getByTestId("run-sampling-btn-3");
    expect((runButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(runButton);
    await waitFor(() =>
      expect(mocks.runSingleJob).toHaveBeenCalledWith(
        { uid: "fn-1" },
        [{ variable: "x1", value: 12.345 }],
        mocks.setLaunchingSampling,
      ),
    );
  });

  it("uses the provided sort model initially and the dark palette for row tints", async () => {
    mocks.sortModel = [{ field: "ndi", sort: "asc" }];
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <MogaParetoTable {...defaultProps} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));

    // before the weights effect resets it, the grid starts on the persisted sort
    expect(mocks.gridSortModels[0]).toEqual([{ field: "ndi", sort: "asc" }]);
    expect(rowHoverTint()).toContain("black");
    expect(selectedTint()).toContain("black");
    expect(selectedHoverTint()).toContain("black");
  });

  it("renders an empty grid with no columns while no table data exists yet", async () => {
    render(<MogaParetoTable tableData={undefined} hovered={null} setHovered={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId("data-grid").dataset.loading).toBe("false"));
    // no data → the weights sync and the performance recompute stay out of the way
    expect(mocks.setWeights).not.toHaveBeenCalled();
    expect(mocks.setSortModel).toHaveBeenCalledWith([{ field: "performance", sort: "desc" }]);
  });
});
