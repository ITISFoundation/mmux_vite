import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import { Download } from "@mui/icons-material";
import { triggerBlobDownload } from "../../utils/downloadBlob";

interface DownloadDataButtonProps {
  /**
   * The plot's OWN committed backend response — the exact payload the latest
   * guarded generation resolved (V46sc clone included). Clicking exports it
   * verbatim: no refetch, no cache read, no mutation, no display transform.
   */
  data: unknown;
  /** Plot identity in the filename (QoI + axes / function uid). */
  filename: string;
  testId: string;
}

/**
 * Renders nothing while the plot holds no response — a download of a plot that
 * shows no data would export nothing but stale bytes.
 */
export function DownloadDataButton({ data, filename, testId }: DownloadDataButtonProps) {
  const theme = useTheme();
  if (data === undefined || data === null) {
    return null;
  }
  const download = () => {
    triggerBlobDownload(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), filename);
  };
  return (
    <Tooltip title="Download the raw data behind this plot (JSON, request units)">
      <Box
        mmux-testid={testId}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: "8px",
          padding: "2px",
        }}
      >
        <IconButton size="small" aria-label="Download plot data" onClick={download}>
          <Download fontSize="small" />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
