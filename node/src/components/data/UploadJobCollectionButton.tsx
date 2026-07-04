import { useState } from "react";
import { Button, type SxProps, type Theme } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { toast } from "react-toastify";
import { uploadJobCollectionCsv } from "../../utils/functionUtils";
import { parseJobCollectionCsv, pickSingleCsvFile, type UploadedInputPreset } from "../../utils/jobCollectionCsv";

export type UploadJobCollectionSuccessResult = {
  targetFunctionUid: string;
  importedSamples: number;
  inputVars: string[];
  outputVars: string[];
  inputPresets: Record<string, UploadedInputPreset>;
};

type UploadJobCollectionButtonProps = {
  buttonLabel?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  onUploadSuccess: (result: UploadJobCollectionSuccessResult) => Promise<void> | void;
};

export default function UploadJobCollectionButton(props: UploadJobCollectionButtonProps) {
  const { buttonLabel = "Upload JobCollection CSV", disabled = false, sx, onUploadSuccess } = props;

  const [uploading, setUploading] = useState(false);

  const handleClick = async () => {
    try {
      const file = await pickSingleCsvFile();
      const csvContent = await file.text();
      // V13: 1 authoritative parse drives all 4 downstream effects atomically.
      const analysis = parseJobCollectionCsv(csvContent);

      setUploading(true);
      const uploadResult = await uploadJobCollectionCsv({ csvContent });

      await onUploadSuccess({
        targetFunctionUid: uploadResult.targetFunctionUid,
        importedSamples: uploadResult.importedSamples,
        inputVars: analysis.inputVars,
        outputVars: analysis.outputVars,
        inputPresets: analysis.inputPresets,
      });

      toast.success(`Imported ${uploadResult.importedSamples} samples from "${file.name}".`);
    } catch (error) {
      if ((error as Error).message !== "No file selected") {
        console.error(error);
        toast.error((error as Error).message || "Failed to upload JobCollection CSV.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<UploadFileIcon />}
      onClick={handleClick}
      disabled={disabled || uploading}
      sx={sx}
    >
      {uploading ? "Uploading…" : buttonLabel}
    </Button>
  );
}
