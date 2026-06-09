/* eslint-disable @typescript-eslint/naming-convention */
/**
 * E2E-style integration test for the CSV upload flow in FunctionList.
 *
 * What is mocked:
 *   - API calls (listFunctions, uploadJobCollectionCsv, getFunctionJobCollections)
 *   - File picker (pickSingleCsvFile) → returns a File backed by the real CSV on disk
 *   - Secondary contexts (SamplingContext, JobContext) and PersistenceContext
 *   - react-toastify (side-effect-free stub)
 *
 * What runs for real:
 *   - FunctionContextProvider (state management under test)
 *   - analyzeUploadedJobCollectionCsv (the CSV analysis logic being validated)
 *   - FunctionList + UploadJobCollectionButton (the components under test)
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import React from "react";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionList } from "./FunctionList";
import { FunctionContextProvider, useFunctionContext } from "../../context/FunctionContext";

const fileName = fileURLToPath(import.meta.url);
const dirName = dirname(fileName);
const csvContent = readFileSync(resolve(dirName, "./__fixtures__/jobCollectionImport.csv"), "utf-8");

// The function the backend will return after the CSV is uploaded.
// inputSchema matches the 6 input__ columns in the CSV.
const uploadedFunction = {
  uid: "test-uid",
  title: "lhs_lognormal_real_50_high",
  description: "",
  inputSchema: {
    schemaContent: {
      properties: {
        bone_cancellous: { type: "number" },
        bone_cortical: { type: "number" },
        csf: { type: "number" },
        fat: { type: "number" },
        grey_matter: { type: "number" },
        white_matter: { type: "number" },
      },
    },
  },
  outputSchema: {
    schemaContent: {
      properties: {
        pair_1_current: { type: "number" },
        pair_2_current: { type: "number" },
        collateral_50target: { type: "number" },
        collateral_95target: { type: "number" },
        mean_nontarget: { type: "number" },
        mean_target: { type: "number" },
        selectivity_mean: { type: "number" },
        selectivity_rms: { type: "number" },
        strength: { type: "number" },
        threshold_50target: { type: "number" },
        threshold_95target: { type: "number" },
      },
    },
  },
};

// ---- Module mocks ----

vi.mock("../../context/PersistenceContext", () => ({
  usePersistenceContext: () => ({
    getFunctionValues: () => ({}),
    setFunctionValues: () => {},
    loading: false,
  }),
}));

vi.mock("../../context/SamplingContext", () => ({
  useSamplingContext: () => ({
    setLhsSamplingConfig: vi.fn(),
    setGridSamplingConfig: vi.fn(),
    setSingleJobConfig: vi.fn(),
    clearSampling: vi.fn(),
  }),
}));

vi.mock("../../context/JobContext", () => ({
  useJobContext: () => ({
    setSelectedJobUids: vi.fn(),
    setFetchedJobCollections: vi.fn(),
  }),
}));

vi.mock("react-toastify", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

vi.mock("../navigation/TutorialManualLinks", () => ({
  HelpContents: () => <></>,
}));

// vi.hoisted ensures these are available inside vi.mock factories (which are hoisted to file top).
const { mockListFunctions, mockUploadJobCollectionCsv, mockPickSingleCsvFile } = vi.hoisted(() => ({
  mockListFunctions: vi.fn(),
  mockUploadJobCollectionCsv: vi.fn(),
  mockPickSingleCsvFile: vi.fn(),
}));

vi.mock("../../utils/functionUtils", () => ({
  listFunctions: mockListFunctions,
  uploadJobCollectionCsv: mockUploadJobCollectionCsv,
  getFunctionJobCollections: vi.fn(async () => []),
}));

// Partial mock: keep analyzeUploadedJobCollectionCsv real; mock only the file-picker.
vi.mock("../../utils/jobCollectionCsv", async importOriginal => {
  const original = await importOriginal<typeof import("../../utils/jobCollectionCsv")>();
  return { ...original, pickSingleCsvFile: mockPickSingleCsvFile };
});

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

// ---- Tests ----

describe("FunctionList — CSV upload E2E flow", () => {
  beforeEach(() => {
    cleanup();
    mockListFunctions.mockReset();
    mockUploadJobCollectionCsv.mockReset();
    mockPickSingleCsvFile.mockReset();

    // Call sequence for listFunctions:
    //   1st call – initial fetchFunctions on mount → empty list
    //   2nd call – UploadJobCollectionButton dialog useEffect (dropdown) → empty list
    //   3rd+ call – fetchFunctions inside handleUploadSuccess → returns the new function
    mockListFunctions
      .mockResolvedValueOnce([]) // mount
      .mockResolvedValueOnce([]) // dialog open
      .mockResolvedValue([uploadedFunction]); // after upload

    mockUploadJobCollectionCsv.mockResolvedValue({
      targetFunctionUid: "test-uid",
      importedSamples: 50,
    });

    // handleOpen only reads .name and awaits .text(), so a plain duck-typed
    // object is sufficient (File.text() is not available in jsdom).
    mockPickSingleCsvFile.mockResolvedValue({
      name: "test_jobs.csv",
      text: () => Promise.resolve(csvContent),
    });
  });

  it("uploads CSV, auto-selects the new function, and populates distribution with correct min/max and log scale", async () => {
    render(
      <FunctionContextProvider>
        <FunctionList />
        <ContextReader />
      </FunctionContextProvider>,
    );

    // Wait for the initial load to settle into the empty-state branch.
    await waitFor(() => {
      expect(screen.queryByTestId("function-grid")).toBeNull();
    });

    // Click "Upload Data" in the empty-state branch.
    // handleOpen fires: pickSingleCsvFile resolves → state set → dialog opens.
    fireEvent.click(screen.getByRole("button", { name: /upload data/i }));

    // Wait for the dialog confirm button to appear inside the MUI Dialog portal.
    // The title TextField is pre-populated from the file stem ("test_jobs") since
    // initialNewFunctionTitle="" falls back to fileStem in handleOpen.
    const confirmBtn = await screen.findByRole("button", { name: /^upload$/i });

    // Click confirm → uploadJobCollectionCsv (mock) + analyzeUploadedJobCollectionCsv (real) →
    // onUploadSuccess → handleUploadSuccess → fetchFunctions → setDistribution → setRowSelection.
    fireEvent.click(confirmBtn);

    // Wait for the full async chain to complete: the selected function UID must appear.
    await waitFor(() => {
      expect(screen.getByTestId("ctx-uid").textContent).toBe("test-uid");
    });

    // Parse the distribution that was written into the context.
    const rawDist = screen.getByTestId("ctx-dist").textContent ?? "{}";
    const distribution = JSON.parse(rawDist) as Record<string, Record<string, unknown>>;
    const presets = distribution["test-uid"];

    // All 6 input variables from the CSV must be present.
    expect(Object.keys(presets)).toEqual(
      expect.arrayContaining(["bone_cancellous", "bone_cortical", "csf", "fat", "grey_matter", "white_matter"]),
    );

    // bone_cancellous: lognormal conductivity samples — bounds and log-scale detection.
    // Values cross-checked with jobCollectionCsv.test.ts real-data test.
    const bc = presets.bone_cancellous as { min: number; max: number; logScale: boolean };
    expect(bc.min).toBeCloseTo(0.006563, 3);
    expect(bc.max).toBeCloseTo(0.191365, 3);
    expect(bc.logScale).toBe(true);

    // csf: lognormal-sampled too → log scale correctly detected even though the
    // range is less than 2 orders of magnitude (shape score comparison detects it).
    const csf = presets.csf as { min: number; max: number; logScale: boolean };
    expect(csf.logScale).toBe(true);
    expect(csf.min).toBeCloseTo(1.152, 2);
    expect(csf.max).toBeCloseTo(3.052, 2);

    // The backend was called exactly once and reported 50 imported samples.
    expect(mockUploadJobCollectionCsv).toHaveBeenCalledTimes(1);
    await expect(mockUploadJobCollectionCsv.mock.results[0].value).resolves.toMatchObject({
      importedSamples: 50,
    });
  });
});
