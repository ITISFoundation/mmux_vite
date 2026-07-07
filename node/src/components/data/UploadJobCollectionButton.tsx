import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { toast } from "react-toastify";
import { uploadJobCollectionCsv } from "../../utils/functionUtils";
import { parseJobCollectionCsv, pickSingleCsvFile, type ParsedJobCollectionCsv } from "../../utils/jobCollectionCsv";
import { RegisteredFunction } from "../../context/types";

export type UploadJobCollectionSuccessResult = {
  targetFunctionUid: string;
  importedSamples: number;
  inputVars: string[];
  outputVars: string[];
  inputPresets: ParsedJobCollectionCsv["inputPresets"];
};

type UploadJobCollectionButtonProps = {
  buttonLabel?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  existingFunctions?: RegisteredFunction[];
  onUploadSuccess: (result: UploadJobCollectionSuccessResult) => Promise<void> | void;
};

type PendingUpload = {
  file: File;
  csvContent: string;
  analysis: ParsedJobCollectionCsv;
};

function toSxArray(sx: SxProps<Theme> | undefined): readonly SxProps<Theme>[] {
  if (!sx) return [];
  return Array.isArray(sx) ? sx : [sx];
}

export default function UploadJobCollectionButton(props: UploadJobCollectionButtonProps) {
  const { buttonLabel = "Upload JobCollection CSV", disabled = false, sx, existingFunctions = [], onUploadSuccess } = props;

  const [uploading, setUploading] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
  const [targetFunctionUid, setTargetFunctionUid] = useState("");
  const [newFunctionTitle, setNewFunctionTitle] = useState("");

  const closeDialog = () => {
    setPendingUpload(null);
  };

  const handleClick = async () => {
    try {
      const file = await pickSingleCsvFile();
      const csvContent = await file.text();
      // V13: 1 authoritative parse drives all downstream effects atomically.
      const analysis = parseJobCollectionCsv(csvContent);

      const sourceFunctionExists = Boolean(
        analysis.sourceFunctionUid && existingFunctions.some(fun => fun.uid === analysis.sourceFunctionUid),
      );
      setTargetMode(sourceFunctionExists ? "existing" : "new");
      setTargetFunctionUid(sourceFunctionExists ? (analysis.sourceFunctionUid ?? "") : "");
      setNewFunctionTitle(analysis.sourceJobCollectionTitle ?? "");
      setPendingUpload({ file, csvContent, analysis });
    } catch (error) {
      if ((error as Error).message !== "No file selected") {
        console.error(error);
        toast.error((error as Error).message || "Failed to upload JobCollection CSV.");
      }
    }
  };

  const handleConfirm = async () => {
    if (!pendingUpload) return;
    const { file, csvContent, analysis } = pendingUpload;

    try {
      setUploading(true);
      const uploadResult = await uploadJobCollectionCsv({
        csvContent,
        targetMode,
        targetFunctionUid: targetMode === "existing" ? targetFunctionUid : undefined,
        newFunctionTitle: targetMode === "new" ? newFunctionTitle || undefined : undefined,
        sourceFunctionUid: analysis.sourceFunctionUid,
      });

      await onUploadSuccess({
        targetFunctionUid: uploadResult.targetFunctionUid,
        importedSamples: uploadResult.importedSamples,
        inputVars: analysis.inputVars,
        outputVars: analysis.outputVars,
        inputPresets: analysis.inputPresets,
      });

      toast.success(`Imported ${uploadResult.importedSamples} samples from "${file.name}".`);
      closeDialog();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to upload JobCollection CSV.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDisabled = uploading || (targetMode === "existing" && !targetFunctionUid);

  return (
    <>
      <Button variant="contained" size="medium" onClick={handleClick} disabled={disabled} sx={[{ px: 3 }, ...toSxArray(sx)]}>
        {buttonLabel}
      </Button>

      <Dialog open={pendingUpload !== null} onClose={uploading ? undefined : closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Import JobCollection CSV</DialogTitle>
        <DialogContent>
          {pendingUpload && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {pendingUpload.file.name} — {pendingUpload.analysis.rows.length} samples, {pendingUpload.analysis.inputVars.length}{" "}
              input(s), {pendingUpload.analysis.outputVars.length} output(s)
            </Typography>
          )}

          <RadioGroup value={targetMode} onChange={e => setTargetMode(e.target.value as "existing" | "new")}>
            <FormControlLabel value="new" control={<Radio />} label="Create a new function" />
            <FormControlLabel value="existing" control={<Radio />} label="Attach to an existing function" />
          </RadioGroup>

          {targetMode === "new" ? (
            <TextField
              label="New function title"
              fullWidth
              size="small"
              value={newFunctionTitle}
              onChange={e => setNewFunctionTitle(e.target.value)}
              sx={{ mt: 1 }}
            />
          ) : (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel id="upload-target-function-label">Target function</InputLabel>
              <Select
                labelId="upload-target-function-label"
                label="Target function"
                value={targetFunctionUid}
                onChange={e => setTargetFunctionUid(e.target.value)}
              >
                {existingFunctions.map(fun => (
                  <MenuItem key={fun.uid} value={fun.uid}>
                    {fun.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirmDisabled} variant="contained">
            {uploading ? "Uploading…" : "Import"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
