import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listFunctions, uploadJobCollectionCsv } from "../../utils/functionUtils";
import { analyzeUploadedJobCollectionCsv, pickSingleCsvFile, type UploadedInputPreset } from "../../utils/jobCollectionCsv";

type UploadMode = "existing" | "new";

export type UploadJobCollectionSuccessResult = {
  targetFunctionUid: string;
  importedSamples: number;
  targetMode: UploadMode;
  inputVars: string[];
  outputVars: string[];
  inputPresets: Record<string, UploadedInputPreset>;
};

type UploadJobCollectionButtonProps = {
  buttonLabel: string;
  buttonTestId?: string;
  confirmTestId?: string;
  disabled?: boolean;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  sx?: SxProps<Theme>;
  allowExistingTarget?: boolean;
  defaultMode?: UploadMode;
  initialTargetFunctionUid?: string;
  initialSourceFunctionUid?: string;
  initialNewFunctionTitle?: string;
  onUploadSuccess?: (result: UploadJobCollectionSuccessResult) => Promise<void> | void;
};

export default function UploadJobCollectionButton(props: UploadJobCollectionButtonProps) {
  const {
    buttonLabel,
    buttonTestId,
    confirmTestId,
    disabled = false,
    variant = "contained",
    size = "medium",
    sx,
    allowExistingTarget = true,
    defaultMode = "new",
    initialTargetFunctionUid = "",
    initialSourceFunctionUid = "",
    initialNewFunctionTitle = "Uploaded JobCollection Function",
    onUploadSuccess,
  } = props;

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCsvContent, setUploadCsvContent] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadMode, setUploadMode] = useState<UploadMode>(allowExistingTarget ? defaultMode : "new");
  const [targetFunctionUid, setTargetFunctionUid] = useState(initialTargetFunctionUid);
  const [sourceFunctionUid, setSourceFunctionUid] = useState(initialSourceFunctionUid);
  const [newFunctionTitle, setNewFunctionTitle] = useState(initialNewFunctionTitle);
  const [availableFunctions, setAvailableFunctions] = useState<Array<{ uid: string; title: string }>>([]);

  useEffect(() => {
    if (!uploadDialogOpen) {
      return;
    }
    (async () => {
      try {
        const functions = await listFunctions();
        setAvailableFunctions(functions.map(fun => ({ uid: fun.uid, title: fun.title || fun.uid })));
      } catch (error) {
        console.error(error);
        toast.error("Could not load functions for upload target selection.");
      }
    })();
  }, [uploadDialogOpen]);

  const handleOpen = async () => {
    try {
      const file = await pickSingleCsvFile();
      const csvContent = await file.text();
      const fileStem = file.name.replace(/\.csv$/i, "");
      setUploadCsvContent(csvContent);
      setUploadFileName(file.name);
      setUploadMode(allowExistingTarget ? defaultMode : "new");
      setTargetFunctionUid(initialTargetFunctionUid);
      setSourceFunctionUid(initialSourceFunctionUid);
      setNewFunctionTitle(initialNewFunctionTitle || fileStem || "Uploaded JobCollection Function");
      setUploadDialogOpen(true);
    } catch (error) {
      if ((error as Error).message !== "No file selected") {
        console.error(error);
        toast.error("Failed to read selected CSV file.");
      }
    }
  };

  const handleUpload = async () => {
    try {
      if (uploadMode === "existing" && !targetFunctionUid) {
        toast.warning("Please choose a target compatible function.");
        return;
      }

      const result =
        uploadMode === "existing"
          ? await uploadJobCollectionCsv({
              csvContent: uploadCsvContent,
              targetMode: uploadMode,
              targetFunctionUid,
            })
          : await uploadJobCollectionCsv({
              csvContent: uploadCsvContent,
              targetMode: uploadMode,
              newFunctionTitle: newFunctionTitle || undefined,
              sourceFunctionUid: sourceFunctionUid || undefined,
            });
      const analysis = analyzeUploadedJobCollectionCsv(uploadCsvContent, {
        inferDistributionType: uploadMode === "new",
      });

      if (onUploadSuccess) {
        await onUploadSuccess({
          ...result,
          inputVars: analysis.inputVars,
          outputVars: analysis.outputVars,
          inputPresets: analysis.inputPresets,
        });
      }

      setUploadDialogOpen(false);
      toast.success("JobCollection CSV uploaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to upload JobCollection CSV.");
    }
  };

  return (
    <>
      <Button variant={variant} size={size} sx={sx} onClick={handleOpen} disabled={disabled} mmux-testid={buttonTestId}>
        {buttonLabel}
      </Button>
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload JobCollection CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            File: {uploadFileName}
          </Typography>

          {allowExistingTarget && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="upload-mode-label">Upload Mode</InputLabel>
              <Select
                labelId="upload-mode-label"
                label="Upload Mode"
                value={uploadMode}
                onChange={event => setUploadMode(event.target.value as UploadMode)}
              >
                <MenuItem value="existing">Attach to Existing Compatible Function</MenuItem>
                <MenuItem value="new">Create Local Function from CSV</MenuItem>
              </Select>
            </FormControl>
          )}

          {uploadMode === "existing" ? (
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel id="target-function-label">Target Function</InputLabel>
              <Select
                labelId="target-function-label"
                label="Target Function"
                value={targetFunctionUid}
                onChange={event => setTargetFunctionUid(String(event.target.value))}
              >
                {availableFunctions.map(fun => (
                  <MenuItem key={fun.uid} value={fun.uid}>
                    {fun.title} ({fun.uid})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <>
              <TextField
                fullWidth
                label="New Local Function Title"
                value={newFunctionTitle}
                onChange={event => setNewFunctionTitle(event.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel id="source-function-label">Source Function (Optional)</InputLabel>
                <Select
                  labelId="source-function-label"
                  label="Source Function (Optional)"
                  value={sourceFunctionUid}
                  onChange={event => setSourceFunctionUid(String(event.target.value))}
                >
                  <MenuItem value="">None</MenuItem>
                  {availableFunctions.map(fun => (
                    <MenuItem key={fun.uid} value={fun.uid}>
                      {fun.title} ({fun.uid})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} mmux-testid={confirmTestId}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
