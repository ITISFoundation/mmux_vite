import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import JobsSelector from "./JobSelector";

const fetchedJobCollections: SelectedJobCollection[] = [
  {
    jobCollection: { uid: "jc-1", title: "Collection 1" } as never,
    selected: false,
    subJobs: [{ selected: false, job: { uid: "job-1", status: "SUCCESS", inputs: { x1: 1 }, outputs: { y: 1 } } as never }],
  },
];

const functionContextValue = { selectedFunction: { uid: "fn-1" } as never };
const samplingContextValue = { launchingSampling: false, runningSampling: false };
const jobContextValue = {
  setSelectedJobUids: vi.fn(),
  fetchedJobCollections,
  requestForceFetch: vi.fn().mockResolvedValue(undefined),
};
const mmuxContextValue = { setIsSuMoGenerated: vi.fn() };

vi.mock("../../context/FunctionContext", () => ({
  useFunctionContext: () => functionContextValue,
}));
vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => samplingContextValue,
}));
vi.mock("../../context/JobContext", () => ({
  useJobContext: () => jobContextValue,
}));
vi.mock("../../context/MMUXContext", () => ({
  useMMUXContext: () => mmuxContextValue,
}));

// Avoid mounting the real @mui/x-data-grid (its CSS import isn't transformable
// under vitest/jsdom); render each column's renderCell for every row instead so
// this test only exercises JobSelector's own JSX/logic, not the grid internals.
function MockDataGrid({
  rows,
  columns,
}: {
  rows: SelectedJobCollection[];
  columns: { field: string; renderCell?: (p: { row: SelectedJobCollection }) => React.ReactNode }[];
}) {
  return (
    <div>
      {rows.map(row =>
        columns.map(column =>
          column.renderCell ? (
            <React.Fragment key={`${row.jobCollection.uid}-${column.field}`}>{column.renderCell({ row })}</React.Fragment>
          ) : null,
        ),
      )}
    </div>
  );
}

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: MockDataGrid,
}));

describe("JobSelector", () => {
  beforeEach(() => {
    cleanup();
  });

  it("B23/V31: download-CSV icon button has an accessible name", () => {
    render(<JobsSelector loading={false} setLoading={vi.fn()} setJobProgress={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Download JobCollection CSV" })).toBeInTheDocument();
  });
});
