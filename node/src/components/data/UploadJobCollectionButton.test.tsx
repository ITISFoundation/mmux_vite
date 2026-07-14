import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { toast } from "react-toastify";
import UploadJobCollectionButton from "./UploadJobCollectionButton";
import { uploadJobCollectionCsv } from "../../utils/functionUtils";
import { pickSingleCsvFile } from "../../utils/jobCollectionCsv";

vi.mock("../../utils/functionUtils", () => ({
  uploadJobCollectionCsv: vi.fn(),
}));

vi.mock("../../utils/jobCollectionCsv", async importOriginal => {
  const actual = await importOriginal<typeof import("../../utils/jobCollectionCsv")>();
  return {
    ...actual,
    pickSingleCsvFile: vi.fn(),
  };
});

const csvContent = ["source_job_uid,status,input__x1,output__y", "job-1,SUCCESS,1.0,10.0", "job-2,SUCCESS,5.0,20.0"].join("\n");

function makeFakeCsvFile(name = "job_collection.csv"): File {
  return { name, text: () => Promise.resolve(csvContent) } as unknown as File;
}

describe("UploadJobCollectionButton", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("parses the CSV, opens the import dialog, and drives onUploadSuccess with 1 authoritative result (V13)", async () => {
    vi.mocked(pickSingleCsvFile).mockResolvedValueOnce(makeFakeCsvFile());
    vi.mocked(uploadJobCollectionCsv).mockResolvedValueOnce({
      targetFunctionUid: "func-new",
      importedSamples: 2,
      jobCollection: { uid: "jc-new" } as never,
    });
    const onUploadSuccess = vi.fn();
    const toastSuccessSpy = vi.spyOn(toast, "success").mockImplementation(() => "" as never);

    render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Upload Data" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));

    expect(uploadJobCollectionCsv).toHaveBeenCalledWith(
      expect.objectContaining({
        csvContent,
        targetMode: "new",
      }),
    );
    expect(onUploadSuccess).toHaveBeenCalledWith({
      targetFunctionUid: "func-new",
      importedSamples: 2,
      inputVars: ["x1"],
      outputVars: ["y"],
      inputPresets: { x1: { distribution: "uniform", min: 1.0, max: 5.0, logScale: false } },
    });
    expect(toastSuccessSpy).toHaveBeenCalled();
  });

  it("shows an error toast and does not call onUploadSuccess when the backend rejects the upload", async () => {
    vi.mocked(pickSingleCsvFile).mockResolvedValueOnce(makeFakeCsvFile());
    vi.mocked(uploadJobCollectionCsv).mockRejectedValueOnce(new Error("Incompatible function schema"));
    const onUploadSuccess = vi.fn();
    const toastErrorSpy = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Upload Data" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Incompatible function schema"));
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("silently ignores a cancelled file picker (no file selected)", async () => {
    vi.mocked(pickSingleCsvFile).mockRejectedValueOnce(new Error("No file selected"));
    const onUploadSuccess = vi.fn();
    const toastErrorSpy = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Upload Data" }));

    await waitFor(() => expect(pickSingleCsvFile).toHaveBeenCalledTimes(1));
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(toastErrorSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Import" })).not.toBeInTheDocument();
  });

  it("defaults to 'existing' mode and pre-selects the target when the CSV's source function is known", async () => {
    vi.mocked(pickSingleCsvFile).mockResolvedValueOnce(makeFakeCsvFile());
    vi.mocked(uploadJobCollectionCsv).mockResolvedValueOnce({
      targetFunctionUid: "func-1",
      importedSamples: 2,
      jobCollection: { uid: "jc-new" } as never,
    });
    const csvWithSource = [
      "# source_function_uid,func-1",
      "source_job_uid,status,input__x1,output__y",
      "job-1,SUCCESS,1.0,10.0",
    ].join("\n");
    vi.mocked(pickSingleCsvFile).mockReset();
    vi.mocked(pickSingleCsvFile).mockResolvedValueOnce({
      name: "job_collection.csv",
      text: () => Promise.resolve(csvWithSource),
    } as unknown as File);
    const onUploadSuccess = vi.fn();

    render(
      <UploadJobCollectionButton
        onUploadSuccess={onUploadSuccess}
        existingFunctions={[{ uid: "func-1", title: "Existing Fn" } as never]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Upload Data" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));
    expect(uploadJobCollectionCsv).toHaveBeenCalledWith(
      expect.objectContaining({ targetMode: "existing", targetFunctionUid: "func-1", sourceFunctionUid: "func-1" }),
    );
  });
});
