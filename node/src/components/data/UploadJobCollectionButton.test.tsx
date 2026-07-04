import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup, waitFor } from "@testing-library/react";
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

  it("parses the CSV and drives onUploadSuccess with 1 authoritative result (V13)", async () => {
    vi.mocked(pickSingleCsvFile).mockResolvedValueOnce(makeFakeCsvFile());
    vi.mocked(uploadJobCollectionCsv).mockResolvedValueOnce({
      targetFunctionUid: "func-new",
      importedSamples: 2,
      jobCollection: { uid: "jc-new" } as never,
    });
    const onUploadSuccess = vi.fn();
    const toastSuccessSpy = vi.spyOn(toast, "success").mockImplementation(() => "" as never);

    const { getByRole } = render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));

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

    const { getByRole } = render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Incompatible function schema"));
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("silently ignores a cancelled file picker (no file selected)", async () => {
    vi.mocked(pickSingleCsvFile).mockRejectedValueOnce(new Error("No file selected"));
    const onUploadSuccess = vi.fn();
    const toastErrorSpy = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    const { getByRole } = render(<UploadJobCollectionButton onUploadSuccess={onUploadSuccess} />);
    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(pickSingleCsvFile).toHaveBeenCalledTimes(1));
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(toastErrorSpy).not.toHaveBeenCalled();
  });
});
