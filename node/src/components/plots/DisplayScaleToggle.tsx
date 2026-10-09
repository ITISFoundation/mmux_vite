import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import { CustomAnimatedToggle } from "../utils/CustomAnimatedToggle";

interface DisplayScaleToggleProps {
  /** True renders the value axis as log. Display-only: never feeds a request. */
  log: boolean;
  onChange: (log: boolean) => void;
  /** A log axis cannot render non-positive plotted values; disable with a reason. */
  disabled: boolean;
  disabledReason: string;
  testId: string;
}

/**
 * Per-panel DISPLAY scale toggle (§V12). It only switches the Plotly value-axis
 * type; the COMPUTATION scale (which space the surrogate is trained/predicted
 * in) stays owned by the QoI Surrogate-scale card. Defaults come from that card
 * so the panel initially shows the scale the model actually lives in.
 */
export function DisplayScaleToggle({ log, onChange, disabled, disabledReason, testId }: DisplayScaleToggleProps) {
  const theme = useTheme();
  return (
    <Tooltip
      placement="top"
      title={disabled ? disabledReason : "Display axis scale only — the prediction scale is set per output."}
    >
      <Box
        mmux-testid={testId}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          width: "160px",
          padding: "4px 6px",
          borderRadius: "8px",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography sx={{ fontSize: "0.65em", fontWeight: 300, color: theme.palette.text.secondary }}>Display scale</Typography>
        <CustomAnimatedToggle
          data={["linear", "log"]}
          value={log ? 1 : 0}
          disabled={disabled}
          onChange={value => onChange(value === 1)}
        />
      </Box>
    </Tooltip>
  );
}
